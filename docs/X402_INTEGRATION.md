# Stealth402 — x402 + ZK Integration Design

## How Stealth402 Extends x402

Standard x402 flow: client pays → server verifies → serves content.

Stealth402 flow: client pays once → gets private subscription credential → proves subscription N times without linking identity.

```
STANDARD x402                       ZEROPASS x402 + ZK
──────────────                      ──────────────────
GET /api                            GET /api
  ← 402 (price, payTo)               ← 402 (price, payTo=commitment)
Pay via SAC transfer (visible)      Pay via SAC (amount hidden)
  → retry with payment sig           Generate ZK proof (browser)
  ← 200 OK                           → retry with ZK proof header
                                     ← 200 OK
                                   
Identity: wallet linked to call     Identity: wallet NEVER linked to call
Amount: visible on-chain            Amount: hidden (Pedersen commitment)
Merchant: visible on-chain          Merchant: hidden (Poseidon commitment)
```

---

## API Middleware Architecture

```
api/
├── server.ts              ← Express app entry point
├── middleware/
│   ├── x402.ts            ← Standard x402 payment gate (subscribe endpoint)
│   └── zk_gate.ts         ← ZK proof gate (protected API endpoints)
├── routes/
│   ├── subscribe.ts       ← POST /subscribe — takes payment, registers commitment
│   └── protected.ts       ← GET /api/* — ZK-gated endpoints
├── lib/
│   ├── stellar.ts         ← Soroban RPC client
│   ├── commitment.ts      ← Generate amount + merchant commitments
│   └── proof_verify.ts    ← Call Soroban verifier contract
└── types.ts
```

---

## Subscribe Flow (One-Time Payment)

### Endpoint: `POST /subscribe`

Protected by standard x402 middleware. The user pays here — once.

```typescript
// api/routes/subscribe.ts
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { generateMerchantCommitment } from "../lib/commitment";
import { addSubscriptionToChain } from "../lib/stellar";

const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS!;
const MERCHANT_SALT = process.env.MERCHANT_SALT!;  // secret, never revealed

// x402 middleware — standard payment, but payTo is merchant commitment not raw address
const facilitator = new HTTPFacilitatorClient({
  url: "https://channels.openzeppelin.com/x402/testnet",
  createAuthHeaders: async () => ({
    verify: { Authorization: `Bearer ${process.env.OZ_API_KEY}` },
    settle: { Authorization: `Bearer ${process.env.OZ_API_KEY}` },
    supported: { Authorization: `Bearer ${process.env.OZ_API_KEY}` },
  }),
});

router.post("/subscribe", paymentMiddleware(
  {
    "POST /subscribe": {
      accepts: [{
        scheme: "exact",
        price: "$1.00",                      // $1 USDC/month subscription
        network: "stellar:testnet",
        payTo: MERCHANT_ADDRESS,             // real address for settlement
      }],
      description: "Stealth402 monthly subscription",
      mimeType: "application/json",
    },
  },
  new x402ResourceServer(facilitator).register("stellar:testnet", new ExactStellarScheme()),
), async (req, res) => {
  // Payment verified and settled by x402 middleware
  // Now register the subscription commitment on-chain

  const { subscriber_public_key, amount_commitment, expiry_days } = req.body;
  const merchantCommitment = generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
  const expiry = Math.floor(Date.now() / 1000) + (expiry_days ?? 30) * 86400;

  // subscription_id is random — client generates and sends
  const subscription_id = req.body.subscription_id;

  // leaf = Poseidon(subscriber_public_key, amount_commitment, merchant_commitment, expiry, sub_id)
  // We don't know subscriber_secret — that stays client-side
  // Client sends us the leaf they pre-computed from their secret
  const leaf = req.body.leaf;  // client computed this

  const leafIndex = await addSubscriptionToChain({
    leaf,
    amount_commitment,
    merchant_commitment: merchantCommitment,
    expiry,
  });

  res.json({
    success: true,
    leaf_index: leafIndex,
    merchant_commitment: merchantCommitment,
    expiry,
    subscription_id,
    // Client already has subscriber_secret — we never see it
  });
});
```

---

## Access Flow (Per-Session ZK Proof)

### Endpoint: `GET /api/*` (protected)

No x402 here — uses custom ZK gate middleware instead.

```typescript
// api/middleware/zk_gate.ts
import { verifySubscriptionProof } from "../lib/proof_verify";
import { getContractRoots } from "../lib/stellar";

export async function zkGate(req: Request, res: Response, next: NextFunction) {
  const proofHeader = req.headers["x-stealth402-proof"];
  if (!proofHeader) {
    return res.status(402).json({
      error: "Subscription proof required",
      instructions: {
        prove_at: "/prove",
        contract: process.env.SUBSCRIPTION_REGISTRY_CONTRACT,
      },
    });
  }

  const { proof, publicSignals, nullifier, merchantCommitment } = JSON.parse(
    Buffer.from(proofHeader as string, "base64").toString()
  );

  // Fetch current on-chain roots
  const { merkleRoot, nullifierSmtRoot, revokeSmtRoot } = await getContractRoots();

  // Verify proof calls subscription_registry::verify_and_use on-chain
  const valid = await verifySubscriptionProof({
    proof,
    publicSignals,
    nullifier,
    merkleRoot,
    nullifierSmtRoot,
    revokeSmtRoot,
    merchantCommitment,
    currentTimestamp: Math.floor(Date.now() / 1000),
  });

  if (!valid) {
    return res.status(401).json({ error: "Invalid or expired subscription proof" });
  }

  next();
}
```

---

## Client-Side Proof Generation

The browser generates proofs — private inputs never leave the device.

```typescript
// frontend/lib/stealth402_client.ts
import { groth16 } from "snarkjs";
import { poseidon2 } from "circomlibjs";
import { getMerkleProof, getSmtRoots } from "./stellar_client";

export async function generateProofAndCall(
  url: string,
  privateState: SubscriberState,
  merchantCommitment: string,
): Promise<Response> {
  const sessionNonce = crypto.getRandomValues(new Uint8Array(32));
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Fetch public inputs from on-chain
  const { merkleRoot, nullifierSmtRoot, revokeSmtRoot } = await getSmtRoots();
  const { merklePath, merklePathIndices } = await getMerkleProof(privateState.leafIndex);

  // Generate proof in browser WASM — subscriber_secret never leaves
  const { proof, publicSignals } = await groth16.fullProve(
    {
      // PRIVATE
      subscriber_secret: privateState.subscriberSecret,
      amount: privateState.amount,
      blinding_factor: privateState.blindingFactor,
      merchant_salt: privateState.merchantSalt,
      expiry: privateState.expiry,
      subscription_id: privateState.subscriptionId,
      merkle_path: merklePath,
      merkle_path_indices: merklePathIndices,
      // PUBLIC
      merkle_root: merkleRoot,
      nullifier_smt_root: nullifierSmtRoot,
      revoke_smt_root: revokeSmtRoot,
      session_nonce: Array.from(sessionNonce),
      current_timestamp: currentTimestamp,
      merchant_commitment: merchantCommitment,
      min_amount: "1",
    },
    "/circuits/subscription_proof.wasm",
    "/circuits/subscription_proof_final.zkey",
  );

  // Nullifier = publicSignals[0] (first output of circuit)
  const nullifier = publicSignals[0];

  // Attach proof to API call
  const proofPayload = Buffer.from(JSON.stringify({
    proof,
    publicSignals,
    nullifier,
    merchantCommitment,
  })).toString("base64");

  return fetch(url, {
    headers: { "x-stealth402-proof": proofPayload },
  });
}
```

---

## Environment Variables

```bash
# api/.env
MERCHANT_ADDRESS=G...                    # Stellar public key receiving payments
MERCHANT_SALT=random_32_bytes_hex        # secret — never revealed on-chain
OZ_API_KEY=your_openzeppelin_api_key     # from channels.openzeppelin.com/testnet/gen
MPP_SECRET_KEY=strong_random_secret      # for MPP credential verification
SUBSCRIPTION_REGISTRY_CONTRACT=C...     # deployed Soroban contract
NULLIFIER_REGISTRY_CONTRACT=C...        # deployed Soroban contract
GROTH16_VERIFIER_CONTRACT=C...          # deployed Soroban contract
STELLAR_RPC=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

---

## Proof Header Format

Sent with every protected API call:

```
X-Stealth402-Proof: base64({
  "proof": {
    "pi_a": ["...", "...", "1"],
    "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
    "pi_c": ["...", "...", "1"],
    "protocol": "groth16"
  },
  "publicSignals": [
    "nullifier_field_element",
    "amount_commitment_field_element"
  ],
  "nullifier": "0x...",
  "merchantCommitment": "0x..."
})
```

---

## MPP + ZK (Optional Extension)

For high-frequency API usage, combine MPP channel mode with ZK:

- User opens MPP channel (on-chain, once) → also registers subscription commitment
- Each API call: signs cumulative MPP voucher (off-chain) AND includes ZK proof
- Server verifies both: MPP voucher (off-chain) + ZK nullifier (on-chain, batched)
- At close: channel settles on-chain with final cumulative amount

This gives: private amounts + unlinkable sessions + minimal on-chain txns.

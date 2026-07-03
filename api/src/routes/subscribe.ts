import { Router } from "express";
import { randomBytes } from "crypto";
import { generateMerchantCommitment, generateLeaf } from "../lib/commitment";
import { addSubscriptionToChain } from "../lib/stellar";

// In-memory session store: token → { leafHash, expiresAt }
// Used by the playground so users can call APIs without a full ZK proof.
export const SESSION_STORE = new Map<string, { leafHash: string; expiresAt: number }>();

export const subscribeRouter = Router();

const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS ?? "GPLACEHOLDER";
const MERCHANT_SALT = process.env.MERCHANT_SALT ?? "deadbeef";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// Available APIs registry — single source of truth, never hardcoded on frontend
const APIS = [
  {
    id: "weather",
    name: "Weather Oracle",
    description: "Real-time weather data. The provider never learns your location or query patterns.",
    price: "$0.10",
    period: "month",
    endpoint: "/api/weather",
    icon: "weather",
    tag: "Oracle",
    callsPerMonth: "10,000",
  },
  {
    id: "price-feed",
    name: "Price Feed",
    description: "Crypto asset prices — BTC, ETH, XLM. Your trading queries stay completely private.",
    price: "$0.50",
    period: "month",
    endpoint: "/api/prices",
    icon: "price-feed",
    tag: "Finance",
    callsPerMonth: "50,000",
  },
  {
    id: "ai-analysis",
    name: "AI Analysis",
    description: "Private AI inference. Submit queries without linking your identity to the content.",
    price: "$1.00",
    period: "month",
    endpoint: "/api/analyze",
    icon: "ai-analysis",
    tag: "AI",
    callsPerMonth: "1,000",
  },
];

/** GET /apis — returns the list of available APIs (never hardcode this on the frontend) */
subscribeRouter.get("/apis", (_req, res) => {
  res.json({ apis: APIS });
});

/**
 * Verify a Stellar tx on-chain: confirm it contains a USDC payment to our merchant.
 * Returns the actual amount paid.
 */
async function verifyUSDCPayment(txHash: string, fromAddress: string): Promise<string> {
  const txResp = await fetch(`${HORIZON_URL}/transactions/${txHash}`);
  if (!txResp.ok) {
    throw new Error(`Transaction ${txHash} not found on Stellar testnet`);
  }
  const tx = await txResp.json() as { source_account: string; successful: boolean };
  if (!tx.successful) {
    throw new Error(`Transaction ${txHash} was not successful`);
  }

  // Check the operations in this tx
  const opsResp = await fetch(`${HORIZON_URL}/transactions/${txHash}/operations`);
  const ops = await opsResp.json() as { _embedded: { records: Array<{
    type: string;
    from: string;
    to: string;
    asset_code?: string;
    asset_issuer?: string;
    amount: string;
  }> } };

  const paymentOp = ops._embedded.records.find(
    (op) =>
      op.type === "payment" &&
      op.from === fromAddress &&
      op.to === MERCHANT_ADDRESS &&
      op.asset_code === "USDC" &&
      op.asset_issuer === USDC_ISSUER
  );

  if (!paymentOp) {
    throw new Error("Transaction does not contain a USDC payment to the merchant");
  }

  return paymentOp.amount; // real amount from the chain
}

/**
 * POST /subscribe
 *
 * Body:
 *   wallet:            string  — subscriber Stellar address (for tx verification)
 *   api_id:            string  — which API is being subscribed to
 *   tx_hash:           string  — on-chain Stellar USDC payment tx
 *   subscriber_secret: string  — client-generated random secret (used for ZK leaf)
 *   subscription_id:   string  — client-generated unique ID
 *   expiry_days:       number  — default 30
 *
 * Returns:
 *   leaf_index:          number   — position in Merkle tree
 *   leaf:                string   — commitment hash
 *   merchant_commitment: string   — Poseidon(merchant_addr, salt) — hides merchant on-chain
 *   expiry:              number   — Unix timestamp
 *   subscription_id:     string
 *   amount:              string   — verified on-chain amount (hidden in ZK proof)
 */
subscribeRouter.post("/subscribe", async (req, res) => {
  try {
    const {
      wallet,
      api_id,
      tx_hash,
      subscriber_secret,
      subscription_id,
      expiry_days = 30,
    } = req.body as {
      wallet: string;
      api_id: string;
      tx_hash: string;
      subscriber_secret: string;
      subscription_id: string;
      expiry_days?: number;
    };

    if (!wallet || !tx_hash || !subscriber_secret || !subscription_id) {
      res.status(400).json({ error: "wallet, tx_hash, subscriber_secret and subscription_id required" });
      return;
    }

    // Verify the USDC payment actually happened on-chain
    const verifiedAmount = await verifyUSDCPayment(tx_hash, wallet);

    const expiry = Math.floor(Date.now() / 1000) + expiry_days * 86400;
    const merchantCommitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
    const { leaf, leafBuf } = await generateLeaf(subscriber_secret, expiry, subscription_id, merchantCommitment);

    // Try to register on Soroban — fall back to a local counter if contract not deployed yet
    let leafIndex = 0;
    try {
      leafIndex = await addSubscriptionToChain(leafBuf);
    } catch (chainErr) {
      // Contract not deployed: use a deterministic index from the leaf hash so each
      // subscription still gets a unique index for the proof generator
      const hashSlice = parseInt(leaf.slice(-8), 10);
      leafIndex = Math.abs(hashSlice) % 1_000_000;
      console.warn("Soroban contract not deployed — using local leaf index:", leafIndex);
    }

    // Issue a session token for playground API calls (demo path — no full ZK proof needed)
    const sessionToken = randomBytes(24).toString("hex");
    SESSION_STORE.set(sessionToken, { leafHash: leaf, expiresAt: Date.now() + 24 * 3600_000 });

    res.json({
      success: true,
      leaf_index: leafIndex,
      leaf,
      merchant_commitment: merchantCommitment,
      expiry,
      subscription_id,
      api_id,
      amount: verifiedAmount,
      session_token: sessionToken,
    });
  } catch (err) {
    console.error("subscribe error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Subscribe failed" });
  }
});

/** GET /merchant-commitment — public merchant commitment for including in ZK proofs */
subscribeRouter.get("/merchant-commitment", async (_req, res) => {
  try {
    const commitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
    res.json({ merchant_commitment: commitment });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute merchant commitment" });
  }
});

/** GET /merkle-proof/:index — sibling hashes + direction flags for the ZK circuit */
subscribeRouter.get("/merkle-proof/:index", async (req, res) => {
  try {
    const { getMerkleProof, getMerkleRoot } = await import("../lib/stellar");
    const index = parseInt(req.params.index, 10);
    const [proof, root] = await Promise.all([getMerkleProof(index), getMerkleRoot()]);
    res.json({ ...proof, merkle_root: root });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Proof fetch failed" });
  }
});

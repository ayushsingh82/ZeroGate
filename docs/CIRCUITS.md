# Stealth402 — ZK Circuit Design

## Overview

One main circuit handles everything: proving a valid, unexpired, unrevoked subscription
exists without revealing who holds it or what was paid.

**Framework:** Circom 2.0  
**Proof system:** Groth16  
**Hash:** Poseidon (ZK-friendly, matches Stellar host function)  
**SMT:** Sparse Merkle Tree for exclusion proofs (nullifiers + revocations)

---

## Circuit: `subscription_proof.circom`

### Inputs

```circom
// PRIVATE — never leave browser
signal private input subscriber_secret;      // root secret, generated at subscribe time
signal private input amount;                 // what was paid
signal private input blinding_factor;        // for Pedersen amount commitment
signal private input merchant_salt;          // merchant's privacy salt
signal private input expiry;                 // subscription expiry timestamp
signal private input subscription_id;        // unique id of this subscription
signal private input merkle_path[DEPTH];     // sibling hashes in subscription tree
signal private input merkle_path_indices[DEPTH]; // left/right flags for each level

// PUBLIC — submitted on-chain, reveal nothing sensitive
signal input merkle_root;              // current root of SubscriptionRegistry (on-chain)
signal input nullifier_smt_root;       // root of spent-nullifier SMT (on-chain)
signal input revoke_smt_root;          // root of revoked-subscription SMT (on-chain)
signal input session_nonce;            // random value chosen per API call
signal input current_timestamp;        // block timestamp (checked < expiry)
signal input merchant_commitment;      // Poseidon(merchant_addr, merchant_salt) — public id
signal input min_amount;               // minimum subscription price (public tier check)
```

### Outputs (public signals)

```circom
signal output nullifier;               // Poseidon(subscriber_secret, session_nonce)
signal output amount_commitment;       // Pedersen(amount, blinding_factor)
```

---

## What the Circuit Proves

```
1. LEAF CONSTRUCTION
   leaf = Poseidon(
     subscriber_secret,
     Pedersen(amount, blinding_factor),  // amount commitment
     Poseidon(merchant_addr, salt),       // merchant commitment
     expiry,
     subscription_id
   )

2. INCLUSION PROOF (Merkle)
   MerkleProof(leaf, merkle_path, merkle_path_indices) == merkle_root
   → "This subscription exists in the registry"

3. EXPIRY CHECK
   expiry > current_timestamp
   → "Subscription has not expired"

4. AMOUNT RANGE CHECK
   amount >= min_amount  AND  amount <= MAX_AMOUNT
   → "A valid amount was paid (without revealing exact amount)"

5. NULLIFIER NON-MEMBERSHIP (SMT exclusion)
   nullifier = Poseidon(subscriber_secret, session_nonce)
   SMTNonMembership(nullifier, nullifier_smt_root) == true
   → "This session token has not been used before"

6. REVOCATION NON-MEMBERSHIP (SMT exclusion)
   SMTNonMembership(subscription_id, revoke_smt_root) == true
   → "This subscription has not been revoked by the merchant"

7. MERCHANT MATCH
   Poseidon(merchant_addr, merchant_salt) == merchant_commitment
   → "Payment was made to this specific merchant (without revealing address)"
```

---

## Circuit File Structure

```
circuits/
├── subscription_proof.circom       ← main circuit (wire everything together)
├── lib/
│   ├── pedersen_commitment.circom  ← Pedersen(amount, blinding) → commitment
│   ├── range_check.circom          ← assert min ≤ amount ≤ max
│   └── merkle_proof.circom         ← standard binary Merkle inclusion
└── node_modules/circomlib/
    ├── circuits/poseidon.circom    ← Poseidon hash (use as-is)
    └── circuits/smt_verifier.circom ← SMT non-membership (use as-is)
```

---

## Trusted Setup

Groth16 requires a circuit-specific trusted setup (Powers of Tau ceremony).

For hackathon/testnet:
1. Use the **existing Hermez Powers of Tau** file (up to 2^20 constraints) — already public
2. Run `snarkjs groth16 setup` with our circuit-specific contribution
3. Export `verification_key.json` → embed in Soroban verifier contract

For production: full multi-party ceremony needed. Out of scope for hackathon.

---

## Proof Generation (Browser WASM)

```typescript
// frontend/lib/prover.ts
import { groth16 } from "snarkjs";

export async function generateSubscriptionProof(
  privateInputs: SubscriptionPrivateInputs,
  publicInputs: SubscriptionPublicInputs
): Promise<{ proof: Groth16Proof; publicSignals: string[] }> {
  const { proof, publicSignals } = await groth16.fullProve(
    { ...privateInputs, ...publicInputs },
    "/circuits/subscription_proof.wasm",   // compiled circuit
    "/circuits/subscription_proof_final.zkey" // proving key
  );
  return { proof, publicSignals };
}
```

Both `.wasm` and `.zkey` are served as static files — no server ever sees private inputs.

---

## Proof Size & Cost Estimate

| Item | Value |
|------|-------|
| Proof size (Groth16) | ~256 bytes |
| Public signals | ~7 field elements (~224 bytes) |
| On-chain verification | 1× `bn254_multi_pairing_check` call |
| Estimated Soroban fee | ~0.01 XLM (based on Nethermind benchmarks) |
| Circuit constraints (est.) | ~15,000–25,000 |
| Proof generation time | ~2–5s in browser WASM |

---

## Compile & Build Commands

```bash
# Install
npm install -g circom snarkjs
npm install circomlib

# Compile circuit
circom circuits/subscription_proof.circom \
  --r1cs --wasm --sym \
  -o circuits/build/

# Trusted setup (Powers of Tau — reuse existing)
snarkjs powersoftau new bn128 18 pot18_0000.ptau
snarkjs powersoftau contribute pot18_0000.ptau pot18_0001.ptau --name="Stealth402"
snarkjs powersoftau prepare phase2 pot18_0001.ptau pot18_final.ptau

# Circuit-specific setup
snarkjs groth16 setup circuits/build/subscription_proof.r1cs pot18_final.ptau \
  circuits/build/subscription_proof_0000.zkey
snarkjs zkey contribute circuits/build/subscription_proof_0000.zkey \
  circuits/build/subscription_proof_final.zkey --name="Stealth402"

# Export verification key (for Soroban contract)
snarkjs zkey export verificationkey \
  circuits/build/subscription_proof_final.zkey \
  circuits/build/verification_key.json

# Export Solidity verifier (reference — we adapt for Soroban)
snarkjs zkey export solidityverifier \
  circuits/build/subscription_proof_final.zkey \
  circuits/build/verifier_reference.sol
```

---

## Test Vectors

```typescript
// circuits/test/subscription_proof.test.ts
const testPrivate = {
  subscriber_secret: "12345678901234567890",
  amount: "100",               // $1.00 USDC in cents
  blinding_factor: "98765",
  merchant_salt: "11111",
  expiry: "2000000000",        // far future
  subscription_id: "42",
  merkle_path: [...],          // computed from test tree
  merkle_path_indices: [0, 1, 0, ...]
};

const testPublic = {
  merkle_root: "...",          // root of tree containing this leaf
  nullifier_smt_root: "...",   // empty SMT root
  revoke_smt_root: "...",      // empty SMT root
  session_nonce: "99999",
  current_timestamp: "1700000000",
  merchant_commitment: "...",
  min_amount: "50"             // $0.50 minimum
};
// Expected: proof verifies, nullifier = Poseidon(secret, nonce)
```

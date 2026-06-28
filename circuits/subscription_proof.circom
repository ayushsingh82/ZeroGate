pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "./lib/merkle_proof.circom";

// Stealth402 Subscription Proof
//
// Proves that:
//   1. The prover knows a subscriber_secret whose leaf exists in the
//      on-chain SubscriptionRegistry Merkle tree (paid via x402).
//   2. The subscription has not expired.
//   3. The merchant_commitment matches the one stored in the leaf
//      (so the proof is bound to a specific API / merchant).
//   4. Outputs a unique, session-specific nullifier so the on-chain
//      contract can prevent replay without learning anything about
//      the subscriber's identity.
//
// Privacy guarantees:
//   - subscriber_secret never leaves the browser.
//   - Payment amount is not in this circuit (hidden at payment time
//     via on-chain commitment; future version adds range proof).
//   - Nullifier = Poseidon(secret, nonce) — different every session,
//     unlinkable across calls even for the same subscription.
//   - Merchant address is never revealed; only its Poseidon commitment
//     appears as a public signal.

template SubscriptionProof(depth) {
    // ─── Private inputs (never leave browser) ────────────────────────
    signal input subscriber_secret;      // root secret generated at subscribe time
    signal input expiry;                 // Unix timestamp: when subscription expires
    signal input subscription_id;        // unique ID assigned at subscribe time
    signal input merchant_commitment;    // Poseidon(merchant_addr, merchant_salt)
    signal input merkle_path[depth];     // sibling hashes in the Merkle tree
    signal input merkle_path_indices[depth]; // 0 = left child, 1 = right child

    // ─── Public inputs (submitted on-chain, safe to reveal) ──────────
    signal input merkle_root;            // current SubscriptionRegistry root
    signal input session_nonce;          // random value chosen per API call
    signal input current_timestamp;      // block / server timestamp (must be < expiry)
    signal input expected_merchant_commitment; // which merchant's API is being accessed

    // ─── Output (public signal) ───────────────────────────────────────
    signal output nullifier;             // Poseidon(secret, nonce) — registered on-chain after use

    // ─── 1. Compute nullifier ─────────────────────────────────────────
    component null_hash = Poseidon(2);
    null_hash.inputs[0] <== subscriber_secret;
    null_hash.inputs[1] <== session_nonce;
    nullifier <== null_hash.out;

    // ─── 2. Bind proof to the correct merchant ────────────────────────
    // merchant_commitment (private) must equal expected_merchant_commitment (public).
    // This means a proof generated for merchant A cannot be replayed at merchant B.
    merchant_commitment === expected_merchant_commitment;

    // ─── 3. Build the subscription leaf ──────────────────────────────
    // leaf = Poseidon(secret, expiry, subscription_id, merchant_commitment)
    // Must match exactly what subscription_registry::add_subscription stores.
    component leaf_hash = Poseidon(4);
    leaf_hash.inputs[0] <== subscriber_secret;
    leaf_hash.inputs[1] <== expiry;
    leaf_hash.inputs[2] <== subscription_id;
    leaf_hash.inputs[3] <== merchant_commitment;

    // ─── 4. Merkle inclusion proof ────────────────────────────────────
    // Proves the leaf exists in the on-chain Merkle tree.
    component merkle = MerkleProof(depth);
    merkle.leaf <== leaf_hash.out;
    for (var i = 0; i < depth; i++) {
        merkle.path_elements[i] <== merkle_path[i];
        merkle.path_indices[i]  <== merkle_path_indices[i];
    }
    merkle_root === merkle.root;

    // ─── 5. Expiry check: expiry > current_timestamp ─────────────────
    // GreaterThan(n) works for integers up to 2^n.
    // 64 bits covers any Unix timestamp for the foreseeable future.
    component expiry_check = GreaterThan(64);
    expiry_check.in[0] <== expiry;
    expiry_check.in[1] <== current_timestamp;
    expiry_check.out === 1;
}

// Instantiate with depth=20 → supports up to 2^20 (~1M) subscriptions.
component main {public [
    merkle_root,
    session_nonce,
    current_timestamp,
    expected_merchant_commitment
]} = SubscriptionProof(20);

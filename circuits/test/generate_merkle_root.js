// Computes the expected merkle_root for a single-leaf tree (leaf at index 0)
// so we can fill in input_valid.json with a real root.
// Run: node circuits/test/generate_merkle_root.js

const { buildPoseidon } = require("circomlibjs");

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Must match circuit inputs exactly
  const subscriber_secret = BigInt("1234567890123456789");
  const expiry            = BigInt("2000000000");
  const subscription_id   = BigInt("42");

  // merchant_commitment = Poseidon(merchant_addr_as_field, merchant_salt)
  // Using dummy values for test
  const merchant_addr = BigInt("111111111111111111");
  const merchant_salt = BigInt("999999999999999999");
  const merchant_commitment = F.toObject(poseidon([merchant_addr, merchant_salt]));
  console.log("merchant_commitment:", merchant_commitment.toString());

  // leaf = Poseidon(secret, expiry, sub_id, merchant_commitment)
  const leaf = F.toObject(poseidon([
    subscriber_secret,
    expiry,
    subscription_id,
    merchant_commitment,
  ]));
  console.log("leaf:", leaf.toString());

  // For a tree of depth 20 where the leaf is at index 0,
  // all siblings are the empty node value (0 for simplicity in tests).
  // The root for a single-leaf tree with empty siblings:
  const DEPTH = 20;
  let current = leaf;
  for (let i = 0; i < DEPTH; i++) {
    // index = 0 at every level → current is left child, sibling (0) is right
    current = F.toObject(poseidon([current, BigInt(0)]));
  }
  console.log("merkle_root:", current.toString());

  // nullifier = Poseidon(secret, session_nonce)
  const session_nonce = BigInt("9999999999");
  const nullifier = F.toObject(poseidon([subscriber_secret, session_nonce]));
  console.log("nullifier:", nullifier.toString());

  console.log("\n--- Paste into test/input_valid.json ---");
  console.log(JSON.stringify({
    subscriber_secret: subscriber_secret.toString(),
    expiry: expiry.toString(),
    subscription_id: subscription_id.toString(),
    merchant_commitment: merchant_commitment.toString(),
    merkle_path: Array(DEPTH).fill("0"),
    merkle_path_indices: Array(DEPTH).fill("0"),
    merkle_root: current.toString(),
    session_nonce: session_nonce.toString(),
    current_timestamp: "1700000000",
    expected_merchant_commitment: merchant_commitment.toString(),
  }, null, 2));
}

main().catch(console.error);

#!/usr/bin/env bash
set -e

CIRCUIT="subscription_proof"
BUILD_DIR="build"

echo "=== Stealth402 Proof Test ==="

# 1. Generate real test inputs using Poseidon
echo "[1/4] Generating test inputs..."
node test/generate_merkle_root.js > /tmp/stealth402_inputs.txt
cat /tmp/stealth402_inputs.txt

# Extract the JSON block (everything after the dashes line)
node -e "
const { buildPoseidon } = require('circomlibjs');
async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const secret = BigInt('1234567890123456789');
  const expiry = BigInt('2000000000');
  const sub_id = BigInt('42');
  const merchant_addr = BigInt('111111111111111111');
  const merchant_salt = BigInt('999999999999999999');
  const merchant_commitment = F.toObject(poseidon([merchant_addr, merchant_salt]));
  const leaf = F.toObject(poseidon([secret, expiry, sub_id, merchant_commitment]));
  const DEPTH = 20;
  let current = leaf;
  for (let i = 0; i < DEPTH; i++) {
    current = F.toObject(poseidon([current, BigInt(0)]));
  }
  const session_nonce = BigInt('9999999999');
  const input = {
    subscriber_secret: secret.toString(),
    expiry: expiry.toString(),
    subscription_id: sub_id.toString(),
    merchant_commitment: merchant_commitment.toString(),
    merkle_path: Array(DEPTH).fill('0'),
    merkle_path_indices: Array(DEPTH).fill('0'),
    merkle_root: current.toString(),
    session_nonce: session_nonce.toString(),
    current_timestamp: '1700000000',
    expected_merchant_commitment: merchant_commitment.toString(),
  };
  require('fs').writeFileSync('test/input_valid.json', JSON.stringify(input, null, 2));
  console.log('Written test/input_valid.json');
}
main().catch(console.error);
"

# 2. Generate witness
echo "[2/4] Generating witness..."
node $BUILD_DIR/${CIRCUIT}_js/generate_witness.js \
  $BUILD_DIR/${CIRCUIT}_js/${CIRCUIT}.wasm \
  test/input_valid.json \
  $BUILD_DIR/witness.wtns

# 3. Generate proof
echo "[3/4] Generating Groth16 proof..."
snarkjs groth16 prove \
  $BUILD_DIR/${CIRCUIT}_final.zkey \
  $BUILD_DIR/witness.wtns \
  $BUILD_DIR/proof.json \
  $BUILD_DIR/public.json

echo "Public signals:"
cat $BUILD_DIR/public.json

# 4. Verify proof
echo "[4/4] Verifying proof..."
snarkjs groth16 verify \
  $BUILD_DIR/verification_key.json \
  $BUILD_DIR/public.json \
  $BUILD_DIR/proof.json

echo ""
echo "=== All checks passed ==="
echo "  proof.json  → $BUILD_DIR/proof.json"
echo "  public.json → $BUILD_DIR/public.json (nullifier is index 0)"

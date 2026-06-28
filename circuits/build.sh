#!/usr/bin/env bash
set -e

CIRCUIT="subscription_proof"
BUILD_DIR="build"
PTAU="build/pot18_final.ptau"

echo "=== Stealth402 Circuit Build ==="
mkdir -p $BUILD_DIR

# 1. Compile circuit → r1cs + wasm + sym
echo "[1/6] Compiling circuit..."
~/.cargo/bin/circom ${CIRCUIT}.circom \
  --r1cs --wasm --sym \
  --output $BUILD_DIR \
  -l node_modules

echo "[1/6] Done. Constraints:"
snarkjs r1cs info $BUILD_DIR/${CIRCUIT}.r1cs

# 2. Powers of Tau (dev setup — NOT for production)
if [ ! -f "$PTAU" ]; then
  echo "[2/6] Generating Powers of Tau (2^18)..."
  snarkjs powersoftau new bn128 18 build/pot18_0000.ptau -v
  snarkjs powersoftau contribute build/pot18_0000.ptau build/pot18_0001.ptau \
    --name="Stealth402 Dev" --entropy="stealth402_dev_entropy_$(date +%s)"
  snarkjs powersoftau prepare phase2 build/pot18_0001.ptau $PTAU -v
  echo "[2/6] Done."
else
  echo "[2/6] Using existing ptau."
fi

# 3. Groth16 setup (circuit-specific)
echo "[3/6] Groth16 setup..."
snarkjs groth16 setup $BUILD_DIR/${CIRCUIT}.r1cs $PTAU \
  $BUILD_DIR/${CIRCUIT}_0000.zkey

# 4. Contribute to phase 2 (dev contribution)
echo "[4/6] Phase 2 contribution..."
snarkjs zkey contribute $BUILD_DIR/${CIRCUIT}_0000.zkey \
  $BUILD_DIR/${CIRCUIT}_final.zkey \
  --name="Stealth402 Dev" --entropy="stealth402_contribution_$(date +%s)"

# 5. Export verification key
echo "[5/6] Exporting verification key..."
snarkjs zkey export verificationkey \
  $BUILD_DIR/${CIRCUIT}_final.zkey \
  $BUILD_DIR/verification_key.json

# 6. Generate Solidity verifier (reference for adapting to Soroban)
echo "[6/6] Exporting Solidity verifier (for reference)..."
snarkjs zkey export solidityverifier \
  $BUILD_DIR/${CIRCUIT}_final.zkey \
  $BUILD_DIR/verifier_reference.sol

echo ""
echo "=== Build complete ==="
echo "  r1cs:             $BUILD_DIR/${CIRCUIT}.r1cs"
echo "  wasm:             $BUILD_DIR/${CIRCUIT}_js/${CIRCUIT}.wasm"
echo "  proving key:      $BUILD_DIR/${CIRCUIT}_final.zkey"
echo "  verification key: $BUILD_DIR/verification_key.json"
echo ""
echo "Next: run ./test.sh to verify a proof end-to-end"

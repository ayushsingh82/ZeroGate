import { groth16 } from "snarkjs";
import path from "path";
import { getMerkleRoot, isNullifierSpent } from "./stellar";

const WASM_PATH = path.resolve(__dirname, "../../circuits/build/subscription_proof_js/subscription_proof.wasm");
const VKEY_PATH = path.resolve(__dirname, "../../circuits/build/verification_key.json");

let _vkey: object | null = null;
async function loadVkey() {
  if (!_vkey) {
    const fs = await import("fs");
    _vkey = JSON.parse(fs.readFileSync(VKEY_PATH, "utf8"));
  }
  return _vkey!;
}

export interface ProofPayload {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
  };
  publicSignals: string[];
  nullifier: string;
  merchantCommitment: string;
}

export async function verifySubscriptionProof(payload: ProofPayload): Promise<boolean> {
  const { proof, publicSignals, nullifier, merchantCommitment } = payload;

  // 1. Verify Groth16 proof off-chain (fast path — avoids on-chain call for every request)
  const vkey = await loadVkey();
  const valid = await groth16.verify(vkey, publicSignals, proof);
  if (!valid) return false;

  // 2. Check the merkle_root in public signals matches the on-chain root
  const onChainRoot = await getMerkleRoot();
  const proofRoot = publicSignals[1]; // index 1 = merkle_root
  if (onChainRoot && proofRoot !== onChainRoot) return false;

  // 3. Check nullifier not spent
  const spent = await isNullifierSpent(nullifier);
  if (spent) return false;

  // 4. Check merchant commitment matches
  const expectedMerchant = process.env.MERCHANT_COMMITMENT;
  if (expectedMerchant && publicSignals[4] !== expectedMerchant) return false;

  // 5. Check timestamp is reasonable (within 5 minute drift)
  const proofTimestamp = Number(publicSignals[3]);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - proofTimestamp) > 300) return false;

  return true;
}

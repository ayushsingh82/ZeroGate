import { buildPoseidon } from "circomlibjs";

let _poseidon: Awaited<ReturnType<typeof buildPoseidon>> | null = null;
async function poseidon() {
  if (!_poseidon) _poseidon = await buildPoseidon();
  return _poseidon;
}

function toField(val: bigint | string | number): bigint {
  return BigInt(val);
}

export async function poseidonHash(inputs: (bigint | string | number)[]): Promise<bigint> {
  const p = await poseidon();
  const result = p(inputs.map(toField));
  return BigInt(p.F.toString(result));
}

export async function generateMerchantCommitment(
  merchantAddr: string,
  merchantSalt: string,
): Promise<string> {
  const addrBig = BigInt("0x" + Buffer.from(merchantAddr).toString("hex").slice(0, 62));
  const saltBig = BigInt("0x" + merchantSalt);
  const commitment = await poseidonHash([addrBig, saltBig]);
  return commitment.toString();
}

export async function generateLeaf(
  subscriberSecret: string,
  expiry: number,
  subscriptionId: string,
  merchantCommitment: string,
): Promise<{ leaf: string; leafBuf: Buffer }> {
  const leaf = await poseidonHash([
    BigInt(subscriberSecret),
    BigInt(expiry),
    BigInt(subscriptionId),
    BigInt(merchantCommitment),
  ]);
  const hex = leaf.toString(16).padStart(64, "0");
  return { leaf: leaf.toString(), leafBuf: Buffer.from(hex, "hex") };
}

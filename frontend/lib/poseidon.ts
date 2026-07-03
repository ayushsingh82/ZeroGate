"use client";

// BN254 field modulus
const F = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

/** Poseidon hash (BN254, circomlibjs) — same as backend commitment lib */
export async function poseidonHash(inputs: bigint[]): Promise<string> {
  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const result = poseidon(inputs.map((n) => n % F));
  return poseidon.F.toString(result);
}

declare module "circomlibjs" {
  export function buildPoseidon(): Promise<{
    (inputs: unknown[]): unknown;
    F: { toString(v: unknown): string };
  }>;
}

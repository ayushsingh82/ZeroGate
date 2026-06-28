import { Contract, Networks, SorobanRpc, TransactionBuilder, BASE_FEE, Keypair } from "@stellar/stellar-sdk";

export const RPC_URL = process.env.STELLAR_RPC ?? "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE ?? Networks.TESTNET;

export function rpc() {
  return new SorobanRpc.Server(RPC_URL);
}

export function serverKeypair(): Keypair {
  const secret = process.env.SERVER_SECRET_KEY;
  if (!secret) throw new Error("SERVER_SECRET_KEY not set");
  return Keypair.fromSecret(secret);
}

export async function addSubscriptionToChain(leaf: Buffer): Promise<number> {
  const contractId = process.env.SUBSCRIPTION_REGISTRY_CONTRACT;
  if (!contractId) throw new Error("SUBSCRIPTION_REGISTRY_CONTRACT not set");

  const server = rpc();
  const kp = serverKeypair();
  const account = await server.getAccount(kp.publicKey());

  const contract = new Contract(contractId);
  const leafArg = Buffer.from(leaf);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call("add_subscription", leafArg as unknown as xdr.ScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim)}`);
  }

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  assembled.sign(kp);

  const result = await server.sendTransaction(assembled);
  if (result.status === "ERROR") throw new Error(`TX error: ${result.errorResult}`);

  // Poll for completion
  let pollResult;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    pollResult = await server.getTransaction(result.hash);
    if (pollResult.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) break;
  }

  if (!pollResult || pollResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error("TX did not succeed");
  }

  // Return value is the leaf index (u32)
  return Number(pollResult.returnValue?.u32() ?? 0);
}

export async function getMerkleRoot(): Promise<string> {
  const contractId = process.env.SUBSCRIPTION_REGISTRY_CONTRACT;
  if (!contractId) throw new Error("SUBSCRIPTION_REGISTRY_CONTRACT not set");

  const server = rpc();
  const kp = serverKeypair();
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call("get_root"))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) throw new Error("Simulation failed");

  const result = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result;
  return result?.retval.bytes().toString("hex") ?? "";
}

export async function getMerkleProof(leafIndex: number): Promise<{ path: string[]; indices: number[] }> {
  const contractId = process.env.SUBSCRIPTION_REGISTRY_CONTRACT;
  if (!contractId) throw new Error("SUBSCRIPTION_REGISTRY_CONTRACT not set");

  const server = rpc();
  const kp = serverKeypair();
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call("get_proof", leafIndex as unknown as xdr.ScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) throw new Error("Simulation failed");

  // Parse (Vec<BytesN<32>>, Vec<u32>) return value
  const retval = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  const tuple = retval?.vec() ?? [];
  const pathVec = tuple[0]?.vec() ?? [];
  const indicesVec = tuple[1]?.vec() ?? [];

  return {
    path: pathVec.map((v: unknown) => (v as { bytes(): Buffer }).bytes().toString("hex")),
    indices: indicesVec.map((v: unknown) => Number((v as { u32(): number }).u32())),
  };
}

export async function isNullifierSpent(nullifier: string): Promise<boolean> {
  const contractId = process.env.NULLIFIER_REGISTRY_CONTRACT;
  if (!contractId) return false;

  const server = rpc();
  const kp = serverKeypair();
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(contractId);

  const nullifierBuf = Buffer.from(nullifier.replace("0x", ""), "hex");

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call("is_spent", nullifierBuf as unknown as xdr.ScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) return false;

  const retval = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return retval?.bool() ?? false;
}

export async function spendNullifier(nullifier: string): Promise<void> {
  const contractId = process.env.NULLIFIER_REGISTRY_CONTRACT;
  if (!contractId) throw new Error("NULLIFIER_REGISTRY_CONTRACT not set");

  const server = rpc();
  const kp = serverKeypair();
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(contractId);

  const nullifierBuf = Buffer.from(nullifier.replace("0x", ""), "hex");

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call("spend_nullifier", nullifierBuf as unknown as xdr.ScVal))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) throw new Error("Spend simulation failed");

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  assembled.sign(kp);
  await server.sendTransaction(assembled);
}

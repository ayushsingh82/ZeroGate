"use client";

import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { signTx, NETWORK_PASSPHRASE, HORIZON_URL } from "./wallet";
import { poseidonHash } from "./poseidon";

// ShieldedPool contract — holds USDC, stores only commitment hashes on-chain
export const POOL_CONTRACT = "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY";
// USDC Stellar Asset Contract (SAC) on testnet
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const SOROBAN_RPC = "https://soroban-testnet.stellar.org";

export interface DepositResult {
  txHash: string;
  commitment: string; // Poseidon(secret, api_id, expiry) — never links to wallet on-chain
  leafIndex: number;
}

/**
 * Private deposit flow (Option A + C):
 *   1. Compute commitment = Poseidon(subscriberSecret, expiry) off-chain
 *   2. Call ShieldedPool.deposit(from, USDC_SAC, amount, commitment)
 *      → on-chain only stores the commitment hash — no amount, no merchant address
 *   3. Server receives commitment (not wallet) → issues session token
 */
export async function depositToPool(
  fromAddress: string,
  amountStr: string,
  subscriberSecret: string,
  expiry: number,
  onSigned?: () => void
): Promise<DepositResult> {
  // Compute the commitment off-chain — this is what the ZK circuit proves membership of
  const secretBig = BigInt("0x" + subscriberSecret);
  const commitment = await poseidonHash([secretBig, BigInt(expiry)]);
  // commitment is a decimal string — convert to 32-byte hex for on-chain storage
  const commitmentHex = BigInt(commitment).toString(16).padStart(64, "0");
  const commitmentBytes = hexToBytes(commitmentHex);

  const rpc = new SorobanRpc.Server(SOROBAN_RPC);
  const account = await rpc.getAccount(fromAddress);
  const fee = "1000000"; // 0.1 XLM max fee for Soroban

  // amount in stroops (USDC has 7 decimal places on Stellar)
  const amountStroops = Math.round(parseFloat(amountStr) * 1e7);

  const contract = new Contract(POOL_CONTRACT);
  const tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "deposit",
        new Address(fromAddress).toScVal(),            // from
        new Address(USDC_SAC).toScVal(),               // token (USDC SAC)
        nativeToScVal(BigInt(amountStroops), { type: "i128" }), // amount
        xdr.ScVal.scvBytes(Buffer.from(commitmentBytes)), // commitment hash
      )
    )
    .setTimeout(60)
    .build();

  // Simulate to get footprint
  const simResult = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }
  const prepared = SorobanRpc.assembleTransaction(tx, simResult).build();

  const signedXdr = await signTx(prepared.toXDR());
  onSigned?.();

  const { TransactionBuilder: TB } = await import("@stellar/stellar-sdk");
  const signedTx = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResult = await rpc.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${sendResult.errorResult}`);
  }

  // Poll for confirmation
  const txHash = sendResult.hash;
  let leafIndex = 0;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await rpc.getTransaction(txHash);
    if (status.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      // Extract leaf index from return value
      try {
        const retVal = status.returnValue;
        if (retVal && retVal.switch().name === "scvU32") {
          leafIndex = retVal.u32();
        }
      } catch {}
      break;
    }
    if (status.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Transaction failed on-chain");
    }
  }

  return { txHash, commitment, leafIndex };
}

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export function apiPriceToUSDC(price: string): string {
  return price.replace("$", "").trim();
}

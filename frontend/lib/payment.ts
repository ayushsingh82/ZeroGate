"use client";

import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { signTx, NETWORK_PASSPHRASE, HORIZON_URL } from "./wallet";

const MERCHANT = "GBBGLHXY7DAZAQBY4PTIN65KQNQGLOM52QRKKFR42O5PAD3B3XKXMQUM";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new Asset("USDC", USDC_ISSUER);

export interface PaymentResult {
  txHash: string;
  amount: string;
  merchant: string;
}

export async function payUSDC(
  fromAddress: string,
  amountStr: string,
  onSigned?: () => void
): Promise<PaymentResult> {
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(fromAddress);
  const fee = await server.fetchBaseFee();

  const tx = new TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: MERCHANT,
        asset: USDC,
        amount: amountStr,
      })
    )
    .setTimeout(60)
    .build();

  const signedXdr = await signTx(tx.toXDR());
  onSigned?.(); // Freighter approved — now submitting to Stellar

  const { TransactionBuilder: TB } = await import("@stellar/stellar-sdk");
  const signedTx = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(signedTx);

  return {
    txHash: result.hash as string,
    amount: amountStr,
    merchant: MERCHANT,
  };
}

export function apiPriceToUSDC(price: string): string {
  return price.replace("$", "").trim();
}

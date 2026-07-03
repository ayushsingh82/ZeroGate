"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { depositToPool, apiPriceToUSDC, POOL_CONTRACT } from "@/lib/payment";

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="11" r="5" stroke="#CFFF03" strokeWidth="1.5"/>
        <path d="M16 4V2M16 20v-2M9 11H7M25 11h-2M11.1 6.1l-1.4-1.4M22.3 17.3l-1.4-1.4M11.1 15.9l-1.4 1.4M22.3 4.7l-1.4 1.4" stroke="#CFFF03" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 22a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground"/>
        <path d="M6 26h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (id === "price-feed") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <polyline points="4,24 10,16 15,20 21,10 28,14" stroke="#CFFF03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="14" r="2" fill="#CFFF03"/>
        <line x1="4" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" className="text-muted-foreground"/>
        <line x1="4" y1="4" x2="4" y2="28" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (id === "ai-analysis") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect x="6" y="10" width="20" height="14" rx="3" stroke="#CFFF03" strokeWidth="1.5"/>
        <circle cx="11" cy="17" r="2" fill="#CFFF03"/>
        <circle cx="21" cy="17" r="2" fill="#CFFF03"/>
        <path d="M14 17h4" stroke="#CFFF03" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 10V7M21 10V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  return null;
}

export interface SubscriptionData {
  apiId: string;
  txHash: string;       // Soroban tx hash (to ShieldedPool, not merchant)
  amount: string;
  subscribedAt: string;
  subscriberSecret: string;
  leafIndex: number;
  merchantCommitment: string;
  subscriptionId: string;
  sessionToken: string;
  commitment: string;   // Poseidon(secret, expiry) — stored in pool on-chain
}

export interface Api {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  endpoint: string;
  icon: string;
  tag: string;
  callsPerMonth: string;
}

interface ApiCardProps {
  api: Api;
  isSubscribed: boolean;
  subscriptionData?: SubscriptionData;
  isConnected: boolean;
  onSubscribe: (data: SubscriptionData) => void;
  onProve: () => void;
}

type PayState = "idle" | "signing" | "submitting" | "registering" | "done" | "error";

const PAY_LABELS: Record<PayState, string> = {
  idle:        "",
  signing:     "Sign in Freighter…",
  submitting:  "Depositing to ShieldedPool…",
  registering: "Issuing ZK credential…",
  done:        "",
  error:       "",
};

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ApiCard({ api, isSubscribed, subscriptionData, isConnected, onSubscribe, onProve }: ApiCardProps) {
  const [payState, setPayState] = useState<PayState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { address, connect } = useWallet();

  async function handleSubscribe() {
    if (!isConnected || !address) { await connect(); return; }
    setError(null);

    const subscriberSecret = randomHex(32);
    const subscriptionId = `${api.id}-${Date.now()}-${randomHex(4)}`;
    const expiry = Math.floor(Date.now() / 1000) + 30 * 86400; // 30 days

    try {
      // Step 1: deposit USDC to ShieldedPool — only commitment hash stored on-chain
      // Merchant address never appears on-chain; amount goes into contract escrow
      setPayState("signing");
      const { txHash, commitment, leafIndex } = await depositToPool(
        address,
        apiPriceToUSDC(api.price),
        subscriberSecret,
        expiry,
        () => setPayState("submitting"),
      );

      // Step 2: server issues session token based on commitment — never sees wallet address
      setPayState("registering");
      const resp = await fetch("http://localhost:3001/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // No wallet, no tx_hash — server is blind to subscriber identity
          api_id: api.id,
          commitment,
          leaf_index: leafIndex,
          subscriber_secret: subscriberSecret,
          subscription_id: subscriptionId,
          expiry,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json() as { error?: string };
        throw new Error(err.error ?? "Subscription registration failed");
      }

      const data = await resp.json() as {
        merchant_commitment: string;
        session_token: string;
      };

      setPayState("done");
      onSubscribe({
        apiId: api.id,
        txHash,
        amount: api.price,
        subscribedAt: new Date().toISOString(),
        subscriberSecret,
        leafIndex,
        merchantCommitment: data.merchant_commitment,
        subscriptionId,
        sessionToken: data.session_token,
        commitment,
      });
    } catch (err) {
      setPayState("error");
      const msg = err instanceof Error ? err.message : "Payment failed";
      setError(
        msg.includes("declined") || msg.includes("rejected") || msg.includes("cancel")
          ? "Transaction cancelled in Freighter."
          : msg.includes("USDC") || msg.includes("underfunded") || msg.includes("Insufficient")
          ? "Insufficient USDC balance. Get testnet USDC from the faucet."
          : msg
      );
    }
  }

  const busy = ["signing", "submitting", "registering"].includes(payState);

  return (
    <div className={`rounded-lg border bg-[var(--card)] p-5 flex flex-col gap-4 transition-colors ${
      isSubscribed ? "border-emerald-500/30" : "border-[var(--border)]"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <ApiIcon id={api.id} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{api.name}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">
              {api.tag}
            </span>
          </div>
        </div>
        {isSubscribed && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
      </div>

      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{api.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-[var(--accent)] p-2">
          <p className="text-[var(--muted-foreground)]">Price</p>
          <p className="font-mono font-semibold text-[var(--foreground)]">
            {api.price}<span className="text-[var(--muted-foreground)] font-normal">/{api.period}</span>
          </p>
        </div>
        <div className="rounded bg-[var(--accent)] p-2">
          <p className="text-[var(--muted-foreground)]">Calls</p>
          <p className="font-mono font-semibold text-[var(--foreground)]">{api.callsPerMonth}</p>
        </div>
      </div>

      <div className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--accent)] rounded px-2 py-1.5 truncate">
        {api.endpoint}
      </div>

      {/* On-chain receipt — shows pool deposit, not merchant payment */}
      {isSubscribed && subscriptionData && (
        <div className="space-y-1">
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${subscriptionData.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors truncate"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {subscriptionData.txHash.slice(0, 16)}… (ShieldedPool deposit)
          </a>
          <p className="text-xs text-[var(--muted-foreground)]">
            Merchant: <span className="font-mono">{POOL_CONTRACT.slice(0, 8)}…</span> (hidden behind pool)
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 leading-relaxed">{error}</p>
      )}

      {isSubscribed ? (
        <button
          onClick={onProve}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate ZK Proof
          <ArrowRight className="w-3 h-3" />
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {PAY_LABELS[payState]}
            </>
          ) : isConnected ? (
            <>Pay {api.price} USDC · Subscribe privately</>
          ) : (
            <>Connect wallet to subscribe</>
          )}
        </button>
      )}
    </div>
  );
}

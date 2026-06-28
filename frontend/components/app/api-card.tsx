"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

interface Api {
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
  isConnected: boolean;
  onSubscribe: () => void;
  onProve: () => void;
}

export function ApiCard({ api, isSubscribed, isConnected, onSubscribe, onProve }: ApiCardProps) {
  const [subscribing, setSubscribing] = useState(false);
  const { connect } = useWallet();

  async function handleSubscribe() {
    if (!isConnected) {
      await connect();
      return;
    }
    setSubscribing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSubscribing(false);
    onSubscribe();
  }

  return (
    <div className={`rounded-lg border bg-[var(--card)] p-5 flex flex-col gap-4 transition-colors ${
      isSubscribed ? "border-emerald-500/30" : "border-[var(--border)]"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{api.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{api.name}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">
              {api.tag}
            </span>
          </div>
        </div>
        {isSubscribed && (
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        )}
      </div>

      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{api.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-[var(--accent)] p-2">
          <p className="text-[var(--muted-foreground)]">Price</p>
          <p className="font-mono font-semibold text-[var(--foreground)]">{api.price}<span className="text-[var(--muted-foreground)] font-normal">/{api.period}</span></p>
        </div>
        <div className="rounded bg-[var(--accent)] p-2">
          <p className="text-[var(--muted-foreground)]">Calls</p>
          <p className="font-mono font-semibold text-[var(--foreground)]">{api.callsPerMonth}</p>
        </div>
      </div>

      <div className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--accent)] rounded px-2 py-1.5 truncate">
        {api.endpoint}
      </div>

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
          disabled={subscribing}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-60"
        >
          {subscribing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Paying via x402…
            </>
          ) : isConnected ? (
            <>Subscribe · {api.price}</>
          ) : (
            <>Connect wallet to subscribe</>
          )}
        </button>
      )}
    </div>
  );
}

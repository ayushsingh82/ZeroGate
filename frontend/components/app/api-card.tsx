"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="11" r="5" stroke="#CFFF03" strokeWidth="1.5"/>
        <path d="M16 4V2M16 20v-2M9 11H7M25 11h-2M11.1 6.1l-1.4-1.4M22.3 17.3l-1.4-1.4M11.1 15.9l-1.4 1.4M22.3 4.7l-1.4 1.4" stroke="#CFFF03" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 22a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground"/>
        <path d="M6 26h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground"/>
        <path d="M10 29h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (id === "price-feed") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="4,24 10,16 15,20 21,10 28,14" stroke="#CFFF03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="14" r="2" fill="#CFFF03"/>
        <line x1="4" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" className="text-muted-foreground"/>
        <line x1="4" y1="4" x2="4" y2="28" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (id === "ai-analysis") {
    return (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="20" height="14" rx="3" stroke="#CFFF03" strokeWidth="1.5"/>
        <circle cx="11" cy="17" r="2" fill="#CFFF03"/>
        <circle cx="21" cy="17" r="2" fill="#CFFF03"/>
        <path d="M14 17h4" stroke="#CFFF03" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 10V7M21 10V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
        <path d="M8 24l2 3M24 24l-2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
        <path d="M16 6a2 2 0 0 1 0-4 2 2 0 0 1 0 4z" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"/>
      <path d="M16 11v10M11 16h10" stroke="#CFFF03" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

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
          <ApiIcon id={api.id} />
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

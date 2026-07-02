"use client";

import { ShieldCheck } from "lucide-react";

interface TxHistoryProps {
  subscribed: string[];
}

const API_META: Record<string, { name: string; price: string; period: string; callsTotal: number }> = {
  weather: {
    name: "Weather Oracle",
    price: "$0.10",
    period: "month",
    callsTotal: 10000,
  },
  "price-feed": {
    name: "Price Feed",
    price: "$0.50",
    period: "month",
    callsTotal: 50000,
  },
  "ai-analysis": {
    name: "AI Analysis",
    price: "$1.00",
    period: "month",
    callsTotal: 1000,
  },
};

const MOCK_USAGE: Record<string, { used: number; proofs: number; since: string }> = {
  weather:       { used: 142,  proofs: 142,  since: "Jun 28, 2026" },
  "price-feed":  { used: 3841, proofs: 3841, since: "Jun 27, 2026" },
  "ai-analysis": { used: 17,   proofs: 17,   since: "Jun 29, 2026" },
};

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="#CFFF03" strokeWidth="1.4"/>
        <path d="M12 2V1M12 15v-1M5 8H4M20 8h-1M7 4l-.7-.7M17.7 14.7l-.7-.7M7 12l-.7.7M17.7 3.3l-.7.7" stroke="#CFFF03" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M6 17a4 4 0 0 1 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
        <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (id === "price-feed") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <polyline points="3,18 8,12 12,15 17,7 21,10" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="21" cy="10" r="1.5" fill="#CFFF03"/>
      </svg>
    );
  }
  if (id === "ai-analysis") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <rect x="4" y="8" width="16" height="10" rx="2.5" stroke="#CFFF03" strokeWidth="1.4"/>
        <circle cx="9" cy="13" r="1.5" fill="#CFFF03"/>
        <circle cx="15" cy="13" r="1.5" fill="#CFFF03"/>
        <path d="M11 13h2" stroke="#CFFF03" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M8 8V6M16 8V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  return null;
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#CFFF03]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function TxHistory({ subscribed }: TxHistoryProps) {
  if (subscribed.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">No subscriptions yet.</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Subscribe to a service above to track your usage here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">{subscribed.length} active {subscribed.length === 1 ? "subscription" : "subscriptions"}</p>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          Amount always hidden
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {subscribed.map((apiId) => {
          const meta = API_META[apiId];
          const usage = MOCK_USAGE[apiId] ?? { used: 0, proofs: 0, since: "—" };
          if (!meta) return null;
          return (
            <div key={apiId} className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <ApiIcon id={apiId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{meta.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">active</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Subscribed {usage.since} · <span className="text-[var(--foreground)]">amount hidden</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono font-semibold text-[var(--foreground)]">{meta.price}<span className="text-[var(--muted-foreground)] font-normal text-xs">/{meta.period}</span></p>
                  <p className="text-xs text-[var(--muted-foreground)]">via x402</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">API calls used</span>
                  <span className="font-mono text-[var(--foreground)]">
                    {usage.used.toLocaleString()} / {meta.callsTotal.toLocaleString()}
                  </span>
                </div>
                <UsageBar used={usage.used} total={meta.callsTotal} />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">ZK proofs generated</span>
                  <span className="font-mono text-[var(--foreground)]">{usage.proofs.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--accent)]">
        <p className="text-xs text-[var(--muted-foreground)]">
          <span className="text-[var(--foreground)]">Payment amounts are never stored.</span>{" "}
          Each API call is proven independently with a fresh ZK nullifier.
        </p>
      </div>
    </div>
  );
}

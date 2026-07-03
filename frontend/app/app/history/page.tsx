"use client";

import { Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { useSubscriptions } from "@/hooks/use-subscriptions";

const API_META: Record<string, { name: string; price: string; period: string; callsPerMonth: string }> = {
  "weather":    { name: "Weather Oracle", price: "$0.10", period: "month", callsPerMonth: "10,000" },
  "price-feed": { name: "Price Feed",     price: "$0.50", period: "month", callsPerMonth: "50,000" },
  "ai-analysis":{ name: "AI Analysis",    price: "$1.00", period: "month", callsPerMonth: "1,000"  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <path d="M6 17a4 4 0 0 1 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
    </svg>
  );
  if (id === "price-feed") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <polyline points="3,18 8,12 12,15 17,7 21,10" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="21" cy="10" r="1.5" fill="#CFFF03"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <rect x="4" y="8" width="16" height="10" rx="2.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <circle cx="9" cy="13" r="1.5" fill="#CFFF03"/><circle cx="15" cy="13" r="1.5" fill="#CFFF03"/>
    </svg>
  );
}

export default function HistoryPage() {
  const { subscriptions, loaded } = useSubscriptions();
  const entries = Object.values(subscriptions);

  if (!loaded) return null;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">History</h1>
        <p className="text-sm text-[var(--muted-foreground)]">On-chain payment records. Amounts are hidden in ZK proofs — only the Merkle commitment is stored.</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <Clock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">No subscriptions yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]">{entries.length} active {entries.length === 1 ? "subscription" : "subscriptions"}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <ShieldCheck className="w-3 h-3" />Amount always hidden
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {entries.map((sub) => {
              const meta = API_META[sub.apiId];
              if (!meta) return null;
              return (
                <div key={sub.apiId} className="px-5 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ApiIcon id={sub.apiId} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{meta.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">active</span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Subscribed {formatDate(sub.subscribedAt)} · {meta.callsPerMonth} calls/mo
                      </p>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${sub.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-[var(--muted-foreground)] hover:text-emerald-400 transition-colors mt-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {sub.txHash.slice(0, 24)}…
                      </a>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-semibold text-[var(--foreground)]">
                        {meta.price}<span className="text-[var(--muted-foreground)] font-normal text-xs">/{meta.period}</span>
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">via x402</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded bg-[var(--accent)] px-3 py-2">
                      <p className="text-[var(--muted-foreground)] mb-0.5">Merkle leaf</p>
                      <p className="font-mono text-[var(--foreground)]">#{sub.leafIndex}</p>
                    </div>
                    <div className="rounded bg-[var(--accent)] px-3 py-2">
                      <p className="text-[var(--muted-foreground)] mb-0.5">Merchant commitment</p>
                      <p className="font-mono text-[var(--foreground)] truncate">{sub.merchantCommitment.slice(0, 14)}…</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--accent)]">
            <p className="text-xs text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)]">Payment amounts are never stored.</span>{" "}
              Each API call uses a fresh ZK nullifier — calls cannot be linked to subscriptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

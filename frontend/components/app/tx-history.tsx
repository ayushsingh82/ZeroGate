"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import type { SubscriptionData, Api } from "@/components/app/api-card";

interface TxHistoryProps {
  subscriptions: Record<string, SubscriptionData>;
  apis: Api[];
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TxHistory({ subscriptions, apis }: TxHistoryProps) {
  const entries = Object.values(subscriptions);

  if (entries.length === 0) {
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
        <p className="text-xs text-[var(--muted-foreground)]">
          {entries.length} active {entries.length === 1 ? "subscription" : "subscriptions"}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          Amount always hidden
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {entries.map((sub) => {
          const api = apis.find((a) => a.id === sub.apiId);
          if (!api) return null;
          return (
            <div key={sub.apiId} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <ApiIcon id={sub.apiId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--foreground)]">{api.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">active</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Subscribed {formatDate(sub.subscribedAt)} · {api.callsPerMonth} calls/mo · amount hidden
                  </p>

                  {/* On-chain tx link */}
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${sub.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[var(--muted-foreground)] hover:text-emerald-400 transition-colors mt-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {sub.txHash.slice(0, 20)}…
                  </a>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono font-semibold text-[var(--foreground)]">
                    {api.price}
                    <span className="text-[var(--muted-foreground)] font-normal text-xs">/{api.period}</span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">via x402</p>
                </div>
              </div>

              {/* Leaf index — proof anchor */}
              <div className="mt-3 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[var(--muted-foreground)]">Merkle leaf</span>
                  <span className="font-mono text-[var(--foreground)]">#{sub.leafIndex}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--muted-foreground)]">Merchant commitment</span>
                  <span className="font-mono text-[var(--foreground)] truncate max-w-[120px]">
                    {sub.merchantCommitment.slice(0, 10)}…
                  </span>
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

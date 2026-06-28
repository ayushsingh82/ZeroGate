"use client";

import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface TxHistoryProps {
  subscribed: string[];
}

const BASE_TXS = [
  {
    id: "tx1",
    type: "subscribe",
    api: "Weather Oracle",
    apiId: "weather",
    time: "2m ago",
    status: "confirmed",
    amountVisible: false,
    nullifier: "0xa3f891bc…",
    txHash: "0x1a2b3c4d…",
    note: "x402 payment · USDC Testnet",
  },
  {
    id: "tx2",
    type: "proof",
    api: "Weather Oracle",
    apiId: "weather",
    time: "1m ago",
    status: "verified",
    amountVisible: false,
    nullifier: "0x7e904d5c…",
    txHash: null,
    note: "Groth16 proof · 2.8s",
  },
  {
    id: "tx3",
    type: "subscribe",
    api: "Price Feed",
    apiId: "price-feed",
    time: "45s ago",
    status: "confirmed",
    amountVisible: false,
    nullifier: "0xb5c63a2f…",
    txHash: "0x5e6f7a8b…",
    note: "x402 payment · USDC Testnet",
  },
  {
    id: "tx4",
    type: "proof",
    api: "Price Feed",
    apiId: "price-feed",
    time: "30s ago",
    status: "verified",
    amountVisible: false,
    nullifier: "0x08e4d719…",
    txHash: null,
    note: "Groth16 proof · 3.1s",
  },
  {
    id: "tx5",
    type: "proof",
    api: "Weather Oracle",
    apiId: "weather",
    time: "10s ago",
    status: "verified",
    amountVisible: false,
    nullifier: "0x3f2c8b1a…",
    txHash: null,
    note: "Groth16 proof · 2.6s · new nullifier",
  },
];

function TxIcon({ apiId }: { apiId: string }) {
  if (apiId === "weather") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3.5" stroke="#CFFF03" strokeWidth="1.4"/>
        <path d="M12 2V1M12 15v-1M5 8H4M20 8h-1M7 4l-.7-.7M17.7 14.7l-.7-.7M7 12l-.7.7M17.7 3.3l-.7.7" stroke="#CFFF03" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M6 17a4 4 0 0 1 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
        <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  if (apiId === "price-feed") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="3,18 8,12 12,15 17,7 21,10" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="21" cy="10" r="1.5" fill="#CFFF03"/>
      </svg>
    );
  }
  if (apiId === "ai-analysis") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="16" height="10" rx="2.5" stroke="#CFFF03" strokeWidth="1.4"/>
        <circle cx="9" cy="13" r="1.5" fill="#CFFF03"/>
        <circle cx="15" cy="13" r="1.5" fill="#CFFF03"/>
        <path d="M11 13h2" stroke="#CFFF03" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M8 8V6M16 8V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-muted-foreground"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" className="text-muted-foreground"/>
      <path d="M12 8v8M8 12h8" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export function TxHistory({ subscribed }: TxHistoryProps) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const txs = subscribed.length === 0
    ? []
    : BASE_TXS.filter((t) => subscribed.includes(t.apiId));

  if (txs.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">No transactions yet.</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Subscribe to an API above to see your private transaction history.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">{txs.length} transactions · amounts always hidden</p>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          Private
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {txs.map((tx) => (
          <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4">
            <TxIcon apiId={tx.apiId} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[var(--foreground)]">{tx.api}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  tx.type === "subscribe"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {tx.type === "subscribe" ? "x402 pay" : "ZK proof"}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tx.status === "confirmed" || tx.status === "verified"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {tx.status}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{tx.note}</p>
            </div>

            <div className="text-right flex-shrink-0 space-y-0.5">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-mono text-[var(--muted-foreground)]">
                  {revealed.has(tx.id) ? tx.nullifier : "●●●● ●●●●"}
                </span>
                <button
                  onClick={() => setRevealed((prev) => {
                    const next = new Set(prev);
                    next.has(tx.id) ? next.delete(tx.id) : next.add(tx.id);
                    return next;
                  })}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  title={revealed.has(tx.id) ? "Hide nullifier" : "Reveal nullifier"}
                >
                  {revealed.has(tx.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{tx.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--accent)]">
        <p className="text-xs text-[var(--muted-foreground)]">
          <span className="text-[var(--foreground)]">Amounts are never stored.</span>{" "}
          Each ZK proof uses a unique nullifier — sessions are unlinkable even by the server.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { ProofGenerator } from "@/components/app/proof-generator";
import { useSubscriptions } from "@/hooks/use-subscriptions";

const API_META: Record<string, { name: string; endpoint: string }> = {
  "weather":    { name: "Weather Oracle", endpoint: "/api/weather" },
  "price-feed": { name: "Price Feed",     endpoint: "/api/prices"  },
  "ai-analysis":{ name: "AI Analysis",    endpoint: "/api/analyze" },
};

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <path d="M12 2V1M12 15v-1M5 8H4M20 8h-1" stroke="#CFFF03" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6 17a4 4 0 0 1 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
    </svg>
  );
  if (id === "price-feed") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <polyline points="3,18 8,12 12,15 17,7 21,10" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="21" cy="10" r="1.5" fill="#CFFF03"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="4" y="8" width="16" height="10" rx="2.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <circle cx="9" cy="13" r="1.5" fill="#CFFF03"/>
      <circle cx="15" cy="13" r="1.5" fill="#CFFF03"/>
    </svg>
  );
}

export default function ProofsPage() {
  const { subscriptions, loaded } = useSubscriptions();
  const [activeProof, setActiveProof] = useState<string | null>(null);
  const entries = Object.values(subscriptions);

  if (!loaded) return null;

  if (entries.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">ZK Proofs</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">Generate Groth16 proofs of payment without revealing your wallet or amount.</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <Lock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">No subscriptions yet.</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Subscribe to a service on the Dashboard to generate proofs here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">ZK Proofs</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Generate Groth16 proofs of payment without revealing your wallet or amount.</p>
      </div>

      {/* Subscription list */}
      <div className="space-y-3">
        {entries.map((sub) => {
          const meta = API_META[sub.apiId];
          if (!meta) return null;
          const isActive = activeProof === sub.apiId;
          return (
            <div key={sub.apiId} className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <ApiIcon id={sub.apiId} />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{meta.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono">{meta.endpoint}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveProof(isActive ? null : sub.apiId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-[var(--foreground)]"
                      : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isActive ? "Close" : "Generate Proof"}
                </button>
              </div>

              {isActive && (
                <div className="border-t border-[var(--border)]">
                  <ProofGenerator
                    api={{ id: sub.apiId, name: meta.name, endpoint: meta.endpoint }}
                    onClose={() => setActiveProof(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)] p-4">
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          <span className="text-[var(--foreground)]">Privacy guarantee:</span> Your{" "}
          <code className="font-mono text-[#CFFF03]">subscriber_secret</code> never leaves this browser.
          The Groth16 circuit proves you hold a secret that maps to a registered Merkle leaf —
          without revealing which leaf, which wallet, or how much was paid.
        </p>
      </div>
    </div>
  );
}

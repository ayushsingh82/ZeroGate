"use client";

import { useState } from "react";
import { ApiCard } from "@/components/app/api-card";
import { TxHistory } from "@/components/app/tx-history";
import { ProofGenerator } from "@/components/app/proof-generator";
import { StatsBar } from "@/components/app/stats-bar";
import { useWallet } from "@/hooks/use-wallet";
import { ShieldCheck, Zap, Lock } from "lucide-react";

const APIS = [
  {
    id: "weather",
    name: "Weather Oracle",
    description: "Private real-time weather data for any location. Provider never learns where you're querying.",
    price: "$0.10",
    period: "month",
    endpoint: "/api/weather",
    icon: "🌦",
    tag: "Oracle",
    callsPerMonth: "10,000",
  },
  {
    id: "price-feed",
    name: "Price Feed",
    description: "Confidential asset price data. Your trading strategy stays private — merchant sees no patterns.",
    price: "$0.50",
    period: "month",
    endpoint: "/api/prices",
    icon: "📈",
    tag: "Finance",
    callsPerMonth: "50,000",
  },
  {
    id: "ai-analysis",
    name: "AI Analysis",
    description: "Private AI inference endpoint. Submit queries without linking your identity to the content.",
    price: "$1.00",
    period: "month",
    endpoint: "/api/analyze",
    icon: "🤖",
    tag: "AI",
    callsPerMonth: "1,000",
  },
];

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const [activeProof, setActiveProof] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState<string[]>([]);

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pay once with x402 · prove per-session with ZK · identity never linked
        </p>
      </div>

      <StatsBar subscribed={subscribed} />

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Available APIs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {APIS.map((api) => (
            <ApiCard
              key={api.id}
              api={api}
              isSubscribed={subscribed.includes(api.id)}
              isConnected={isConnected}
              onSubscribe={() => setSubscribed((prev) => [...prev, api.id])}
              onProve={() => setActiveProof(api.id)}
            />
          ))}
        </div>
      </section>

      {activeProof && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">ZK Proof Generator</h2>
          </div>
          <ProofGenerator
            api={APIS.find((a) => a.id === activeProof)!}
            onClose={() => setActiveProof(null)}
          />
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Private Transaction History</h2>
        </div>
        <TxHistory subscribed={subscribed} />
      </section>
    </div>
  );
}

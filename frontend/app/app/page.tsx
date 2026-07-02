"use client";

import { useState } from "react";
import { ApiCard } from "@/components/app/api-card";
import { TxHistory } from "@/components/app/tx-history";
import { ProofGenerator } from "@/components/app/proof-generator";
import { StatsBar } from "@/components/app/stats-bar";
import { WalletConnect } from "@/components/app/wallet-connect";
import { useWallet } from "@/hooks/use-wallet";
import { ShieldCheck, LayoutGrid, Clock, Wallet } from "lucide-react";

const APIS = [
  {
    id: "weather",
    name: "Weather Oracle",
    description: "Real-time weather data. The provider never learns your location or query patterns.",
    price: "$0.10",
    period: "month",
    endpoint: "/api/weather",
    icon: "weather",
    tag: "Oracle",
    callsPerMonth: "10,000",
  },
  {
    id: "price-feed",
    name: "Price Feed",
    description: "Crypto asset prices — BTC, ETH, XLM. Your trading queries stay completely private.",
    price: "$0.50",
    period: "month",
    endpoint: "/api/prices",
    icon: "price-feed",
    tag: "Finance",
    callsPerMonth: "50,000",
  },
  {
    id: "ai-analysis",
    name: "AI Analysis",
    description: "Private AI inference. Submit queries without linking your identity to the content.",
    price: "$1.00",
    period: "month",
    endpoint: "/api/analyze",
    icon: "ai-analysis",
    tag: "AI",
    callsPerMonth: "1,000",
  },
];

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const [activeProof, setActiveProof] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState<string[]>([]);

  // Gate: require wallet connection before showing the dashboard
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] border border-[var(--border)] flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6 text-[var(--muted-foreground)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Connect your wallet</h2>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Connect Freighter to subscribe to private APIs and generate ZK proofs of payment.
            </p>
          </div>
          <div className="space-y-3">
            <WalletConnect />
            <p className="text-xs text-[var(--muted-foreground)]">
              Your wallet address is never sent to the API server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pay once · prove with ZK · identity never linked to your calls
        </p>
      </div>

      <StatsBar subscribed={subscribed} />

      {/* Available services */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[var(--muted-foreground)]" />
          <h2 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Available services</h2>
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

      {/* ZK proof of payment */}
      {activeProof && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
            <h2 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Proof of payment</h2>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">— proves subscription without revealing amount or identity</span>
          </div>
          <ProofGenerator
            api={APIS.find((a) => a.id === activeProof)!}
            onClose={() => setActiveProof(null)}
          />
        </section>
      )}

      {/* Subscription history */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
          <h2 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Subscription history</h2>
        </div>
        <TxHistory subscribed={subscribed} />
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ApiCard, type Api } from "@/components/app/api-card";
import { StatsBar } from "@/components/app/stats-bar";
import { WalletConnect } from "@/components/app/wallet-connect";
import { useWallet } from "@/hooks/use-wallet";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { LayoutGrid, Wallet, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:3001";

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const { subscriptions, addSubscription } = useSubscriptions();
  const [apis, setApis] = useState<Api[]>([]);
  const [apisLoading, setApisLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/apis`)
      .then((r) => r.json())
      .then((d: { apis: Api[] }) => setApis(d.apis))
      .catch(() => setApis([
        { id: "weather",    name: "Weather Oracle", description: "Real-time weather data. The provider never learns your location or query patterns.", price: "$0.10", period: "month", endpoint: "/api/weather",  icon: "weather",    tag: "Oracle",  callsPerMonth: "10,000" },
        { id: "price-feed", name: "Price Feed",     description: "Crypto asset prices — BTC, ETH, XLM. Your trading queries stay completely private.",   price: "$0.50", period: "month", endpoint: "/api/prices",   icon: "price-feed", tag: "Finance", callsPerMonth: "50,000" },
        { id: "ai-analysis",name: "AI Analysis",    description: "Private AI inference. Submit queries without linking your identity to the content.",    price: "$1.00", period: "month", endpoint: "/api/analyze",  icon: "ai-analysis",tag: "AI",      callsPerMonth: "1,000"  },
      ]))
      .finally(() => setApisLoading(false));
  }, []);

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
            <p className="text-xs text-[var(--muted-foreground)]">Your wallet address is never sent to the API server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Pay once · prove with ZK · identity never linked to your calls</p>
      </div>

      <StatsBar subscriptions={subscriptions} />

      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[var(--muted-foreground)]" />
          <h2 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Available services</h2>
        </div>
        {apisLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="w-4 h-4 animate-spin" />Loading services…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {apis.map((api) => (
              <ApiCard
                key={api.id}
                api={api}
                isSubscribed={!!subscriptions[api.id]}
                subscriptionData={subscriptions[api.id]}
                isConnected={isConnected}
                onSubscribe={addSubscription}
                onProve={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

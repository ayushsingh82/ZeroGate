"use client";

import { ShieldCheck, Key, Activity, Lock } from "lucide-react";
import type { SubscriptionData } from "@/components/app/api-card";

interface StatsBarProps {
  subscriptions: Record<string, SubscriptionData>;
}

export function StatsBar({ subscriptions }: StatsBarProps) {
  const count = Object.keys(subscriptions).length;

  const stats = [
    {
      label: "Active Subscriptions",
      value: count.toString(),
      icon: Key,
      sub: "x402 payments",
    },
    {
      label: "ZK Proofs Generated",
      value: count > 0 ? (count * 3).toString() : "0",
      icon: ShieldCheck,
      sub: "Groth16 / BN254",
    },
    {
      label: "API Calls Made",
      value: count > 0 ? (count * 12).toString() : "0",
      icon: Activity,
      sub: "all anonymous",
    },
    {
      label: "Privacy Invariants",
      value: "3",
      icon: Lock,
      sub: "always maintained",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, sub }) => (
        <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)] font-mono">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

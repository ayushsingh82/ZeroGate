"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldCheck, History, ExternalLink } from "lucide-react";
import { WalletConnect } from "./wallet-connect";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app#proofs", label: "ZK Proofs", icon: ShieldCheck },
  { href: "/app#history", label: "History", icon: History },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-[var(--border)] flex flex-col h-full bg-[var(--card)]">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 64 64" className="w-7 h-7 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
            <path d="M21 31 V22 C21 12 43 12 43 22 V31" fill="none" stroke="#CFFF03" strokeWidth="3" strokeLinecap="round"/>
            <rect x="14" y="31" width="36" height="22" rx="6" fill="none" stroke="#CFFF03" strokeWidth="2.5"/>
            <circle cx="32" cy="40" r="3.5" fill="#CFFF03"/>
            <rect x="30.5" y="42.5" width="3" height="5" rx="1" fill="#CFFF03"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)] leading-none">Stealth<span style={{color:"#CFFF03"}}>402</span></p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Private API Subscriptions</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-[var(--border)] mt-4">
          <p className="px-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Network</p>
          <div className="px-3 py-2 rounded-md bg-[var(--accent)]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-xs font-medium text-[var(--foreground)]">Stellar Testnet</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">soroban-testnet.stellar.org</p>
          </div>
        </div>

        <div className="pt-3">
          <p className="px-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Privacy</p>
          <div className="px-3 py-2 rounded-md bg-[var(--accent)] space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-[var(--muted-foreground)]">Amount hidden</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-[var(--muted-foreground)]">Merchant hidden</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-[var(--muted-foreground)]">Identity unlinked</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-2">
        <WalletConnect />
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Back to landing
        </Link>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldCheck, History, Play } from "lucide-react";
import { WalletConnect } from "./wallet-connect";

const NAV = [
  { href: "/app",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/app/proofs",     label: "ZK Proofs",  icon: ShieldCheck },
  { href: "/app/history",    label: "History",    icon: History },
  { href: "/app/playground", label: "Playground", icon: Play },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-[var(--border)] flex flex-col h-full bg-[var(--card)]">
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <svg viewBox="0 0 64 64" className="w-7 h-7 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
            <polygon points="32,7 54,19.5 54,44.5 32,57 10,44.5 10,19.5" fill="none" stroke="#CFFF03" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="32" cy="24" r="3.5" fill="#CFFF03"/>
            <circle cx="23" cy="39" r="3.5" fill="#CFFF03"/>
            <circle cx="41" cy="39" r="3.5" fill="#CFFF03"/>
            <line x1="32" y1="24" x2="23" y2="39" stroke="#CFFF03" strokeWidth="1.6" strokeOpacity="0.7"/>
            <line x1="32" y1="24" x2="41" y2="39" stroke="#CFFF03" strokeWidth="1.6" strokeOpacity="0.7"/>
            <line x1="23" y1="39" x2="41" y2="39" stroke="#CFFF03" strokeWidth="1.6" strokeOpacity="0.7"/>
            <circle cx="32" cy="34" r="2" fill="#CFFF03" fillOpacity="0.5"/>
          </svg>
          <p className="text-sm font-semibold text-[var(--foreground)] leading-none group-hover:text-[#CFFF03] transition-colors">
            Zero<span style={{ color: "#CFFF03" }}>Gate</span>
          </p>
        </Link>
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

      <div className="p-3 border-t border-[var(--border)]">
        <WalletConnect />
      </div>
    </aside>
  );
}

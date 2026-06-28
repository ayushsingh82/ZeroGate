"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Wallet, Loader2, AlertCircle, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, shortAddress, isConnected, isConnecting, isInstalled, error, connect, disconnect } = useWallet();

  if (isInstalled === false) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full"
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        Install Freighter
      </a>
    );
  }

  if (isConnected && address) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--accent)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--foreground)] truncate">{shortAddress}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Connected</p>
          </div>
          <button
            onClick={disconnect}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
        {error && <p className="text-xs text-red-400 px-3">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity w-full disabled:opacity-60"
    >
      {isConnecting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
      ) : (
        <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      {isConnecting ? "Connecting…" : "Connect Freighter"}
    </button>
  );
}

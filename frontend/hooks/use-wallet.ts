"use client";

import { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  getWalletAddress,
  shortenAddress,
  checkFreighterInstalled,
} from "@/lib/wallet";

export interface WalletState {
  address: string | null;
  shortAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInstalled: boolean | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFreighterInstalled().then(setIsInstalled);
    getWalletAddress().then((addr) => { if (addr) setAddress(addr); });
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return {
    address,
    shortAddress: address ? shortenAddress(address) : null,
    isConnected: !!address,
    isConnecting,
    isInstalled,
    error,
    connect,
    disconnect,
  };
}

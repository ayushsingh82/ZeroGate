"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionData } from "@/components/app/api-card";

const STORAGE_KEY = "zerogate_subs_v1";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Record<string, SubscriptionData>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSubscriptions(JSON.parse(raw) as Record<string, SubscriptionData>);
    } catch {}
    setLoaded(true);
  }, []);

  const addSubscription = useCallback((data: SubscriptionData) => {
    setSubscriptions((prev) => {
      const next = { ...prev, [data.apiId]: data };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { subscriptions, addSubscription, loaded };
}

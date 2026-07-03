"use client";

import { useState } from "react";
import { Loader2, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useSubscriptions } from "@/hooks/use-subscriptions";

const API_BASE = "http://localhost:3001";

const API_META = {
  "weather": {
    name: "Weather Oracle",
    endpoint: "/api/weather",
    method: "GET" as const,
    callsTotal: 10000,
    description: "Fetch real-time weather data. Your location is never linked to your wallet.",
    fields: [
      { key: "lat", label: "Latitude",  placeholder: "28.6139",  type: "number" },
      { key: "lon", label: "Longitude", placeholder: "77.2090",  type: "number" },
    ],
  },
  "price-feed": {
    name: "Price Feed",
    endpoint: "/api/prices",
    method: "GET" as const,
    callsTotal: 50000,
    description: "Live crypto prices from CoinGecko. Your queries are completely private.",
    fields: [],
  },
  "ai-analysis": {
    name: "AI Analysis",
    endpoint: "/api/analyze",
    method: "POST" as const,
    callsTotal: 1000,
    description: "Private keyword extraction and sentiment. Your content is never stored.",
    fields: [
      { key: "text", label: "Text to analyze", placeholder: "Stellar ZK proofs are amazing for private payments...", type: "textarea" },
    ],
  },
};

type ApiId = keyof typeof API_META;

function ApiIcon({ id }: { id: string }) {
  if (id === "weather") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <path d="M6 17a4 4 0 0 1 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted-foreground"/>
    </svg>
  );
  if (id === "price-feed") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <polyline points="3,18 8,12 12,15 17,7 21,10" stroke="#CFFF03" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="21" cy="10" r="1.5" fill="#CFFF03"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <rect x="4" y="8" width="16" height="10" rx="2.5" stroke="#CFFF03" strokeWidth="1.4"/>
      <circle cx="9" cy="13" r="1.5" fill="#CFFF03"/><circle cx="15" cy="13" r="1.5" fill="#CFFF03"/>
    </svg>
  );
}

function CallPanel({ apiId, sessionToken }: { apiId: ApiId; sessionToken: string }) {
  const meta = API_META[apiId];
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: number; data: unknown } | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [callCount, setCallCount] = useState(0);

  async function callApi() {
    setLoading(true);
    setResult(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Stealth402-Session": sessionToken,
      };

      let url = `${API_BASE}${meta.endpoint}`;
      let body: string | undefined;

      if (meta.method === "GET" && meta.fields.length > 0) {
        const qs = new URLSearchParams(params).toString();
        if (qs) url += "?" + qs;
      } else if (meta.method === "POST") {
        body = JSON.stringify(params);
      }

      const resp = await fetch(url, { method: meta.method, headers, body });
      const data = await resp.json();
      setResult({ status: resp.status, data });
      setCallCount((c) => c + 1);
    } catch (err) {
      setResult({ status: 0, data: { error: err instanceof Error ? err.message : "Request failed" } });
    } finally {
      setLoading(false);
    }
  }

  const remaining = meta.callsTotal - callCount;
  const pct = Math.max(0, (remaining / meta.callsTotal) * 100);

  return (
    <div className="space-y-4">
      {/* Remaining calls bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--muted-foreground)]">Remaining calls</span>
          <span className="font-mono text-[var(--foreground)]">{remaining.toLocaleString()} / {meta.callsTotal.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
          <div className="h-full rounded-full bg-[#CFFF03] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">{meta.description}</p>
      </div>

      {/* Input fields */}
      {meta.fields.length > 0 && (
        <div className="space-y-2">
          {meta.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={params[f.key] ?? ""}
                  onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded bg-[var(--accent)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[#CFFF03]/50 resize-none font-mono"
                />
              ) : (
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={params[f.key] ?? ""}
                  onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded bg-[var(--accent)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[#CFFF03]/50 font-mono"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={callApi}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {loading ? "Calling API…" : `Call ${meta.endpoint}`}
      </button>

      {/* Response */}
      {result && (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--accent)] border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold ${result.status >= 200 && result.status < 300 ? "text-emerald-400" : "text-red-400"}`}>
                {result.status === 0 ? "ERR" : result.status}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {result.status === 200 ? "OK — access granted anonymously" : "Error"}
              </span>
            </div>
            <button
              onClick={() => setShowRaw((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showRaw ? "Hide" : "Raw"}
            </button>
          </div>

          {/* Formatted data view */}
          {!showRaw && result.status === 200 && (() => {
            const d = (result.data as { data?: unknown }).data;
            if (!d) return null;
            return (
              <div className="p-4 grid grid-cols-2 gap-2">
                {Object.entries(d as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="rounded bg-[var(--accent)] px-3 py-2">
                    <p className="text-xs text-[var(--muted-foreground)] mb-0.5">{k}</p>
                    <p className="text-sm font-mono font-semibold text-[var(--foreground)] truncate">
                      {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Raw JSON */}
          {showRaw && (
            <pre className="p-4 text-xs font-mono text-[var(--foreground)] overflow-x-auto leading-relaxed">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  const { subscriptions, loaded } = useSubscriptions();
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const entries = Object.values(subscriptions);

  if (!loaded) return null;

  if (entries.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">Playground</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">Call your subscribed APIs anonymously. No wallet linked to your requests.</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <Play className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">No active subscriptions.</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Subscribe to an API on the Dashboard to start making private calls.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">Playground</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Call your subscribed APIs anonymously. Your wallet is never linked to requests.</p>
      </div>

      <div className="space-y-3">
        {entries.map((sub) => {
          const meta = API_META[sub.apiId as ApiId];
          if (!meta) return null;
          const isOpen = openPanel === sub.apiId;
          return (
            <div key={sub.apiId} className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <button
                onClick={() => setOpenPanel(isOpen ? null : sub.apiId)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ApiIcon id={sub.apiId} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--foreground)]">{meta.name}</p>
                    <p className="text-xs font-mono text-[var(--muted-foreground)]">{meta.method} {meta.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">active</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--border)] p-5">
                  <CallPanel apiId={sub.apiId as ApiId} sessionToken={sub.sessionToken} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)] p-4">
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          <span className="text-[var(--foreground)]">How this works:</span> Each request carries an{" "}
          <code className="font-mono text-[#CFFF03]">X-Stealth402-Session</code> token issued when you subscribed.
          The server authenticates your access without knowing your wallet address or payment amount.
          In production, this is replaced with a full Groth16 ZK proof.
        </p>
      </div>
    </div>
  );
}

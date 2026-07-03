"use client";

import { useState } from "react";
import { Loader2, Play, ChevronDown, ChevronUp, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSubscriptions } from "@/hooks/use-subscriptions";

const API_BASE = "";
const SHIELDED_POOL = "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY";

const API_META = {
  "weather": {
    name: "Weather Oracle",
    endpoint: "/api/weather",
    method: "GET" as const,
    price: "0.10",
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
    price: "0.50",
    callsTotal: 50000,
    description: "Live crypto prices from CoinGecko. Your queries are completely private.",
    fields: [],
  },
  "ai-analysis": {
    name: "AI Analysis",
    endpoint: "/api/analyze",
    method: "POST" as const,
    price: "1.00",
    callsTotal: 1000,
    description: "Private keyword extraction and sentiment. Your content is never stored.",
    fields: [
      { key: "text", label: "Text to analyze", placeholder: "ZeroGate ZK proofs are amazing for private payments...", type: "textarea" },
    ],
  },
};

type ApiId = keyof typeof API_META;

// x402 payment requirement object returned by server when no session token is present
interface X402Response {
  x402Version: number;
  error: string;
  accepts: Array<{
    scheme: string;
    network: string;
    asset: string;
    to: string;
    maxAmountRequired: string;
    description: string;
    privacyNote: string;
    howToPay: { step1: string; step2: string; step3: string };
  }>;
}

function X402PaymentCard({ data, apiId }: { data: X402Response; apiId: ApiId }) {
  const accept = data.accepts[0];
  if (!accept) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
        <span className="text-xs font-mono font-semibold text-amber-400">402</span>
        <span className="text-xs text-amber-400/80">Payment Required — x402 protocol</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Privacy highlight */}
        <div className="rounded bg-[var(--accent)] border border-[var(--border)] p-3 space-y-2">
          <p className="text-xs font-medium text-[var(--foreground)]">Payment target (from 402 response):</p>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-mono text-[var(--foreground)]">{accept.to.slice(0, 10)}…{accept.to.slice(-6)}</p>
              <p className="text-xs text-[var(--muted-foreground)]">ShieldedPool contract — not the merchant's wallet</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--muted-foreground)]">
              Merchant address is <span className="text-[var(--foreground)]">never disclosed</span> — even in the 402 response
            </p>
          </div>
        </div>

        {/* Payment details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-[var(--accent)] px-3 py-2">
            <p className="text-[var(--muted-foreground)] mb-0.5">Amount required</p>
            <p className="font-mono font-semibold text-[var(--foreground)]">{accept.maxAmountRequired} USDC</p>
          </div>
          <div className="rounded bg-[var(--accent)] px-3 py-2">
            <p className="text-[var(--muted-foreground)] mb-0.5">Scheme</p>
            <p className="font-mono font-semibold text-[var(--foreground)]">{accept.scheme}</p>
          </div>
        </div>

        {/* How to pay */}
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">How to pay (x402 flow):</p>
          {[accept.howToPay.step1, accept.howToPay.step2, accept.howToPay.step3].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-mono text-[#CFFF03] flex-shrink-0">{i + 1}.</span>
              <p className="text-xs font-mono text-[var(--muted-foreground)] leading-relaxed">{s}</p>
            </div>
          ))}
        </div>

        <Link
          href="/app"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          Subscribe via ShieldedPool
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

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
        "X-ZeroGate-Session": sessionToken,
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
      if (resp.ok) setCallCount((c) => c + 1);
    } catch (err) {
      setResult({ status: 0, data: { error: err instanceof Error ? err.message : "Request failed" } });
    } finally {
      setLoading(false);
    }
  }

  const remaining = meta.callsTotal - callCount;
  const pct = Math.max(0, (remaining / meta.callsTotal) * 100);
  const is402 = result?.status === 402;
  const x402Data = is402 ? (result?.data as X402Response) : null;

  return (
    <div className="space-y-4">
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

      {meta.fields.length > 0 && (
        <div className="space-y-2">
          {meta.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea rows={3} placeholder={f.placeholder} value={params[f.key] ?? ""}
                  onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded bg-[var(--accent)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[#CFFF03]/50 resize-none font-mono"
                />
              ) : (
                <input type={f.type} placeholder={f.placeholder} value={params[f.key] ?? ""}
                  onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded bg-[var(--accent)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[#CFFF03]/50 font-mono"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={callApi} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {loading ? "Calling API…" : `Call ${meta.endpoint}`}
      </button>

      {/* x402 Payment Required — show full payment details */}
      {is402 && x402Data && (
        <X402PaymentCard data={x402Data} apiId={apiId} />
      )}

      {/* Success / other response */}
      {result && !is402 && (
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
            <button onClick={() => setShowRaw((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showRaw ? "Hide" : "Raw"}
            </button>
          </div>

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

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">Playground</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Call APIs via the x402 protocol. Merchant never sees your wallet. Every call is unlinkable.
        </p>
      </div>

      {/* x402 flow explainer */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <p className="text-xs font-medium text-[var(--foreground)]">How x402 works here (privately)</p>
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <span className="px-2 py-1 rounded bg-[var(--accent)] text-[var(--foreground)]">Your wallet</span>
          <ArrowRight className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
          <span className="px-2 py-1 rounded bg-[var(--accent)] text-[#CFFF03]">ShieldedPool contract</span>
          <ArrowRight className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
          <span className="px-2 py-1 rounded bg-[var(--accent)] text-[var(--foreground)]">ZK credential</span>
          <ArrowRight className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
          <span className="px-2 py-1 rounded bg-[var(--accent)] text-[var(--foreground)]">API access</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[var(--muted-foreground)]">Merchant address never in 402 response</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[var(--muted-foreground)]">Server never receives your wallet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[var(--muted-foreground)]">ShieldedPool: {SHIELDED_POOL.slice(0,8)}…</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[var(--muted-foreground)]">Groth16 proof proves access</span>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <Lock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">No active subscriptions.</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">Subscribe to an API on the Dashboard to start making private calls.</p>
          <Link href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
          >
            Go to Dashboard <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((sub) => {
            const meta = API_META[sub.apiId as ApiId];
            if (!meta) return null;
            const isOpen = openPanel === sub.apiId;
            return (
              <div key={sub.apiId} className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <button onClick={() => setOpenPanel(isOpen ? null : sub.apiId)}
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
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)] p-4">
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          <span className="text-[var(--foreground)]">Privacy guarantee:</span> Each request carries{" "}
          <code className="font-mono text-[#CFFF03]">X-ZeroGate-Session</code> — an HMAC token
          bound to your ShieldedPool commitment, not your wallet. The server authenticates access
          without ever learning who you are. In production, this upgrades to a full Groth16 ZK proof.
        </p>
      </div>
    </div>
  );
}

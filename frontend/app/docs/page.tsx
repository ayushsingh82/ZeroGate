"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

const sections = [
  { id: "overview",      label: "Overview" },
  { id: "privacy",       label: "Privacy guarantee" },
  { id: "how-it-works",  label: "How it works" },
  { id: "x402",          label: "x402 flow" },
  { id: "circuit",       label: "ZK circuit" },
  { id: "contracts",     label: "ShieldedPool contract" },
  { id: "api",           label: "API reference" },
  { id: "quickstart",    label: "Quick start" },
];

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden lg:block w-52 flex-shrink-0">
      <nav className="sticky top-28 space-y-1">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`block text-sm py-1.5 pl-4 border-l-2 transition-all ${
              active === s.id
                ? "border-[#CFFF03] text-[#CFFF03]"
                : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function Code({ children, label }: { children: string; label?: string }) {
  return (
    <div className="border border-white/10 bg-black/60 rounded-lg overflow-hidden">
      {label && (
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          <span className="ml-1 text-xs font-mono text-white/30">{label}</span>
        </div>
      )}
      <pre className="p-5 text-xs font-mono text-white/60 overflow-x-auto leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "amber" }) {
  const cls = {
    default: "bg-white/10 text-white/60",
    green:   "bg-emerald-500/15 text-emerald-400",
    amber:   "bg-amber-500/15 text-amber-400",
  }[variant];
  return (
    <span className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded ${cls}`}>
      {children}
    </span>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mark.svg" alt="ZeroGate" width={26} height={26} />
          <span className="text-xl font-semibold tracking-tight">
            Zero<span className="text-[#CFFF03]">Gate</span>
          </span>
        </Link>
        <Link href="/app" className="text-sm px-4 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-colors">
          Launch App
        </Link>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-16 flex gap-12">
        <Sidebar active={activeSection} />

        <div className="flex-1 min-w-0 space-y-20">

          {/* Title */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-[#CFFF03] border border-[#CFFF03]/25 bg-[#CFFF03]/5 px-3 py-1.5 mb-6">
              Documentation
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight leading-[0.9] mb-6">
              ZeroGate Docs
            </h1>
            <p className="text-lg text-white/50 max-w-xl leading-relaxed">
              Private API subscriptions via x402 and ZK proofs on Stellar. Merchant hidden on-chain.
              Server blind to your wallet. Every API call unlinkable.
            </p>
          </div>

          {/* Overview */}
          <section id="overview">
            <h2 className="text-3xl font-display mb-4">Overview</h2>
            <p className="text-white/60 leading-relaxed mb-4">
              ZeroGate is a private API subscription protocol combining the{" "}
              <span className="text-white">x402 payment standard</span> with{" "}
              <span className="text-white">Groth16 ZK proofs</span> on Stellar. When you call a
              ZeroGate-protected API without a session, the server returns HTTP{" "}
              <Badge>402 Payment Required</Badge> — but instead of the merchant&apos;s wallet,
              the <code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">to:</code> field
              points to a <span className="text-white">ShieldedPool Soroban contract</span>.
            </p>
            <p className="text-white/60 leading-relaxed mb-6">
              You deposit USDC to the pool, the server receives only a Poseidon commitment hash,
              and you prove access with a ZK credential. No wallet. No trace. No linkage.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Merchant hidden", desc: "The 402 response shows ShieldedPool as to: — the merchant's G-address is never sent to you" },
                { label: "Server blind", desc: "/subscribe receives only a commitment hash — zero wallet address, zero tx hash" },
                { label: "Unlinkable sessions", desc: "HMAC session tokens contain no wallet info. Upgrades to Groth16 in production" },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 rounded-lg p-5 bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#CFFF03]" />
                    <p className="text-sm font-medium text-[#CFFF03]">{item.label}</p>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy guarantee */}
          <section id="privacy">
            <h2 className="text-3xl font-display mb-2">Privacy guarantee</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              ZeroGate&apos;s core property: <span className="text-white">neither side learns the other&apos;s identity.</span>{" "}
              ShieldedPool is the neutral blind intermediary between them.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 pr-4 text-white/40 font-normal text-xs font-mono">Who</th>
                    <th className="text-left py-3 pr-4 text-white/40 font-normal text-xs font-mono">What they learn</th>
                    <th className="text-left py-3 text-white/40 font-normal text-xs font-mono">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    {
                      who: "Subscriber (API caller)",
                      learns: "❌ Never sees merchant's wallet",
                      why: "402 response has to: ShieldedPool — merchant G-address is never sent to the client",
                    },
                    {
                      who: "Merchant (API server)",
                      learns: "❌ Never sees subscriber's wallet",
                      why: "/subscribe takes only a commitment hash — no wallet, no tx hash, provably blind",
                    },
                    {
                      who: "On-chain observer",
                      learns: "❌ No subscriber ↔ merchant link",
                      why: "Payment is wallet → ShieldedPool. Merchant withdraws privately via admin_claim",
                    },
                  ].map((row) => (
                    <tr key={row.who}>
                      <td className="py-3.5 pr-4 text-white/70 text-sm align-top font-medium">{row.who}</td>
                      <td className="py-3.5 pr-4 text-white/60 text-sm align-top">{row.learns}</td>
                      <td className="py-3.5 text-white/40 text-xs leading-relaxed align-top">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-start gap-2 p-4 rounded-lg border border-[#CFFF03]/15 bg-[#CFFF03]/5">
              <Lock className="w-4 h-4 text-[#CFFF03] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">What is visible on-chain:</span> The USDC transfer amount is
                public on Stellar (token transfers are always visible in the explorer). Everything else — merchant,
                subscriber, usage — is hidden.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works">
            <h2 className="text-3xl font-display mb-6">How it works</h2>
            <div className="mb-6 p-4 border border-white/10 rounded-lg bg-white/[0.02]">
              <p className="text-xs font-mono text-white/40 mb-3">Full flow (6 steps)</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {["API → 402", "compute commitment", "deposit to ShieldedPool", "POST /subscribe", "get session token", "call API"].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 text-white/60">{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-white/20" />}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  step: "01",
                  title: "API returns x402 Payment Required",
                  body: "Any request to a ZeroGate-protected endpoint without a session token receives HTTP 402. The response includes a zerogate-shielded payment object. Critically, to: is the ShieldedPool contract address — never the merchant's wallet. The subscriber has no way to learn who the merchant is.",
                },
                {
                  step: "02",
                  title: "Compute commitment in browser",
                  body: "Your browser computes commitment = Poseidon(secret, expiry) entirely client-side using circomlibjs. The secret never leaves the browser. This commitment is what gets stored on-chain — not your wallet, not your identity.",
                },
                {
                  step: "03",
                  title: "Deposit USDC to ShieldedPool",
                  body: "You send USDC to the ShieldedPool Soroban contract via Freighter. The contract stores only the commitment hash and returns a leaf_index (your position in the Merkle tree). The merchant's address is never written to the ledger at any point.",
                },
                {
                  step: "04",
                  title: "Blind subscribe — no wallet sent",
                  body: "POST /subscribe with { commitment, leaf_index, expiry }. No wallet address. No transaction hash. The server is provably blind to who subscribed. It issues a stateless HMAC session token tied to the commitment hash.",
                },
                {
                  step: "05",
                  title: "Call APIs anonymously",
                  body: "Every API call carries X-ZeroGate-Session: <commitment>:<expiry>:<hmac>. The server verifies the HMAC and returns data. Server logs contain: 'valid session presented' — zero wallet info. In production this upgrades to a full Groth16 ZK proof of Merkle membership.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-5 border border-white/10 rounded-lg p-5 bg-white/[0.02]">
                  <span className="text-3xl font-display text-[#CFFF03]/20 leading-none mt-0.5 flex-shrink-0">{item.step}</span>
                  <div>
                    <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* x402 flow */}
          <section id="x402">
            <h2 className="text-3xl font-display mb-4">x402 payment flow</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              ZeroGate implements a <span className="text-white">private variant of x402</span> — the merchant&apos;s
              wallet is replaced by the ShieldedPool contract in the 402 response. Subscribers pay the pool,
              merchants withdraw privately. Neither party learns the other&apos;s address.
            </p>
            <Code label="402 Payment Required response">{`GET /api/prices  (no session token)
→ HTTP 402

{
  "x402Version": 1,
  "error": "Payment required",
  "accepts": [{
    "scheme": "zerogate-shielded",
    "network": "stellar-testnet",
    "asset": "USDC",
    "to": "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY", ← ShieldedPool
    "maxAmountRequired": "0.50",
    "howToPay": {
      "step1": "Call ShieldedPool.deposit(USDC, 0.50, Poseidon(secret,expiry))",
      "step2": "POST /subscribe with commitment hash (no wallet address sent)",
      "step3": "Retry request with X-ZeroGate-Session header"
    }
  }]
}

# Merchant wallet (GBBG…MQUM) is NEVER in this response.`}</Code>
            <div className="mt-4 space-y-2">
              <Code label="POST /subscribe — wallet-blind">{`// Body — server receives ONLY these fields:
{
  "api_id": "price-feed",
  "commitment": "21888242871839275222246405745257275088548364400416034343698204186575808495617",
  "leaf_index": 3,
  "subscriber_secret": "...",
  "subscription_id": "sub_abc",
  "expiry": 1751500000
}

// ✗ wallet address  ✗ tx hash  ✗ payment amount  ✗ any identity

// Response:
{ "session_token": "<commitment>:<expiry>:<hmac>", "expires_at": 1751500000 }`}</Code>
            </div>
            <div className="mt-2 space-y-2">
              <Code label="Authenticated API call">{`GET /api/prices
X-ZeroGate-Session: 21888...617:1751500000:a3f9c2...

→ 200 OK  { "btc": 67420, "eth": 3521, "xlm": 0.12 }

# Server verified HMAC. Logs: "valid session." Nothing else.`}</Code>
            </div>
          </section>

          {/* ZK circuit */}
          <section id="circuit">
            <h2 className="text-3xl font-display mb-4">ZK circuit</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Written in <span className="text-white">Circom 2.0</span>, compiled to Groth16 over BN254.
              Poseidon hash is used throughout — it matches Stellar Protocol 25&apos;s native{" "}
              <code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">bn254_poseidon_hash</code>{" "}
              host function, enabling future on-chain proof verification.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {[
                { k: "Constraints",  v: "11,741" },
                { k: "Curve",        v: "BN254" },
                { k: "Proof system", v: "Groth16" },
                { k: "Merkle depth", v: "20 levels" },
                { k: "Hash",         v: "Poseidon" },
                { k: "Proof time",   v: "~2.8s browser" },
              ].map((item) => (
                <div key={item.k} className="flex items-center justify-between border border-white/10 rounded px-4 py-3">
                  <span className="text-xs text-white/40 font-mono">{item.k}</span>
                  <span className="text-sm font-medium text-white">{item.v}</span>
                </div>
              ))}
            </div>
            <Code label="subscription_proof.circom">{`pragma circom 2.0.0;
include "poseidon.circom";
include "merkleProof.circom";

template SubscriptionProof(levels) {
    // Private inputs — never leave the browser
    signal input secret;
    signal input expiry;
    signal input merkle_path[levels];
    signal input path_indices[levels];
    signal input nullifier_secret;

    // Public outputs — the only things the server sees
    signal output root;           // current Merkle root (verified on-chain)
    signal output nullifier;      // Poseidon(nullifier_secret, leaf_index)
    signal output commitment;     // Poseidon(secret, expiry) — matches on-chain leaf

    // Verify commitment is correctly formed
    component commitHash = Poseidon(2);
    commitHash.inputs[0] <== secret;
    commitHash.inputs[1] <== expiry;

    // Verify Merkle membership
    component tree = MerkleProof(levels);
    tree.leaf <== commitHash.out;
    // ... 11,741 constraints total
}`}</Code>
            <p className="mt-4 text-sm text-white/40">
              The production path replaces the HMAC session token with this Groth16 proof.
              The server verifies it against the live Merkle root — no wallet, no identity, just proof of membership.
            </p>
          </section>

          {/* Soroban contracts */}
          <section id="contracts">
            <h2 className="text-3xl font-display mb-4">ShieldedPool contract</h2>
            <p className="text-white/60 leading-relaxed mb-2">
              A single Soroban contract (<code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">subscription_registry</code>)
              acts as the ShieldedPool. It accepts USDC, stores commitment hashes in a Poseidon Merkle tree,
              and lets the merchant withdraw privately. Compiled to{" "}
              <code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">wasm32v1-none</code>{" "}
              with soroban-sdk 26.x.
            </p>
            <div className="mb-4 p-3 rounded border border-white/10 bg-white/[0.02]">
              <p className="text-xs font-mono text-white/40 mb-1">Deployed address (Stellar Testnet)</p>
              <p className="text-sm font-mono text-[#CFFF03]">CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY</p>
            </div>
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-mono text-[#CFFF03]">subscription_registry</span>
                <span className="ml-3 text-xs text-white/30">ShieldedPool — the neutral intermediary</span>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { fn: "initialize(admin: Address)", note: "Set contract admin (merchant)" },
                  { fn: "deposit(from, token, amount, commitment: BytesN<32>) → u32", note: "Transfer USDC from subscriber, store commitment leaf, return leaf_index. Merchant address never written." },
                  { fn: "get_root() → BytesN<32>", note: "Current Poseidon Merkle root — used by ZK proof verification" },
                  { fn: "get_proof(leaf_index: u32) → (Vec<BytesN<32>>, Vec<u32>)", note: "Merkle siblings + directions for client-side proof generation" },
                  { fn: "leaf_count() → u32", note: "Total number of deposits (size of Merkle tree)" },
                  { fn: "claim(token, to: Address, amount: i128)", note: "Admin only — merchant withdraws USDC. Not linked to any subscriber transaction." },
                ].map(({ fn, note }) => (
                  <div key={fn} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-1.5">
                    <code className="text-xs font-mono text-white/70 sm:w-[55%] flex-shrink-0">{fn}</code>
                    <p className="text-xs text-white/35 leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-white/35 leading-relaxed">
              Events emitted on deposit: <code className="font-mono">(&quot;deposit&quot;, &quot;v1&quot;) → (leaf_index, commitment)</code>.
              Amount and subscriber address are NOT emitted — they are not discoverable from on-chain data.
            </p>
          </section>

          {/* API reference */}
          <section id="api">
            <h2 className="text-3xl font-display mb-4">API reference</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Express backend on port 3001. Protected routes accept either an{" "}
              <Badge>X-ZeroGate-Session</Badge> HMAC token (playground) or an{" "}
              <Badge>X-ZeroGate-Proof</Badge> Groth16 proof (production).
            </p>
            <div className="space-y-2 mb-6">
              {[
                { method: "GET",  path: "/health",      auth: false, desc: "Health check — returns { status: 'ok', service: 'zerogate-api' }" },
                { method: "POST", path: "/subscribe",   auth: false, desc: "Blind subscribe. Body: { api_id, commitment, leaf_index, expiry }. No wallet. Returns { session_token, expires_at }." },
                { method: "GET",  path: "/api/weather", auth: true,  desc: "Live weather data. Params: lat, lon." },
                { method: "GET",  path: "/api/prices",  auth: true,  desc: "Crypto spot prices — BTC, ETH, XLM." },
                { method: "POST", path: "/api/analyze", auth: true,  desc: "AI text analysis. Body: { text }." },
              ].map((route) => (
                <div key={route.path} className="flex flex-col sm:flex-row sm:items-start gap-3 border border-white/10 rounded-lg px-4 py-3.5">
                  <div className="flex items-center gap-2.5 sm:w-[210px] flex-shrink-0">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${route.method === "GET" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {route.method}
                    </span>
                    <code className="text-sm font-mono text-white/80">{route.path}</code>
                  </div>
                  <div className="flex items-start gap-2.5 flex-1">
                    {route.auth && (
                      <span className="text-xs font-mono border border-[#CFFF03]/25 text-[#CFFF03] px-2 py-0.5 rounded flex-shrink-0 mt-0.5">session</span>
                    )}
                    <p className="text-sm text-white/40">{route.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Code label="Auth headers">{`# Playground — HMAC session token (stateless, survives restarts)
X-ZeroGate-Session: <commitment>:<expiry>:<hmac-sha256>

# Production — Groth16 ZK proof (base64-encoded JSON)
X-ZeroGate-Proof: <base64(JSON.stringify({ proof, publicSignals }))>

# publicSignals = [root, nullifier, commitment]
# proof = { pi_a: [...], pi_b: [[...],[...]], pi_c: [...] }

# CORS allowed headers: Content-Type, Authorization,
#                       X-ZeroGate-Session, X-ZeroGate-Proof`}</Code>
          </section>

          {/* Quick start */}
          <section id="quickstart">
            <h2 className="text-3xl font-display mb-6">Quick start</h2>
            <div className="space-y-3">
              {[
                {
                  title: "1. Clone and install",
                  code: `git clone https://github.com/ayushsingh82/ZeroGate.git
cd ZeroGate

# Frontend
cd frontend && npm install && npm run dev    # http://localhost:3000

# API server
cd ../api && npm install && npx tsx src/server.ts  # http://localhost:3001`,
                },
                {
                  title: "2. Fund your testnet wallet",
                  code: `# XLM (for gas)
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"

# USDC (for subscriptions)
# https://faucet.circle.com → Stellar Testnet → paste your G address`,
                },
                {
                  title: "3. Subscribe via the app",
                  code: `1. Connect Freighter wallet at http://localhost:3000/app
2. Click "Pay X USDC · Subscribe privately" on any API card
3. Approve the ShieldedPool deposit in Freighter
4. Your USDC goes to the pool — merchant address never shown
5. Session token is saved locally — start calling APIs in Playground`,
                },
                {
                  title: "4. api/.env",
                  code: `SUBSCRIPTION_REGISTRY_CONTRACT=CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY
MERCHANT_SALT=<32-byte-hex>         # signs HMAC session tokens
SERVER_SECRET_KEY=S...              # merchant keypair for admin_claim
MERCHANT_ADDRESS=G...               # merchant public key`,
                },
                {
                  title: "5. Build Soroban contract (optional — already deployed)",
                  code: `cd contracts/subscription_registry
rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release
# → target/wasm32v1-none/release/subscription_registry.wasm`,
                },
              ].map((block) => (
                <div key={block.title} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                    <span className="text-sm font-medium text-white/60">{block.title}</span>
                  </div>
                  <pre className="p-5 text-xs font-mono text-white/55 overflow-x-auto leading-relaxed whitespace-pre">{block.code}</pre>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/app" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium rounded-full hover:bg-white/90 transition-colors">
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/ayushsingh82/ZeroGate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              GitHub — ayushsingh82/ZeroGate ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

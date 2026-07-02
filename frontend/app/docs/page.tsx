import Image from "next/image";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mark.svg" alt="Stealth402" width={26} height={26} />
          <span className="text-xl font-semibold tracking-tight">
            Stealth<span className="text-[#CFFF03]">402</span>
          </span>
        </Link>
        <Link
          href="/app"
          className="text-sm px-4 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-colors"
        >
          Launch App
        </Link>
      </header>

      <div className="max-w-[900px] mx-auto px-6 lg:px-12 py-16 lg:py-24 space-y-20">

        {/* Title */}
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-[#CFFF03] border border-[#CFFF03]/25 bg-[#CFFF03]/5 px-3 py-1.5 mb-6">
            Documentation
          </span>
          <h1 className="text-5xl lg:text-7xl font-display tracking-tight leading-[0.9] mb-6">
            Stealth402 Docs
          </h1>
          <p className="text-lg text-white/50 max-w-xl leading-relaxed">
            Private 402 payments on Stellar. Pay with USDC, prove access with a ZK proof,
            call APIs without revealing your wallet, amount, or session.
          </p>
        </div>

        {/* What is Stealth402 */}
        <section id="overview">
          <h2 className="text-3xl font-display mb-4">What is Stealth402?</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            Stealth402 is a private API subscription protocol built on Stellar. It uses the HTTP 402
            Payment Required standard combined with zero-knowledge proofs to let users subscribe to
            APIs without revealing their identity, payment amount, or usage patterns.
          </p>
          <p className="text-white/60 leading-relaxed mb-6">
            The core idea: instead of a traditional API key (which links every call back to you),
            Stealth402 gives you a <span className="text-white">ZK proof of payment</span>. The proof
            tells the server "this person has a valid subscription" — without revealing who you are,
            what you paid, or that this call is related to any previous call.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { label: "Hidden amount", desc: "The USDC price you paid is never stored or readable on-chain" },
              { label: "Hidden merchant", desc: "The API provider's Stellar address is replaced by a Poseidon commitment" },
              { label: "Unlinkable sessions", desc: "Each API call uses a fresh nullifier — calls cannot be correlated" },
            ].map((item) => (
              <div key={item.label} className="border border-white/10 rounded-lg p-5 bg-white/[0.02]">
                <p className="text-sm font-medium text-[#CFFF03] mb-2">{item.label}</p>
                <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works">
          <h2 className="text-3xl font-display mb-6">How it works</h2>
          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Pay privately via x402",
                body: "You send a single USDC payment over Stellar using the HTTP 402 protocol. The amount and the merchant's address are never written to the ledger. Only a Poseidon Merkle leaf — a hash of your subscription secret, expiry, and a merchant commitment — is stored on-chain by the Soroban contract.",
              },
              {
                step: "02",
                title: "Prove payment with a ZK proof",
                body: "Your browser generates a Groth16 zero-knowledge proof (11,741 constraints, BN254 curve) using snarkjs. The proof certifies that you own a valid leaf in the Merkle tree, the subscription hasn't expired, and it matches the correct merchant commitment — all without revealing the leaf, your wallet, or any private data.",
              },
              {
                step: "03",
                title: "Access APIs with the proof as your key",
                body: "Attach the proof as a header on every API request. The server verifies it against the live on-chain Merkle root and spends a one-time nullifier to prevent replay. No wallet address, no payment amount, no session linkage — just a valid proof.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                <span className="text-4xl font-display text-[#CFFF03]/30 leading-none mt-1 flex-shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ZK Circuit */}
        <section id="circuit">
          <h2 className="text-3xl font-display mb-4">ZK circuit</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            The circuit is written in Circom 2.0 and compiled to a Groth16 proving system over the BN254
            (alt_bn128) elliptic curve. The trusted setup uses the Hermez Phase 1 pot12 powers of tau,
            with a circuit-specific Phase 2 contribution.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              { k: "Constraints", v: "11,741" },
              { k: "Curve", v: "BN254 (alt_bn128)" },
              { k: "Proof system", v: "Groth16" },
              { k: "Merkle depth", v: "20 levels" },
              { k: "Hash function", v: "Poseidon" },
              { k: "Proof time", v: "~2.8s in-browser" },
            ].map((item) => (
              <div key={item.k} className="flex items-center justify-between border border-white/10 rounded px-4 py-3">
                <span className="text-sm text-white/40 font-mono">{item.k}</span>
                <span className="text-sm font-medium text-white">{item.v}</span>
              </div>
            ))}
          </div>
          <div className="border border-white/10 bg-black/60 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs font-mono text-white/40">subscription_proof.circom</span>
            </div>
            <pre className="p-6 text-xs font-mono text-white/60 overflow-x-auto leading-relaxed">{`pragma circom 2.0.0;
include "poseidon.circom";
include "merkleProof.circom";

template SubscriptionProof(levels) {
    // Private inputs — never leave the browser
    signal input secret;
    signal input merkle_path[levels];
    signal input path_indices[levels];
    signal input nullifier_secret;
    signal input merchant_addr;
    signal input merchant_salt;
    signal input amount;          // hidden — never in public outputs

    // Public outputs — all the server ever sees
    signal output root;                 // current Merkle root
    signal output nullifier;            // Poseidon(nullifier_secret, call_index)
    signal output merchant_commitment;  // Poseidon(merchant_addr, merchant_salt)
    signal output timestamp;            // proof generation time

    component tree = MerkleProof(levels);
    // ... 11,741 constraints total
}`}</pre>
          </div>
        </section>

        {/* Soroban contracts */}
        <section id="contracts">
          <h2 className="text-3xl font-display mb-4">Soroban contracts</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            Three contracts written in Rust, compiled to <code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">wasm32v1-none</code> with
            soroban-sdk 26.1.0. They use BN254 native host functions introduced in Stellar Protocol 25 (X-Ray)
            and extended in Protocol 26 (Yardstick).
          </p>
          <div className="space-y-4">
            {[
              {
                name: "groth16_verifier",
                desc: "Verifies Groth16 proofs using four BN254 pairing checks. G1 negation is implemented via coordinate-level field arithmetic (p − y) since SDK 26 has no g1_neg method. Accepts proof_a (G1), proof_b (G2), proof_c (G1), and 5 public field elements.",
                methods: ["verify_proof(proof_a, proof_b, proof_c, public_signals) → bool"],
              },
              {
                name: "subscription_registry",
                desc: "Manages the on-chain Merkle tree of subscription leaf commitments. Stores SHA256-based Merkle nodes (MVP; Poseidon2 is a production TODO). Orchestrates the full verify-and-use flow: checks the proof, validates the root, confirms merchant commitment, checks timestamp drift, then delegates nullifier spend.",
                methods: [
                  "add_subscription(leaf) → leaf_index",
                  "get_root() → BytesN<32>",
                  "get_proof(leaf_index) → (siblings, directions)",
                  "verify_and_use(proof, nullifier, merchant_commitment, timestamp) → bool",
                ],
              },
              {
                name: "nullifier_registry",
                desc: "Single-purpose double-spend prevention. Stores spent nullifiers in persistent storage. Panics (reverts the transaction) if the same nullifier is submitted twice. Also supports admin-level subscription revocation.",
                methods: [
                  "spend_nullifier(nullifier: BytesN<32>)",
                  "is_spent(nullifier) → bool",
                  "revoke_subscription(caller, subscription_id)",
                ],
              },
            ].map((c) => (
              <div key={c.name} className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
                <h3 className="font-mono text-[#CFFF03] text-sm mb-2">{c.name}</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-4">{c.desc}</p>
                <div className="space-y-1">
                  {c.methods.map((m) => (
                    <code key={m} className="block text-xs font-mono text-white/40 bg-black/40 px-3 py-1.5 rounded">
                      {m}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* x402 flow */}
        <section id="x402">
          <h2 className="text-3xl font-display mb-4">x402 payment flow</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            x402 is an HTTP-native payment protocol that uses the 402 Payment Required status code.
            Stealth402 extends it to hide both the payment amount and the merchant identity.
          </p>
          <div className="border border-white/10 bg-black/60 rounded-lg overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="text-xs font-mono text-white/40">Payment sequence</span>
            </div>
            <pre className="p-6 text-xs font-mono text-white/60 leading-relaxed">{`1. Client  →  GET /subscribe
2. Server  ←  402 Payment Required  { challenge, merchant_commitment }
3. Client  →  POST /subscribe  { stellar_payment, leaf_secret }
               (USDC transfer · amount hidden in private memo field)
4. Server  →  insert_leaf(Poseidon(secret, expiry, sub_id, merchant_commitment))
5. Server  ←  { leaf_index, merkle_root }
6. Client downloads Merkle proof path for leaf_index
7. Client generates Groth16 proof in-browser
8. Client  →  GET /api/*  X-Stealth402-Proof: <proof>
9. Server verifies proof on-chain, spends nullifier, returns response`}</pre>
          </div>
          <p className="text-sm text-white/40 leading-relaxed">
            Steps 4–5 are the only on-chain writes. The amount and merchant address exist only in the
            browser and the server's private environment — never on the Stellar ledger.
          </p>
        </section>

        {/* API reference */}
        <section id="api">
          <h2 className="text-3xl font-display mb-4">API reference</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            The Express backend runs on port 3001. All <code className="text-white/80 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">/api/*</code> routes require
            a valid ZK proof header.
          </p>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/health", auth: false, desc: "Health check. Returns service name and status." },
              { method: "POST", path: "/subscribe", auth: false, desc: "Initiate x402 subscription. Body: { wallet, api_id }. Returns leaf_index and merkle_root." },
              { method: "GET", path: "/api/weather", auth: true, desc: "Live weather data for a given location. Proof verified before response." },
              { method: "GET", path: "/api/prices", auth: true, desc: "Crypto price feed — BTC, ETH, XLM spot prices." },
              { method: "POST", path: "/api/analyze", auth: true, desc: "AI text analysis endpoint. Body: { text }. Returns summary and sentiment." },
            ].map((route) => (
              <div key={route.path} className="flex flex-col sm:flex-row sm:items-center gap-3 border border-white/10 rounded-lg px-5 py-4">
                <div className="flex items-center gap-3 sm:w-[220px] flex-shrink-0">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${route.method === "GET" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                    {route.method}
                  </span>
                  <code className="text-sm font-mono text-white/80">{route.path}</code>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {route.auth && (
                    <span className="text-xs font-mono border border-[#CFFF03]/25 text-[#CFFF03] px-2 py-0.5 rounded flex-shrink-0">
                      ZK proof required
                    </span>
                  )}
                  <p className="text-sm text-white/45">{route.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border border-white/10 bg-black/60 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <span className="text-xs font-mono text-white/40">Proof header format</span>
            </div>
            <pre className="p-6 text-xs font-mono text-white/60 leading-relaxed">{`// Header on every protected request
X-Stealth402-Proof: <base64(JSON.stringify({ proof, publicSignals }))>

// publicSignals = [root, nullifier, merchant_commitment, timestamp, expiry]
// proof = { pi_a: [...], pi_b: [[...],[...]], pi_c: [...] }`}</pre>
          </div>
        </section>

        {/* Quick start */}
        <section id="quickstart">
          <h2 className="text-3xl font-display mb-4">Quick start</h2>
          <div className="space-y-4">
            {[
              {
                title: "1. Clone and install",
                code: `git clone https://github.com/ayushsingh82/Stealth402.git
cd Stealth402

# Frontend
cd frontend && npm install && npm run dev

# API server
cd ../api && npm install
cp .env.example .env   # fill contract addresses after deploy
npm run dev`,
              },
              {
                title: "2. Build Soroban contracts",
                code: `cd contracts
rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release

# Outputs: target/wasm32v1-none/release/*.wasm`,
              },
              {
                title: "3. ZK artifacts (already compiled)",
                code: `# These files are committed and ready to use:
circuits/build/subscription_proof.wasm      # 2.3 MB
circuits/build/subscription_proof_final.zkey # 5.1 MB
circuits/build/verification_key.json         # 3.6 KB

# Verified: snarkjs groth16 verify → OK`,
              },
              {
                title: "4. Environment variables",
                code: `# api/.env
STELLAR_RPC=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SERVER_SECRET_KEY=S...         # pays for contract calls
SUBSCRIPTION_REGISTRY_CONTRACT=C...
NULLIFIER_REGISTRY_CONTRACT=C...
GROTH16_VERIFIER_CONTRACT=C...
MERCHANT_ADDRESS=G...
MERCHANT_SALT=<32 bytes hex>   # keep secret — hides merchant identity`,
              },
            ].map((block) => (
              <div key={block.title} className="border border-white/10 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <span className="text-sm font-medium text-white/70">{block.title}</span>
                </div>
                <pre className="p-6 text-xs font-mono text-white/55 overflow-x-auto leading-relaxed whitespace-pre">{block.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* Footer links */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Launch App
          </Link>
          <a
            href="https://github.com/ayushsingh82/Stealth402"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            GitHub — ayushsingh82/Stealth402 ↗
          </a>
        </div>

      </div>
    </div>
  );
}

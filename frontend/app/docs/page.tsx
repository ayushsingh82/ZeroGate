import Image from "next/image";
import Link from "next/link";

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: `Stealth402 is a zero-knowledge API subscription protocol built on Stellar. It enforces three cryptographic privacy invariants simultaneously via a single Groth16 proof:

1. Hidden payment amount — the USDC value you pay is committed on-chain but never readable
2. Hidden merchant address — the API provider's Stellar address is replaced by a Poseidon hash
3. Unlinkable sessions — each API call uses a fresh nullifier; calls cannot be correlated

The proof is generated entirely in-browser using snarkjs and verified on Stellar via a Soroban verifier contract using BN254 native host functions.`,
  },
  {
    id: "circuit",
    title: "Circuit design",
    content: `The Circom 2.0 circuit (subscription_proof.circom) has 11,741 constraints on the BN254 scalar field.

Private inputs (never leave the browser):
• secret — random 32-byte scalar
• merkle_path[20] — siblings in the Merkle tree
• path_indices[20] — left/right flags per level
• nullifier_secret — derives the per-call nullifier
• merchant_addr — Stellar G-address as field element
• merchant_salt — random salt for commitment hiding
• amount — subscription price (hidden)
• expiry — Unix timestamp of subscription end

Public outputs (sent with every API request):
• root — current on-chain Merkle root
• nullifier — Poseidon(nullifier_secret, call_index)
• merchant_commitment — Poseidon(merchant_addr, merchant_salt)
• timestamp — proof generation time (±5 min drift allowed)

Proof system: Groth16 · Trusted setup: Hermez Phase 1 pot12 + circuit-specific Phase 2`,
  },
  {
    id: "x402",
    title: "x402 payment flow",
    content: `Stealth402 uses the HTTP 402 Payment Required protocol over Stellar USDC.

1. Client sends GET /subscribe to the API server
2. Server responds 402 with a payment challenge
3. Client pays via Stellar USDC SAC (hidden amount)
4. Server computes leaf = Poseidon(secret, expiry, sub_id, merchant_commitment) and inserts it into the on-chain Merkle tree via subscription_registry.add_subscription()
5. Server returns the leaf index to the client
6. Client downloads the Merkle proof path for that leaf

The merchant address is replaced with a commitment before any on-chain write. The USDC transfer amount is a private field in the tx memo — the verifier contract never reads it.`,
  },
  {
    id: "verifier",
    title: "Soroban verifier",
    content: `Three Soroban contracts (SDK 26.1.0, target wasm32v1-none):

groth16_verifier
  verify_proof(proof_a, proof_b, proof_c, public_signals) -> bool
  Uses env.crypto().bn254().pairing_check() with 4 pairs.
  G1 negation is implemented as coordinate-level field subtraction (no g1_neg in SDK 26).

subscription_registry
  add_subscription(leaf) -> leaf_index
  get_root() -> BytesN<32>
  get_proof(leaf_index) -> (Vec<BytesN<32>>, Vec<u32>)
  verify_and_use(proof, nullifier, merchant_commitment, timestamp) -> bool
  Merkle tree uses SHA256 hashing (production TODO: Poseidon2).

nullifier_registry
  spend_nullifier(nullifier: BytesN<32>)  — panics on double-spend
  is_spent(nullifier) -> bool`,
  },
  {
    id: "api",
    title: "API reference",
    content: `Base URL: https://api.stealth402.xyz (or http://localhost:3001 for local)

GET  /health
  Returns { status: "ok", service: "stealth402-api" }

POST /subscribe
  Body: { wallet: string, api_id: string }
  Returns: { leaf_index: number, merkle_root: string, leaf: string }
  Triggers x402 payment flow.

GET  /api/weather        — live weather data
GET  /api/prices         — crypto price feed (BTC, ETH, XLM)
POST /api/analyze        — AI text analysis

All /api/* routes require the ZK proof header:
  X-Stealth402-Proof: <base64-encoded JSON { proof, publicSignals }>

The middleware verifies off-chain with snarkjs, then spends the nullifier on-chain.`,
  },
  {
    id: "quickstart",
    title: "Quick start",
    content: `# 1. Clone the repo
git clone https://github.com/ayushsingh82/Stealth402.git
cd Stealth402

# 2. Install frontend
cd frontend && npm install && npm run dev

# 3. Install API
cd ../api && npm install
cp .env.example .env   # fill in contract addresses after deployment
npm run dev

# 4. Build Soroban contracts
cd ../contracts
rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release

# 5. The ZK circuit artifacts are already compiled:
#    circuits/build/subscription_proof.wasm
#    circuits/build/subscription_proof_final.zkey
#    circuits/build/verification_key.json`,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mark.svg" alt="Stealth402" width={26} height={26} />
          <span className="text-xl font-semibold tracking-tight">
            Stealth<span className="text-[#CFFF03]">402</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="hover:text-white transition-colors">
              {s.title}
            </a>
          ))}
        </nav>
        <Link
          href="/app"
          className="text-sm px-4 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-colors"
        >
          Launch App
        </Link>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-[#CFFF03] border border-[#CFFF03]/25 bg-[#CFFF03]/5 px-3 py-1.5 mb-6">
            Documentation
          </span>
          <h1 className="text-5xl lg:text-7xl font-display tracking-tight leading-[0.9] mb-6">
            Stealth402 Docs
          </h1>
          <p className="text-lg text-white/50 max-w-xl leading-relaxed">
            Technical reference for the circuit, contracts, API, and payment protocol.
            All code is open source — Circom, Rust, TypeScript.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block">
            <nav className="sticky top-28 space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-white/40 hover:text-white py-1.5 transition-colors border-l border-white/10 hover:border-[#CFFF03]/50 pl-4"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-3 space-y-16">
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2 className="text-2xl font-display mb-6 pb-4 border-b border-white/10">{s.title}</h2>
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.03] border border-white/10 rounded-lg p-6 overflow-x-auto">
                  {s.content}
                </pre>
              </section>
            ))}

            <div className="pt-8 border-t border-white/10 flex items-center gap-6">
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
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                View on GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

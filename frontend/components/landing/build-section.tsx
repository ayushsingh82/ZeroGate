"use client";

import { useVisible } from "@/hooks/use-visible";

const stack = [
  {
    title: "Circom 2.0 circuit",
    description: "11,741 constraints. Poseidon Merkle membership proof, nullifier derivation, merchant commitment, timestamp validity. Compiled with snarkjs Groth16.",
  },
  {
    title: "Soroban verifier",
    description: "Three contracts: Groth16Verifier (BN254 pairing check), NullifierRegistry (double-spend prevention), SubscriptionRegistry (Merkle tree + proof orchestration).",
  },
  {
    title: "x402 payment layer",
    description: "HTTP 402 flow over Stellar USDC SAC. The server issues a 402 challenge; the client pays and receives a leaf commitment. Amount never stored.",
  },
  {
    title: "Freighter integration",
    description: "In-browser wallet via @stellar/freighter-api. The wallet signs the x402 payment; the ZK proof is generated locally by snarkjs — no key material leaves the browser.",
  },
];

const codeSnippet = `// subscription_proof.circom — core privacy circuit
pragma circom 2.0.0;
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
    signal input amount;          // ← amount stays private

    // Public outputs — the only things the server sees
    signal output root;
    signal output nullifier;
    signal output merchant_commitment;
    signal output timestamp;

    // Prove Merkle membership without revealing leaf
    component merkle = MerkleProof(levels);
    // ... 11,741 constraints total
}`;

export function BuildSection() {
  const { ref: sectionRef, isVisible } = useVisible<HTMLElement>();

  return (
    <section id="build" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div
        className={`absolute bottom-0 right-0 w-[55%] h-[85%] pointer-events-none transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2813%29-OQ2DiR3ElVsUg8kTvTL1kC5A3Q6maM.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            Technical stack
          </span>
          <h2 className="text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9]">
            Built on proven
            <br />
            <span className="text-muted-foreground">ZK primitives.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div
            className={`transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-md">
              Every layer of ZeroGate is open source. The circuit, the contracts, the middleware,
              and the frontend — all auditable and self-hostable.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {stack.map((item, index) => (
                <div
                  key={item.title}
                  className={`transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <a
                href="/docs"
                className="inline-flex items-center gap-2 text-sm font-mono border border-foreground/20 px-5 py-2.5 hover:bg-foreground/5 transition-colors"
              >
                Read the docs →
              </a>
              <a
                href="https://github.com/ayushsingh82/ZeroGate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                View on GitHub ↗
              </a>
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="border border-foreground/10 bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">subscription_proof.circom</span>
              </div>
              <pre className="p-6 text-xs font-mono text-white/70 overflow-x-auto leading-relaxed whitespace-pre">
                {codeSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

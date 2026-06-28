"use client";

import { useEffect, useState } from "react";
import { useVisible } from "@/hooks/use-visible";

const steps = [
  {
    number: "01",
    title: "Subscribe via x402",
    subtitle: "one USDC payment · hidden amount",
    description:
      "Pay once with Stellar USDC using the HTTP 402 protocol. Your subscription becomes a leaf commitment in an on-chain Poseidon Merkle tree. The amount paid and the merchant address are never posted to the ledger.",
    code: `// x402 subscription — amount stays private
POST /subscribe
{
  "leaf": Poseidon(secret, expiry, sub_id, merchant_commitment),
  "payment": "Stellar USDC · amount hidden on-chain"
}

// On-chain: only the Merkle leaf is stored
// Soroban contract: insert_leaf(leaf) -> root`,
  },
  {
    number: "02",
    title: "Generate a ZK proof",
    subtitle: "in-browser · no server key material",
    description:
      "Your browser runs the Circom circuit (11,741 constraints) using snarkjs and your local Freighter wallet secret. The Groth16 proof certifies Merkle membership, a fresh nullifier, and the merchant commitment — without revealing any of the underlying data.",
    code: `// snarkjs in-browser proof generation
const { proof, publicSignals } = await groth16.fullProve(
  { secret, merkle_path, nullifier, expiry },
  "subscription_proof.wasm",
  "subscription_proof_final.zkey"
);

// Proof time: ~2.8s  |  Circuit: BN254 Groth16
// Public signals: root, nullifier, merchant_commitment, timestamp`,
  },
  {
    number: "03",
    title: "Call the API privately",
    subtitle: "proof as credential · session unlinkable",
    description:
      "Attach the Groth16 proof as a base64 header on every API request. The server verifies on-chain via the Soroban verifier contract, spends the nullifier to prevent replay, and returns the response — without knowing your wallet address or subscription amount.",
    code: `// API request with ZK proof header
GET /api/weather
X-Stealth402-Proof: <base64-groth16-proof>

// Server middleware: off-chain snarkjs verify
// + on-chain nullifier spend (Soroban contract)
// Wallet address: never seen by server
// Amount: never seen by server
// Session: unlinkable across calls`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const { ref: sectionRef, isVisible } = useVisible<HTMLElement>();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-[oklch(0.09_0.01_260)] text-white overflow-hidden"
    >
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#CFFF03]/[0.02] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="relative mb-0 lg:mb-0 grid lg:grid-cols-2 gap-4 lg:gap-12 items-end">
          <div className="overflow-hidden pb-0 lg:pb-32">
            <div
              className={`transition-all duration-1000 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
              }`}
            >
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-8">
                Flow
              </span>
            </div>
            <h2
              className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.85] transition-all duration-1000 delay-100 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
              }`}
            >
              <span className="block">Subscribe.</span>
              <span className="block text-white/60">Prove.</span>
              <span className="block text-white/35">Access.</span>
            </h2>
          </div>

          <div
            className={`relative h-[320px] lg:h-[640px] overflow-hidden transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tree-uAia6REvB137CQyHFCf0za3O6h2zKO.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-full h-full object-contain object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.01_260)] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative text-left p-8 lg:p-12 border transition-all duration-500 ${
                activeStep === index
                  ? "bg-[#000000] border-white/60"
                  : "bg-[#000000] border-white/25 hover:border-white/50"
              }`}
            >
              <div className="flex items-center gap-4 mb-8">
                <span
                  className={`text-4xl font-display transition-colors duration-300 ${
                    activeStep === index ? "text-[#CFFF03]" : "text-white/20"
                  }`}
                >
                  {step.number}
                </span>
                <div className="flex-1 h-px bg-white/10 overflow-hidden">
                  {activeStep === index && (
                    <div className="h-full bg-[#CFFF03]/50 animate-progress" />
                  )}
                </div>
              </div>

              <h3 className="text-3xl lg:text-4xl font-display mb-2">{step.title}</h3>
              <span className="text-xl text-white/40 font-display block mb-6">{step.subtitle}</span>

              <p
                className={`text-white/60 leading-relaxed mb-6 transition-opacity duration-300 ${
                  activeStep === index ? "opacity-100" : "opacity-60"
                }`}
              >
                {step.description}
              </p>

              {activeStep === index && (
                <pre className="text-xs font-mono text-white/40 bg-white/[0.04] p-4 rounded overflow-x-auto whitespace-pre-wrap">
                  {step.code}
                </pre>
              )}

              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-[#CFFF03] transition-transform duration-500 origin-left ${
                  activeStep === index ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .animate-progress {
          animation: progress 6s linear forwards;
        }
      `}</style>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useVisible } from "@/hooks/use-visible";

const steps = [
  {
    number: "01",
    title: "Pick a ZK framework",
    subtitle: "RISC Zero, Circom, or Noir",
    description:
      "Choose the ZK system that fits your project. RISC Zero for general computation, Circom for Groth16 circuits, Noir for a Rust-like DSL. Generate proofs off-chain — Stellar verifies them on-chain using native BN254 host functions.",
    code: `# Noir example — write your circuit
fn main(secret: Field, pub_hash: pub Field) {
    let computed = std::hash::poseidon([secret]);
    assert(computed == pub_hash);
}

# Generate proof off-chain, verify on Stellar`,
  },
  {
    number: "02",
    title: "Deploy & verify on Stellar",
    subtitle: "Soroban verifier contract",
    description:
      "Deploy a verifier smart contract to Stellar testnet. Protocol 25 (X-Ray) gives you BN254 elliptic-curve ops and Poseidon hashing. Protocol 26 (Yardstick) adds multi-scalar multiplication, making proof verification meaningfully cheaper.",
    code: `#[contractimpl]
impl VerifierContract {
    pub fn verify(
        env: Env,
        proof: Bytes,
        public_inputs: Vec<u256>,
    ) -> bool {
        // native BN254 host functions
        groth16_verify(&env, proof, public_inputs)
    }
}`,
  },
  {
    number: "03",
    title: "Submit your hack",
    subtitle: "open source + demo video",
    description:
      "Open-source your repo on GitHub/GitLab with a clear README. Record a 2–3 minute demo video showing ZK doing real work. ZK must be load-bearing — not a wrapper — and proofs must be verified in a Stellar contract or on Stellar testnet/mainnet.",
    code: `## Submission checklist
✓ Public repo with source + README
✓ 2–3 min demo video
✓ ZK load-bearing (not cosmetic)
✓ Proofs verified on Stellar contract

Submit via Telegram: t.me/+e898qibDUVExODkx`,
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
              <span className="block">Prove.</span>
              <span className="block text-white/60">Deploy.</span>
              <span className="block text-white/35">Submit.</span>
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

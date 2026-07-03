"use client";

import { useEffect, useState } from "react";
import { useVisible } from "@/hooks/use-visible";

const steps = [
  {
    number: "01",
    title: "Deposit to ShieldedPool",
    subtitle: "merchant hidden · wallet stays private",
    description:
      "Your USDC goes to a neutral ShieldedPool Soroban contract — never directly to the merchant. The contract stores only a Poseidon(secret, expiry) commitment hash. The merchant address never appears on the ledger. An observer sees: your wallet sent USDC to a pool contract. Nothing more.",
    code: `// What the ShieldedPool stores on-chain:
commitment = Poseidon(subscriber_secret, expiry)

// What NEVER touches the ledger:
// ✗  merchant wallet address
// ✗  which API you subscribed to
// ✗  your subscriber identity

// Explorer shows: YourWallet → CDMJVG...GXYY (pool)`,
  },
  {
    number: "02",
    title: "Register blind — server sees nothing",
    subtitle: "no wallet · no tx hash · no linkage",
    description:
      "After depositing, your browser calls /subscribe with only the commitment hash — no wallet address, no transaction hash. The server is provably blind to your identity. It issues a session token tied to the commitment, not to you. Even if the server is fully compromised, it cannot reveal who subscribed.",
    code: `// POST /subscribe — what the server receives:
{
  commitment: "Poseidon(secret, expiry)",  // hash only
  leaf_index: 0,
  subscription_id: "price-feed-...",
  expiry: 1783123200
}

// What the server NEVER receives:
// ✗  wallet address
// ✗  tx hash
// ✗  payment amount`,
  },
  {
    number: "03",
    title: "Call APIs — identity zero",
    subtitle: "session token → ZK proof · fully unlinkable",
    description:
      "Every API call carries a session token derived from your commitment via HMAC — no wallet, no cookie, no session history. The server authenticates you without knowing you. In production, this upgrades to a full Groth16 proof: proving Merkle membership in the ShieldedPool without revealing which leaf you hold.",
    code: `// Every API call — server sees only this:
GET /api/prices
X-ZeroGate-Session: <commitment>:<expiry>:<hmac>

// Server verifies HMAC. Serves data.
// Server logs: valid credential presented.
// Server never logs: which wallet, which deposit, which leaf

// Production path:
X-ZeroGate-Proof: <base64-groth16>  // full ZK, no token`,
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
              <span className="block">Deposit.</span>
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

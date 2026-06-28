"use client";

import { useEffect, useState } from "react";
import { useVisible } from "@/hooks/use-visible";

const guarantees = [
  {
    title: "Amount-hiding",
    description:
      "The USDC amount you pay is committed via Poseidon hash and never appears in any Stellar transaction field readable by the verifier or merchant.",
  },
  {
    title: "Merchant-hiding",
    description:
      "The API provider's Stellar address is replaced by a Poseidon commitment on-chain. No on-chain observer can determine who you paid, only that you paid someone.",
  },
  {
    title: "Session unlinkability",
    description:
      "Each API call produces a unique nullifier. The nullifier registry prevents replay without enabling any form of call correlation across sessions.",
  },
  {
    title: "Non-custodial",
    description:
      "No server or third party ever holds your wallet keys or session token. The ZK proof is generated entirely in-browser — your secret never leaves your machine.",
  },
];

const proofStats = [
  { value: "11,741", label: "circuit constraints" },
  { value: "depth 20", label: "Merkle tree depth" },
  { value: "Groth16", label: "proof system" },
  { value: "BN254", label: "elliptic curve" },
  { value: "<3s", label: "proof generation" },
];

const tags = ["Amount hidden", "Merchant hidden", "Unlinkable sessions", "Non-custodial"];

export function PrizesSection() {
  const { ref: sectionRef, isVisible } = useVisible<HTMLElement>();
  const [activeReq, setActiveReq] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReq((prev) => (prev + 1) % guarantees.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="privacy" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span
            className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Privacy guarantees
          </span>

          <h2
            className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] mb-12 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Four things
            <br />
            <span className="text-muted-foreground">we never leak.</span>
          </h2>

          <div
            className={`transition-all duration-1000 delay-100 ${isVisible ? "opacity-100" : "opacity-0"}`}
          >
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Every privacy property in Stealth402 is cryptographically enforced — not a policy
              promise. The{" "}
              <span className="text-[#CFFF03]">Groth16 circuit</span>{" "}
              proves all four simultaneously with a single pairing check on Stellar.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 relative p-8 lg:p-12 border border-foreground/10 min-h-[400px] overflow-hidden transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative z-10">
              <span className="font-mono text-sm text-muted-foreground">Circuit proof stats</span>
              <div className="mt-8 space-y-4">
                {proofStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex items-center justify-between py-3 border-b border-foreground/10 transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                    style={{ transitionDelay: `${index * 80 + 200}ms` }}
                  >
                    <span className="font-mono text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-3xl font-display">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`px-3 py-1 border border-foreground/10 text-xs font-mono text-muted-foreground transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 100 + 300}ms` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            {guarantees.map((g, index) => (
              <div
                key={g.title}
                className={`p-6 border transition-all duration-500 cursor-default ${
                  activeReq === index
                    ? "border-foreground/30 bg-foreground/[0.04]"
                    : "border-foreground/10"
                } ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
                style={{ transitionDelay: `${index * 80}ms` }}
                onClick={() => setActiveReq(index)}
                onMouseEnter={() => setActiveReq(index)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-10 h-10 flex items-center justify-center border transition-colors ${
                      activeReq === index
                        ? "border-[#CFFF03] bg-[#CFFF03]/10"
                        : "border-foreground/20"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className={`w-5 h-5 ${activeReq === index ? "text-[#CFFF03]" : "text-muted-foreground"}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 2L17 5v6c0 5-7 7-7 7S3 16 3 11V5L10 2z" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{g.title}</h3>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

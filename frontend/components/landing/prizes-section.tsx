"use client";

import { useEffect, useState } from "react";
import { useVisible } from "@/hooks/use-visible";
import { Trophy, Code, Video, GitBranch } from "lucide-react";

const requirements = [
  {
    icon: Code,
    title: "Open-source repo",
    description:
      "Public GitHub/GitLab/Bitbucket with full source code and a clear README explaining what you built and how ZK is used.",
  },
  {
    icon: Video,
    title: "Demo video",
    description:
      "2–3 minute walkthrough showing the project working and explaining what ZK is doing and why it matters.",
  },
  {
    icon: Trophy,
    title: "ZK load-bearing",
    description:
      "ZK must power a real part of how the project works — not a cosmetic wrapper. The proof must do meaningful work.",
  },
  {
    icon: GitBranch,
    title: "Stellar integration",
    description:
      "Proofs must be verified in a Stellar contract or otherwise integrate Stellar testnet or mainnet in a meaningful way.",
  },
];

const prizes = [
  { place: "1st", amount: "$5,000", label: "in XLM" },
  { place: "2nd", amount: "$2,000", label: "in XLM" },
  { place: "3rd", amount: "$1,250", label: "in XLM" },
  { place: "4th", amount: "$1,000", label: "in XLM" },
  { place: "5th", amount: "$750", label: "in XLM" },
];

const tags = ["Open source", "Demo video", "ZK on Stellar", "Non-custodial"];

export function PrizesSection() {
  const { ref: sectionRef, isVisible } = useVisible<HTMLElement>();
  const [activeReq, setActiveReq] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReq((prev) => (prev + 1) % requirements.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="prizes" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span
            className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Prize Pool
          </span>

          <h2
            className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] mb-12 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Win up to
            <br />
            <span className="text-muted-foreground">$5,000 in XLM.</span>
          </h2>

          <div
            className={`transition-all duration-1000 delay-100 ${isVisible ? "opacity-100" : "opacity-0"}`}
          >
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              A hackathon should reward ideas, not effort-theater. Stellar Hacks gives you{" "}
              <span className="text-[#CFFF03]">four clear submission requirements</span>{" "}
              and $10,000 in prizes — so you can focus on building something real with ZK.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 relative p-8 lg:p-12 border border-foreground/10 min-h-[400px] overflow-hidden transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="absolute inset-0 pointer-events-none items-center justify-end hidden lg:flex">
              {["/images/shield.png", "/images/isolated.jpg", "/images/encrypted.jpg", "/images/audit.jpg"].map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="absolute h-3/4 w-3/4 object-contain object-right transition-opacity duration-500"
                  style={{ opacity: activeReq === index ? 0.85 : 0 }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <span className="font-mono text-sm text-muted-foreground">Prize breakdown</span>
              <div className="mt-8 space-y-4">
                {prizes.map((prize, index) => (
                  <div
                    key={prize.place}
                    className={`flex items-center justify-between py-3 border-b border-foreground/10 transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                    style={{ transitionDelay: `${index * 80 + 200}ms` }}
                  >
                    <span className="font-mono text-sm text-muted-foreground">{prize.place}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display">{prize.amount}</span>
                      <span className="text-sm text-muted-foreground font-mono">{prize.label}</span>
                    </div>
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
            {requirements.map((req, index) => (
              <div
                key={req.title}
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
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/20"
                    }`}
                  >
                    <req.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{req.title}</h3>
                    <p className="text-sm text-muted-foreground">{req.description}</p>
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

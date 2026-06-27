"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useVisible } from "@/hooks/use-visible";

export function CtaSection() {
  const { ref: sectionRef, isVisible } = useVisible<HTMLDivElement>();
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section id="submit" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`relative border border-foreground transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          onMouseMove={handleMouseMove}
        >
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              background: `radial-gradient(500px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(207, 255, 3, 0.6), transparent 50%)`,
            }}
          />

          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1">
                <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
                  Get started
                </span>

                <h2 className="text-6xl md:text-7xl lg:text-[72px] font-display tracking-tight mb-8 leading-[0.95]">
                  Your ZK submission
                  <br />
                  <span className="text-muted-foreground">closes June 29.</span>
                </h2>

                <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl">
                  Build anything with zero-knowledge on Stellar. Privacy pools, private payments,
                  confidential tokens, provable computation — if ZK is load-bearing and it runs on
                  Stellar, you&apos;re eligible. $10,000 in prizes.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <a
                    href="https://t.me/+e898qibDUVExODkx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-base font-medium hover:bg-foreground/90 transition-colors group"
                  >
                    Submit your project
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a
                    href="https://discord.gg/stellardev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-foreground/20 px-8 py-4 text-base font-mono hover:bg-foreground/5 transition-colors"
                  >
                    Join #zk-chat →
                  </a>
                </div>

                <p className="text-sm text-muted-foreground mt-8 font-mono">
                  Stellar Testnet · Open source · $10,000 prize pool
                </p>
              </div>

              <div className="hidden lg:flex items-end justify-center w-[560px] h-[620px] -mr-16">
                <img
                  src="/images/bridge.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain object-bottom"
                />
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-t border-r border-foreground/10" />
        </div>
      </div>
    </section>
  );
}

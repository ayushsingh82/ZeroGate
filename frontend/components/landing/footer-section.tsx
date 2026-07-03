"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const footerLinks = {
  Product: [
    { name: "How it works", href: "#how-it-works" },
    { name: "Privacy model", href: "#features" },
    { name: "Technical stack", href: "#build" },
    { name: "Launch App", href: "/app" },
  ],
  Docs: [
    { name: "Getting started", href: "/docs" },
    { name: "Circuit design", href: "/docs#circuit" },
    { name: "API reference", href: "/docs#api" },
    { name: "GitHub", href: "https://github.com/ayushsingh82/ZeroGate", external: true },
  ],
  Protocol: [
    { name: "x402 payment flow", href: "/docs#x402" },
    { name: "Groth16 verifier", href: "/docs#verifier" },
    { name: "Nullifier registry", href: "/docs#nullifier" },
    { name: "Stellar testnet", href: "https://developers.stellar.org", external: true },
  ],
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com/ayushsingh82/ZeroGate" },
  { name: "Stellar Docs", href: "https://developers.stellar.org" },
];

export function FooterSection() {
  return (
    <footer className="relative bg-black">
      <div className="relative w-full h-[340px] md:h-[420px] overflow-hidden">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2810%29-UnDKstODkIENp5xqTYUEpt0Sm8tNOw.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-8">
            <div className="col-span-2">
              <a href="/" className="inline-flex items-center gap-2.5 mb-6">
                <Image src="/logo-mark.svg" alt="ZeroGate" width={28} height={28} />
                <span className="text-2xl font-display text-white">
                  Zero<span className="text-[#CFFF03]">Gate</span>
                </span>
              </a>

              <p className="text-white/50 leading-relaxed mb-8 max-w-xs text-sm">
                Zero-knowledge API subscriptions on Stellar. Hidden amounts, hidden merchant,
                unlinkable sessions. Built with Circom, Groth16, and Soroban.
              </p>

              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium text-white mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target={"external" in link && link.external ? "_blank" : undefined}
                        rel={"external" in link && link.external ? "noopener noreferrer" : undefined}
                        className="text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-2"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            &copy; 2026 ZeroGate. Open source under MIT.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CFFF03]" />
              Stellar Testnet
            </span>
            <span className="font-mono">Groth16 · BN254 · Soroban</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

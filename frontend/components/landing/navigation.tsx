"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Prizes", href: "#prizes" },
  { name: "How to build", href: "#how-it-works" },
  { name: "ZK stack", href: "#features" },
  { name: "Submit", href: "#submit" },
];

const SUBMIT_URL = "https://t.me/+e898qibDUVExODkx";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          <a href="#" className="flex items-center gap-2 group">
            <span className="text-[#CFFF03] text-xl">✦</span>
            <span
              className={`font-display tracking-tight transition-all duration-500 ${
                isScrolled ? "text-xl text-foreground" : "text-2xl text-white"
              }`}
            >
              Stellar<span className="text-[#CFFF03]">Hacks</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm transition-colors duration-300 relative group ${
                  isScrolled
                    ? "text-foreground/70 hover:text-foreground"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                    isScrolled ? "bg-foreground" : "bg-white"
                  }`}
                />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="https://discord.gg/stellardev"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm transition-colors duration-300 font-mono ${
                isScrolled ? "text-foreground/60 hover:text-foreground" : "text-white/60 hover:text-white"
              }`}
            >
              Discord
            </a>
            <Button
              size="sm"
              asChild
              className={`rounded-full transition-all duration-500 ${
                isScrolled
                  ? "bg-foreground hover:bg-foreground/90 text-background px-4 h-8 text-xs"
                  : "bg-white hover:bg-white/90 text-black px-6"
              }`}
            >
              <a href={SUBMIT_URL} target="_blank" rel="noopener noreferrer">Submit project</a>
            </Button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors duration-500 ${
              isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div
            className={`flex flex-col gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <Button
              className="flex-1 bg-foreground text-background rounded-full h-14 text-base"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href={SUBMIT_URL} target="_blank" rel="noopener noreferrer">Submit project</a>
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full h-14 text-base border-foreground/20"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="https://discord.gg/stellardev" target="_blank" rel="noopener noreferrer">Join Discord</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

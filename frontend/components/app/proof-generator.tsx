"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, X, Copy, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface Api {
  id: string;
  name: string;
  endpoint: string;
  icon: string;
}

interface ProofGeneratorProps {
  api: Api;
  onClose: () => void;
}

type Stage = "idle" | "generating" | "proving" | "calling" | "done" | "error";

const MOCK_NULLIFIER = "0x" + "a3f891bc" + "2d047e91" + "b5c63a2f" + "08e4d719" + "3f2c8b1a" + "7e904d5c" + "1b2e3f4a" + "9c8d7e6f";
const MOCK_MERKLE_ROOT = "0x" + "1f2e3d4c" + "5b6a7980" + "9c8b7a6f" + "0e1d2c3b" + "4a5968f7" + "e6d5c4b3" + "a2918070" + "6f5e4d3c";
const MOCK_PROOF = {
  pi_a: ["14382910234...", "87654321098...", "1"],
  pi_b: [["29182736450...", "18273645091..."], ["91827364509...", "82736450918..."], ["1", "0"]],
  pi_c: ["34521908765...", "65432198076...", "1"],
  protocol: "groth16",
};
const MOCK_SESSION_NONCE = "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
const MOCK_RESPONSE = { status: 200, data: { message: "Access granted", session: "anon_" + Math.random().toString(36).slice(2, 10) } };

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Ready to prove",
  generating: "Computing witness…",
  proving: "Generating Groth16 proof…",
  calling: "Submitting proof to API…",
  done: "Access granted",
  error: "Proof failed",
};

export function ProofGenerator({ api, onClose }: ProofGeneratorProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [showProof, setShowProof] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  async function runProof() {
    setStage("generating");
    const start = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 100) / 10), 100);

    await new Promise((r) => setTimeout(r, 1200));
    setStage("proving");
    await new Promise((r) => setTimeout(r, 2400));
    setStage("calling");
    await new Promise((r) => setTimeout(r, 800));
    clearInterval(tick);
    setElapsed(Math.floor((Date.now() - start) / 100) / 10);
    setStage("done");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const isRunning = ["generating", "proving", "calling"].includes(stage);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{api.icon}</span>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{api.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] font-mono">{api.endpoint}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-0 rounded-lg overflow-hidden border border-[var(--border)]">
          {(["generating", "proving", "calling"] as Stage[]).map((s, i) => {
            const labels = ["1. Witness", "2. Groth16 Proof", "3. API Call"];
            const done = stage === "done" || (
              s === "generating" && ["proving", "calling", "done"].includes(stage)
            ) || (
              s === "proving" && ["calling", "done"].includes(stage)
            ) || (
              s === "calling" && stage === "done"
            );
            const active = stage === s;
            return (
              <div
                key={s}
                className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${i > 0 ? "border-l border-[var(--border)]" : ""} ${
                  done ? "bg-emerald-500/10 text-emerald-400" : active ? "bg-[var(--accent)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-3 h-3 rounded-full border border-current opacity-40" />}
                {labels[i]}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg bg-[var(--accent)] border border-[var(--border)] p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted-foreground)]">Status</span>
            <span className={`font-medium ${stage === "done" ? "text-emerald-400" : stage === "error" ? "text-red-400" : "text-[var(--foreground)]"}`}>
              {isRunning && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
              {STAGE_LABELS[stage]}
            </span>
          </div>

          {stage !== "idle" && (
            <>
              <div className="border-t border-[var(--border)] pt-3 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted-foreground)] flex-shrink-0">Nullifier</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[var(--foreground)] truncate">{MOCK_NULLIFIER.slice(0, 18)}…</span>
                    <button onClick={() => copy(MOCK_NULLIFIER, "null")} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0">
                      {copied === "null" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted-foreground)] flex-shrink-0">Merkle Root</span>
                  <span className="text-[var(--foreground)] truncate">{MOCK_MERKLE_ROOT.slice(0, 18)}…</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted-foreground)] flex-shrink-0">Session Nonce</span>
                  <span className="text-[var(--foreground)] truncate">{MOCK_SESSION_NONCE.slice(0, 18)}…</span>
                </div>
                {stage !== "idle" && elapsed > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-foreground)]">Proof time</span>
                    <span className="text-[var(--foreground)]">{elapsed}s</span>
                  </div>
                )}
              </div>

              {stage === "done" && (
                <div className="border-t border-[var(--border)] pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-foreground)]">HTTP Status</span>
                    <span className="text-emerald-400">200 OK</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[var(--muted-foreground)] flex-shrink-0">Response</span>
                    <span className="text-[var(--foreground)] text-right">{JSON.stringify(MOCK_RESPONSE.data)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {stage === "done" && (
          <button
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {showProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showProof ? "Hide" : "Inspect"} raw Groth16 proof
          </button>
        )}

        {showProof && (
          <div className="relative rounded-lg bg-[var(--accent)] border border-[var(--border)] p-4">
            <button
              onClick={() => copy(JSON.stringify({ proof: MOCK_PROOF, nullifier: MOCK_NULLIFIER, merkleRoot: MOCK_MERKLE_ROOT }, null, 2), "proof")}
              className="absolute top-3 right-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {copied === "proof" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="text-xs text-[var(--muted-foreground)] font-mono overflow-x-auto leading-relaxed">
{JSON.stringify({ proof: MOCK_PROOF, nullifier: MOCK_NULLIFIER, merkleRoot: MOCK_MERKLE_ROOT }, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          {stage === "idle" || stage === "done" ? (
            <button
              onClick={runProof}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-4 h-4" />
              {stage === "done" ? "Generate New Proof" : "Generate Proof & Call API"}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium bg-[var(--accent)] text-[var(--muted-foreground)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              {STAGE_LABELS[stage]}
            </div>
          )}
        </div>

        <div className="rounded-md bg-[var(--accent)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="text-[var(--foreground)] font-medium">Privacy guarantee:</span> Your{" "}
            <code className="font-mono">subscriber_secret</code> never leaves this browser. The proof
            proves subscription validity using a one-way nullifier — the server learns nothing about your
            wallet or payment amount.
          </p>
        </div>
      </div>
    </div>
  );
}

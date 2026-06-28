import { Request, Response, NextFunction } from "express";
import { verifySubscriptionProof, ProofPayload } from "../lib/proof_verify";
import { spendNullifier } from "../lib/stellar";

export async function zkGate(req: Request, res: Response, next: NextFunction) {
  const proofHeader = req.headers["x-stealth402-proof"] as string | undefined;

  if (!proofHeader) {
    res.status(402).json({
      error: "Subscription proof required",
      header: "X-Stealth402-Proof",
      instructions: {
        subscribe_at: "POST /subscribe",
        prove_at: "Generate proof client-side using subscriber_secret + session_nonce",
      },
    });
    return;
  }

  let payload: ProofPayload;
  try {
    payload = JSON.parse(Buffer.from(proofHeader, "base64").toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid proof header encoding" });
    return;
  }

  const valid = await verifySubscriptionProof(payload);
  if (!valid) {
    res.status(401).json({ error: "Invalid, expired, or replayed subscription proof" });
    return;
  }

  // Mark nullifier as spent (prevents replay)
  try {
    await spendNullifier(payload.nullifier);
  } catch {
    // On-chain spend failed — still serve (idempotent nullifier check above)
  }

  // Attach session info (nullifier only — wallet never attached)
  (req as Request & { session?: { nullifier: string } }).session = {
    nullifier: payload.nullifier,
  };

  next();
}

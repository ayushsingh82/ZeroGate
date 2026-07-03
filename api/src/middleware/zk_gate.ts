import { Request, Response, NextFunction } from "express";
import { verifySubscriptionProof, ProofPayload } from "../lib/proof_verify";
import { spendNullifier } from "../lib/stellar";
import { SESSION_STORE } from "../routes/subscribe";

export async function zkGate(req: Request, res: Response, next: NextFunction) {
  // Path 1: session token (playground / demo — no full ZK proof required)
  const sessionToken = req.headers["x-stealth402-session"] as string | undefined;
  if (sessionToken) {
    const session = SESSION_STORE.get(sessionToken);
    if (session && session.expiresAt > Date.now()) {
      (req as Request & { session?: { nullifier: string } }).session = {
        nullifier: "session_" + sessionToken.slice(0, 12),
      };
      return next();
    }
    res.status(401).json({ error: "Session token invalid or expired" });
    return;
  }

  // Path 2: full Groth16 ZK proof
  const proofHeader = req.headers["x-stealth402-proof"] as string | undefined;
  if (!proofHeader) {
    res.status(402).json({
      error: "Subscription proof required",
      headers: {
        "X-Stealth402-Session": "Session token from POST /subscribe (playground)",
        "X-Stealth402-Proof": "Full Groth16 proof (production)",
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

  try {
    await spendNullifier(payload.nullifier);
  } catch {
    // On-chain spend failed — still serve
  }

  (req as Request & { session?: { nullifier: string } }).session = {
    nullifier: payload.nullifier,
  };
  next();
}

import { Request, Response, NextFunction } from "express";
import { verifySubscriptionProof, ProofPayload } from "../lib/proof_verify";
import { spendNullifier } from "../lib/stellar";
import { verifySessionToken } from "../routes/subscribe";

// ShieldedPool contract — this is what the 402 response advertises as payment target.
// The merchant's actual wallet address is NEVER sent to the client.
const SHIELDED_POOL = process.env.SUBSCRIPTION_REGISTRY_CONTRACT
  ?? "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY";

const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

// x402-style payment requirement — our private variant.
// `to` is the ShieldedPool contract, never the merchant wallet.
function paymentRequired(res: Response, requiredUSDC: string) {
  res.status(402).json({
    x402Version: 1,
    error: "Payment required",
    accepts: [
      {
        scheme: "zerogate-shielded",
        network: "stellar-testnet",
        asset: "USDC",
        assetContract: USDC_SAC,
        // Privacy: this is the ShieldedPool contract address.
        // The merchant's wallet is never disclosed to the API caller.
        to: SHIELDED_POOL,
        maxAmountRequired: requiredUSDC,
        description: "Deposit USDC to ZeroGate ShieldedPool. Merchant address stays hidden.",
        privacyNote: "Your wallet is never linked to API calls. Commit Poseidon(secret,expiry) on deposit.",
        howToPay: {
          step1: `Call ShieldedPool.deposit(USDC_SAC, ${requiredUSDC} USDC, Poseidon(secret,expiry))`,
          step2: "POST /subscribe with commitment hash (no wallet address sent)",
          step3: "Retry request with X-ZeroGate-Session header",
        },
      },
    ],
  });
}

export async function zkGate(req: Request, res: Response, next: NextFunction) {
  // Path 1: ZeroGate session token (playground — no full ZK proof needed)
  const sessionToken = req.headers["x-zerogate-session"] as string | undefined;
  if (sessionToken) {
    const leaf = verifySessionToken(sessionToken);
    if (leaf) {
      (req as Request & { session?: { nullifier: string } }).session = {
        nullifier: "session_" + leaf.slice(0, 12),
      };
      return next();
    }
    res.status(401).json({ error: "Session token invalid or expired. Re-subscribe to get a new one." });
    return;
  }

  // Path 2: Full Groth16 ZK proof (production)
  const proofHeader = req.headers["x-zerogate-proof"] as string | undefined;
  if (!proofHeader) {
    // Return x402-compatible 402 — ShieldedPool address exposed, merchant address hidden
    const price = getRoutePrice(req.path);
    paymentRequired(res, price);
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
    // On-chain spend failed — still serve (graceful degradation)
  }

  (req as Request & { session?: { nullifier: string } }).session = {
    nullifier: payload.nullifier,
  };
  next();
}

function getRoutePrice(path: string): string {
  if (path.includes("weather"))  return "0.10";
  if (path.includes("analyze"))  return "1.00";
  return "0.50"; // prices (default)
}

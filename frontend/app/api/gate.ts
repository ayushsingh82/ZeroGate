import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

const SHIELDED_POOL = "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY";
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

function priceForPath(path: string): string {
  if (path.includes("weather")) return "0.10";
  if (path.includes("analyze")) return "1.00";
  return "0.50";
}

export function checkGate(req: NextRequest): NextResponse | null {
  const sessionToken = req.headers.get("x-zerogate-session");
  if (sessionToken) {
    const leaf = verifySessionToken(sessionToken);
    if (leaf) return null; // authorized
    return NextResponse.json({ error: "Session token invalid or expired. Re-subscribe." }, { status: 401 });
  }

  // No session — return x402
  const price = priceForPath(req.nextUrl.pathname);
  return NextResponse.json({
    x402Version: 1,
    error: "Payment required",
    accepts: [{
      scheme: "zerogate-shielded",
      network: "stellar-testnet",
      asset: "USDC",
      assetContract: USDC_SAC,
      to: SHIELDED_POOL,
      maxAmountRequired: price,
      description: "Deposit USDC to ZeroGate ShieldedPool. Merchant address stays hidden.",
      privacyNote: "Your wallet is never linked to API calls.",
      howToPay: {
        step1: `Call ShieldedPool.deposit(USDC_SAC, ${price} USDC, Poseidon(secret,expiry))`,
        step2: "POST /api/subscribe with commitment hash (no wallet address sent)",
        step3: "Retry request with X-ZeroGate-Session header",
      },
    }],
  }, { status: 402 });
}

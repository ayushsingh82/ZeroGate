import { NextRequest, NextResponse } from "next/server";
import { checkGate } from "../gate";

export async function GET(req: NextRequest) {
  const gateResp = checkGate(req);
  if (gateResp) return gateResp;

  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,stellar&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    const raw = await r.json() as { bitcoin?: { usd: number }; ethereum?: { usd: number }; stellar?: { usd: number } };
    return NextResponse.json({
      data: {
        BTC: raw.bitcoin?.usd ?? 67420,
        ETH: raw.ethereum?.usd ?? 3521,
        XLM: raw.stellar?.usd ?? 0.12,
      },
      source: "CoinGecko",
      timestamp: Date.now(),
      anonymous: true,
    });
  } catch {
    return NextResponse.json({
      data: { BTC: 67420, ETH: 3521, XLM: 0.12 },
      source: "fallback",
      timestamp: Date.now(),
      anonymous: true,
    });
  }
}

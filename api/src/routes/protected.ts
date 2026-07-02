import { Router, Request } from "express";
import { zkGate } from "../middleware/zk_gate";

export const protectedRouter = Router();

// All /api/* routes require a valid ZK subscription proof
protectedRouter.use(zkGate);

interface SessionRequest extends Request {
  session?: { nullifier: string };
}

/**
 * GET /api/weather?lat=&lon=
 * Proxies Open-Meteo (free, no key required).
 * Location is accepted from the client but never stored or linked to wallet.
 */
protectedRouter.get("/weather", async (req: SessionRequest, res) => {
  const lat = parseFloat((req.query.lat as string) ?? "28.6139");
  const lon = parseFloat((req.query.lon as string) ?? "77.2090");

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;
    const upstream = await fetch(url);
    const json = (await upstream.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const c = json.current ?? {};

    res.json({
      data: {
        temperature_c: c.temperature_2m ?? null,
        humidity_pct:  c.relative_humidity_2m ?? null,
        wind_kmh:      c.wind_speed_10m ?? null,
        weather_code:  c.weather_code ?? null,
      },
      meta: {
        source: "open-meteo.com",
        session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
        privacy: "Location not stored. Wallet not linked.",
      },
    });
  } catch {
    res.status(502).json({ error: "upstream_error", detail: "Open-Meteo unreachable" });
  }
});

/**
 * GET /api/prices
 * Proxies CoinGecko free tier (no key, 30 req/min).
 */
protectedRouter.get("/prices", async (req: SessionRequest, res) => {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=bitcoin,ethereum,stellar,usd-coin&vs_currencies=usd&include_24hr_change=true";
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const json = (await upstream.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;

    res.json({
      data: {
        BTC_USD:  { price: json.bitcoin?.usd,    change_24h: json.bitcoin?.usd_24h_change },
        ETH_USD:  { price: json.ethereum?.usd,   change_24h: json.ethereum?.usd_24h_change },
        XLM_USD:  { price: json.stellar?.usd,    change_24h: json.stellar?.usd_24h_change },
        USDC_USD: { price: json["usd-coin"]?.usd, change_24h: json["usd-coin"]?.usd_24h_change },
      },
      timestamp: new Date().toISOString(),
      meta: {
        source: "coingecko.com",
        session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
        privacy: "Query not stored. Wallet not linked.",
      },
    });
  } catch {
    res.status(502).json({ error: "upstream_error", detail: "CoinGecko unreachable" });
  }
});

/**
 * POST /api/analyze
 * Simple private keyword analysis — no external AI key required.
 * Replace the body with an LLM call if you add an OpenAI key later.
 */
protectedRouter.post("/analyze", (req: SessionRequest, res) => {
  const { text } = req.body as { text?: string };
  const input = (text ?? "").toLowerCase();

  const topics: string[] = [];
  if (/bitcoin|btc|crypto/.test(input))   topics.push("crypto");
  if (/privacy|private|anon/.test(input)) topics.push("privacy");
  if (/stellar|xlm|soroban/.test(input))  topics.push("stellar");
  if (/zk|proof|circuit/.test(input))     topics.push("zero-knowledge");
  if (/payment|pay|usdc/.test(input))     topics.push("payments");
  if (topics.length === 0)                topics.push("general");

  const positive = /(good|great|amazing|fast|secure|private|safe)/i.test(input);
  const negative = /(bad|slow|broken|fail|error|wrong)/i.test(input);
  const sentiment = positive ? "positive" : negative ? "negative" : "neutral";

  res.json({
    data: {
      sentiment,
      topics,
      word_count: (text ?? "").split(/\s+/).filter(Boolean).length,
      summary: `Analyzed ${(text ?? "").length} characters. Topics: ${topics.join(", ")}.`,
    },
    meta: {
      session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
      privacy: "Content not stored. Wallet not linked.",
    },
  });
});

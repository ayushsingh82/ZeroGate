import { Router, Request } from "express";
import { zkGate } from "../middleware/zk_gate";

export const protectedRouter = Router();

// All /api/* routes require a valid ZK subscription proof
protectedRouter.use(zkGate);

interface SessionRequest extends Request {
  session?: { nullifier: string };
}

/**
 * GET /api/weather
 * Private weather oracle — location never linked to wallet.
 */
protectedRouter.get("/weather", (req: SessionRequest, res) => {
  res.json({
    data: {
      location: "Redacted",
      temperature_c: 22 + Math.floor(Math.random() * 5),
      humidity_pct: 60 + Math.floor(Math.random() * 20),
      condition: "Partly cloudy",
      forecast: "Clear skies tomorrow",
    },
    meta: {
      session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
      privacy: "Location not recorded. Wallet not linked.",
    },
  });
});

/**
 * GET /api/prices
 * Private price feed — query patterns never linked to wallet.
 */
protectedRouter.get("/prices", (req: SessionRequest, res) => {
  res.json({
    data: {
      XLM_USD:  { price: "0.1142", change_24h: "+2.3%" },
      BTC_USD:  { price: "67420",  change_24h: "-0.8%" },
      ETH_USD:  { price: "3840",   change_24h: "+1.2%" },
      USDC_USD: { price: "1.0000", change_24h: "0.0%" },
    },
    timestamp: new Date().toISOString(),
    meta: {
      session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
      privacy: "Query not recorded. Wallet not linked.",
    },
  });
});

/**
 * POST /api/analyze
 * Private AI inference — content never linked to wallet.
 */
protectedRouter.post("/analyze", (req: SessionRequest, res) => {
  const { text } = req.body as { text?: string };
  res.json({
    data: {
      sentiment: "positive",
      topics: ["blockchain", "privacy", "zero-knowledge"],
      summary: `Analyzed ${(text ?? "").length} characters anonymously.`,
      tokens_used: 42,
    },
    meta: {
      session_nullifier: req.session?.nullifier?.slice(0, 10) + "…",
      privacy: "Input content not stored. Wallet not linked.",
    },
  });
});

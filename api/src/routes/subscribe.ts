import { Router } from "express";
import { createHmac } from "crypto";
import { generateMerchantCommitment } from "../lib/commitment";

const SESSION_SECRET = process.env.MERCHANT_SALT ?? "dev-secret";

/** Stateless HMAC session token — survives server restarts. */
export function makeSessionToken(commitment: string, expiresAt: number): string {
  const payload = `${commitment}:${expiresAt}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

/** Returns the commitment if valid and not expired, otherwise null. */
export function verifySessionToken(token: string): string | null {
  const sep1 = token.indexOf(":");
  const sep2 = token.lastIndexOf(":");
  if (sep1 === -1 || sep1 === sep2) return null;
  const commitment = token.slice(0, sep1);
  const expiryStr = token.slice(sep1 + 1, sep2);
  const sig = token.slice(sep2 + 1);
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${commitment}:${expiry}`)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? commitment : null;
}

export const subscribeRouter = Router();

const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS ?? "GPLACEHOLDER";
const MERCHANT_SALT = process.env.MERCHANT_SALT ?? "deadbeef";

const APIS = [
  {
    id: "weather",
    name: "Weather Oracle",
    description: "Real-time weather data. The provider never learns your location or query patterns.",
    price: "$0.10",
    period: "month",
    endpoint: "/api/weather",
    icon: "weather",
    tag: "Oracle",
    callsPerMonth: "10,000",
  },
  {
    id: "price-feed",
    name: "Price Feed",
    description: "Crypto asset prices — BTC, ETH, XLM. Your trading queries stay completely private.",
    price: "$0.50",
    period: "month",
    endpoint: "/api/prices",
    icon: "price-feed",
    tag: "Finance",
    callsPerMonth: "50,000",
  },
  {
    id: "ai-analysis",
    name: "AI Analysis",
    description: "Private AI inference. Submit queries without linking your identity to the content.",
    price: "$1.00",
    period: "month",
    endpoint: "/api/analyze",
    icon: "ai-analysis",
    tag: "AI",
    callsPerMonth: "1,000",
  },
];

subscribeRouter.get("/apis", (_req, res) => {
  res.json({ apis: APIS });
});

/**
 * POST /subscribe
 *
 * Privacy-preserving registration — server never learns:
 *   - Subscriber wallet address
 *   - Payment amount
 *   - Merchant identity (payment went to ShieldedPool contract, not merchant)
 *
 * Body:
 *   api_id:            string  — which API
 *   commitment:        string  — Poseidon(secret, expiry) stored in ShieldedPool on-chain
 *   leaf_index:        number  — Merkle position in ShieldedPool
 *   subscriber_secret: string  — client secret for ZK proof generation
 *   subscription_id:   string  — client-generated unique ID
 *   expiry:            number  — Unix timestamp
 *
 * Returns:
 *   merchant_commitment: string  — Poseidon(merchant_addr, salt) for ZK circuit
 *   session_token:       string  — HMAC token for playground API calls (no wallet linked)
 */
subscribeRouter.post("/subscribe", async (req, res) => {
  try {
    const {
      api_id,
      commitment,
      leaf_index,
      subscriber_secret,
      subscription_id,
      expiry,
    } = req.body as {
      api_id: string;
      commitment: string;
      leaf_index: number;
      subscriber_secret: string;
      subscription_id: string;
      expiry: number;
    };

    if (!commitment || !subscriber_secret || !subscription_id || !expiry) {
      res.status(400).json({ error: "commitment, subscriber_secret, subscription_id and expiry required" });
      return;
    }

    // Merchant commitment — hides merchant identity in ZK circuit
    const merchantCommitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);

    // Session token bound to commitment, not wallet — server stays blind
    const sessionExpiry = Date.now() + 30 * 24 * 3600_000;
    const sessionToken = makeSessionToken(commitment, sessionExpiry);

    res.json({
      success: true,
      leaf_index: leaf_index ?? 0,
      merchant_commitment: merchantCommitment,
      expiry,
      subscription_id,
      api_id,
      session_token: sessionToken,
    });
  } catch (err) {
    console.error("subscribe error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Subscribe failed" });
  }
});

subscribeRouter.get("/merchant-commitment", async (_req, res) => {
  try {
    const commitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
    res.json({ merchant_commitment: commitment });
  } catch {
    res.status(500).json({ error: "Failed to compute merchant commitment" });
  }
});

subscribeRouter.get("/merkle-proof/:index", async (req, res) => {
  try {
    const { getMerkleProof, getMerkleRoot } = await import("../lib/stellar");
    const index = parseInt(req.params.index, 10);
    const [proof, root] = await Promise.all([getMerkleProof(index), getMerkleRoot()]);
    res.json({ ...proof, merkle_root: root });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Proof fetch failed" });
  }
});

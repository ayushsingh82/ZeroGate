import { Router } from "express";
import { generateMerchantCommitment, generateLeaf } from "../lib/commitment";
import { addSubscriptionToChain } from "../lib/stellar";

export const subscribeRouter = Router();

const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS ?? "GPLACEHOLDER";
const MERCHANT_SALT = process.env.MERCHANT_SALT ?? "deadbeef";

/**
 * POST /subscribe
 *
 * Body:
 *   subscriber_secret: string  — client-generated random secret (stays client-side)
 *   subscription_id:   string  — client-generated unique ID
 *   expiry_days:       number  — default 30
 *
 * In production this route is gated by x402 middleware that collects the payment first.
 * For the hackathon demo, payment simulation is handled client-side.
 *
 * Returns:
 *   leaf_index:          number   — position in Merkle tree
 *   merchant_commitment: string   — Poseidon(merchant_addr, salt)
 *   expiry:              number   — Unix timestamp
 *   subscription_id:     string
 */
subscribeRouter.post("/subscribe", async (req, res) => {
  try {
    const { subscriber_secret, subscription_id, expiry_days = 30 } = req.body as {
      subscriber_secret: string;
      subscription_id: string;
      expiry_days?: number;
    };

    if (!subscriber_secret || !subscription_id) {
      res.status(400).json({ error: "subscriber_secret and subscription_id required" });
      return;
    }

    const expiry = Math.floor(Date.now() / 1000) + expiry_days * 86400;
    const merchantCommitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
    const { leaf, leafBuf } = await generateLeaf(subscriber_secret, expiry, subscription_id, merchantCommitment);

    const leafIndex = await addSubscriptionToChain(leafBuf);

    res.json({
      success: true,
      leaf_index: leafIndex,
      leaf,
      merchant_commitment: merchantCommitment,
      expiry,
      subscription_id,
    });
  } catch (err) {
    console.error("subscribe error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Subscribe failed" });
  }
});

/**
 * GET /merchant-commitment
 * Returns the public merchant commitment so clients can include it in proofs.
 */
subscribeRouter.get("/merchant-commitment", async (_req, res) => {
  try {
    const commitment = await generateMerchantCommitment(MERCHANT_ADDRESS, MERCHANT_SALT);
    res.json({ merchant_commitment: commitment });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute merchant commitment" });
  }
});

/**
 * GET /merkle-proof/:leaf_index
 * Returns sibling hashes + direction flags for the ZK circuit.
 */
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

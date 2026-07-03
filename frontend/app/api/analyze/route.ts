import { NextRequest, NextResponse } from "next/server";
import { checkGate } from "../gate";

export async function POST(req: NextRequest) {
  const gateResp = checkGate(req);
  if (gateResp) return gateResp;

  const body = await req.json() as { text?: string };
  const text = body.text ?? "";

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const positiveWords = ["good", "great", "excellent", "amazing", "best", "love", "perfect", "awesome", "fantastic", "zk", "private", "secure", "anonymous"];
  const negativeWords = ["bad", "terrible", "awful", "worst", "hate", "poor", "broken", "failed", "error"];

  let score = 0;
  words.forEach((w) => {
    if (positiveWords.includes(w)) score++;
    if (negativeWords.includes(w)) score--;
  });

  const sentiment = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

  const stopWords = new Set(["the", "a", "an", "is", "in", "it", "of", "to", "and", "or", "for", "with", "this", "that", "on", "at", "by"]);
  const freq: Record<string, number> = {};
  words.forEach((w) => { if (!stopWords.has(w) && w.length > 3) freq[w] = (freq[w] ?? 0) + 1; });
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);

  return NextResponse.json({
    data: {
      sentiment,
      sentiment_score: score,
      word_count: wordCount,
      keywords,
      summary: `${wordCount}-word text. Sentiment: ${sentiment}.`,
    },
    anonymous: true,
    timestamp: Date.now(),
  });
}

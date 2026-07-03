import { createHmac } from "crypto";

const SESSION_SECRET = process.env.MERCHANT_SALT ?? "zerogate-dev-secret";

export function makeSessionToken(commitment: string, expiresAt: number): string {
  const payload = `${commitment}:${expiresAt}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const sep1 = token.indexOf(":");
  const sep2 = token.lastIndexOf(":");
  if (sep1 === -1 || sep1 === sep2) return null;
  const commitment = token.slice(0, sep1);
  const expiryStr = token.slice(sep1 + 1, sep2);
  const sig = token.slice(sep2 + 1);
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;
  const expected = createHmac("sha256", SESSION_SECRET).update(`${commitment}:${expiry}`).digest("hex");
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? commitment : null;
}

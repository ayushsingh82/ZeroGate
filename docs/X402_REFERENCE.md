# x402 on Stellar — Reference

## What is x402?
Open protocol from Coinbase Developer Platform for **programmatic, per-request payments over HTTP**.
Turns the old "402 Payment Required" HTTP status code into a machine-readable payment negotiation layer for both humans and AI agents.

On Stellar, x402 uses **Soroban authorization entries** (not pre-signed transactions) so clients pay for API requests via signed auth entries.

---

## Payment Flow

```
Client                        Server                     Facilitator / Chain
  |                              |                              |
  | GET /resource                |                              |
  |----------------------------->|                              |
  |                              |                              |
  | 402 Payment Required         |                              |
  | PAYMENT-REQUIRED header:     |                              |
  |  { price, network,           |                              |
  |    facilitatorUrl, payTo }   |                              |
  |<-----------------------------|                              |
  |                              |                              |
  | Sign Soroban auth entry      |                              |
  | (transfer from→payTo)        |                              |
  |                              |                              |
  | Retry + PAYMENT-SIGNATURE    |                              |
  |----------------------------->|                              |
  |                              | verify + settle              |
  |                              |----------------------------->|
  |                              |<-----------------------------|
  |                              |                              |
  | 200 OK + PAYMENT-RESPONSE    |                              |
  |<-----------------------------|                              |
```

---

## Stellar-Specific Details

- **Auth-entry signing** — client signs a Soroban authorization entry (not a full transaction)
- **Replay protection** — auth entries have expiration built in; no sequence number conflicts
- **Sponsored fees** — facilitator can wrap auth entry so client pays no network fees
- **Supported assets** — any SEP-41 compliant token; default is USDC
- **Compatible wallets** — Freighter (browser extension), Albedo, Hana, HOT, Klever, OneKey

---

## Testnet USDC
| Property | Value |
|----------|-------|
| Asset Code | USDC |
| Issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| SEP-41 Contract | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

## Mainnet USDC
| Property | Value |
|----------|-------|
| Asset Code | USDC |
| Issuer | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| SEP-41 Contract | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |

---

## Facilitators

### 1. Coinbase x402 Facilitator
- Supports Stellar Testnet with sponsored fees
- Check supported networks: x402 Facilitator Supported Networks

### 2. Built on Stellar Facilitator (OpenZeppelin)
Built with OpenZeppelin Relayer + x402 Facilitator Plugin. Exposes `/verify`, `/settle`, `/supported`.

| | Testnet | Mainnet |
|--|---------|---------|
| Facilitator URL | `https://channels.openzeppelin.com/x402/testnet` | `https://channels.openzeppelin.com/x402` |
| API Key | https://channels.openzeppelin.com/testnet/gen | https://channels.openzeppelin.com/gen |
| x402 version | v2 | v2 |
| Scheme | exact | exact |
| Assets | Any SEP-41 token (default USDC) | Any SEP-41 token (default USDC) |

Verify availability:
```bash
curl -I https://channels.openzeppelin.com/x402/supported
# Expected: HTTP 200
```

---

## Minimal Server Example (`@x402/express`)

```typescript
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://channels.openzeppelin.com/x402/testnet",
  createAuthHeaders: async () => {
    const headers = { Authorization: `Bearer YOUR_API_KEY` };
    return { verify: headers, settle: headers, supported: headers };
  },
});

const app = express();

app.use(
  paymentMiddleware(
    {
      "GET /api/data": {
        accepts: [{
          scheme: "exact",
          price: "$0.001",
          network: "stellar:testnet",
          payTo: "SERVER_STELLAR_ADDRESS",
        }],
        description: "Protected data endpoint",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      "stellar:testnet",
      new ExactStellarScheme(),
    ),
  ),
);

app.get("/api/data", (req, res) => {
  res.json({ data: "secret content" });
});

app.listen(4021);
```

## Pricing Formats
```typescript
// Human-readable (converts to USDC equivalent)
price: "$0.001"

// Explicit asset + base units (7 decimals for USDC → 1 USDC = 10_000_000)
price: {
  asset: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  amount: "10000",  // 0.001 USDC
}
```

---

## Key Resources
- npm: `x402-stellar`, `@x402/express`, `@stellar/mpp`
- Stellar x402 examples: https://github.com/stellar/x402
- x402 starter template: available on GitHub
- x402 protocol spec: Coinbase Developer Platform docs

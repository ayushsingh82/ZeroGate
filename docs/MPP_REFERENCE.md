# MPP (Machine Payments Protocol) on Stellar — Reference

## What is MPP?
Open protocol for **programmatic, per-request payments over HTTP** designed for AI agents and APIs.
Extends HTTP 402 into a machine-readable payment layer. On Stellar, works with Soroban SAC token transfers — no external facilitator required.

---

## Two Modes

| Mode | How it settles | Best for |
|------|---------------|----------|
| **Charge** | Every request = 1 on-chain Soroban SAC transfer | Simple pay-per-call APIs |
| **Session (Channel)** | Pre-fund once; off-chain cumulative signatures; settle in batch | High-frequency AI agent micropayments |

---

## Mode 1: Charge (Per-Request On-Chain Settlement)

### How it works
```
Client                  Server                  Chain
  |                        |                      |
  | GET /resource           |                      |
  |------------------------>|                      |
  |                        |                      |
  | 402 Payment Required    |                      |
  | (currency, amount,      |                      |
  |  recipient, network)    |                      |
  |<------------------------|                      |
  |                        |                      |
  | Build Soroban SAC       |                      |
  | transfer + simulate     |--------------------->|
  |<---------------------------------------------|
  |                        |                      |
  | Sign + send credential  |                      |
  |------------------------>|                      |
  |                        | Verify + broadcast    |
  |                        |---------------------->|
  |                        |<---------------------|
  |                        |                      |
  | 200 OK + receipt        |                      |
  |<------------------------|                      |
```

### Pull Mode (default) — server broadcasts
```typescript
// server.js
import express from "express";
import { Mppx, Store } from "mppx/server";
import { stellar } from "@stellar/mpp/charge/server";
import { USDC_SAC_TESTNET } from "@stellar/mpp";

const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY,
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_RECIPIENT,  // G... address
      currency: USDC_SAC_TESTNET,
      network: "stellar:testnet",
      store: Store.memory(),   // replay protection
    }),
  ],
});

app.get("/my-service", async (req, res) => {
  const result = await mppx.charge({
    amount: "0.01",            // 0.01 USDC per request
    description: "API access",
  })(webReq);

  if (result.status === 402) {
    // send challenge headers
    return res.status(402).send(await result.challenge.text());
  }

  const response = result.withReceipt(Response.json({ data: "secret" }));
  return res.status(response.status).send(await response.text());
});
```

```typescript
// client.js
import { Keypair } from "@stellar/stellar-sdk";
import { Mppx } from "mppx/client";
import { stellar } from "@stellar/mpp/charge/client";

Mppx.create({
  methods: [
    stellar.charge({
      keypair: Keypair.fromSecret(process.env.STELLAR_SECRET),
      mode: "pull",   // server broadcasts
    }),
  ],
});

// Payment handled automatically on 402
const res = await fetch("http://localhost:3001/my-service");
```

### Push Mode — client broadcasts
- Set `mode: "push"` on client
- Client broadcasts the transaction, sends `signedHash` credential
- Server verifies signature against the `from` account public key
- No change needed on server side

### Sponsored Fees
```typescript
stellar.charge({
  recipient: RECIPIENT,
  currency: USDC_SAC_TESTNET,
  network: "stellar:testnet",
  store: Store.memory(),
  feePayer: {
    envelopeSigner: Keypair.fromSecret(FEE_PAYER_SECRET),
  },
})
// Client signs only auth entries; server pays fees and broadcasts
```

---

## Mode 2: Session / Channel (Off-Chain Cumulative Payments)

### How it works
```
Client                  Server                  Chain
  |                        |                      |
  |  SETUP (once)           |                      |
  | Deploy channel contract |                      |
  | Deposit USDC once       |--------------------->|
  |                        |<---------------------|
  |                        |                      |
  |  VOUCHER PAYMENTS (many, off-chain)            |
  |                        |                      |
  | GET /resource           |                      |
  |------------------------>|                      |
  | 402 + channel info      |                      |
  |<------------------------|                      |
  |                        |                      |
  | Simulate prepare_commitment (read-only)        |
  |--------------------------------------------->  |
  | Commitment bytes                               |
  |<---------------------------------------------  |
  |                        |                      |
  | Sign commitment bytes   |                      |
  | (ed25519, cumulative)   |                      |
  |                        |                      |
  | Send voucher credential |                      |
  |------------------------>|                      |
  |                        | Verify sig locally    |
  |                        | (no on-chain tx!)     |
  | 200 OK                  |                      |
  |<------------------------|                      |
  |                        |                      |
  |  CLOSE (server settles) |                      |
  |                        | close(highestAmount,  |
  |                        |  highestSig)          |
  |                        |--------------------->  |
  |                        | USDC transferred       |
  |                        |<---------------------  |
```

### Server
```typescript
import { stellar } from "@stellar/mpp/channel/server";
import { StrKey } from "@stellar/stellar-sdk";

const commitmentPublicKeyG = StrKey.encodeEd25519PublicKey(
  Buffer.from(process.env.COMMITMENT_PUBKEY, "hex")
);

const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY,
  methods: [
    stellar.channel({
      channel: process.env.CHANNEL_CONTRACT,    // C... Soroban contract
      commitmentKey: commitmentPublicKeyG,
      store: Store.memory(),
      network: "stellar:testnet",
    }),
  ],
});

// Charge 0.1 USDC per request (off-chain)
const result = await mppx.channel({
  amount: "0.1",
  description: "API call",
})(webReq);
```

### Client
```typescript
import { stellar } from "@stellar/mpp/channel/client";
import { Keypair } from "@stellar/stellar-sdk";

const commitmentKey = Keypair.fromRawEd25519Seed(
  Buffer.from(process.env.COMMITMENT_SECRET, "hex")
);

Mppx.create({
  methods: [
    stellar.channel({
      commitmentKey,
      onProgress(event) {
        if (event.type === "signed") {
          console.log(`Cumulative: ${event.cumulativeAmount}`);
        }
      },
    }),
  ],
});

// Each fetch auto-increments cumulative commitment — no on-chain tx
const res = await fetch("http://localhost:3001/my-service");
```

### Closing a Channel (Server Settles)
```typescript
import { close } from "@stellar/mpp/channel/server";

const txHash = await close({
  channel: CHANNEL_CONTRACT,
  amount: 2000000n,           // cumulative in base units (bigint)
  signature: lastCommitmentSig, // Uint8Array — highest seen sig
  feePayer: {
    envelopeSigner: Keypair.fromSecret(process.env.SIGNER_SECRET),
  },
  network: "stellar:testnet",
});
// Single on-chain tx settles ALL accumulated payments
```

---

## Subpath Imports
| Path | Purpose |
|------|---------|
| `@stellar/mpp/charge/server` | Charge mode server |
| `@stellar/mpp/charge/client` | Charge mode client |
| `@stellar/mpp/channel/server` | Channel mode server (+ `close`, `getChannelState`) |
| `@stellar/mpp/channel/client` | Channel mode client |
| `@stellar/mpp` | Constants (e.g. `USDC_SAC_TESTNET`) |
| `mppx/server` | `Mppx.create`, `Store` |
| `mppx/client` | `Mppx.create` |

---

## Install
```bash
npm install @stellar/mpp mppx @stellar/stellar-sdk express
```

---

## Testnet Setup Checklist
1. Create keypair at https://lab.stellar.org/account/create
2. Fund with XLM (Friendbot): https://lab.stellar.org/account/fund
3. Add USDC trustline (button on fund page)
4. Get testnet USDC: https://faucet.circle.com (select Stellar Testnet)

---

## Key Resources
- `@stellar/mpp` npm package
- `mppx` npm package  
- one-way-channel Soroban contract (for session mode)
- MPP Specification whitepaper
- MPP Charge Guide + Session Guide on Stellar docs

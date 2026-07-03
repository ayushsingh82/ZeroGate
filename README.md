# ZeroGate — Private API Subscriptions with x402 + ZK on Stellar

> Deposit. Prove. Access. Anonymously.

ZeroGate is a private API monetisation protocol built on the **x402 payment standard** and Stellar's ZK host functions. When you call a ZeroGate-protected API without a session, the server returns an HTTP **402 Payment Required** response — but instead of advertising the merchant's wallet, the `to:` field points to a **ShieldedPool Soroban contract**. You deposit USDC to the pool, the server receives only a commitment hash, and you prove access with a Groth16 ZK proof. The merchant never appears on-chain. The server never sees your wallet. Every API call is unlinkable.

---

## The Problem

Standard API subscription payments are fully public:
- The **x402 402 response** leaks the merchant's wallet address to every API caller
- Payment amount visible in every block explorer
- Every API call traceable back to the paying wallet

For privacy-sensitive APIs — trading signals, medical queries, identity lookups, competitive intelligence — this is a non-starter.

---

## The Core Privacy Guarantee — Bidirectional Blindness

ZeroGate's central property: **neither the subscriber nor the merchant learns the other's identity.**

| Who | What they learn | Why |
|---|---|---|
| **Subscriber** (API caller) | ❌ Never sees merchant's wallet address | The x402 402 response advertises only the ShieldedPool contract address as `to:`. Merchant's G-address is never sent to the client at any point in the flow. |
| **Merchant** (API server) | ❌ Never sees subscriber's wallet address | `/subscribe` receives only a Poseidon commitment hash. Zero wallet address, zero tx hash. Server is provably blind to who paid. |
| **On-chain observer** | ❌ Never sees merchant ↔ subscriber link | Payment goes wallet → ShieldedPool. Merchant claims funds privately via `admin_claim`. No on-chain link between subscriber and merchant. |

**ShieldedPool is the neutral blind intermediary between them.**

---

## What ZeroGate Delivers

| What's Hidden | Mechanism |
|---|---|
| **Merchant address** | USDC goes to ShieldedPool contract, not merchant wallet. Merchant never appears on-chain. |
| **Subscriber identity** | `/subscribe` never receives a wallet address — only a ZK commitment hash |
| **API call linkage** | Each call uses a session token derived from the commitment, not from any wallet key |
| **Subscription details** | Only `Poseidon(secret, expiry)` is stored in the contract — no plan, no amount, no wallet |

---

## How It Works

### Step 0 — API returns x402 Payment Required (merchant hidden)

```http
GET /api/prices
→ HTTP 402

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "zerogate-shielded",
    "to": "CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY",  ← ShieldedPool
    "maxAmountRequired": "0.50",
    ...
  }]
}

# Merchant's G-address (GBBG…MQUM) is NEVER in this response.
# Subscriber learns only that payment goes to the pool contract.
```

### Step 1 — Private Deposit (Merchant Address Hidden On-Chain)

```
Subscriber wallet ──USDC──▶ ShieldedPool contract
                              stores: Poseidon(secret, expiry)
                              merchant address: never written to ledger

NOT this:
Subscriber wallet ──USDC──▶ Merchant wallet   ← visible on every block explorer
```

Merchant claims funds via `admin_claim(token, their_address, amount)` — executed privately, not linked to any subscriber transaction.

### Step 2 — Blind Subscribe (Subscriber Wallet Hidden from Server)

```typescript
// POST /subscribe — server receives ONLY:
{ commitment, leaf_index, subscriber_secret, subscription_id, expiry }

// Server NEVER receives:
// ✗  wallet address
// ✗  transaction hash
// ✗  payment amount
// ✗  anything that identifies the subscriber
```

Server issues an HMAC session token bound to the commitment hash — not to any wallet. The server is provably blind to who subscribed.

### Step 3 — Anonymous API Access

```http
GET /api/prices
X-ZeroGate-Session: <commitment>:<expiry>:<hmac>

# Server verifies HMAC. Returns data.
# Server logs: "valid token presented." Zero wallet info.
```

In production: session token upgrades to a full Groth16 proof — proves Merkle membership without revealing which leaf, which wallet, or what was paid.

---

## Architecture

```
Browser
  ├─ depositToPool(secret, expiry, amount)
  │    ├─ commitment = Poseidon(secret, expiry)   ← computed client-side
  │    ├─ call ShieldedPool.deposit(USDC, commitment)
  │    └─ returns txHash + leafIndex
  │
  ├─ POST /subscribe { commitment, leafIndex, secret }  ← NO wallet
  │    └─ receives: merchant_commitment + session_token
  │
  └─ GET /api/prices
       X-ZeroGate-Session: <hmac-token>
       └─ returns data (wallet never logged)

ShieldedPool Soroban Contract
  ├─ deposit(from, token, amount, commitment) → u32  ← stores hash only
  ├─ get_root() → BytesN<32>                          ← Merkle root for ZK
  ├─ get_path(index) → proof siblings                 ← client builds ZK proof
  └─ admin_claim(token, to, amount)                   ← merchant withdraws

ZK Circuit (Circom 2.0 / Groth16 / BN254)
  └─ subscription_proof.circom — 11,741 constraints
       ├─ Merkle inclusion (you have a valid leaf)
       ├─ Expiry check (subscription not expired)
       ├─ Merchant commitment match
       └─ Nullifier output (per-session, unlinkable)
```

---

## Deployed Contracts (Stellar Testnet)

| Contract | Address |
|---|---|
| ShieldedPool (subscription_registry) | `CDMJVGYOLXA4UF4FYWMP2XXHBX7OGNM6C54NZ6BAEUPL6TXPSUJVGXYY` |
| USDC SAC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

---

## Tech Stack

| Layer | Tech |
|---|---|
| ZK Proofs | Circom 2.0 + Groth16 (snarkjs, browser WASM) |
| Hash | Poseidon (BN254 — matches Stellar Protocol 25 host fn) |
| Smart Contracts | Soroban (Rust), deployed to Stellar Testnet |
| Payment | USDC via Stellar Asset Contract → ShieldedPool |
| Session Auth | HMAC-SHA256 (stateless, survives restarts) |
| Frontend | Next.js 15 + Freighter wallet |
| On-chain Verifier | BN254 `bn254_multi_pairing_check` host function |

---

## Privacy Properties — What's True

| Claim | Status |
|---|---|
| Merchant address hidden on-chain | ✅ Payment goes to pool contract, not merchant |
| Server never learns wallet address | ✅ `/subscribe` takes commitment hash only |
| API calls unlinkable to wallet | ✅ Session token contains no wallet info |
| Subscription amount hidden in contract | ✅ Contract stores only Poseidon hash |
| USDC transfer amount private | ⚠️ Stellar token transfers are public — amount visible in explorer |

---

## Quick Start

```bash
# 1. Run the API server
cd api && npm install && npx tsx src/server.ts

# 2. Run the frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000

# 3. Fund testnet account
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"
# USDC faucet: https://faucet.circle.com (Stellar Testnet)

# 4. Subscribe via the app
# Connect Freighter → click "Pay & Subscribe privately" → approve in Freighter
# USDC goes to ShieldedPool, not to any merchant wallet
```

---

## Repo Layout

```
ZeroGate/
├── circuits/
│   ├── subscription_proof.circom   ← ZK circuit (Groth16, BN254, depth=20)
│   └── lib/merkle_proof.circom     ← Poseidon Merkle tree
├── contracts/
│   └── subscription_registry/      ← ShieldedPool: deposit + Merkle + claim
├── api/
│   ├── src/routes/subscribe.ts     ← blind subscribe (no wallet)
│   ├── src/middleware/zk_gate.ts   ← session token + ZK proof verifier
│   └── src/lib/commitment.ts       ← Poseidon commitment helpers
├── frontend/
│   ├── app/app/                    ← Dashboard / ZK Proofs / History / Playground
│   ├── lib/payment.ts              ← depositToPool (Soroban contract call)
│   └── lib/poseidon.ts             ← client-side Poseidon hash
└── README.md
```

---

## Network

| Property | Value |
|---|---|
| Network | Stellar Testnet |
| Passphrase | `Test SDF Network ; September 2015` |
| RPC | `https://soroban-testnet.stellar.org` |
| Horizon | `https://horizon-testnet.stellar.org` |
| USDC Issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

---

Built for the **Stellar ZK Hackathon** — demonstrating that Stellar's BN254 host functions enable real, composable ZK privacy primitives on a payments-native L1.

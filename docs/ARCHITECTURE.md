# Stealth402 — System Architecture

## What We're Building

A private subscription payment system where:
- Users pay for API access via **x402 on Stellar** with **hidden amounts** and **hidden merchant addresses**
- Per-session, users prove they have already paid via **ZK proofs** — without linking their paying wallet to their API usage

Three things are always hidden:
| What | How |
|------|-----|
| Payment amount | Pedersen commitment in Circom circuit |
| Merchant address | Committed (hashed), never on-chain in plaintext |
| Wallet ↔ session link | Fresh ZK nullifier per session |

---

## High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                      │
│                                                              │
│  ┌──────────────────┐   ┌──────────────────────────────┐   │
│  │  x402 Payment UI  │   │  snarkjs WASM Prover          │   │
│  │  (Stellar SDK)    │   │  (Circom Groth16)             │   │
│  └────────┬─────────┘   └──────────────┬───────────────┘   │
│           │ SAC token transfer           │ proof + nullifier  │
│           │ (amount hidden)              │                    │
└───────────┼──────────────────────────────┼────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐   ┌─────────────────────────────────┐
│   STELLAR ON-CHAIN    │   │        API LAYER (Node.js)       │
│                       │   │                                   │
│  SubscriptionRegistry │◄──┤  x402 Middleware                 │
│  (Soroban)            │   │  - parses 402 Payment Required   │
│  - Merkle tree of     │   │  - routes to Stellar SAC         │
│    commitments        │   │  - forwards ZK proof to verifier │
│                       │   │                                   │
│  Groth16Verifier      │◄──┤  ZK Proof Validator              │
│  (Soroban)            │   │  - calls Soroban verifier        │
│  - BN254 pairing      │   │  - checks nullifier not spent    │
│    check host fn      │   │                                   │
│                       │   └─────────────────────────────────┘
│  NullifierRegistry    │
│  (Soroban SMT)        │
│  - spent nullifiers   │
│  - revoked subs       │
└───────────────────────┘
```

---

## Privacy Model

### What is public on-chain
- That a payment was made (sender address, receiver address as commitment)
- That a subscription commitment was added to the Merkle tree
- That a nullifier was spent (opaque hash — reveals nothing)
- Merkle root updates

### What is never on-chain
- Payment amount (hidden via Pedersen commitment)
- Merchant address in plaintext (only `hash(merchant_address, salt)` stored)
- Which subscription a user is accessing (nullifier is unlinkable)
- Session history or usage patterns

### What never leaves the browser
- `subscriber_secret` — the root key for all proofs
- `blinding_factor` — used in amount commitment
- Raw merchant address (user side)

---

## Data Structures

### Subscription Leaf (stored in Merkle tree)
```
leaf = Poseidon(
  subscriber_secret,       // private: user's root secret
  amount_commitment,       // public:  Pedersen(amount, blinding)
  merchant_commitment,     // public:  Poseidon(merchant_addr, salt)
  expiry_timestamp,        // public:  Unix timestamp
  subscription_id          // public:  random unique id
)
```

### Nullifier (prevents session replay)
```
nullifier = Poseidon(subscriber_secret, session_nonce)
```
- `session_nonce` is a random value chosen per API call
- Nullifier is stored on-chain after use
- Same subscription can generate unlimited different nullifiers (one per session)

### Amount Commitment (hides payment amount)
```
amount_commitment = Pedersen(amount, blinding_factor)
```
- Commitment stored on-chain
- Range proof in circuit ensures amount > 0 and ≤ MAX_AMOUNT
- Merchant can verify they received payment via Confidential Token balance

---

## Proof System

**Framework:** Circom 2.0 + Groth16  
**Why Circom over Noir:** Groth16 proofs are smaller and cheaper to verify on-chain than UltraHonk  
**On-chain verifier:** Reuse NethermindEth/stellar-private-payments Groth16 verifier  
**Hash function:** Poseidon (available as Stellar host function — consistent between circuit and on-chain)

---

## Component Dependency Map

```
circuits/subscription_proof.circom
    └── uses: circomlib/poseidon, circomlib/merkle, circomlib/smt_verifier
    └── outputs: proof + public signals

contracts/groth16_verifier/
    └── reused from: NethermindEth/stellar-private-payments
    └── calls: bn254 host functions (Protocol 25/26)

contracts/subscription_registry/
    └── uses: poseidon host function
    └── maintains: Merkle tree of subscription leaves

contracts/nullifier_registry/
    └── implements: Sparse Merkle Tree
    └── tracks: spent nullifiers + revoked subscriptions

api/middleware/x402.ts
    └── intercepts: HTTP 402 responses
    └── pays via: Stellar SAC (USDC or XLM)
    └── passes: ZK proof to Soroban verifier
```

---

## Repos We Reuse (Don't Rebuild)

| Component | Source |
|-----------|--------|
| Groth16 verifier Soroban contract | `NethermindEth/stellar-private-payments` |
| ASP Sparse Merkle Tree pattern | `NethermindEth/stellar-private-payments` |
| Browser WASM proof generation pattern | `NethermindEth/stellar-private-payments` |
| Poseidon / Merkle circuits | `circomlib` |
| SMT non-membership circuit | `circomlib` |
| x402 HTTP middleware | Build new |
| Subscription registry contract | Build new |
| `subscription_proof.circom` | Build new |

---

## Network

- **Chain:** Stellar Testnet (Futurenet for Protocol 26 host functions if needed)
- **Token:** USDC or native XLM via SAC
- **Contract runtime:** Soroban (Rust)

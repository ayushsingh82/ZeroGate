# Stealth402 — Private API Subscriptions with ZK on Stellar

> Pay once. Prove forever. Stay anonymous.

Stealth402 is a privacy-preserving API subscription system built on Stellar. Users pay for API access via the x402 protocol, then prove per-session (via ZK proofs) that they have an active subscription — **without ever linking their paying wallet to their API usage**.

---

## The Problem

Standard x402 / HTTP 402 payments are fully transparent:
- The payment amount is visible on-chain
- The merchant address is visible on-chain
- Every API call can be linked back to the paying wallet

For privacy-sensitive API use (medical, financial, identity, competitive intelligence), this is a fundamental blocker.

---

## What Stealth402 Does

Three privacy invariants — always preserved:

| What's Hidden | How |
|---|---|
| **Payment amount** | Pedersen commitment on-chain; range proof in ZK circuit |
| **Merchant address** | `Poseidon(merchant_addr, salt)` commitment stored on-chain |
| **Wallet ↔ session link** | Nullifier = `Poseidon(subscriber_secret, session_nonce)` — one-way, per-session |

**Subscribe once** → receive a private subscription credential (stored client-side only).

**Use any number of times** → generate a fresh ZK proof per API call. Verifier sees: "valid subscription exists, hasn't expired, not replayed." Nothing else.

---

## Architecture

```
Client (Browser)
  ├── Pay via x402 → Stellar Testnet (USDC SAC transfer)
  ├── Receive subscription credential (leaf index + secret)
  ├── Generate ZK proof (snarkjs WASM, browser-only)
  └── Call API with proof in X-Stealth402-Proof header

API Server (Express + x402 middleware)
  ├── POST /subscribe  — x402 gate → register leaf in Merkle tree
  └── GET  /api/*      — ZK gate → verify proof on-chain, register nullifier

Soroban Contracts (Stellar Testnet)
  ├── groth16_verifier      — BN254 pairing check (reused from NethermindEth)
  ├── subscription_registry — Poseidon Merkle tree of subscription commitments
  └── nullifier_registry    — Spent nullifier set (replay prevention)

ZK Circuit (Circom 2.0 / Groth16 / BN254)
  └── subscription_proof.circom (depth=20, 11,741 constraints)
      ├── Merkle inclusion proof (subscription exists)
      ├── Expiry check (subscription not expired)
      ├── Merchant commitment match (correct API provider)
      └── Nullifier output (session-unique, one-way)
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| ZK Proofs | Circom 2.0 + Groth16 (snarkjs) |
| Hash | Poseidon (circomlib + Stellar Protocol 25 host fn) |
| Smart Contracts | Soroban (Rust) on Stellar Testnet |
| Payment | x402 protocol (HTTP 402 + Stellar SAC USDC transfer) |
| Frontend | Next.js 15 + Freighter wallet |
| Wallet | Freighter (@stellar/freighter-api) |
| On-chain Verifier | BN254 host functions (bn254_multi_pairing_check) |

---

## Repository Layout

```
Stealth402/
├── circuits/
│   ├── subscription_proof.circom   ← main ZK circuit
│   ├── lib/
│   │   └── merkle_proof.circom     ← Poseidon Merkle tree
│   ├── test/
│   │   ├── generate_merkle_root.js ← compute test Merkle root
│   │   └── input_valid.json        ← test inputs
│   ├── build.sh                    ← compile + trusted setup
│   └── test.sh                     ← end-to-end proof test
├── contracts/
│   ├── groth16_verifier/           ← reused from NethermindEth
│   ├── subscription_registry/      ← Merkle tree of commitments
│   └── nullifier_registry/         ← spent nullifier SMT
├── frontend/
│   ├── app/                        ← Next.js app router
│   ├── components/landing/         ← landing page sections
│   ├── hooks/use-wallet.ts         ← Freighter wallet hook
│   └── lib/wallet.ts               ← Freighter functions
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CIRCUITS.md
│   ├── CONTRACTS.md
│   ├── X402_INTEGRATION.md
│   ├── X402_REFERENCE.md
│   ├── MPP_REFERENCE.md
│   ├── NETWORKS_REFERENCE.md
│   └── BUILD_PLAN.md
└── api/                            ← Express server (Phase 3)
```

---

## ZK Circuit — Key Design Choices

**Why Circom + Groth16 (not Noir)?**
Groth16 produces constant-size proofs (~256 bytes, 3 elliptic curve points). On Stellar, this means exactly one `bn254_multi_pairing_check` call. Noir's UltraHonk proofs are larger and more expensive to verify.

**Why Poseidon?**
Stellar Protocol 25 added native `poseidon2` host functions. Our on-chain Merkle tree uses the same hash as the circuit — no translation layer, no mismatches.

**Why a Merkle tree (not just nullifiers)?**
The subscription set lives on-chain as a Merkle tree. Clients compute inclusion proofs locally. The ZK circuit proves membership without revealing which leaf — subscriptions are unlinkable.

---

## Quick Start

### 1. Compile the ZK circuit

```bash
cd circuits
npm install
bash build.sh
```

Requires: `circom` (built from source) + `snarkjs` + `node`

### 2. Run proof test

```bash
bash test.sh
# Expected: snarkjs groth16 verify → OK
```

### 3. Run frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 4. Fund testnet account

```bash
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"
# Get testnet USDC: https://faucet.circle.com (select Stellar Testnet)
```

---

## Network

All development and demos run on **Stellar Testnet**.

| Property | Value |
|---|---|
| Passphrase | `Test SDF Network ; September 2015` |
| RPC | `https://soroban-testnet.stellar.org` |
| Horizon | `https://horizon-testnet.stellar.org` |
| USDC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

---

## Build Phases

- [x] **Phase 1** — ZK circuit (Circom, Merkle proof, expiry check)
- [ ] **Phase 2** — Soroban contracts (groth16_verifier, subscription_registry, nullifier_registry)
- [ ] **Phase 3** — Express API (x402 subscribe endpoint + ZK gate middleware)
- [ ] **Phase 4** — Frontend integration (snarkjs WASM, subscribe UI, demo UI)
- [ ] **Phase 5** — Demo video + deployment

---

## Built for Stellar Hacks ZK Hackathon

Stealth402 demonstrates that Stellar's Protocol 25 BN254 host functions enable real, practical ZK applications on a payments-focused network — not just toy demos.

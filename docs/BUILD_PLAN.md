# Stealth402 — Build Plan

## What We're Building (One Line)
A private subscription payment system where users pay for API access via x402 on Stellar with hidden amounts and hidden merchant addresses, then prove per-session — via ZK — that they have already paid, without ever linking their paying wallet to their API usage.

---

## Project Structure

```
Stellar Hacks/
├── frontend/                    ← existing Next.js landing page
├── circuits/                    ← Circom ZK circuits
│   ├── subscription_proof.circom
│   └── lib/
├── contracts/                   ← Soroban smart contracts (Rust)
│   ├── groth16_verifier/        ← reuse from NethermindEth
│   ├── subscription_registry/
│   └── nullifier_registry/
├── api/                         ← Express backend (x402 + ZK gate)
│   ├── server.ts
│   ├── middleware/
│   └── lib/
└── docs/
    ├── ARCHITECTURE.md
    ├── BUILD_PLAN.md            ← this file
    ├── CIRCUITS.md
    ├── CONTRACTS.md
    ├── X402_INTEGRATION.md
    ├── X402_REFERENCE.md
    ├── MPP_REFERENCE.md
    └── NETWORKS_REFERENCE.md
```

---

## Build Phases

### Phase 1 — ZK Circuit (Day 1 Morning)
**Goal:** Working Circom circuit that compiles and generates valid proofs.

- [ ] Set up Circom + snarkjs toolchain
- [ ] Write `circuits/subscription_proof.circom`
  - Poseidon leaf construction
  - Merkle inclusion proof (use circomlib `MerkleProof`)
  - SMT non-membership for nullifier (use circomlib `SMTVerifier`)
  - SMT non-membership for revocation
  - Expiry check constraint
  - Amount range check (min ≤ amount ≤ max)
  - Nullifier output = Poseidon(secret, session_nonce)
- [ ] Trusted setup: Powers of Tau (use Hermez file) + circuit contribution
- [ ] Export `.wasm`, `.zkey`, `verification_key.json`
- [ ] Write test: valid proof verifies, invalid proof fails, replay fails

**Done when:** `snarkjs groth16 verify verification_key.json public.json proof.json` outputs `true`

---

### Phase 2 — Soroban Contracts (Day 1 Afternoon)

**Goal:** All three contracts deployed on Testnet.

#### 2a. Copy + Deploy `groth16_verifier`
- [ ] Clone `NethermindEth/stellar-private-payments`
- [ ] Copy `groth16_verifier` contract into `contracts/groth16_verifier/`
- [ ] Build: `cargo build --target wasm32-unknown-unknown --release`
- [ ] Deploy to Testnet, note contract address

#### 2b. Build `nullifier_registry`
- [ ] Implement SMT insert (spent nullifiers)
- [ ] Implement SMT insert (revoked subscriptions)
- [ ] `get_nullifier_root()` and `get_revoke_root()` functions
- [ ] `spend_nullifier()` — fails if already spent
- [ ] `revoke_subscription()` — merchant-only
- [ ] Unit tests for SMT operations
- [ ] Deploy to Testnet, note contract address

#### 2c. Build `subscription_registry`
- [ ] Implement Poseidon Merkle tree (append-only, depth 20)
- [ ] `add_subscription(leaf, amount_commitment, merchant_commitment, expiry)`
- [ ] `get_root()` function
- [ ] `verify_and_use()` — calls groth16_verifier + nullifier_registry
- [ ] `initialize()` with verifier + nullifier contract addresses
- [ ] Integration tests
- [ ] Deploy to Testnet, initialize with other contract addresses

**Done when:** Can call `verify_and_use` with a valid proof from Phase 1 and get `true`

---

### Phase 3 — API Backend (Day 2 Morning)

**Goal:** Express server with x402 subscribe + ZK-gated endpoints.

- [ ] `npm init` in `api/`, install dependencies:
  ```bash
  npm install express @x402/express @x402/stellar @x402/core mppx @stellar/mpp @stellar/stellar-sdk circomlibjs
  npm install -D typescript @types/express tsx
  ```
- [ ] `api/lib/stellar.ts` — Soroban RPC client, contract callers
- [ ] `api/lib/commitment.ts` — `generateMerchantCommitment(addr, salt)`
- [ ] `api/routes/subscribe.ts` — x402 middleware + on-chain leaf registration
- [ ] `api/middleware/zk_gate.ts` — verify `X-Stealth402-Proof` header
- [ ] `api/routes/protected.ts` — sample ZK-gated endpoint
- [ ] `api/server.ts` — wire everything together
- [ ] `.env` with all contract addresses + API keys
- [ ] Test: subscribe → get leaf_index → generate proof → call API → 200 OK

**Done when:** Full flow works end-to-end via curl/Postman

---

### Phase 4 — Frontend Integration (Day 2 Afternoon)

**Goal:** Browser can subscribe, generate proofs, and call the API.

- [ ] Add `snarkjs` + `circomlibjs` to frontend
- [ ] Copy compiled `.wasm` + `.zkey` into `frontend/public/circuits/`
- [ ] `frontend/lib/stealth402_client.ts` — `generateProofAndCall()`
- [ ] `frontend/lib/stellar_client.ts` — fetch Merkle proof + SMT roots from chain
- [ ] Subscribe UI — connects wallet (Freighter), pays via x402, stores state in localStorage
- [ ] Demo UI — button to call protected API with ZK proof, show response
- [ ] Show proof generation happening in browser (loading state)

**Done when:** Demo runs fully in browser on Testnet without any server-side secret access

---

### Phase 5 — Polish + Demo Prep (Day 3)

- [ ] Record 2-3 minute demo video showing:
  1. User subscribes (x402 payment, hidden amount, hidden merchant)
  2. Wallet secret stays in browser
  3. API call with ZK proof (show the proof being generated)
  4. 200 OK response
  5. Replay attempt fails (nullifier already spent)
  6. Different session, same subscription — new proof, new nullifier, works
- [ ] README.md explaining what ZK is doing and why
- [ ] Clean up `.env.example`
- [ ] Push to public GitHub repo

---

## Key Dependencies

```bash
# Circuit toolchain
npm install -g circom snarkjs
npm install circomlib

# API
npm install express @x402/express @x402/stellar @x402/core
npm install mppx @stellar/mpp
npm install @stellar/stellar-sdk

# Frontend additions
npm install snarkjs circomlibjs
```

```toml
# contracts/*/Cargo.toml
[dependencies]
soroban-sdk = "21"
```

---

## Testnet Contracts to Deploy

| Contract | Deploy Order | Notes |
|----------|-------------|-------|
| `groth16_verifier` | 1st | No init args |
| `nullifier_registry` | 2nd | No init args |
| `subscription_registry` | 3rd | Init with addresses from 1 + 2 |

---

## Critical Path (What Blocks What)

```
Circuit compile + trusted setup
        │
        ▼
verification_key.json → groth16_verifier contract can be tested
        │
        ▼
groth16_verifier deployed → subscription_registry can call it
        │
        ▼
nullifier_registry deployed ┐
                            ├─→ subscription_registry initialized
        ┌───────────────────┘
        ▼
subscription_registry deployed + initialized
        │
        ▼
API can call all contracts
        │
        ▼
Frontend can drive full flow
```

---

## Risk + Mitigation

| Risk | Mitigation |
|------|-----------|
| Circuit has too many constraints for browser WASM | Profile early; trim SMT depth if needed |
| Poseidon host fn output doesn't match circomlib | Use same parameter set; write a cross-check test |
| x402 facilitator auth issues | Test `/supported` endpoint first; have fallback test with direct SAC transfer |
| WASM proof gen too slow in browser | Show a progress indicator; 2-5s is acceptable |
| Groth16 verifier contract ABI changed | Pin to specific commit of NethermindEth repo |

---

## What We're NOT Building (Scope Control)

- Full wallet integration (use browser localStorage for demo)
- Merchant dashboard
- Production trusted setup (use development setup for hackathon)
- Mainnet deployment
- MPP channel mode integration (Charge mode only for now)
- Confidential Token standard (amounts hidden via circuit, not token standard)

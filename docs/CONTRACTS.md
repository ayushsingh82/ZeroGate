# Stealth402 — Soroban Smart Contracts

## Overview

Three contracts. One is reused, two are new.

| Contract | Status | Responsibility |
|----------|--------|---------------|
| `groth16_verifier` | **Reuse** from NethermindEth | Verify Circom Groth16 proofs using BN254 host functions |
| `subscription_registry` | **Build** | Store subscription commitments in Merkle tree |
| `nullifier_registry` | **Build** | Track spent nullifiers + revoked subscriptions via SMT |

---

## Contract 1: `groth16_verifier` (Reused)

**Source:** `NethermindEth/stellar-private-payments`  
**Do not modify.** Deploy as-is to Testnet.

What it does:
- Accepts a Groth16 proof (`pi_a`, `pi_b`, `pi_c`) and public signals
- Calls `bn254_multi_pairing_check` Stellar host function
- Returns `true` if proof is valid

Interface we call:
```rust
pub fn verify_proof(
    env: Env,
    proof_a: Vec<u8>,      // G1 point, 64 bytes
    proof_b: Vec<u8>,      // G2 point, 128 bytes
    proof_c: Vec<u8>,      // G1 point, 64 bytes
    public_signals: Vec<BytesN<32>>,
) -> bool
```

---

## Contract 2: `subscription_registry`

Manages the Merkle tree of active subscription commitments.

### Storage
```rust
// Merkle tree stored as a flat array of node hashes
// Level 0 = leaves, Level DEPTH = root
DataKey::MerkleNode(level: u32, index: u32) -> BytesN<32>
DataKey::LeafCount -> u32
DataKey::MerkleRoot -> BytesN<32>
DataKey::VerifierContract -> Address   // groth16_verifier contract address
DataKey::NullifierContract -> Address  // nullifier_registry contract address
```

### Functions

```rust
// Initialize registry with verifier + nullifier contract addresses
pub fn initialize(
    env: Env,
    admin: Address,
    verifier: Address,
    nullifier_registry: Address,
)

// Add a subscription commitment leaf to the Merkle tree
// Called when a user pays via x402/MPP
// merchant_commitment = Poseidon(merchant_addr, salt) — never store raw address
pub fn add_subscription(
    env: Env,
    leaf: BytesN<32>,           // Poseidon(secret, amount_commit, merchant_commit, expiry, sub_id)
    amount_commitment: BytesN<32>, // Pedersen(amount, blinding) — for audit
    merchant_commitment: BytesN<32>,
    expiry: u64,
) -> u32  // returns leaf index

// Get current Merkle root (used as public signal in ZK proof)
pub fn get_root(env: Env) -> BytesN<32>

// Verify a subscription proof — called by API middleware on each request
// Returns the nullifier (so caller can register it as spent)
pub fn verify_and_use(
    env: Env,
    proof_a: Vec<u8>,
    proof_b: Vec<u8>,
    proof_c: Vec<u8>,
    nullifier: BytesN<32>,
    merkle_root: BytesN<32>,
    nullifier_smt_root: BytesN<32>,
    revoke_smt_root: BytesN<32>,
    merchant_commitment: BytesN<32>,
    current_timestamp: u64,
) -> bool  // true = valid proof, nullifier registered as spent
```

### Merkle Tree Implementation
- Depth: 20 levels (supports up to 2^20 = ~1M subscriptions)
- Hash: Poseidon2 (use Stellar `poseidon2` host function)
- Empty leaf value: `Poseidon2([0, 0])` (standard)
- Insert: append leaf, update path to root

```rust
// Pseudocode for leaf insertion
fn insert_leaf(env: &Env, leaf: BytesN<32>) -> u32 {
    let index = env.storage().get::<_, u32>(&DataKey::LeafCount).unwrap_or(0);
    // Store leaf at level 0
    env.storage().set(&DataKey::MerkleNode(0, index), &leaf);
    // Update all ancestors
    let mut current = leaf;
    let mut idx = index;
    for level in 0..DEPTH {
        let sibling = get_node(env, level, idx ^ 1); // XOR flips last bit = sibling
        current = if idx % 2 == 0 {
            poseidon2(env, &[current, sibling])
        } else {
            poseidon2(env, &[sibling, current])
        };
        idx >>= 1;
        env.storage().set(&DataKey::MerkleNode(level + 1, idx), &current);
    }
    env.storage().set(&DataKey::MerkleRoot, &current);
    env.storage().set(&DataKey::LeafCount, &(index + 1));
    index
}
```

---

## Contract 3: `nullifier_registry`

Sparse Merkle Tree (SMT) with two trees:
1. **Spent nullifiers** — nullifiers that have been used in a session
2. **Revoked subscriptions** — subscription IDs revoked by merchants

### Why SMT
A regular Merkle tree can only prove a key IS in the tree (inclusion).
An SMT can prove a key IS NOT in the tree (non-membership/exclusion) — exactly what we need to prove a nullifier hasn't been spent yet.

### Storage
```rust
DataKey::SpentNullifierRoot -> BytesN<32>
DataKey::RevokeRoot -> BytesN<32>
// SMT node storage: (tree_id, key_path, level) -> node_hash
DataKey::SmtNode(tree: u8, path: BytesN<32>, level: u32) -> BytesN<32>
```

### Functions

```rust
// Get current roots (used as public signals in ZK proof)
pub fn get_nullifier_root(env: Env) -> BytesN<32>
pub fn get_revoke_root(env: Env) -> BytesN<32>

// Register a nullifier as spent (called after successful proof verification)
// Fails if nullifier already exists (double-spend prevention)
pub fn spend_nullifier(env: Env, nullifier: BytesN<32>) -> BytesN<32>  // returns new root

// Revoke a subscription (called by merchant or admin)
pub fn revoke_subscription(env: Env, caller: Address, subscription_id: BytesN<32>) -> BytesN<32>

// Check if nullifier is spent (off-chain helper, not used in ZK path)
pub fn is_spent(env: Env, nullifier: BytesN<32>) -> bool
```

### SMT Insert (Pseudocode)
```rust
// SMT: key space = all possible BytesN<32> values
// Default empty node = Poseidon2([0, 0])
// Insert: walk key bits top-down, set leaf at bottom, update path to root
fn smt_insert(env: &Env, tree: u8, key: BytesN<32>) {
    // Walk from root (level 256) to leaf (level 0) following key bits
    // Set leaf node = Poseidon2([key, 1])  (value = 1 = "exists")
    // Update all ancestors on the path back to root
}
```

---

## Contract Interaction Flow

```
User pays via x402/MPP (off-chain)
     │
     ▼
subscription_registry::add_subscription(leaf, ...)
     │ inserts leaf into Merkle tree
     │ returns leaf_index + new merkle_root
     │
     ▼ (user stores subscriber_secret + leaf_index client-side)

--- later, on each API call ---

Client generates ZK proof (browser WASM)
     │ public inputs include:
     │   merkle_root = subscription_registry::get_root()
     │   nullifier_smt_root = nullifier_registry::get_nullifier_root()
     │   revoke_smt_root = nullifier_registry::get_revoke_root()
     │
     ▼
subscription_registry::verify_and_use(proof, nullifier, ...)
     │ calls groth16_verifier::verify_proof(...)
     │ if valid → calls nullifier_registry::spend_nullifier(nullifier)
     │ returns true
     │
     ▼
API middleware gets true → serves response
```

---

## Deployment Order

```bash
# 1. Deploy groth16_verifier (no args)
stellar contract deploy --wasm contracts/groth16_verifier/target/wasm32-unknown-unknown/release/groth16_verifier.wasm --network testnet

# 2. Deploy nullifier_registry
stellar contract deploy --wasm contracts/nullifier_registry/... --network testnet

# 3. Deploy subscription_registry (pass other two contract addresses)
stellar contract invoke \
  --id SUBSCRIPTION_REGISTRY_ID \
  --fn initialize \
  -- \
  --admin ADMIN_G_ADDRESS \
  --verifier GROTH16_VERIFIER_C_ADDRESS \
  --nullifier_registry NULLIFIER_REGISTRY_C_ADDRESS \
  --network testnet
```

---

## File Structure

```
contracts/
├── groth16_verifier/          ← copy from NethermindEth repo
│   ├── Cargo.toml
│   └── src/lib.rs
├── subscription_registry/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs             ← contract entry points
│       ├── merkle.rs          ← Merkle tree operations
│       └── storage.rs         ← DataKey definitions
└── nullifier_registry/
    ├── Cargo.toml
    └── src/
        ├── lib.rs             ← contract entry points
        └── smt.rs             ← Sparse Merkle Tree operations
```

---

## Cargo.toml (shared dependencies)

```toml
[dependencies]
soroban-sdk = { version = "21", features = ["testutils"] }

[dev-dependencies]
soroban-sdk = { version = "21", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true

[profile.release-with-logs]
inherits = "release"
debug-assertions = true
```

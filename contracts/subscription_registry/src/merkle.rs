use soroban_sdk::{BytesN, Env, Vec};
use crate::storage::DataKey;

pub const TREE_DEPTH: u32 = 20;

// Empty node value: keccak256("stealth402_empty") truncated to 32 bytes,
// used as placeholder for empty leaves in the Merkle tree.
// In production, replace with Poseidon2([0,0]) to match the circuit.
const ZERO_VALUE: [u8; 32] = [
    0x2f, 0xe5, 0x4c, 0x60, 0xd3, 0xac, 0xab, 0xf3,
    0x34, 0x3a, 0x35, 0xb6, 0xeb, 0xa1, 0x5d, 0xb4,
    0x82, 0x15, 0x23, 0x86, 0xeb, 0xa1, 0xd6, 0x63,
    0x86, 0x27, 0xb4, 0xf1, 0xb2, 0xf3, 0xdd, 0x11,
];

pub fn zero_value(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &ZERO_VALUE)
}

fn get_node(env: &Env, level: u32, index: u32) -> BytesN<32> {
    env.storage()
        .persistent()
        .get(&DataKey::MerkleNode(level, index))
        .unwrap_or_else(|| zero_value(env))
}

fn set_node(env: &Env, level: u32, index: u32, value: BytesN<32>) {
    env.storage()
        .persistent()
        .set(&DataKey::MerkleNode(level, index), &value);
}

/// Hash two 32-byte values using Stellar's SHA-256 (MVP).
/// Production: replace with Poseidon2 to match the ZK circuit.
fn hash_pair(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    let mut data = soroban_sdk::Bytes::new(env);
    data.append(&left.clone().into());
    data.append(&right.clone().into());
    env.crypto().sha256(&data).into()
}

/// Append a leaf, update ancestors, return leaf index.
pub fn insert_leaf(env: &Env, leaf: BytesN<32>) -> u32 {
    let index: u32 = env
        .storage()
        .instance()
        .get(&DataKey::LeafCount)
        .unwrap_or(0);

    set_node(env, 0, index, leaf.clone());

    let mut current = leaf;
    let mut idx = index;
    for level in 0..TREE_DEPTH {
        let (left, right) = if idx % 2 == 0 {
            (current.clone(), get_node(env, level, idx + 1))
        } else {
            (get_node(env, level, idx - 1), current.clone())
        };
        current = hash_pair(env, &left, &right);
        idx >>= 1;
        set_node(env, level + 1, idx, current.clone());
    }

    env.storage().instance().set(&DataKey::MerkleRoot, &current);
    env.storage().instance().set(&DataKey::LeafCount, &(index + 1));

    index
}

/// Return the Merkle inclusion proof for a given leaf index.
pub fn get_proof(env: &Env, leaf_index: u32) -> (Vec<BytesN<32>>, Vec<u32>) {
    let mut path: Vec<BytesN<32>> = Vec::new(env);
    let mut indices: Vec<u32> = Vec::new(env);
    let mut idx = leaf_index;

    for level in 0..TREE_DEPTH {
        let sibling = if idx % 2 == 0 {
            get_node(env, level, idx + 1)
        } else {
            get_node(env, level, idx - 1)
        };
        path.push_back(sibling);
        indices.push_back(idx % 2);
        idx >>= 1;
    }

    (path, indices)
}

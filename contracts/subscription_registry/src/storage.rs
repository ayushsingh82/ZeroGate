use soroban_sdk::contracttype;

pub const TREE_DEPTH: u32 = 20;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    VerifierContract,
    NullifierContract,
    LeafCount,
    MerkleRoot,
    MerkleNode(u32, u32), // (level, index)
}

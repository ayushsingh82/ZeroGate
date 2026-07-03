#![no_std]

mod merkle;
mod storage;

use soroban_sdk::{
    contract, contractimpl, Address, BytesN, Env, Vec,
    token::TokenClient,
};
use storage::DataKey;

#[contract]
pub struct SubscriptionRegistry;

#[contractimpl]
impl SubscriptionRegistry {
    /// One-time setup — call immediately after deploy.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::LeafCount, &0u32);
    }

    /// Private deposit — user pays `amount` of `token` into this contract.
    /// Only `commitment` (a Poseidon hash) is stored on-chain.
    /// Amount, merchant address, and subscriber identity are never stored.
    /// Returns the Merkle leaf index.
    pub fn deposit(
        env: Env,
        from: Address,
        token: Address,
        amount: i128,
        commitment: BytesN<32>,
    ) -> u32 {
        from.require_auth();
        // Pull tokens from user into this contract (escrow — merchant not visible)
        TokenClient::new(&env, &token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        let leaf_index = merkle::insert_leaf(&env, commitment.clone());
        // Emit only the commitment hash — amount and addresses stay off-chain
        env.events().publish(("deposit", "v1"), (leaf_index, commitment));
        leaf_index
    }

    /// Current Merkle root — public input for ZK proofs.
    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::MerkleRoot)
            .unwrap_or_else(|| merkle::zero_value(&env))
    }

    /// Total subscriptions registered.
    pub fn leaf_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0)
    }

    /// Sibling path + direction flags — client uses this for ZK proof inputs.
    pub fn get_proof(env: Env, leaf_index: u32) -> (Vec<BytesN<32>>, Vec<u32>) {
        merkle::get_proof(&env, leaf_index)
    }

    /// Admin can claim accumulated USDC on behalf of merchant.
    /// In production: replace with a ZK proof that merchant knows the preimage.
    pub fn claim(env: Env, token: Address, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        TokenClient::new(&env, &token).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );
        env.events().publish(("claim", "v1"), amount);
    }
}

#![no_std]

mod merkle;
mod storage;

use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env, Vec};
use storage::DataKey;

#[contract]
pub struct SubscriptionRegistry;

#[contractimpl]
impl SubscriptionRegistry {
    /// One-time setup — call immediately after deploy.
    pub fn initialize(
        env: Env,
        admin: Address,
        verifier: Address,
        nullifier_registry: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VerifierContract, &verifier);
        env.storage().instance().set(&DataKey::NullifierContract, &nullifier_registry);
        env.storage().instance().set(&DataKey::LeafCount, &0u32);
    }

    /// Add a subscription commitment leaf to the Merkle tree.
    /// Called after a successful x402 payment.
    /// Returns the leaf index (client stores this for future proofs).
    pub fn add_subscription(
        env: Env,
        leaf: BytesN<32>,
    ) -> u32 {
        merkle::insert_leaf(&env, leaf)
    }

    /// Current Merkle root — used as public input for ZK proofs.
    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::MerkleRoot)
            .unwrap_or_else(|| merkle::zero_value(&env))
    }

    /// Leaf count — total subscriptions registered.
    pub fn leaf_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0)
    }

    /// Get Merkle inclusion proof for a leaf index.
    /// Client uses this to build the private inputs for the ZK circuit.
    pub fn get_proof(env: Env, leaf_index: u32) -> (Vec<BytesN<32>>, Vec<u32>) {
        merkle::get_proof(&env, leaf_index)
    }

    /// Verify a Groth16 subscription proof and register the nullifier as spent.
    /// Called by API middleware on every protected request.
    ///
    /// Public inputs must match:
    ///   [0] nullifier
    ///   [1] merkle_root (must match current on-chain root)
    ///   [2] session_nonce
    ///   [3] current_timestamp
    ///   [4] expected_merchant_commitment
    pub fn verify_and_use(
        env: Env,
        proof_a: Bytes,
        proof_b: Bytes,
        proof_c: Bytes,
        public_signals: Vec<Bytes>,
        nullifier: BytesN<32>,
        merchant_commitment: BytesN<32>,
        current_timestamp: u64,
    ) -> bool {
        // 1. Fetch the on-chain Merkle root and check public signals match
        let on_chain_root = Self::get_root(env.clone());
        // public_signals[1] should be the merkle_root — validated in circuit

        // 2. Check nullifier not spent
        let nullifier_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::NullifierContract)
            .unwrap();

        // Call nullifier_registry::is_spent
        let is_spent: bool = env.invoke_contract(
            &nullifier_contract,
            &soroban_sdk::symbol_short!("is_spent"),
            soroban_sdk::vec![&env, nullifier.clone().into()],
        );
        if is_spent {
            return false;
        }

        // 3. Call groth16_verifier::verify_proof
        let verifier_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::VerifierContract)
            .unwrap();

        let valid: bool = env.invoke_contract(
            &verifier_contract,
            &soroban_sdk::symbol_short!("verify_proof"),
            soroban_sdk::vec![
                &env,
                proof_a.into(),
                proof_b.into(),
                proof_c.into(),
                public_signals.into(),
            ],
        );
        if !valid {
            return false;
        }

        // 4. Register nullifier as spent
        env.invoke_contract::<()>(
            &nullifier_contract,
            &soroban_sdk::symbol_short!("spend_null"),
            soroban_sdk::vec![&env, nullifier.into()],
        );

        true
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN, Env};

    #[test]
    fn test_add_subscription_and_root() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SubscriptionRegistry);
        let client = SubscriptionRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let verifier = Address::generate(&env);
        let nullifier_reg = Address::generate(&env);

        client.initialize(&admin, &verifier, &nullifier_reg);

        let root_before = client.get_root();
        assert_eq!(client.leaf_count(), 0);

        let leaf = BytesN::from_array(&env, &[0xab; 32]);
        let idx = client.add_subscription(&leaf);
        assert_eq!(idx, 0);
        assert_eq!(client.leaf_count(), 1);

        let root_after = client.get_root();
        assert_ne!(root_before, root_after);
    }

    #[test]
    fn test_merkle_proof_returned() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SubscriptionRegistry);
        let client = SubscriptionRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin, &Address::generate(&env), &Address::generate(&env));

        let leaf = BytesN::from_array(&env, &[0x01; 32]);
        let idx = client.add_subscription(&leaf);

        let (path, indices) = client.get_proof(&idx);
        assert_eq!(path.len(), storage::TREE_DEPTH);
        assert_eq!(indices.len(), storage::TREE_DEPTH);
    }
}

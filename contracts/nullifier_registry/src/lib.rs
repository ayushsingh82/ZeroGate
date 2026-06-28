#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Vec};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    SpentNullifier(BytesN<32>),
    RevokedSub(BytesN<32>),
    NullifierCount,
}

#[contract]
pub struct NullifierRegistry;

#[contractimpl]
impl NullifierRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NullifierCount, &0u32);
    }

    /// Mark a nullifier as spent. Panics if already spent (double-spend prevention).
    pub fn spend_nullifier(env: Env, nullifier: BytesN<32>) {
        let key = DataKey::SpentNullifier(nullifier.clone());
        if env.storage().persistent().has(&key) {
            panic!("nullifier already spent");
        }
        env.storage().persistent().set(&key, &true);

        let count: u32 = env.storage().instance().get(&DataKey::NullifierCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::NullifierCount, &(count + 1));
    }

    /// Returns true if the nullifier has been spent.
    pub fn is_spent(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::SpentNullifier(nullifier))
    }

    /// Revoke a subscription by ID (merchant or admin only).
    pub fn revoke_subscription(env: Env, caller: Address, subscription_id: BytesN<32>) {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            panic!("unauthorized");
        }
        env.storage()
            .persistent()
            .set(&DataKey::RevokedSub(subscription_id), &true);
    }

    /// Returns true if a subscription has been revoked.
    pub fn is_revoked(env: Env, subscription_id: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::RevokedSub(subscription_id))
    }

    pub fn nullifier_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::NullifierCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_spend_nullifier() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, NullifierRegistry);
        let client = NullifierRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let nullifier = BytesN::from_array(&env, &[1u8; 32]);

        assert!(!client.is_spent(&nullifier));
        client.spend_nullifier(&nullifier);
        assert!(client.is_spent(&nullifier));
        assert_eq!(client.nullifier_count(), 1);
    }

    #[test]
    #[should_panic(expected = "nullifier already spent")]
    fn test_double_spend_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, NullifierRegistry);
        let client = NullifierRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let nullifier = BytesN::from_array(&env, &[2u8; 32]);
        client.spend_nullifier(&nullifier);
        client.spend_nullifier(&nullifier); // should panic
    }

    #[test]
    fn test_revoke_subscription() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, NullifierRegistry);
        let client = NullifierRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let sub_id = BytesN::from_array(&env, &[3u8; 32]);
        assert!(!client.is_revoked(&sub_id));
        client.revoke_subscription(&admin, &sub_id);
        assert!(client.is_revoked(&sub_id));
    }
}

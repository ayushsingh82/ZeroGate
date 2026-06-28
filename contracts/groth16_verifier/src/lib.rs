#![no_std]
use soroban_sdk::{
    contract, contractimpl,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    BytesN, Env, Vec,
};

// BN254 base field modulus p (big-endian 32 bytes)
// p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
const P: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x97, 0x81, 0x6a, 0x91, 0x68, 0x71, 0xca, 0x8d,
    0x3c, 0x20, 0x8c, 0x16, 0xd8, 0x7c, 0xfd, 0x47,
];

const NUM_PUBLIC_INPUTS: u32 = 5;

/// Negate a G1 affine point: (x, y) -> (x, p - y)
fn g1_neg(env: &Env, point: &Bn254G1Affine) -> Bn254G1Affine {
    let bytes = point.to_bytes().to_array();
    let x = &bytes[0..32];
    let y_bytes: [u8; 32] = bytes[32..64].try_into().unwrap_or([0u8; 32]);

    // Compute p - y with big-endian borrow subtraction
    let mut neg_y = [0u8; 32];
    let mut borrow: u16 = 0;
    let mut i = 32usize;
    while i > 0 {
        i -= 1;
        let diff = (P[i] as u16).wrapping_sub(y_bytes[i] as u16).wrapping_sub(borrow);
        neg_y[i] = diff as u8;
        borrow = (diff >> 8) & 1;
    }

    let mut out = [0u8; 64];
    out[0..32].copy_from_slice(x);
    out[32..64].copy_from_slice(&neg_y);
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &out))
}

// --- Verification Key placeholders (fill from circuits/build/verification_key.json) ---
fn vk_alpha(env: &Env) -> Bn254G1Affine {
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &[0u8; 64]))
}
fn vk_beta(env: &Env) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &[0u8; 128]))
}
fn vk_gamma(env: &Env) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &[0u8; 128]))
}
fn vk_delta(env: &Env) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &[0u8; 128]))
}
fn vk_ic(env: &Env) -> Vec<Bn254G1Affine> {
    let mut ic: Vec<Bn254G1Affine> = Vec::new(env);
    for _ in 0..=NUM_PUBLIC_INPUTS {
        ic.push_back(Bn254G1Affine::from_bytes(BytesN::from_array(env, &[0u8; 64])));
    }
    ic
}

#[contract]
pub struct Groth16Verifier;

#[contractimpl]
impl Groth16Verifier {
    /// Verify a Groth16 proof for subscription_proof.circom.
    /// proof_a: 64-byte G1, proof_b: 128-byte G2, proof_c: 64-byte G1
    /// public_signals: 5 × 32-byte field elements
    pub fn verify_proof(
        env: Env,
        proof_a: BytesN<64>,
        proof_b: BytesN<128>,
        proof_c: BytesN<64>,
        public_signals: Vec<BytesN<32>>,
    ) -> bool {
        if public_signals.len() != NUM_PUBLIC_INPUTS {
            return false;
        }

        let bn254 = env.crypto().bn254();

        let a = Bn254G1Affine::from_bytes(proof_a);
        let b = Bn254G2Affine::from_bytes(proof_b);
        let c = Bn254G1Affine::from_bytes(proof_c);

        // vk_x = IC[0] + sum(signals[i] * IC[i+1])
        let ic = vk_ic(&env);
        let mut vk_x = ic.get(0).unwrap();
        for i in 0..NUM_PUBLIC_INPUTS {
            let scalar = Bn254Fr::from_bytes(public_signals.get(i).unwrap());
            let term = bn254.g1_mul(&ic.get(i + 1).unwrap(), &scalar);
            vk_x = bn254.g1_add(&vk_x, &term);
        }

        // Groth16: e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
        let neg_a    = g1_neg(&env, &a);
        let neg_vk_x = g1_neg(&env, &vk_x);
        let neg_c    = g1_neg(&env, &c);

        let mut g1v: Vec<Bn254G1Affine> = Vec::new(&env);
        g1v.push_back(neg_a);
        g1v.push_back(vk_alpha(&env));
        g1v.push_back(neg_vk_x);
        g1v.push_back(neg_c);

        let mut g2v: Vec<Bn254G2Affine> = Vec::new(&env);
        g2v.push_back(b);
        g2v.push_back(vk_beta(&env));
        g2v.push_back(vk_gamma(&env));
        g2v.push_back(vk_delta(&env));

        bn254.pairing_check(g1v, g2v)
    }
}

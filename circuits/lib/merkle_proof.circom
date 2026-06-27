pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

// Binary Merkle tree inclusion proof using Poseidon hashing.
// Matches the on-chain subscription_registry Merkle tree exactly.
template MerkleProof(depth) {
    signal input leaf;
    signal input path_elements[depth];  // sibling hashes at each level
    signal input path_indices[depth];   // 0 = leaf is left child, 1 = leaf is right child

    signal output root;

    component hashers[depth];
    signal hashes[depth + 1];
    // sel[i] = path_indices[i] * (hashes[i] - path_elements[i])
    // Each sel is a single multiplication — avoids non-quadratic error.
    signal sel[depth];

    hashes[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        // path_indices[i] must be boolean
        path_indices[i] * (path_indices[i] - 1) === 0;

        // sel[i] = index * (current - sibling)
        sel[i] <== path_indices[i] * (hashes[i] - path_elements[i]);

        hashers[i] = Poseidon(2);
        // index=0 → inputs = [current, sibling]
        // index=1 → inputs = [sibling, current]
        hashers[i].inputs[0] <== hashes[i]         - sel[i];
        hashers[i].inputs[1] <== path_elements[i]  + sel[i];

        hashes[i + 1] <== hashers[i].out;
    }

    root <== hashes[depth];
}

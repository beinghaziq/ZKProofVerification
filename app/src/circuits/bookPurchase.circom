pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom"; // Ensure the path to Poseidon is correct

// Template for hashing two inputs
template SimpleHash() {
    signal input a; // First input
    signal input b; // Second input
    signal output hash; // Output hash

    // Instantiate Poseidon for hashing
    component hasher = Poseidon(2);
    hasher.inputs[0] <== a; // First input
    hasher.inputs[1] <== b; // Second input
    hash <== hasher.out; // Output hash
}

template PurchaseProof() {
    // Public inputs
    signal input merkleRoot;  // The expected Merkle root
    signal input bookHash;     // Hash of the book
    signal input userId;       // User ID

    // Optional Merkle proof inputs - can be empty
    signal input pathElements[0];  // Empty array for path elements
    signal input pathIndices[0];   // Empty array for path indices

    signal output commitment;  // Commitment output

    // Use SimpleHash to create a commitment
    component hashProof = SimpleHash();
    hashProof.a <== bookHash; // Connect book hash
    hashProof.b <== userId;   // Connect user ID
    commitment <== hashProof.hash; // Output commitment from hashing

    // Ensure the commitment matches the expected Merkle root
    merkleRoot === commitment; // Check equality
}

// Main component with public inputs, excluding commitment
component main { public [merkleRoot, bookHash, userId] } = PurchaseProof();

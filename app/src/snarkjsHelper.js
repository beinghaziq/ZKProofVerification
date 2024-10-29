import * as snarkjs from 'snarkjs';
import fs from 'fs/promises';



export const createProof = async (input, wasmPath, zkeyPath) => {

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );
        return { proof, publicSignals };
    } catch (error) {
        throw new Error(`Proof generation failed: ${error.message}`);
    }
}

export const verifyProof = async(proof, publicSignals) => {
    try {
        // Load the verification key
        const vKey = JSON.parse(await fs.readFile('./verification_key.json', 'utf-8'));
        // Verify the proof
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        if (isValid) {
            console.log("Proof is valid!");
        } else {
            console.log("Proof is invalid");
        }
    } catch (error) {
        console.error("Error verifying proof:", error);
    }
}
npm install  snarkjs  did-jwt circom2

- create circuit file => bookPurchase.circom

compile circuits
`circom2 bookPurchaseProof.circom --r1cs --wasm --sym`

Snark js setup

```
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau prepare phase2 pot12_0000.ptau pot12_final.ptau -v
snarkjs groth16 setup bookPurchase.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json
```
This will create multiple files



# Generate a larger power of tau ceremony (using 2^14 instead of 2^12)
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v

# Prepare for phase 2
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v

# Now try the setup again with the larger ceremony
snarkjs groth16 setup bookPurchase.r1cs pot14_final.ptau circuit_0000.zkey
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


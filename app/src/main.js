import path from 'path';
import { fileURLToPath } from 'url';
import { Wallet } from 'ethers';


import { createJWT }  from 'did-jwt';
import { createProof, verifyProof } from './snarkjsHelper.js'
import * as circomlibjs from "circomlibjs";

/**
 * Here the userId means cognito id, rest userId is an internally generated id from PLN_Users.user_id
 */

    const main = async () => {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const wasmPath = path.resolve(__dirname, "../../bookPurchase_js/bookpurchase.wasm");
        // const circuitPath = path.resolve(__dirname, "../../proofs/bookPurchaseProof.circom");
        const zkeyPath = path.resolve(__dirname, "../../circuit_0000.zkey");
        // Generate a random Ethereum wallet
        const wallet = Wallet.createRandom();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address;

        // Create a DID based on the Ethereum address
        const did = `did:ethr:${publicKey}`; // Example: did:ethr:0x1234...abcd

        console.log("Generated DID:", did);
        console.log("Public Key:", publicKey);
        console.log("Private Key:", privateKey);

        const credentialPayload = {
            sub: did, // Subject: the recipient of the credential
            nbf: Math.floor(Date.now() / 1000), // Not before timestamp
            claim: { userId: "user-123", bookId: "book-123", purchased: 1 }, // Claims to include in the credential
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expiration time (1 hour)
        };
        try {
            // Sign the JWT using the private key with ethers.js
            const jwt = await createJWT(credentialPayload, {
                issuer: did,
                signer: async (data) => {
                    // Sign the data with the private key
                    return wallet.signMessage(data); // Use the wallet to sign
                }
            });
    
            console.log("Issued Verifiable Credential (JWT):", jwt);
             // Return the issued credential
        } catch (error) {
            console.error("Error issuing credential:", error);
        }

    const poseidon = await circomlibjs.buildPoseidon();
    const bookTitle = "Zero Knowledge Proof in Action";
    const userId = 42;
    const encoder = new TextEncoder();
    const bookTitleBytes = encoder.encode(bookTitle);
    const bookHash = poseidon.F.toString(poseidon([poseidon.F.e(bookTitleBytes)]));
    
    // Create the unique commitment
    const commitment = poseidon.F.toString(poseidon([bookHash, userId]));

    console.log(`Book Hash: ${bookHash}`);
    console.log(`Commitment: ${commitment}`);

    const purchases = [
        { bookHash: bookHash, userId: userId },
      ];

      // Generate commitments (leaves) for each purchase
    const leaves = purchases.map((purchase) => {
        return poseidon.F.toString(poseidon([purchase.bookHash, purchase.userId]));
      });

      
    const merkleRoot = buildMerkleTree(leaves);

    const { pathElements, pathIndices } = getMerklePath(0, leaves);
    
        // const input = { userId: 12, bookId: 1123, purchased: 1 };
        const input = {
                    merkleRoot,
                    pathElements,
                    pathIndices,
                    bookHash,
                    userId
                };
        console.log(input, "input here")
        const { proof, publicSignals } = await createProof(
            input,
            wasmPath,
            zkeyPath
        );
       

        await verifyProof(proof, publicSignals);

}

main()

const hashPair = async(left, right) => {
    const poseidon = await circomlibjs.buildPoseidon();
    return poseidon.F.toString(poseidon([poseidon.F.e(left), poseidon.F.e(right)]));
  }

// const stuffWithHash = async() => {
//     const poseidon = await circomlibjs.buildPoseidon();
//     const bookTitle = "Zero Knowledge Proof in Action";
//     const userId = 42;
//     const encoder = new TextEncoder();
//     const bookTitleBytes = encoder.encode(bookTitle);
//     // Convert the book title to a hash for the book
//     const bookHash = poseidon.F.toString(poseidon([poseidon.F.e(bookTitleBytes)]));
    
//     // Create the unique commitment
//     const commitment = poseidon.F.toString(poseidon([bookHash, userId]));

//     console.log(`Book Hash: ${bookHash}`);
//     console.log(`Commitment: ${commitment}`);

//     const purchases = [
//         { bookHash: bookHash, userId: 1 },
//       ];



//       // Generate commitments (leaves) for each purchase
//     const leaves = purchases.map((purchase) => {
//         return poseidon.F.toString(poseidon([purchase.bookHash, purchase.userId]));
//       });

//     console.log(leaves, "leaves")

      
//   const merkleRoot = buildMerkleTree(leaves);
//   console.log("Merkle Root:", merkleRoot);

//   const { pathElements, pathIndices } = getMerklePath(0, leaves);
//   console.log("Path Elements:", pathElements);
//   console.log("Path Indices:", pathIndices);
// }




// stuffWithHash()



// const purchases = [
//     { bookHash: poseidon.F.e("Book A"), userId: 1 },
//     { bookHash: poseidon.F.e("Book B"), userId: 2 },
//     { bookHash: poseidon.F.e("Book C"), userId: 3 },
//     { bookHash: poseidon.F.e("Book D"), userId: 4 },
//   ];



//   // Generate commitments (leaves) for each purchase
// const leaves = purchases.map((purchase) => {
//     return poseidon.F.toString(poseidon([purchase.bookHash, purchase.userId]));
//   });



//   // Function to compute the Poseidon hash of two leaves
// function hashPair(left, right) {
//     return poseidon.F.toString(poseidon([poseidon.F.e(left), poseidon.F.e(right)]));
//   }
  
  // Build the Merkle Tree
  const buildMerkleTree = (leaves) => {
    let level = leaves;
    while (level.length > 1) {
      // If the number of nodes is odd, duplicate the last node
      if (level.length % 2 !== 0) level.push(level[level.length - 1]);
  
      // Hash each pair of nodes to form the next level
      level = level.reduce((nextLevel, _, i, arr) => {
        if (i % 2 === 0) nextLevel.push(hashPair(arr[i], arr[i + 1]));
        return nextLevel;
      }, []);
    }
  
    return level[0]; // Root of the Merkle tree
  }
  

const getMerklePath = (leafIndex, leaves) => {
    let pathElements = [];
    let pathIndices = [];
    let level = leaves;
    
    while (level.length > 1) {
      if (level.length % 2 !== 0) level.push(level[level.length - 1]);
  
      const isRightNode = leafIndex % 2;
      const siblingIndex = isRightNode ? leafIndex - 1 : leafIndex + 1;
  
      // Collect sibling and index information
      pathElements.push(level[siblingIndex]);
      pathIndices.push(isRightNode);
  
      // Move up to the next level
      leafIndex = Math.floor(leafIndex / 2);
      level = level.reduce((nextLevel, _, i, arr) => {
        if (i % 2 === 0) nextLevel.push(hashPair(arr[i], arr[i + 1]));
        return nextLevel;
      }, []);
    }
  
    return { pathElements, pathIndices };
  }
  

  



// const snarkjs = require("snarkjs");
// const fs = require("fs");

// // User inputs
// const bookTitle = "Some Book";
// const userId = 1234;

// // Hash the book title and user ID (in practice, use a hash function like Poseidon)
// const bookHash = poseidonHash(bookTitle); // Use Poseidon hash here
// const commitment = poseidonHash([bookHash, userId]);

// // Merkle tree parameters (set up based on your existing purchase records)
// const merkleRoot = "0xabc123...";  // Example Merkle root from your purchase tree
// const pathElements = [/* Merkle path elements */];
// const pathIndices = [/* Merkle path indices */];

// (async () => {
//     // Create witness data
//     const input = {
//         merkleRoot,
//         pathElements,
//         pathIndices,
//         bookHash,
//         userId,
//         commitment
//     };

//     // Generate proof
//     const { proof, publicSignals } = await snarkjs.plonk.fullProve(
//         input,
//         "purchaseProof_js/purchaseProof.wasm",
//         "purchaseProof.zkey"
//     );

//     fs.writeFileSync("proof.json", JSON.stringify(proof));
//     fs.writeFileSync("public.json", JSON.stringify(publicSignals));
// })();

import path from 'path';
import { fileURLToPath } from 'url';
import { Wallet } from 'ethers';


import { createJWT } from 'did-jwt';
import { createProof, verifyProof } from './snarkjsHelper.js'

import * as circomlibjs from "circomlibjs";
import { buildMerkleTree, getMerklePath } from './inputHelper.js';

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

const hashPair = async (left, right) => {
	const poseidon = await circomlibjs.buildPoseidon();
	return poseidon.F.toString(poseidon([poseidon.F.e(left), poseidon.F.e(right)]));
}


// Build the Merkle Tree
export const buildMerkleTree = (leaves) => {
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


export const getMerklePath = (leafIndex, leaves) => {
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

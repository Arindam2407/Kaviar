import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Receiver__factory } from "../types";
import { bscNet, receiverBsc } from "../const";
// @ts-ignore
import { MerkleTree, Hasher } from "../src/merkleTree";
// @ts-ignore
import { groth16 } from "snarkjs";
import path from "path";

async function main(){
    const provider = new ethers.providers.StaticJsonRpcProvider(
        bscNet.url,
        bscNet.chainId
    );

    const userOldSignerWallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const userOldSigner = userOldSignerWallet.connect(provider);
    const relayerSignerWallet = new ethers.Wallet(process.env.relayerSigner ?? "");
    const relayerSigner = relayerSignerWallet.connect(provider);
    const userNewSignerWallet = new ethers.Wallet(process.env.userNewSigner ?? "");
    const userNewSigner = userNewSignerWallet.connect(provider);

    const poseidon = await buildPoseidon();

    const receiverContract = new Receiver__factory(userOldSigner).attach(ethers.utils.getAddress(receiverBsc));

    const recipient = await userNewSigner.getAddress();
    const relayer = await relayerSigner.getAddress();
    const fee = 0;

    const leafIndex = 0
    const leafIndexSubset = 0;

    const nullifier = new Uint8Array([
        100,  22, 125, 214,  16,
        112, 189, 102,  24, 213,
        108, 119,  57,  52, 139
    ])

    const nullifierHash = poseidonHash(poseidon, [nullifier, 1, leafIndex]);
    const commitment = "0x0963287f06dca891782be1bc0bf3c54af8d3022782f9188ac510270665e69cbd";

    // tree implementations
    const HEIGHT = 20;

    console.log("pass 1");
    const tree = new MerkleTree(
        HEIGHT,
        "test",
        new PoseidonHasher(poseidon)
    );

    const SubsetTree = new MerkleTree(
        HEIGHT,
        "test",
        new PoseidonHasher(poseidon)
    );
    
    await tree.insert(commitment);
    await SubsetTree.insert(commitment);

    const { root, path_elements, path_index } = await tree.path(leafIndex);
    const { root: subsetRoot, path_elements: path_elements_subset, path_index: path_index_subset } = await SubsetTree.path(leafIndexSubset);
    
    const witness = {
        // Public
        root,
        subsetRoot,
        nullifierHash,
        recipient,
        relayer,
        fee,
        // Private (user keep)
        nullifier: BigNumber.from(nullifier).toBigInt(),
        mainProofIndices: path_index,
        subsetProofIndices: path_index_subset,
        mainProof: path_elements,
        subsetProof: path_elements_subset
    };

    console.log(witness)

    const solProof = await prove(witness);
    console.log(solProof)

    const txWithdraw = await receiverContract
        .connect(relayerSigner)
        .withdraw(solProof, root, subsetRoot, nullifierHash, recipient, relayer, fee, { gasLimit: 1000000 }) ;
    const receiptWithdraw = await txWithdraw.wait();
    console.log("Withdraw gas cost", receiptWithdraw.gasUsed.toNumber()); 
}

class PoseidonHasher implements Hasher {
    poseidon: any;

    constructor(poseidon: any) {
        this.poseidon = poseidon;
    }

    hash(left: string, right: string) {
        return poseidonHash(this.poseidon, [left, right]);
    }
}

function poseidonHash(poseidon: any, inputs: any): string {
    const hash = poseidon(inputs.map((x: any) => ethers.BigNumber.from(x).toBigInt()));
    // Make the number within the field size
    const hashStr = poseidon.F.toString(hash);
    // Make it a valid hex string
    const hashHex = ethers.BigNumber.from(hashStr).toHexString();
    // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
    const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
    return bytes32;
}

interface Proof {
    a: [BigNumberish, BigNumberish];
    b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
    c: [BigNumberish, BigNumberish];
}

async function prove(witness: any): Promise<Proof> {
    const wasmPath = path.join(__dirname, "../build/withdraw_from_subset_js/withdraw_from_subset.wasm");
    const zkeyPath = path.join(__dirname, "../build/circuit_final.zkey");

    const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);
    const solProof: Proof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
    };
    return solProof;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
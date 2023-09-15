import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Receiver__factory, Blacklist__factory } from "../types";
import { bscNet, poseidonAddr, receiverBsc } from "../const";
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

    const blacklist = await new Blacklist__factory(userOldSigner).deploy();

    await (blacklist).deployed();
    console.log(blacklist.address);

    const poseidon = await buildPoseidon();

    const receiverContract = new Receiver__factory(userOldSigner).attach(ethers.utils.getAddress(receiverBsc));

    const HEIGHT = 20;

    console.log("pass 1");
    const tree = new MerkleTree(
        HEIGHT,
        "12723520216389513965340016709307614158265090849155178630105615478958633396456",
        new PoseidonHasher(poseidon)
    );

    const SubsetTree = new MerkleTree(
        HEIGHT,
        "12723520216389513965340016709307614158265090849155178630105615478958633396456",
        new PoseidonHasher(poseidon)
    );
    
    const nullifier = new Uint8Array([
        108,  8,   4, 142, 113, 
        33,   22, 53, 176, 112, 
        151,  78,  72, 16,  49
    ])

    const leafIndex = 0
    const nullifierHash = poseidonHash(poseidon, [nullifier, 1, leafIndex]);
    const commitment = poseidonHash(poseidon, [nullifier, 0]);
    
    console.log(tree);
    console.log(SubsetTree);
    
    await tree.insert(commitment);
    await SubsetTree.insert(commitment);

    const recipient = await userNewSigner.getAddress();
    const relayer = await relayerSigner.getAddress();
    const fee = 0;

    const { root, path_elements, path_index } = await tree.path(
         leafIndex
    );

    const { root: subsetRoot, 
            path_elements: path_elements_subset, 
            path_index: path_index_subset } = await 
            SubsetTree.path(
            leafIndex
    );

    const nullifierBigInt = BigNumber.from(nullifier).toBigInt();
    
    const witness = {
        // Public
        root,
        subsetRoot,
        nullifierHash,
        recipient,
        relayer,
        fee,
        // Private (user keep)
        nullifierBigInt,
        path_index,
        path_index_subset,
        path_elements,
        path_elements_subset
    };

    console.log(witness)

    const solProof = await prove(witness);
    console.log(solProof)

    const txWithdraw = await receiverContract
        .connect(relayerSigner)
        .withdraw(solProof, root, subsetRoot, nullifierHash, recipient, relayer, fee);
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
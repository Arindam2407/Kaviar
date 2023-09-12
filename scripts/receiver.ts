import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import {Receiver__factory, Blacklist__factory} from "../types";
import { bscNet, receiverBsc } from "../const";
// @ts-ignore
import { MerkleTree, Hasher } from "../src/merkleTree";
// @ts-ignore
import { groth16 } from "snarkjs";
import path from "path";

async function main(){
    const userOldSignerWallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = new ethers.providers.StaticJsonRpcProvider(
        bscNet.url,
        bscNet.chainId
      );
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
    const ETH_AMOUNT = ethers.utils.parseEther("0.001");
    const HEIGHT = 20;
    console.log("pass 1");
    const tree = new MerkleTree(
        HEIGHT,
        "test",
        new PoseidonHasher(poseidon)
    );

    const SubsetTree = new MerkleTree(
        HEIGHT,
        "allowed",
        new PoseidonHasher(poseidon)
    );
    
    const nullifier = new Uint8Array([
        14, 254,   9, 120,   1,
       163, 132, 192, 220, 124,
        31, 155,  28,  87, 253
     ])

    const leafIndex = 0
    const nullifierHash = poseidonHash(poseidon, [nullifier, 1, leafIndex])
    const commitment = "0x131d05841a55fe138852b423e66d766620a71c1b259254bea564839fb99e3f27"
    let allowValue = "0x1a6dde72d78cdcb5cbb6678be64735040d7e8bffe5b7e08f7e2813239f71b125";

    const isBlacklisted= await blacklist
    .connect(userOldSigner)
    .isBlacklisted(relayerSigner.address);
    
    if(isBlacklisted) {
        allowValue = "0x2e1d428a1a102b152ad9104dd679817ecbf0206a8427c40dc7210e59c3ee3ffc";
        console.log("Proof will fail going forward as the deposit did not come from an honest actor")
        process.exitCode = 1;
    }
    
    console.log(tree);
    console.log(SubsetTree);
    
    await tree.insert(ethers.BigNumber.from(commitment));
    await SubsetTree.insert(ethers.BigNumber.from(allowValue));

    const recipient = await userNewSigner.getAddress();
    const relayer = await relayerSigner.getAddress();
    const fee = 0;

    const encodedData = ethers.utils.solidityPack(
        ['address', 'address', 'uint256'],
        [recipient, relayer, fee]
    );

    const snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    const withdrawMetadata = ethers.BigNumber.from(ethers.utils.keccak256(encodedData)).toNumber() % (snark_scalar_field);

    const { root, path_elements, path_index } = await tree.path(
         leafIndex
    );

    const { root: subsetRoot, path_elements: path_elements_subset, path_index: path_index_subset } = await SubsetTree.path(
        leafIndex
    );

    const nullifierBigNumber = BigNumber.from(nullifier).toBigInt();

    // change this
    const witness = {
        // Public
        root,
        subsetRoot,
        nullifierHash,
        withdrawMetadata,
        // Private (user keep)
        nullifierBigNumber,
        path_index,
        path_elements,
        path_elements_subset
    };

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

    hash(left: BigNumber, right: BigNumber) {
        return poseidonHash(this.poseidon, [left, right]);
    }
}

function poseidonHash(poseidon: any, inputs: any): BigNumber {
    const hash = poseidon(inputs.map((x: any) => ethers.BigNumber.from(x).toBigInt()));
    // Make the number within the field size
    const hashStr = poseidon.F.toString(hash);

    const num = ethers.BigNumber.from(hashStr);
    // Make it a valid hex string
    
    return num;
}

async function prove(witness: any): Promise<BigNumberish[]> {
    const wasmPath = path.join(__dirname, "../withdraw_from_subset_js/withdraw_from_subset.wasm");
    const zkeyPath = path.join(__dirname, "../circuits/out/withdraw_from_subset_final.zkey");

    const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);

    const solProof = [proof.pi_a[0], proof.pi_a[1],proof.pi_b[0][1], proof.pi_b[0][0], 
    proof.pi_b[1][1], proof.pi_b[1][0], proof.pi_c[0], proof.pi_c[1]] 

    return solProof;
}

class Deposit {
    public constructor(
        public readonly nullifier: Uint8Array,
        public poseidon: any,
        public leafIndex?: number
    ) {
        this.poseidon = poseidon;
    }
    static new(poseidon: any) {
        // random nullifier (private note)
        // here we only have private nullifier 
        const nullifier = ethers.utils.randomBytes(15);
        return new this(nullifier, poseidon);
    }
    // get hash of secret (nullifier)
    get commitment() {
        return poseidonHash(this.poseidon, [this.nullifier, 0]);
    }
    // get hash f nullifierhash (nulifier+1+index)
    get nullifierHash() {
        if (!this.leafIndex && this.leafIndex !== 0)
            throw Error("leafIndex is unset yet");
        return poseidonHash(this.poseidon, [this.nullifier, 1, this.leafIndex]);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
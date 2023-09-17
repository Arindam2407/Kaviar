import * as dotenv from "dotenv";
// import { ethers } from "ethers";
import {ethers} from "hardhat";
//@ts-ignore
import {poseidonContract, buildPoseidon } from "circomlibjs";
import {Sender__factory, MerkleTreeSubset__factory} from "../types";
import {senderAddr, MTSBsc, bscNet, goerliNet, receiverBsc} from "../const";

dotenv.config();
async function main() {

    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "")
    const provider = new ethers.providers.StaticJsonRpcProvider(
        goerliNet.url,
        goerliNet.chainId
    );
    const signer = wallet.connect(provider);

    const poseidon = await buildPoseidon();
    const deposit = Deposit.new(poseidon);
    
    const senderContract = await new Sender__factory(signer).attach(ethers.utils.getAddress(senderAddr));
    const TOTAL_VALUE = ethers.utils.parseEther("0.01");
    const tx = await senderContract
    .connect(signer)
    .deposit(deposit.commitment, MTSBsc, bscNet.name, receiverBsc, { value: TOTAL_VALUE, gasLimit:10000000 });
    const receipt = await tx.wait();
    const events = await senderContract.queryFilter(
        senderContract.filters.Deposit(),
        receipt.blockHash
    );

    console.log("nullifier: ", deposit.nullifier)
    console.log("commitment: ",deposit.commitment)
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

class Deposit {
    private constructor(
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

function getPoseidonFactory(nInputs: number) {
    const bytecode = poseidonContract.createCode(nInputs);
    const abiJson = poseidonContract.generateABI(nInputs);
    const abi = new ethers.utils.Interface(abiJson);
    return new ethers.ContractFactory(abi, bytecode);
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
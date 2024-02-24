import { BigNumber, ethers } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Kaviar__factory } from "../types";
// @ts-ignores
import { prove, poseidonHash } from "../utils/proofUtils";
import {
  parse_chain_provider,
  parse_chain_params,
  chains,
} from "../utils/parseChainUtils";

export default async function runWithdraw(deposit_string: string) {
    const depositElements = JSON.parse(atob(deposit_string));
    const chain = depositElements.chain;
    const nullifier = new Uint8Array(Object.values(depositElements.nullifier));
    const commitment = depositElements.commitment;
    const blockNumber = depositElements.blockNumber;
  
    const provider = parse_chain_provider(chain);
  
    const relayerSignerWallet = new ethers.Wallet(
      process.env.relayerSigner ?? ""
    );
    const relayerSigner = relayerSignerWallet.connect(provider);
  
    const kaviarContract = new Kaviar__factory(relayerSigner).attach(
      parse_chain_params(chain).kaviar
    );
  
    const poseidon = await buildPoseidon();
  
    const events = await kaviarContract.queryFilter(
      kaviarContract.filters.Deposit(commitment),
      blockNumber
    );
  
    let DepositEvent = events[0].args;
  
    const eventsSubset = await kaviarContract.queryFilter(
      kaviarContract.filters.SubsetDeposit(commitment),
      blockNumber
    );
  
    let SubsetDepositEvent = eventsSubset[0].args;
  
    let insertedIndex = DepositEvent[1];
    let root = DepositEvent[2];
    let path_elements = DepositEvent[3];
    let path_indices = num_to_rev_bin(insertedIndex);
  
    let insertedIndexSubset = SubsetDepositEvent[2];
    let subsetRoot = SubsetDepositEvent[3];
    let path_elements_subset = SubsetDepositEvent[4];
    let path_indices_subset = num_to_rev_bin(insertedIndexSubset);
  
    const nullifierHash = poseidonHash(poseidon, [nullifier, 1, insertedIndex]);
    const recipient = await relayerSigner.getAddress();
    const relayer = await relayerSigner.getAddress();
    const fee = 0;
  
    // proof generation and verification
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
      mainProofIndices: path_indices,
      subsetProofIndices: path_indices_subset,
      mainProof: path_elements,
      subsetProof: path_elements_subset,
    };
  
    console.log("\nGenerating proof...\n");
    const solProof = await prove(witness);
  
    console.log("Sending proof, waiting for verification...\n");
    const txWithdraw = await kaviarContract
      .connect(relayerSigner)
      .withdraw(
        solProof,
        root,
        subsetRoot,
        nullifierHash,
        recipient,
        relayer,
        fee,
        { gasLimit: 9000000 }
      );
  
    const receiptWithdraw = await txWithdraw.wait(1);
    console.log(`Deposit successfully withdrawn!\n`);
    console.log(
      `View this transaction on ${parse_chain_params(chain).explorer}${
        receiptWithdraw.transactionHash
      }`
    );
  }

  function num_to_rev_bin(n: any) {
    const binaryString = n.toString(2);
    const reversedBinary = binaryString.split("").reverse().join("");
    const stringArray = Array.from({ length: 20 }, () => "0");
    const reversedBinaryArray = reversedBinary.split("");
    for (let i = 0; i < reversedBinaryArray.length; i++) {
      stringArray[i] = reversedBinaryArray[i];
    }
    return stringArray;
  }

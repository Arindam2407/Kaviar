import { ethers } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Kaviar__factory } from "../types";
import {
    parse_chain_params,
    parse_chain_provider,
  } from "../utils/parseChainUtils";
  import { Deposit } from "../utils/proofUtils";

export default async function runDeposit(chain: string, mts_address: string): Promise<string> {
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
  
    const provider = parse_chain_provider(chain);
    const signer = wallet.connect(provider);
  
    const poseidon = await buildPoseidon();
    const deposit = Deposit.new(poseidon);
  
    const kaviarContract = new Kaviar__factory(signer).attach(
      parse_chain_params(chain).kaviar
    );
    const TOTAL_VALUE = ethers.utils.parseEther("0.01");
  
    const tx = await kaviarContract
      .connect(signer)
      .deposit(deposit.commitment, mts_address, {
        value: TOTAL_VALUE,
        gasLimit: 10000000,
      });
  
    const receipt = await tx.wait();
  
    const depositElements = {
      chain: chain,
      nullifier: deposit.nullifier,
      commitment: deposit.commitment,
      timestamp: receipt.blockNumber,
    };
  
    console.log(`\nDeposit of 0.01 ETH sent successfully! \n`);
    console.log(
      `View this transaction on ${parse_chain_params(chain).explorer}${
        receipt.transactionHash
      }\n`
    );
    console.log(
      `Please copy this deposit string to recover funds later: \n${btoa(
        JSON.stringify(depositElements)
      )}`
    );

    return JSON.stringify(depositElements);
}
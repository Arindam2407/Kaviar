import { ethers } from "ethers";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Kaviar__factory } from "../types";
import {
  parse_chain_params,
  parse_chain_provider,
  chains,
} from "../utils/parseChainUtils";
import { Deposit } from "../utils/proofUtils";

async function main() {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question("Enter Chain : \n", (chain_name: string) => {
    let chain = chain_name;
    readline.question("Enter Subset Tree Address: \n", (address: string) => {
      let mts_address = address;
      try {
        if (mts_address == "") {
          throw new Error("Subset Tree Address must be set");
        }
      } catch (e) {
        console.log(e);
        readline.close();
        return;
      }
      try {
        if (chain == "") {
          throw new Error("Chain must be set");
        } else {
          if (!chains.includes(chain)) {
            throw new Error(
              "Chain could not be parsed because of invalid name"
            );
          }
        }
      } catch (e) {
        console.log(e);
        readline.close();
        return;
      }
      run(chain, mts_address);
      readline.close();
    });
  });
}

async function run(chain: string, mts_address: string) {
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
      gasLimit: 20000000,
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

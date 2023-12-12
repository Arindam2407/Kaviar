import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { MerkleTreeSubset__factory } from "../../types";
import {
  parse_chain_params,
  parse_chain_provider,
  chains,
} from "../../utils/parseChainUtils";

dotenv.config();
async function main() {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question(`Enter Chain: `, (chain_name: string) => {
    let chain = chain_name;
    readline.question(
      `The Subset Tree is a Blacklist (true/false) : `,
      (tree_status: string) => {
        let status = true; //default
        status = Boolean(tree_status);
        try {
          if (chain == "") {
            throw new Error("Chain must be set");
          }
          if (!chains.includes(chain)) {
            throw new Error(
              "Chain could not be parsed because of invalid name"
            );
          }
        } catch (e) {
          console.log(e);
          readline.close();
          return;
        }
        run(chain, status);
        readline.close();
      }
    );
  });
}

async function run(chain: string, status: boolean) {
  const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");

  const provider = parse_chain_provider(chain);
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance on ${chain}: ${balance}\n`);

  const merkleTreeSubset = await new MerkleTreeSubset__factory(signer).deploy(
    parse_chain_params(chain).poseidon,
    status,
    { gasLimit: 10000000 }
  );
  await merkleTreeSubset.deployed();
  console.log(
    `Merkle Tree Subset has been deployed to ${merkleTreeSubset.address} on ${chain}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "ethers";
import { Verifier__factory, Kaviar__factory } from "../types";
import {
  parse_chain_params,
  parse_chain_provider,
  chains,
} from "../utils/parseChainUtils";

async function main() {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question("Enter Chain : ", (chain_name: string) => {
    let chain = chain_name;

    try {
      if (chain == "") {
        throw new Error("Chain must be set");
      } else {
        if (!chains.includes(chain)) {
          throw new Error("Chain could not be parsed because of invalid name");
        }
      }
    } catch (e) {
      console.log(e);
      readline.close();
      return;
    }

    run(chain);
    readline.close();
  });
}

async function run(chain: string) {
  const chain_params = parse_chain_params(chain);

  // deploy KAVIAR on chain
  const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
  const provider = parse_chain_provider(chain);
  const signer = wallet.connect(provider);

  console.log(`\nDeploying contract Verifier.sol on ${chain}\n`);

  const verifier = await new Verifier__factory(signer).deploy();
  await verifier.deployed();
  console.log(
    `Verifier.sol has been deployed to ${verifier.address} on ${chain}\n`
  );

  const ETH_AMOUNT = ethers.utils.parseEther("0.0001");

  // deploy KAVIAR on chain
  console.log(`Deploying contract Kaviar.sol on ${chain}\n`);

  const kaviar = await new Kaviar__factory(signer).deploy(
    verifier.address,
    ETH_AMOUNT,
    chain_params.poseidon
  );
  await kaviar.deployed();
  console.log(`Kaviar.sol has been deployed to ${kaviar.address} on ${chain}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

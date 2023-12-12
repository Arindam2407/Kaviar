import { ethers } from "ethers";
import { MerkleTreeSubset__factory } from "../../types";
import { parse_chain_provider, chains } from "../../utils/parseChainUtils";

async function main() {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question("Enter Chain : \n", (chain_name: string) => {
    let chain = chain_name;
    try {
      if (chain == "") {
        throw new Error("Chain must be set");
      }
      if (!chains.includes(chain)) {
        throw new Error("Chain could not be parsed because of invalid name");
      }
    } catch (e) {
      console.log(e);
      readline.close();
      return;
    }
    readline.question(
      "Enter Subset Tree Address : \n",
      (MTS_address: string) => {
        let mts_address = MTS_address;
        try {
          if (mts_address == "") {
            throw new Error("Subset Tree Address must be set");
          }
        } catch (e) {
          console.log(e);
          readline.close();
          return;
        }
        readline.question(
          "Enter Address to Unblacklist: \n",
          (address_unblacklist: string) => {
            let address_to_unblacklist = address_unblacklist;
            try {
              if (address_to_unblacklist == "") {
                throw new Error("Address to Unblacklist must be set");
              }
            } catch (e) {
              console.log(e);
              readline.close();
              return;
            }
            run(chain, mts_address, address_to_unblacklist);
            readline.close();
          }
        );
      }
    );
  });
}

async function run(
  chain: string,
  mts_address: string,
  address_to_unblacklist: string
) {
  const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
  const provider = parse_chain_provider(chain);
  const signer = wallet.connect(provider);

  const merkleTreeSubsetContract = await new MerkleTreeSubset__factory(
    signer
  ).attach(ethers.utils.getAddress(mts_address));

  const tx = await merkleTreeSubsetContract
    .connect(signer)
    .unBlacklistAddress(address_to_unblacklist);

  const _ = await tx.wait();
  console.log(
    `Address ${address_to_unblacklist} unblacklisted successfully on ${mts_address}!`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
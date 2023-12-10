import { ethers } from "ethers";
import { MerkleTreeSubset__factory } from "../../types";
import { parse_chain_provider, chains } from "../../utils/parseChainUtils";

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
      }
      if (!chains.includes(chain)) {
        throw new Error("Chain could not be parsed because of invalid name");
      }
    } catch (e) {
      console.log(e);
      readline.close();
      return;
    }
    readline.question("Enter Subset Tree Address : ", (MTS_address: string) => {
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
        "Enter Address to Blacklist: ",
        (address_blacklist: string) => {
          let address_to_blacklist = address_blacklist;
          try {
            if (address_to_blacklist == "") {
              throw new Error("Address to Blacklist must be set");
            }
          } catch (e) {
            console.log(e);
            readline.close();
            return;
          }
          run(chain, mts_address, address_to_blacklist);
          readline.close();
        }
      );
    });
  });
}

async function run(
  chain: string,
  mts_address: string,
  address_to_blacklist: string
) {
  const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
  const provider = parse_chain_provider(chain);
  const signer = wallet.connect(provider);

  const merkleTreeSubsetContract = await new MerkleTreeSubset__factory(
    signer
  ).attach(ethers.utils.getAddress(mts_address));

  const tx = await merkleTreeSubsetContract
    .connect(signer)
    .blacklistAddress(address_to_blacklist);

  const _ = await tx.wait();
  console.log(
    `Address ${address_to_blacklist} blacklisted successfully! on ${mts_address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

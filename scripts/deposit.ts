import { chains } from "../utils/parseChainUtils";
import runDeposit from "./runDeposit";

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
      runDeposit(chain, mts_address);
      readline.close();
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

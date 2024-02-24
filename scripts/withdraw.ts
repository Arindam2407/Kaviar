import runWithdraw from "./runWithdraw";

async function main() {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question("Enter Deposit String: \n", (depositString: any) => {
    let deposit_string = depositString;
    try {
      if (deposit_string == "") {
        throw new Error("Deposit String must be set");
      }
    } catch (e) {
      console.log(e);
      readline.close();
      return;
    }
    runWithdraw(deposit_string);
    readline.close();
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { Sender__factory } from  "../types";
import { mantleNet, poseidonAddr } from "../const";

dotenv.config();
async function main() {
   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "")
    const provider = new ethers.providers.StaticJsonRpcProvider(
      mantleNet.url,
      mantleNet.chainId
    );
  //  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-premantle-1-s1.binance.org:8545", {name: "mantle", chainId: 97})
    const signer = wallet.connect(provider);
    // const balanceBN = await signer.getBalance();
    // const balance = Number(ethers.utils.formatEther(balanceBN));
    // console.log(`Wallet balance ${balance}`);

    const ETH_AMOUNT = ethers.utils.parseEther("0.001");
    const AXELAR_GAS = ethers.utils.parseEther("0.005");
    const TOTAL_VALUE = ethers.utils.parseEther("0.006");
    
    
    const verifier = await new Sender__factory(signer).deploy(
        mantleNet.gateway,
        mantleNet.gasservice,
        ETH_AMOUNT,
        poseidonAddr
    );
    await (verifier).deployed();
    console.log(`Sender contract deployed to ${verifier.address}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
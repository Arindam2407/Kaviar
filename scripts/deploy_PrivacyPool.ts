import * as dotenv from "dotenv";
import { ethers } from "ethers";
import{ PrivacyPool__factory} from  "../types";
import {poseidonAddr} from "../const";

dotenv.config();
async function main() {
   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = ethers.providers.getDefaultProvider("goerli");
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);

    const ETH_AMOUNT = ethers.utils.parseEther("0.01");
    const HEIGHT = 20;

    const privacyPool = await new PrivacyPool__factory(signer).deploy(
        poseidonAddr,
        ETH_AMOUNT
    );
    await (privacyPool).deployed();
    console.log(privacyPool.address);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })


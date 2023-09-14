import * as dotenv from "dotenv";
import { ethers } from "ethers";
import{ Receiver__factory } from  "../types";
import { poseidonMantle } from "../const";

dotenv.config();
async function main() {
   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = ethers.providers.getDefaultProvider("goerli");
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);

    const gateway = "0x4D147dCb984e6affEEC47e44293DA442580A3Ec0";
    const gasservice = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    const ETH_AMOUNT = ethers.utils.parseEther("0.01");
    const HEIGHT = 20;

    const receiver = await new Receiver__factory(signer).deploy(
        gateway,
        gasservice,
        ETH_AMOUNT,
        poseidonMantle
    );
  
    await (receiver).deployed();
    console.log(`Receiver contract deployed to ${receiver.address}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import{ Receiver__factory } from  "../types";
import { poseidonLinea, verifierLinea, lineaNet } from "../const";

dotenv.config();
async function main() {
   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = new ethers.providers.StaticJsonRpcProvider(
        lineaNet.url,
        lineaNet.chainId
    );
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);

    const ETH_AMOUNT = ethers.utils.parseEther("0.01");

    const receiver = await new Receiver__factory(signer).deploy(
        lineaNet.gateway,
        lineaNet.gasservice,
        verifierLinea,
        ETH_AMOUNT,
        poseidonLinea
    );
  
    await (receiver).deployed();
    console.log(`Receiver contract deployed to ${receiver.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
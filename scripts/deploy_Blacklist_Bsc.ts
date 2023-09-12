import * as dotenv from "dotenv";
import { ethers } from "ethers";
import{ Blacklist__factory } from  "../types";

dotenv.config();
async function main() {
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = ethers.providers.getDefaultProvider("bsc");
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);

    const blacklist = await new Blacklist__factory(signer).deploy();

    await (blacklist).deployed();
    console.log(blacklist.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
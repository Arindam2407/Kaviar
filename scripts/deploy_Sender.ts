import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { Sender__factory } from  "../types";
import { goerliNet, poseidonAddr } from "../const";

dotenv.config();
async function main() {
   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "")
    const provider = new ethers.providers.StaticJsonRpcProvider(
      goerliNet.url,
      goerliNet.chainId
    );

    const signer = wallet.connect(provider);

    const ETH_AMOUNT = ethers.utils.parseEther("0.001");
    const AXELAR_GAS = ethers.utils.parseEther("0.03");
    
    const verifier = await new Sender__factory(signer).deploy(
        goerliNet.gateway,
        goerliNet.gasservice,
        AXELAR_GAS,
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
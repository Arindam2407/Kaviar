import * as dotenv from "dotenv";
import { ethers } from "ethers";
import{ MerkleTreeSubset__factory } from  "../types";
import { bscNet, poseidonBsc } from "../const";

dotenv.config();
async function main() {   
    const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");
    const provider = new ethers.providers.StaticJsonRpcProvider(
      bscNet.url,
      bscNet.chainId
    );
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);
    
    const MTS = await new MerkleTreeSubset__factory(signer).deploy(poseidonBsc, true, { gasLimit:10000000 });
    await (MTS).deployed();
    console.log(`Merkle Tree Subset address: ${MTS.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    
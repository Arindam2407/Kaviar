// // script to deploy poseidon hash on newly supported network
// // poseidon hash needs to be deployed and added as a field to network parameter specs

// import * as dotenv from "dotenv";
// import { ethers } from "ethers";
// @ts-ignore
// import { poseidonContract, buildPoseidon } from "circomlibjs";
// import { newchainNet } from "./utils/parseChainUtils";

// dotenv.config();
// async function main() {
//   const wallet = new ethers.Wallet(process.env.userOldSigner ?? "");

//   const provider = new ethers.providers.StaticJsonRpcProvider();
//   process.env.NEW_NETWORK_TESTNET_URL,
//   newchainNet.chainId

//   const signer = wallet.connect(provider);
//   const balanceBN = await signer.getBalance();
//   const balance = Number(ethers.utils.formatEther(balanceBN));
//   console.log(`Wallet balance ${balance} \n`);

//   let poseidon = await buildPoseidon();
//   let poseidonContract: ethers.Contract;
//   poseidonContract = await getPoseidonFactory(2).connect(signer).deploy();
//   await poseidonContract.deployed();
//   console.log(poseidonContract.address);
// }

// function getPoseidonFactory(nInputs: number) {
//   const bytecode = poseidonContract.createCode(nInputs);
//   const abiJson = poseidonContract.generateABI(nInputs);
//   const abi = new ethers.utils.Interface(abiJson);
//   return new ethers.ContractFactory(abi, bytecode);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

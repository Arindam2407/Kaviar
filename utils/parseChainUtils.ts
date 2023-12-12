import { ethers } from "ethers";

export const chains = ["GOERLI", "BSC", "MANTLE"];

export function parse_chain_provider(chain: string) {
  if (chain == "GOERLI") {
    const provider = new ethers.providers.StaticJsonRpcProvider(
      process.env.GOERLI_URL,
      goerliNet.chainId
    );
    return provider;
  } else if (chain == "BSC") {
    const provider = new ethers.providers.StaticJsonRpcProvider(
      process.env.BSC_TESTNET_URL,
      bscNet.chainId
    );
    return provider;
  } else {
    const provider = new ethers.providers.StaticJsonRpcProvider(
      process.env.MANTLE_TESTNET_URL,
      mantleNet.chainId
    );
    return provider;
  }
}

export function parse_chain_params(chain: string) {
  if (chain == "GOERLI") {
    return goerliNet;
  } else if (chain == "BSC") {
    return bscNet;
  } else {
    return mantleNet;
  }
}

const goerliNet = {
  chainId: 5,
  explorer: "https://goerli.etherscan.io/tx/",
  poseidon: "0xE8eddE68F249fA99AD369EbD0053961518607F6a",
  verifier: "0xfb3b532c1350269ad23c1f530daa868ce6b156c8",
  kaviar: "0x21ed3af2d38d66b6b955d7108dcddf54317e5c6a",
};
const bscNet = {
  chainId: 97,
  explorer: "https://testnet.bscscan.com/tx/",
  poseidon: "0x056a41D3673F3d0C6d3440DB9408F4f78Dd4aFb3",
  verifier: "0x02515b7ecd58eb3d1d51c7b2ed7490703b5c027f",
  kaviar: "0x8670db125e625ae52af9fe3a15376f797ab7c8e5",
};
const mantleNet = {
  chainId: 5001,
  explorer: "https://testnet.mantlescan.org/tx/",
  poseidon: "0x52EE8690474938F6fEeB75EAb252f805873c11E1",
  verifier: "0xf3e5ca550540b6149d02fff953920e10f1bb13f2",
  kaviar: "0xda626e57906c945cdc4a58f0a805bc9fe51800bb",
};

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
  verifier: "0x3632F5C76b0Dfe3E2771A8bFcEfBD75Bc2DBeB23",
  kaviar: "0xc3B8d3E63Bc2D76Fb13Fd6E547A15a58Cc30D115",
};
const bscNet = {
  chainId: 97,
  explorer: "https://testnet.bscscan.com/tx/",
  poseidon: "0x056a41D3673F3d0C6d3440DB9408F4f78Dd4aFb3",
  verifier: "0x11b876122B7a64A746F8453C5E025b38521F85C6",
  kaviar: "0x40C8d21aAeB68a27750A0e707a8833fcbE4fEE76",
};
const mantleNet = {
  chainId: 5001,
  explorer: "https://testnet.mantlescan.org/tx/",
  poseidon: "0x52EE8690474938F6fEeB75EAb252f805873c11E1",
  verifier: "0x491d3b40Cf1810BD2Af43E25695406c904338F3B",
  kaviar: "0x3DF64cA9bD5d6fb011d88e84412770AF08BD4393",
};

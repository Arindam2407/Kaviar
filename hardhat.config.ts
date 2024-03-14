import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";
import dotenv from "dotenv";
dotenv.config();

const CONFLUX_URL = "https://evmtestnet.confluxrpc.com";
const BSC_TESTNET_URL = "https://bsc-dataseed.binance.org/"
const MANTLE_TESTNET_URL = "https://rpc.testnet.mantle.xyz"
const userOldSigner = process.env.userOldSigner;
const relayerSigner = process.env.relayerSigner;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    conflux: {
      url: CONFLUX_URL,
      accounts: [`${userOldSigner}`, `0x${relayerSigner}`],
      gas: 10000000,
      timeout: 60000,
    },
    bsc: {
      url: BSC_TESTNET_URL,
      chainId: 97,
      accounts: [`${userOldSigner}`, `0x${relayerSigner}`],
      gas: 10000000,
      timeout: 60000,
    },
    mantle: {
      url: MANTLE_TESTNET_URL,
      chainId: 5001,
      accounts: [`${userOldSigner}`, `0x${relayerSigner}`],
      gas: 10000000,
      timeout: 60000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.8.0",
      },
      {
        version: "0.8.10",
      },
    ],
  },
};

export default config;

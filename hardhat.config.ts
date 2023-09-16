import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";
import dotenv from 'dotenv';
dotenv.config();
const INFURA_URL = "https://eth-goerli.g.alchemy.com/v2/wQZhZrGooqQlJMi44xtV3WQEAlhY8Ycz";
const userOldSigner = process.env.userOldSigner;
const relayerSigner = process.env.relayerSigner;
const userNewSigner = process.env.userNewSigner;

const config: HardhatUserConfig = {
    networks: {
        hardhat:{},
        goerli: {
          url: INFURA_URL,
          accounts: [`${userOldSigner}`, `0x${relayerSigner}`, `0x${userNewSigner}`],
          gas:10000000,
          timeout: 60000
        },
        bsc: {
          url: "https://linea-goerli.infura.io/v3/d4e151b7f55949c197d22923a169ff55",
          chainId: 59140,
          accounts: [`${userOldSigner}`, `0x${relayerSigner}`, `0x${userNewSigner}`],
          gas:10000000,
          timeout: 60000
        },
      },
      paths: {
        tests: "./test",
      },
      solidity: {
        compilers: [
          {
            version: "0.8.9"
          },
          {
            version: "0.8.0"
          },
          {
            version: "0.8.10"
          }
        ]
      },
};

export default config;

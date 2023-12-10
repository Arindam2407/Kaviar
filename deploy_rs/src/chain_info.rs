use crate::Chain;

pub struct ChainInfo {
    pub chain_enum_value: Chain,
    pub chain_env_var: String,
    pub poseidon: String,
}

// supported chain names
pub fn parse_chain(chain: &str) -> Result<ChainInfo, &'static str> {
    match chain {
        "GOERLI" => Ok(ChainInfo {
            chain_enum_value: Chain::Goerli,
            chain_env_var: String::from("GOERLI_URL"),
            poseidon: String::from("0xE8eddE68F249fA99AD369EbD0053961518607F6a"),
        }),
        "BSC" => Ok(ChainInfo {
            chain_enum_value: Chain::BinanceSmartChainTestnet,
            chain_env_var: String::from("BSC_TESTNET_URL"),
            poseidon: String::from("0x056a41D3673F3d0C6d3440DB9408F4f78Dd4aFb3"),
        }),
        "MANTLE" => Ok(ChainInfo {
            chain_enum_value: Chain::MantleTestnet,
            chain_env_var: String::from("MANTLE_TESTNET_URL"),
            poseidon: String::from("0x52EE8690474938F6fEeB75EAb252f805873c11E1"),
        }),
        // More networks will be added
        _ => Err("Invalid or Unsupported chain name"),
    }
}

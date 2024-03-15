use crate::Chain;

pub struct ChainInfo {
    pub chain_enum_value: Chain,
    pub chain_env_var: String,
    pub explorer: String,
    pub poseidon: String,
    pub verifier: String,
    pub kaviar: String,
}

// supported chain names
pub fn parse_chain(chain: &str) -> Result<ChainInfo, &'static str> {
    match chain {
        "BSC" => Ok(ChainInfo {
            chain_enum_value: Chain::BinanceSmartChainTestnet,
            chain_env_var: String::from("BSC_TESTNET_URL"),
            explorer: String::from("https://testnet.bscscan.com/tx/"),
            poseidon: String::from("0x056a41D3673F3d0C6d3440DB9408F4f78Dd4aFb3"),
            verifier: String::from("0x02515b7ecd58eb3d1d51c7b2ed7490703b5c027f"),
            kaviar: String::from("0x8670db125e625ae52af9fe3a15376f797ab7c8e5"),
        }),
        "MANTLE" => Ok(ChainInfo {
            chain_enum_value: Chain::MantleTestnet,
            chain_env_var: String::from("MANTLE_TESTNET_URL"),
            explorer: String::from("https://testnet.mantlescan.org/tx/"),
            poseidon: String::from("0x52EE8690474938F6fEeB75EAb252f805873c11E1"),
            verifier: String::from("0xf3e5ca550540b6149d02fff953920e10f1bb13f2"),
            kaviar: String::from("0xda626e57906c945cdc4a58f0a805bc9fe51800bb"),
        }),
        // More networks will be added
        _ => Err("Invalid or Unsupported chain name"),
    }
}

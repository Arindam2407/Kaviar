use dotenv::dotenv;
use ethers::prelude::*;
use std::io;

pub mod chain_info;
pub mod deploy;
pub mod subset;

pub use chain_info::{parse_chain, ChainInfo};
pub use deploy::deploy;
pub use subset::{allowlist, blacklist, deploy_subset, unallowlist, unblacklist};

abigen!(Verifier, "artifacts/contracts/Verifier.sol/Verifier.json",);
abigen!(Kaviar, "artifacts/contracts/Kaviar.sol/Kaviar.json");

pub enum Config {
    Deploy {
        chain: ChainInfo,
        chain_name: String,
    },
    DeploySubset {
        chain: ChainInfo,
        chain_name: String,
    },
    Blacklist {
        chain: ChainInfo,
    },
    Unblacklist {
        chain: ChainInfo,
    },
    Allowlist {
        chain: ChainInfo,
    },
    Unallowlist {
        chain: ChainInfo,
    },
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        dotenv().ok();

        let instruction = &args[1][..];

        match instruction {
            "deploy" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::Deploy { chain, chain_name })
            }
            "deploy_subset" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::DeploySubset { chain, chain_name })
            }
            "blacklist" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::Blacklist { chain })
            }
            "unblacklist" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::Unblacklist { chain })
            }
            "allowlist" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::Allowlist { chain })
            }
            "unallowlist" => {
                if args.len() != 2 {
                    return Err("Incorrect number of arguments");
                }

                println!("Enter Chain : ");

                let mut chain_name = String::new();

                io::stdin()
                    .read_line(&mut chain_name)
                    .expect("Failed to read line");

                let chain_name = chain_name.trim().to_string();

                if parse_chain(&chain_name).is_err() {
                    return Err("Chain could not be parsed because of invalid name");
                }

                let chain = parse_chain(&chain_name).unwrap();

                Ok(Config::Unallowlist { chain })
            }
            _ => Err("Invalid"),
        }
    }
}

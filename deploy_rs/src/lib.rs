use dotenv::dotenv;
use ethers::{
    contract::abigen,
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Http, Provider},
    signers::{LocalWallet, Signer},
    utils,
};
use eyre::Result;
use std::{convert::TryFrom, sync::Arc};

pub mod chain_info;

use chain_info::{parse_chain, ChainInfo};

// the json files must be first created by compiling the contracts in the repository
abigen!(
    Verifier,
    "../artifacts/contracts/Verifier.sol/Verifier.json",
);
abigen!(Kaviar, "../artifacts/contracts/Kaviar.sol/Kaviar.json");

pub struct Config {
    pub chain: ChainInfo,
    pub chain_name: String,
    pub chain_url: String,
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        dotenv().ok();

        if args.len() != 2 {
            return Err("Incorrect number of arguments. Expected 1");
        }

        let chain_name = args[1].clone();

        if parse_chain(&chain_name).is_err() {
            return Err("Chain could not be parsed because of invalid name");
        }

        let chain = parse_chain(&chain_name).unwrap();

        let chain_url = std::env::var(&chain.chain_env_var).expect("Chain URL not set");

        Ok(Config {
            chain,
            chain_name,
            chain_url,
        })
    }
}

pub async fn deploy(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");

    // Deploy Verifier.sol
    let url: &str = &std::env::var(&config.chain.chain_env_var).expect("URL must be set");
    let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
    let wallet: LocalWallet = user
        .parse::<LocalWallet>()
        .expect("Failed to parse wallet")
        .with_chain_id(config.chain.chain_enum_value);
    let client_verifier = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

    println!(
        "\nDeploying contract Verifier.sol on {}\n",
        config.chain_name
    );
    let verifier_contract = Verifier::deploy(client_verifier, ())
        .unwrap()
        .send()
        .await
        .unwrap();

    let addr_verifier = verifier_contract.address();
    println!(
        "Verifier.sol has been deployed to {:?} on {}\n",
        addr_verifier, config.chain_name
    );

    // Deploy Kaviar.sol
    let client_kaviar = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

    let poseidon = config
        .chain
        .poseidon
        .parse::<Address>()
        .expect("Invalid Address");

    // constants
    let eth_amount = utils::parse_ether(0.0001).expect("Failed to parse Ether");

    println!("Deploying contract Kaviar.sol on {}\n", config.chain_name);
    let kaviar_contract = Kaviar::deploy(client_kaviar, (addr_verifier, eth_amount, poseidon))
        .unwrap()
        .send()
        .await
        .unwrap();

    let addr_kaviar = kaviar_contract.address();
    println!(
        "Kaviar.sol has been deployed to {:?} on {}\n",
        addr_kaviar, config.chain_name
    );

    Ok(())
}

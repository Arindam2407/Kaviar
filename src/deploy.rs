use crate::{Config, Kaviar, Verifier};

use dotenv::dotenv;
use ethers::{
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Http, Provider},
    signers::{LocalWallet, Signer},
    utils,
};
use eyre::Result;
use std::{convert::TryFrom, sync::Arc};

pub async fn deploy(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::Deploy { chain, chain_name } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            // Deploy Verifier.sol
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client_verifier = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            println!("\nDeploying contract Verifier.sol on {}\n", chain_name);
            let verifier_contract = Verifier::deploy(client_verifier, ())
                .unwrap()
                .send()
                .await
                .unwrap();

            let addr_verifier = verifier_contract.address();
            println!(
                "Verifier.sol has been deployed to {:?} on {}\n",
                addr_verifier, chain_name
            );

            // Deploy Kaviar.sol
            let client_kaviar = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            let poseidon = chain.poseidon.parse::<Address>().expect("Invalid Address");

            // constants
            let eth_amount = utils::parse_ether(0.01).expect("Failed to parse Ether");

            println!("Deploying contract Kaviar.sol on {}\n", chain_name);
            let kaviar_contract =
                Kaviar::deploy(client_kaviar, (addr_verifier, eth_amount, poseidon))
                    .unwrap()
                    .send()
                    .await
                    .unwrap();

            let addr_kaviar = kaviar_contract.address();
            println!(
                "Kaviar.sol has been deployed to {:?} on {}\n",
                addr_kaviar, chain_name
            );
            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

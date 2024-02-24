use crate::Config;

use dotenv::dotenv;
use ethers::{
    contract::abigen,
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Http, Provider},
    signers::{LocalWallet, Signer},
};
use eyre::Result;
use std::io;
use std::{convert::TryFrom, sync::Arc};

abigen!(
    MerkleTreeSubset,
    "artifacts/contracts/MerkleTreeSubset.sol/MerkleTreeSubset.json"
);

pub async fn deploy_subset(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::DeploySubset { chain, chain_name } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));
            let poseidon = chain.poseidon.parse::<Address>().expect("Invalid Address");
            println!("The Subset Tree is a Blacklist (true/false) : ");
            let mut is_blacklist = String::new();

            io::stdin()
                .read_line(&mut is_blacklist)
                .expect("Failed to read line");

            let is_blacklist: bool = is_blacklist.trim().parse().unwrap_or(true);

            let mts_contract = MerkleTreeSubset::deploy(client, (poseidon, is_blacklist))
                .unwrap()
                .send()
                .await
                .unwrap();

            let addr_mts = mts_contract.address();
            println!(
                "Merkle Tree Subset has been deployed to {:?} on {}\n",
                addr_mts, chain_name
            );

            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

pub async fn blacklist(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::Blacklist { chain } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            println!("Enter Subset Tree Address : ");
            let mut subset_tree_address = String::new();

            io::stdin()
                .read_line(&mut subset_tree_address)
                .expect("Failed to read line");

            let subset_tree_address = subset_tree_address
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            println!("Enter Address to Blacklist: ");
            let mut address_to_blacklist = String::new();

            io::stdin()
                .read_line(&mut address_to_blacklist)
                .expect("Failed to read line");

            let address_to_blacklist = address_to_blacklist
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            let mts_contract = MerkleTreeSubset::new(subset_tree_address, client);
            let tx = mts_contract.blacklist_address(address_to_blacklist);
            let pending_tx = tx.send().await.expect("Transaction failed");
            let _mined_tx = pending_tx.await.expect("Transaction not mined");

            println!(
                "Address {:?} blacklisted successfully on {:?}!",
                address_to_blacklist, subset_tree_address
            );

            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

pub async fn unblacklist(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::Unblacklist { chain } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            println!("Enter Subset Tree Address : ");
            let mut subset_tree_address = String::new();

            io::stdin()
                .read_line(&mut subset_tree_address)
                .expect("Failed to read line");

            let subset_tree_address = subset_tree_address
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            println!("Enter Address to Unblacklist: ");
            let mut address_to_unblacklist = String::new();

            io::stdin()
                .read_line(&mut address_to_unblacklist)
                .expect("Failed to read line");

            let address_to_unblacklist = address_to_unblacklist
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            let mts_contract = MerkleTreeSubset::new(subset_tree_address, client);
            let tx = mts_contract.un_blacklist_address(address_to_unblacklist);
            let pending_tx = tx.send().await.expect("Transaction failed");
            let _mined_tx = pending_tx.await.expect("Transaction not mined");

            println!(
                "Address {:?} unblacklisted successfully on {:?}!",
                address_to_unblacklist, subset_tree_address
            );

            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

pub async fn allowlist(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::Allowlist { chain } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            println!("Enter Subset Tree Address : ");
            let mut subset_tree_address = String::new();

            io::stdin()
                .read_line(&mut subset_tree_address)
                .expect("Failed to read line");

            let subset_tree_address = subset_tree_address
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            println!("Enter Address to Allowlist: ");
            let mut address_to_allowlist = String::new();

            io::stdin()
                .read_line(&mut address_to_allowlist)
                .expect("Failed to read line");

            let address_to_allowlist = address_to_allowlist
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            let mts_contract = MerkleTreeSubset::new(subset_tree_address, client);
            let tx = mts_contract.allowlist_address(address_to_allowlist);
            let pending_tx = tx.send().await.expect("Transaction failed");
            let _mined_tx = pending_tx.await.expect("Transaction not mined");

            println!(
                "Address {:?} allowlisted successfully on {:?}!",
                address_to_allowlist, subset_tree_address
            );

            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

pub async fn unallowlist(config: Config) -> Result<(), &'static str> {
    dotenv().ok();

    match config {
        Config::Unallowlist { chain } => {
            let user: &str = &std::env::var("userOldSigner").expect("User Old Signer must be set");
            let url: &str = &std::env::var(&chain.chain_env_var).expect("URL must be set");
            let provider = Provider::<Http>::try_from(url).expect("Failed to create provider");
            let wallet: LocalWallet = user
                .parse::<LocalWallet>()
                .expect("Failed to parse wallet")
                .with_chain_id(chain.chain_enum_value);
            let client = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

            println!("Enter Subset Tree Address : ");
            let mut subset_tree_address = String::new();

            io::stdin()
                .read_line(&mut subset_tree_address)
                .expect("Failed to read line");

            let subset_tree_address = subset_tree_address
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            println!("Enter Address to Unallowlist: ");
            let mut address_to_unallowlist = String::new();

            io::stdin()
                .read_line(&mut address_to_unallowlist)
                .expect("Failed to read line");

            let address_to_unallowlist = address_to_unallowlist
                .trim()
                .to_string()
                .parse::<Address>()
                .expect("Invalid Address");

            let mts_contract = MerkleTreeSubset::new(subset_tree_address, client);
            let tx = mts_contract.un_allowlist_address(address_to_unallowlist);
            let pending_tx = tx.send().await.expect("Transaction failed");
            let _mined_tx = pending_tx.await.expect("Transaction not mined");

            println!(
                "Address {:?} unallowlisted successfully on {:?}!",
                address_to_unallowlist, subset_tree_address
            );

            Ok(())
        }
        _ => Err("Invalid Params"),
    }
}

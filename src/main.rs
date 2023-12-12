use eyre::Result;
use std::env;
use std::process;

use kaviar::{allowlist, blacklist, deploy, deploy_subset, unallowlist, unblacklist, Config};

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    match config {
        Config::Deploy { .. } => {
            if let Err(e) = deploy(config).await {
                eprintln!("Deployment Failure: {e}");
                process::exit(1);
            }

            Ok(())
        }
        Config::DeploySubset { .. } => {
            if let Err(e) = deploy_subset(config).await {
                eprintln!("Deployment of Subset Tree Failed: {e}");
                process::exit(1);
            }

            Ok(())
        }
        Config::Blacklist { .. } => {
            if let Err(e) = blacklist(config).await {
                eprintln!("Failed to blacklist address: {e}");
                process::exit(1);
            }

            Ok(())
        }
        Config::Unblacklist { .. } => {
            if let Err(e) = unblacklist(config).await {
                eprintln!("Failed to blacklist address: {e}");
                process::exit(1);
            }

            Ok(())
        }
        Config::Allowlist { .. } => {
            if let Err(e) = allowlist(config).await {
                eprintln!("Failed to blacklist address: {e}");
                process::exit(1);
            }

            Ok(())
        }
        Config::Unallowlist { .. } => {
            if let Err(e) = unallowlist(config).await {
                eprintln!("Failed to blacklist address: {e}");
                process::exit(1);
            }

            Ok(())
        }
    }
}

use eyre::Result;
use std::env;
use std::process;

use deploy_rs::{deploy, Config};

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = deploy(config).await {
        eprintln!("Deployment Failure: {e}");
        process::exit(1);
    }

    Ok(())
}

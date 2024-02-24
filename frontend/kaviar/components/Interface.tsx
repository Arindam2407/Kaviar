import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import "react-dom"
import React from "react";
//@ts-ignore
import { buildPoseidon } from "circomlibjs";
import { Kaviar__factory } from "../../../types";
import { parse_chain_params } from "../../../utils/parseChainUtils";
import { Deposit } from "../../../utils/proofUtils";
import { BigNumber, ethers } from "ethers";
// @ts-ignores
import { poseidonHash, Proof } from "../../../utils/proofUtils";
//@ts-ignore
import { groth16 } from "snarkjs";

const ButtonState = {Normal : 0, Loading : 1, Disabled : 2};

const Interface = () => {
    const { enableWeb3, isWeb3Enabled, account, Moralis, deactivateWeb3, isWeb3EnableLoading } = useMoralis()

    const [subsetAddressGOERLI, updateSubsetAddressGOERLI] = useState<HTMLInputElement | null>(null);
    const [subsetAddressBSC, updateSubsetAddressBSC] = useState<HTMLInputElement | null>(null);
    const [subsetAddressMANTLE, updateSubsetAddressMANTLE] = useState<HTMLInputElement | null>(null);
    const [textArea, updateTextArea] = useState<HTMLTextAreaElement | null>(null);
    const [proofElements, updateProofElements] = useState<string | null>(null);
    const [explorerWithdraw, updateExplorerWithdraw] = useState("")
    const [proofStringEl, updateProofStringEl] = useState<HTMLSpanElement | null>(null);
    const [section, updateSection] = useState("Deposit");
    const [withdrawalSuccessful, updateWithdrawalSuccessful] = useState(false);
    const [displayCopiedMessage, updateDisplayCopiedMessage] = useState(false);
    const [metamaskButtonState, updateMetamaskButtonState] = useState(ButtonState.Normal);
    const [depositButtonStateGOERLI, updateDepositButtonStateGOERLI] = useState(ButtonState.Normal);
    const [depositButtonStateBSC, updateDepositButtonStateBSC] = useState(ButtonState.Normal);
    const [depositButtonStateMANTLE, updateDepositButtonStateMANTLE] = useState(ButtonState.Normal);
    const [withdrawButtonState, updateWithdrawButtonState] = useState(ButtonState.Normal);

    useEffect(() => {
        if(!isWeb3Enabled && 
            typeof(window) !== "undefined" && 
            window.localStorage.getItem("connected")){
                enableWeb3()
            }
    },
    [isWeb3Enabled]
    )

    useEffect(() => {
        Moralis.onAccountChanged((account) => {
            if(account == null){
                window.localStorage.removeItem("connected")
                deactivateWeb3()
            }
        })
    },[])

    const connectMetamask = async () => {

        try {
            updateMetamaskButtonState(ButtonState.Loading);

            await enableWeb3();
            window.localStorage.setItem("connected","injected");

            if(!(window as any).ethereum){
                alert("Please install Metamask to use this app.");
                throw "no-metamask";
            }

            var chainId = (window as any).ethereum.networkVersion;

            if(chainId != "5" && chainId != "97" && chainId != "5001"){
                alert("Please switch to a supported chain (GOERLI / BINANCE SMART CHAIN / MANTLE TESTNET");
                throw "wrong-chain";
            }

        } catch(error) {
            console.log(error);
        }

        updateMetamaskButtonState(ButtonState.Normal);
    };

    const copyProof = () => {
        if(!!proofStringEl){
            flashCopiedMessage();
            navigator.clipboard.writeText(proofStringEl.innerHTML);
        }  
    };

    async function prove(witness: any): Promise<Proof> {
        const wasmPath =  "./wasm/withdraw_from_subset.wasm"
        const zkeyPath = "./wasm/circuit_final.zkey";
      
        const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);
        const solProof: Proof = {
          a: [proof.pi_a[0], proof.pi_a[1]],
          b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]],
          ],
          c: [proof.pi_c[0], proof.pi_c[1]],
        };
        return solProof;
    }

    function num_to_rev_bin(n: any) {
        const binaryString = n.toString(2);
        const reversedBinary = binaryString.split("").reverse().join("");
        const stringArray = Array.from({ length: 20 }, () => "0");
        const reversedBinaryArray = reversedBinary.split("");
        for (let i = 0; i < reversedBinaryArray.length; i++) {
          stringArray[i] = reversedBinaryArray[i];
        }
        return stringArray;
      }

    const depositEtherGOERLI = async () => {
        updateDepositButtonStateGOERLI(ButtonState.Disabled);
        if(!subsetAddressGOERLI || !subsetAddressGOERLI.value) { alert("Please Input the Subset Tree/Privacy Pool Address"); } 
        else {
            const ethereum = await (window as any).ethereum;
            const signer =new ethers.providers.Web3Provider(ethereum).getSigner();

            try {
                const poseidon = await buildPoseidon();
                const deposit = Deposit.new(poseidon);
        
                const kaviarContract = new Kaviar__factory(signer).attach(
                parse_chain_params("GOERLI").kaviar
                );
                const TOTAL_VALUE = ethers.utils.parseEther("0.01");
            
                const tx = await kaviarContract
                .connect(signer)
                .deposit(deposit.commitment, subsetAddressGOERLI.value, {
                    value: TOTAL_VALUE,
                    gasLimit: 10000000,
                });
            
                const receipt = await tx.wait();
            
                const depositElements = {
                chain: "GOERLI",
                nullifier: deposit.nullifier,
                commitment: deposit.commitment,
                timestamp: receipt.blockNumber,
                };
            
                console.log(`\nDeposit of 0.01 ETH sent successfully! \n`);
                console.log(
                `View this transaction on ${parse_chain_params("GOERLI").explorer}${
                    receipt.transactionHash
                }\n`
                );
                console.log(
                `Please copy this deposit string to recover funds later: \n${btoa(
                    JSON.stringify(depositElements)
                )}`
                );
                updateProofElements(btoa(JSON.stringify(depositElements)));
            } catch(error) {
                console.log(error);
            }
        }
        updateDepositButtonStateGOERLI(ButtonState.Normal);
    };

    const depositEtherBSC = async () => {
        updateDepositButtonStateGOERLI(ButtonState.Disabled);
        if(!subsetAddressBSC || !subsetAddressBSC.value) { alert("Please Input the Subset Tree/Privacy Pool Address"); } 
        else {
            const ethereum = await (window as any).ethereum;
            const signer =new ethers.providers.Web3Provider(ethereum).getSigner();

            try {
                const poseidon = await buildPoseidon();
                const deposit = Deposit.new(poseidon);
        
                const kaviarContract = new Kaviar__factory(signer).attach(
                parse_chain_params("BSC").kaviar
                );
                const TOTAL_VALUE = ethers.utils.parseEther("0.01");
            
                const tx = await kaviarContract
                .connect(signer)
                .deposit(deposit.commitment, subsetAddressBSC.value, {
                    value: TOTAL_VALUE,
                    gasLimit: 10000000,
                });
            
                const receipt = await tx.wait();
            
                const depositElements = {
                chain: "BSC",
                nullifier: deposit.nullifier,
                commitment: deposit.commitment,
                timestamp: receipt.blockNumber,
                };
            
                console.log(`\nDeposit of 0.01 ETH sent successfully! \n`);
                console.log(
                `View this transaction on ${parse_chain_params("BSC").explorer}${
                    receipt.transactionHash
                }\n`
                );
                console.log(
                `Please copy this deposit string to recover funds later: \n${btoa(
                    JSON.stringify(depositElements)
                )}`
                );
                updateProofElements(btoa(JSON.stringify(depositElements)));
            } catch(error) {
                console.log(error);
            }
        }
        updateDepositButtonStateBSC(ButtonState.Normal);
    };

    const depositEtherMANTLE = async () => {
        updateDepositButtonStateMANTLE(ButtonState.Disabled);
        if(!subsetAddressMANTLE || !subsetAddressMANTLE.value) { alert("Please Input the Subset Tree/Privacy Pool Address"); } 
        else {
            const ethereum = await (window as any).ethereum;
            const signer =new ethers.providers.Web3Provider(ethereum).getSigner();

            try {
                const poseidon = await buildPoseidon();
                const deposit = Deposit.new(poseidon);
        
                const kaviarContract = new Kaviar__factory(signer).attach(
                parse_chain_params("MANTLE").kaviar
                );
                const TOTAL_VALUE = ethers.utils.parseEther("0.01");
            
                const tx = await kaviarContract
                .connect(signer)
                .deposit(deposit.commitment, subsetAddressMANTLE.value, {
                    value: TOTAL_VALUE,
                    gasLimit: 10000000,
                });
            
                const receipt = await tx.wait();
            
                const depositElements = {
                chain: "MANTLE",
                nullifier: deposit.nullifier,
                commitment: deposit.commitment,
                timestamp: receipt.blockNumber,
                };
            
                console.log(`\nDeposit of 0.01 ETH sent successfully! \n`);
                console.log(
                `View this transaction on ${parse_chain_params("MANTLE").explorer}${
                    receipt.transactionHash
                }\n`
                );
                console.log(
                `Please copy this deposit string to recover funds later: \n${btoa(
                    JSON.stringify(depositElements)
                )}`
                );
                updateProofElements(btoa(JSON.stringify(depositElements)));
            } catch(error) {
                console.log(error);
            }
        }
        updateDepositButtonStateMANTLE(ButtonState.Normal);
    };

    const withdrawEther = async () => {
        updateWithdrawButtonState(ButtonState.Disabled);
        if(!textArea || !textArea.value) { alert("Please Input the Proof String"); } 
        else {
            const ethereum = await (window as any).ethereum;
            const relayerSigner =new ethers.providers.Web3Provider(ethereum).getSigner();
            try {
                const depositElements = JSON.parse(atob(textArea.value));
                const chain = depositElements.chain;
                const nullifier = new Uint8Array(Object.values(depositElements.nullifier));
                const commitment = depositElements.commitment;
                const blockNumber = depositElements.blockNumber;
            
                const kaviarContract = new Kaviar__factory(relayerSigner).attach(
                parse_chain_params(chain).kaviar
                );
            
                const poseidon = await buildPoseidon();
            
                const events = await kaviarContract.queryFilter(
                kaviarContract.filters.Deposit(commitment),
                blockNumber
                );
            
                let DepositEvent = events[0].args;
            
                const eventsSubset = await kaviarContract.queryFilter(
                kaviarContract.filters.SubsetDeposit(commitment),
                blockNumber
                );
            
                let SubsetDepositEvent = eventsSubset[0].args;
            
                let insertedIndex = DepositEvent[1];
                let root = DepositEvent[2];
                let path_elements = DepositEvent[3];
                let path_indices = num_to_rev_bin(insertedIndex);
            
                let insertedIndexSubset = SubsetDepositEvent[2];
                let subsetRoot = SubsetDepositEvent[3];
                let path_elements_subset = SubsetDepositEvent[4];
                let path_indices_subset = num_to_rev_bin(insertedIndexSubset);
            
                const nullifierHash = poseidonHash(poseidon, [nullifier, 1, insertedIndex]);
                const recipient = await relayerSigner.getAddress();
                const relayer = await relayerSigner.getAddress();
                const fee = 0;
            
                // proof generation and verification
                const witness = {
                // Public
                root,
                subsetRoot,
                nullifierHash,
                recipient,
                relayer,
                fee,
                // Private (user keep)
                nullifier: BigNumber.from(nullifier).toBigInt(),
                mainProofIndices: path_indices,
                subsetProofIndices: path_indices_subset,
                mainProof: path_elements,
                subsetProof: path_elements_subset,
                };
            
                console.log("\nGenerating proof...\n");
                const solProof = await prove(witness);
            
                console.log("Sending proof, waiting for verification...\n");
                const txWithdraw = await kaviarContract
                .connect(relayerSigner)
                .withdraw(
                    solProof,
                    root,
                    subsetRoot,
                    nullifierHash,
                    recipient,
                    relayer,
                    fee,
                    { gasLimit: 9000000 }
                );
            
                const receiptWithdraw = await txWithdraw.wait(1);
                console.log(`Deposit successfully withdrawn!\n`);
                console.log(
                `View this transaction on ${parse_chain_params(chain).explorer}${
                    receiptWithdraw.transactionHash
                }`
                );
                updateExplorerWithdraw(`View this transaction on ${parse_chain_params(chain).explorer}${
                    receiptWithdraw.transactionHash
                }\n`);
                } catch(error) {
                    console.log(error);
                }
                updateWithdrawalSuccessful(true);
        }
        updateWithdrawButtonState(ButtonState.Normal);
    };

    const flashCopiedMessage = async () => {
        updateDisplayCopiedMessage(true);
        setTimeout(() => {
            updateDisplayCopiedMessage(false);
        }, 1000);
    };

    return (
        <div>
            <nav>
            <div className="card mx-auto" style={{ maxWidth: 500 }}>
            <div className="d-flex justify-content-center">
            <strong> Regulatory-compliant Currency-Mixer enabled by Privacy Pools </strong>
            </div>
            </div>
            </nav>

            <nav>
            <div className="card mx-auto" style={{ maxWidth: 500 }}>
            <div className="d-flex justify-content-center">
            {account ? (<div>Connected to {account.slice(0,6) + "..." + account.slice(account.length - 4, account.length)}</div>) : 
            (<button 
                className="btn btn-primary"
                onClick={connectMetamask}
                disabled = {isWeb3EnableLoading || metamaskButtonState == ButtonState.Disabled}> 
                Connect wallet </button>)}
            </div>
            </div>
            </nav>

            <div className="container">
                <div className="card mx-auto" style={{ maxWidth: 500 }}>
                    {
                        (section == "Deposit") ? (
                            <img className="card-img-top" src="./kaviar.png"/>
                        ) : (
                            <img className="card-img-top" src="./kaviar.png"/>
                        )
                    }
                    <div className="card-body justify-content-center">
                        <div className="btn-group justify-content-center" style={{ marginBottom: 10 }}>
                            {
                                (section == "Deposit") ? (
                                    <button className="btn btn-primary justify-content-center">Deposit</button>
                                ) : (
                                    <button onClick={() => { updateSection("Deposit"); }} className="btn btn-outline-primary">Deposit</button>   
                                )
                            }
                            {
                                (section == "Deposit") ? (
                                    <button onClick={() => { updateSection("Withdraw"); }} className="btn btn-outline-primary">Withdraw</button> 
                                ) : (
                                    <button className="btn btn-primary">Withdraw</button>
                                )
                            }
                        </div>

                        {
                            (section == "Deposit" && !!account) && (
                                <div>
                                    {
                                        (!!proofElements) ? (
                                            <div>
                                                <div className="alert alert-success justify-content-center">
                                                    <span><strong>Proof of Deposit:</strong></span>
                                                    <div className="p-1" style={{ lineHeight: "12px" }}>
                                                        <span style={{ fontSize: 10 }} ref={(proofStringEl) => { updateProofStringEl(proofStringEl); }}>{proofElements}</span>
                                                    </div>

                                                </div>

                                                <div>
                                                    <button className="btn btn-success justify-content-center" onClick={copyProof}><span className="small">Copy Proof String</span></button>
                                                    {
                                                        (!!displayCopiedMessage) && (
                                                            <span className="small" style={{ color: 'green' }}><strong> Copied!</strong></span>
                                                        )
                                                    }
                                                </div>
                                                
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-secondary justify-content-center">Note: All deposits and withdrawals are of the same denomination of 0.01 ETH.</p>
                                                <br/>
                                                <div className="justify-between items-center">
                                                <p className="text-secondary">Enter Subset Tree/Privacy Pool Address.</p>
                                                <div className="form-group">
                                                    <input className="form-control" style={{ resize: "none" }} ref={(ta) => { updateSubsetAddressGOERLI(ta); }}></input>
                                                <button 
                                                    className="btn btn-success" 
                                                    onClick={depositEtherGOERLI}
                                                    disabled={depositButtonStateGOERLI == ButtonState.Disabled}
                                                ><span className="small">GOERLI TESTNET</span></button>
                                                </div>
                                                <br/>
                                                <div className="form-group">
                                                    <input className="form-control" style={{ resize: "none" }} ref={(ta) => { updateSubsetAddressBSC(ta); }}></input>
                                                <button 
                                                    className="btn btn-success" 
                                                    onClick={depositEtherBSC}
                                                    disabled={depositButtonStateBSC == ButtonState.Disabled}
                                                ><span className="small">BINANCE SMART CHAIN</span></button>
                                                </div>
                                                <br/>
                                                <div className="form-group">
                                                    <input className="form-control" style={{ resize: "none" }} ref={(ta) => { updateSubsetAddressMANTLE(ta); }}></input>
                                                <button 
                                                    className="btn btn-success" 
                                                    onClick={depositEtherMANTLE}
                                                    disabled={depositButtonStateMANTLE == ButtonState.Disabled}
                                                ><span className="small">MANTLE TESTNET</span></button>
                                                </div>
                                                </div>
                                            </div>
                                            
                                        )
                                    }
                                </div>
                            )
                        }

                        {
                            (section != "Deposit" && !!account) && (
                                <div>
                                    {
                                        (withdrawalSuccessful) ? (
                                            <div>
                                                <div className="alert alert-success p-3">
                                                    <div><span><strong>Success!</strong></span></div>
                                                    <div style={{ marginTop: 5 }}>
                                                        <span className="text-secondary">Withdrawal successful!</span>
                                                        <br/>
                                                        <br/>
                                                        <span className="text-secondary">{explorerWithdraw}</span>
                                                    </div>

                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-secondary">Note: All deposits and withdrawals are of the same denomination of 0.01 ETH.</p>
                                                <div className="form-group">
                                                    <textarea className="form-control" style={{ resize: "none" }} ref={(ta) => { updateTextArea(ta); }}></textarea>
                                                </div>
                                                <button 
                                                    className="btn btn-primary" 
                                                    onClick={withdrawEther}
                                                    disabled={withdrawButtonState == ButtonState.Disabled}
                                                ><span className="small">Withdraw 0.01 ETH</span></button>
                                            </div>                  
                                        )
                                    }
                                </div>
                            )
                        }
                        {
                            (!account) && (
                                <div>
                                    <p>Please connect your wallet to use the sections.</p>
                                </div>
                            )
                        }
                    </div>
                    <div className="card-footer p-4" style={{ lineHeight: "15px" }} >
                        <span className="small text-secondary" style={{ fontSize: "12px" }}>
                            <strong>Disclaimer: </strong> 
                            This is intended for testnet use only
                        </span>
                    </div>
                </div>
        </div>
    </div>
    )
}

export default Interface
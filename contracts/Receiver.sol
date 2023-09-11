// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.10;
pragma experimental ABIEncoderV2;

import "./MerkleTree.sol";
import "./MerkleTreeSubset.sol";
import "./Blacklist.sol";
import "./WETH.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./verifiers/withdraw_from_subset_verifier.sol";
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Receiver is AxelarExecutable, MerkleTree, MerkleTreeSubset, Blacklist, ReentrancyGuard, WithdrawFromSubsetVerifier {
    using ProofLib for bytes;
    using SafeERC20 for IERC20;

    uint256 public immutable denomination;
    WETHToken public weth;
    IAxelarGasService gasService;

    mapping(uint => bool) public nullifierHashes;

    event Withdrawal(
        address to,
        uint nullifierHash,
        address indexed relayer,
        uint256 fee
    );

    event Deposit(
        uint indexed commitment,
        uint leafIndex,
        uint256 timestamp
    );

    error FeeExceedsDenomination();
    error InvalidZKProof();
    error NoteAlreadySpent();
    error UnknownRoot();
   
    constructor(
        address gateway_,
        address gasReceiver_,
        uint256 _denomination,
        address poseidon
    ) MerkleTree(poseidon, bytes("empty").snarkHash()) 
    MerkleTreeSubset(poseidon, bytes("allowed").snarkHash()) Blacklist() AxelarExecutable(gateway_)  {
        gasService = IAxelarGasService(gasReceiver_);
        require(_denomination > 0, "denomination should be greater than 0");
        denomination = _denomination;
        weth = new WETHToken("Wraped ETH","WETH", address(this));
    }


   // move to sender later
   // Handles calls created by setAndSend. Updates this contract's value
    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        uint commitment = abi.decode(payload_, (uint));
        uint insertedIndex = insert(commitment);

        emit Deposit(commitment, insertedIndex, block.timestamp);
    }

    /**
    @dev Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs
    `input` array consists of:
      - merkle root of all deposits in the contract
      - hash of unique deposit nullifier to prevent double spends
      - the recipient of funds
      - optional fee that goes to the transaction sender (usually a relay)
    */
    function withdraw(
        uint[8] calldata flatProof,
        uint root,
        uint subsetRoot,
        uint nullifierHash,
        address recipient,
        address relayer,
        uint fee
    ) external payable nonReentrant {
        if (nullifierHashes[nullifierHash]) revert NoteAlreadySpent();
        if (!isKnownRoot(root)) revert UnknownRoot();
        if (fee > denomination) revert FeeExceedsDenomination();
        uint withdrawMetadata = abi.encode(recipient, relayer, fee).snarkHash() ;
        if (!_verifyWithdrawFromSubsetProof(
            flatProof,
            root,
            subsetRoot,
            nullifierHash,
            withdrawMetadata
        )) revert InvalidZKProof();
        nullifierHashes[nullifierHash] = true;
        
        _processWithdraw(recipient, relayer, fee);
        emit Withdrawal(recipient, nullifierHash, relayer, fee);
    }

    function _processWithdraw(
        address  _recipient,
        address  _relayer,
        uint256 _fee
    ) internal {
        // sanity checks
        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );
        //To-Do: change to mint token for the recipient
        weth.mint(_recipient, denomination - _fee);

        if(_fee > 0){
            weth.mint(_relayer,_fee);
        }
    }
}

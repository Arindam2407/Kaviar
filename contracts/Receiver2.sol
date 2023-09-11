// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import "./MerkleTree.sol";
import "./WETH.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./verifiers/withdraw_from_subset_verifier.sol";
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract Receiver is AxelarExecutable, MerkleTree, ReentrancyGuard, WithdrawFromSubsetVerifier {
    uint256 public immutable denomination;
    WETHToken public weth;
    IAxelarGasService gasService;

    mapping(bytes32 => bool) public nullifierHashes;

    event Withdrawal(
        address to,
        bytes32 nullifierHash,
        address indexed relayer,
        uint256 fee
    );

    event Deposit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
   

    /**
    @param _denomination transfer amount for each deposit
    @param _merkleTreeHeight the height of deposits' Merkle Tree
    */
    constructor(
        address gateway_,
        address gasReceiver_,
        uint256 _denomination,
        address _hasher
    ) MerkleTreeWithHistory(_hasher) AxelarExecutable(gateway_)  {
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
        bytes32 commitment = abi.decode(payload_, (bytes32));
        uint32 insertedIndex = insert(commitment);
       // _processDeposit();

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
    ) external payable nonReentrant returns(bool) {
        if (nullifierHashes[nullifierHash]) revert NoteAlreadySpent();
        if (!isKnownRoot(root)) revert UnknownRoot();
        if (fee > denomination) revert FeeExceedsDenomination();
        uint withdrawMetadata = abi.encode(recipient, relayer, fee).snarkHash();
        if (!_verifyWithdrawFromSubsetProof(
            flatProof,
            root,
            subsetRoot,
            nullifierHash,
            withdrawMetadata
        )) revert InvalidZKProof();
        nullifierHashes[nullifierHash] = true;
        
        _processWithdraw(recipient, relayer, fee);
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

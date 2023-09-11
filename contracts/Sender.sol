// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.10;
pragma experimental ABIEncoderV2;

import "./MerkleTree.sol";
import "./MerkleTreeSubset.sol";
import "./Blacklist.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import "./verifiers/withdraw_from_subset_verifier.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Sender is AxelarExecutable, ReentrancyGuard, MerkleTree, MerkleTreeSubset, Blacklist, WithdrawFromSubsetVerifier {
    using ProofLib for bytes;
    using SafeERC20 for IERC20;

    uint256 public immutable denomination;
    
    IAxelarGasService gasService;

    mapping(uint => bool) public nullifierHashes;

    event Deposit(
        uint indexed commitment,
        uint leafIndex,
        uint256 timestamp
    );
   
    constructor(address gateway_, address gasReceiver_, uint256 _denomination, address poseidon) 
    AxelarExecutable(gateway_) MerkleTree(poseidon, bytes("empty").snarkHash()) 
    MerkleTreeSubset(poseidon, bytes("allowed").snarkHash()) Blacklist(){
        gasService = IAxelarGasService(gasReceiver_);
        require(_denomination > 0, "denomination should be greater than 0");
        denomination = _denomination;
    }

    function deposit(uint _commitment, string calldata destinationChain,
        string calldata destinationAddress) external payable nonReentrant {

        _processDeposit();

        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(_commitment);
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _processDeposit() internal {
        require(
            msg.value > denomination,
            "Please send exactly 0.1 ETH along with transaction"
        );
    }

}

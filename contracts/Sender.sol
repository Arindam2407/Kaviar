// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract Sender is AxelarExecutable, ReentrancyGuard {
    uint256 public immutable denomination;
    uint256 public axelarGas;
    IAxelarGasService gasService;

    mapping(bytes32 => bool) public nullifierHashes;

    event Deposit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
   
    constructor(address gateway_, address gasReceiver_, uint256 _axelarGas, uint256 _denomination) 
    AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
        denomination = _denomination;
        axelarGas = _axelarGas;
    }

    /**
    @dev Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
    @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
  */
    function deposit(bytes32 _commitment, address _subsetTreeAddress, string calldata destinationChain,
        string calldata destinationAddress) external payable nonReentrant {
        _processDeposit();
       require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(_commitment, _subsetTreeAddress, msg.sender);
        gasService.payNativeGasForContractCall{ value: axelarGas }(
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
            (msg.value - axelarGas) == denomination,
            "Please send exactly 0.1 ETH along with transaction"
        );
    }

}

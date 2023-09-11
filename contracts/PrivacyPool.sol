// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./MerkleTree.sol";
import "./MerkleTreeSubset.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./verifiers/withdraw_from_subset_verifier.sol";
import "./Blacklist.sol";

contract PrivacyPool is ReentrancyGuard, MerkleTree, MerkleTreeSubset, WithdrawFromSubsetVerifier, Blacklist {
    using ProofLib for bytes;
    using SafeERC20 for IERC20;

    uint256 public immutable denomination;

    event Deposit(
        uint indexed commitment,
        uint leafIndex,
        uint timestamp
    );

    event Withdrawal(
        address recipient,
        address indexed relayer,
        uint indexed subsetRoot,
        uint nullifierHash,
        uint fee
    );

    error FeeExceedsDenomination();
    error InvalidZKProof();
    error NoteAlreadySpent();
    error UnknownRoot();

    mapping (uint => bool) public nullifierHashes;

    constructor(address poseidon, uint256 _denomination) MerkleTree(poseidon, bytes("empty").snarkHash()) 
    MerkleTreeSubset(poseidon, bytes("allowed").snarkHash()) Blacklist() {
        require(_denomination > 0, "denomination should be greater than 0");
        denomination = _denomination;
    }

    function deposit(uint commitment)
        public
        payable
        nonReentrant
        returns (uint)
    {   
        _processDeposit();

        uint leafIndex = insert(commitment);

        uint isBanned = bytes("allowed").snarkHash();

        if(isBlacklisted(msg.sender)){
            isBanned = bytes("blocked").snarkHash();
        }

        uint leafIndexSubset = insertSubset(isBanned);

        emit Deposit(commitment, leafIndex, block.timestamp);
        return leafIndex;
    }

    function withdraw(
        uint[8] calldata flatProof,
        uint root,
        uint subsetRoot,
        uint nullifierHash,
        address recipient,
        address relayer,
        uint fee
    )
        public
        payable
        nonReentrant
        returns (bool)
    {
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

        emit Withdrawal(recipient, relayer, subsetRoot, nullifierHash, fee);

        return true;
    }

    function _processDeposit() internal {
        require(
            msg.value == denomination,
            "Please send exactly 0.1 ETH along with transaction"
        );
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

        (bool success, ) = _recipient.call{ value: (denomination - _fee) }("");
        require(success, "payment to _recipient did not go thru");
        if (_fee > 0) {
            (success, ) = _relayer.call{ value: _fee }("");
            require(success, "payment to _relayer did not go thru");
        }
    }
}
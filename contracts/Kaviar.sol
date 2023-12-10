// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.10;
pragma experimental ABIEncoderV2;

import "./MerkleTree.sol";
import "./MerkleTreeSubset.sol";
import "./Verifier.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata input
    ) external view returns (bool);
}

contract Kaviar is MerkleTree, ReentrancyGuard {
    uint256 public immutable denomination;
    IVerifier public immutable verifier;

    mapping(bytes32 => bool) public nullifierHashes;

    event Deposit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        bytes32 root,
        bytes32[20] pathElements,
        uint8[20] pathIndices,
        uint256 timestamp
    );

    event SubsetDeposit(
        bytes32 indexed commitment,
        address subsetAddress,
        uint32 leafIndex,
        bytes32 root,
        bytes32[20] pathElements,
        uint8[20] pathIndices,
        uint256 timestamp
    );

    event Withdrawal(
        address to,
        bytes32 nullifierHash,
        address indexed relayer,
        uint256 fee
    );

    constructor(
        IVerifier _verifier,
        uint256 _denomination,
        address poseidon
    ) MerkleTree(poseidon) {
        require(_denomination > 0, "denomination should be greater than 0");
        verifier = _verifier;
        denomination = _denomination;
    }

    /**
    @dev Deposit funds into the contract. The caller must send value equal to `denomination` of this instance.
    @param commitment the note commitment, which is PoseidonHash(nullifier, 1, leafIndex)
    @param subsetTreeAddress the address of the subsetTree depositor is allowed to transact into
    */
    function deposit(
        bytes32 commitment,
        address subsetTreeAddress
    ) external payable nonReentrant {
        require(msg.value == denomination, "Invalid Amount");

        (
            uint32 insertedIndex,
            bytes32 root,
            bytes32[20] memory pathElements,
            uint8[20] memory pathIndices
        ) = _insert(commitment);

        MerkleTreeSubset subset_tree = MerkleTreeSubset(subsetTreeAddress);

        if (
            subset_tree.typeOfList() && !subset_tree.isBlacklisted(msg.sender)
        ) {
            (
                uint32 insertedIndexSubset,
                bytes32 rootSubset,
                bytes32[20] memory pathElementsSubset,
                uint8[20] memory pathIndicesSubset
            ) = subset_tree._insertSubset(commitment);

            emit SubsetDeposit(
                commitment,
                subsetTreeAddress,
                insertedIndexSubset,
                rootSubset,
                pathElementsSubset,
                pathIndicesSubset,
                block.timestamp
            );
        } else if (
            !subset_tree.typeOfList() && subset_tree.isAllowlisted(msg.sender)
        ) {
            (
                uint32 insertedIndexSubset,
                bytes32 rootSubset,
                bytes32[20] memory pathElementsSubset,
                uint8[20] memory pathIndicesSubset
            ) = subset_tree._insertSubset(commitment);

            emit SubsetDeposit(
                commitment,
                subsetTreeAddress,
                insertedIndexSubset,
                rootSubset,
                pathElementsSubset,
                pathIndicesSubset,
                block.timestamp
            );
        }

        emit Deposit(
            commitment,
            insertedIndex,
            root,
            pathElements,
            pathIndices,
            block.timestamp
        );
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
        Proof calldata _proof,
        bytes32 _root,
        bytes32 _subsetRoot,
        bytes32 _nullifierHash,
        address _recipient,
        address _relayer,
        uint256 _fee
    ) external payable nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");
        require(!isSpent(_nullifierHash), "The note has been already spent");
        require(isKnownRoot(_root), "Cannot find merkle root");
        require(
            verifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [
                    uint256(_root),
                    uint256(_subsetRoot),
                    uint256(_nullifierHash),
                    uint256(uint160(_recipient)),
                    uint256(uint160(_relayer)),
                    _fee
                ]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;
        _processWithdraw(_recipient, _relayer, _fee);
        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    }

    function _processWithdraw(
        address _recipient,
        address _relayer,
        uint256 _fee
    ) internal {
        // sanity checks
        require(
            msg.value == 0,
            "Message value is supposed to be zero for ETH instance"
        );
        payable(_recipient).call{value: denomination - _fee};

        if (_fee > 0) {
            payable(_relayer).call{value: _fee};
        }
    }

    function isSpent(bytes32 _nullifierHash) public view returns (bool) {
        return nullifierHashes[_nullifierHash];
    }

    function isSpentArray(
        bytes32[] calldata _nullifierHashes
    ) external view returns (bool[] memory spent) {
        spent = new bool[](_nullifierHashes.length);
        for (uint256 i = 0; i < _nullifierHashes.length; i++) {
            if (isSpent(_nullifierHashes[i])) {
                spent[i] = true;
            }
        }
    }
}

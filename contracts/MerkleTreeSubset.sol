// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface HasherSubset {
    function poseidon(bytes32[2] calldata leftRight)
        external
        pure
        returns (bytes32);
}

contract MerkleTreeSubset {
    uint256 public constant FIELD_SIZE_SUBSET =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant ZERO_VALUE_SUBSET =
        543544072303548185257517071258879077999438229338741863745347926248040160894; // = keccak256("empty") % FIELD_SIZE

    HasherSubset public hasherSubset;

    uint32 public immutable levelsSubset = 20;

    // the following variables are made public for easier testing and debugging and
    // are not supposed to be accessed in regular code
    bytes32[] public filledSubtreesSubset;
    bytes32[] public zerosSubset;
    uint32 public currentRootIndexSubset = 0;
    uint32 public nextIndexSubset = 0;
    uint32 public constant ROOT_HISTORY_SIZE_SUBSET = 100;
    bytes32[ROOT_HISTORY_SIZE_SUBSET] public rootsSubset;

    constructor(address _hasher) {
        hasherSubset = HasherSubset(_hasher);

        bytes32 currentZeroSubset = bytes32(ZERO_VALUE_SUBSET);
        zerosSubset.push(currentZeroSubset);
        filledSubtreesSubset.push(currentZeroSubset);

        for (uint32 i = 1; i < levelsSubset; i++) {
            currentZeroSubset = hashLeftRightSubset(currentZeroSubset, currentZeroSubset);
            zerosSubset.push(currentZeroSubset);
            filledSubtreesSubset.push(currentZeroSubset);
        }

        rootsSubset[0] = hashLeftRightSubset(currentZeroSubset, currentZeroSubset);
    }

    /**
    @dev Hash 2 tree leaves, returns MiMC(_left, _right)
  */
    function hashLeftRightSubset(bytes32 _left, bytes32 _right)
        public
        view
        returns (bytes32)
    {
        require(
            uint256(_left) < FIELD_SIZE_SUBSET,
            "_left should be inside the field"
        );
        require(
            uint256(_right) < FIELD_SIZE_SUBSET,
            "_right should be inside the field"
        );
        bytes32[2] memory leftright = [_left, _right];
        return hasherSubset.poseidon(leftright);
    }

    /**
    @dev Returns the last root
  */
    function getLastRootSubset() public view returns (bytes32) {
        return rootsSubset[currentRootIndexSubset];
    }

    /**
    @dev Whether the root is present in the root history
  */
    function isKnownRootSubset(bytes32 _root) public view returns (bool) {
        if (_root == 0) return false;

        uint32 i = currentRootIndexSubset;
        do {
            if (_root == rootsSubset[i]) return true;
            if (i == 0) i = ROOT_HISTORY_SIZE_SUBSET;
            i--;
        } while (i != currentRootIndexSubset);
        return false;
    }

    function _insertSubset(bytes32 _leaf) internal returns (uint32 index) {
        uint32 currentIndex = nextIndexSubset;
        require(
            currentIndex != uint32(2)**levelsSubset,
            "Merkle tree is full. No more leafs can be added"
        );
        nextIndexSubset += 1;
        bytes32 currentLevelHash = _leaf;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < levelsSubset; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zerosSubset[i];

                filledSubtreesSubset[i] = currentLevelHash;
            } else {
                left = filledSubtreesSubset[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRightSubset(left, right);

            currentIndex /= 2;
        }

        currentRootIndexSubset = (currentRootIndexSubset + 1) % ROOT_HISTORY_SIZE_SUBSET;
        rootsSubset[currentRootIndexSubset] = currentLevelHash;
        return nextIndexSubset - 1;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface PoseidonSubset {
    function poseidon(uint256[2] calldata) external pure returns (uint);
}

contract MerkleTreeSubset {

    uint256 public constant FIELD_SIZE_SUBSET =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint public constant ROOT_HISTORY_SIZE_SUBSET = 30;

    uint32 public immutable levelsSubset = 20;

    error MerkleTreeSubsetCapacity();

    PoseidonSubset public hasherSubset;
    mapping (uint => uint) public zerosSubset;
    mapping (uint => uint) public filledSubtreesSubset;
    mapping (uint => uint) public rootsSubset;    
    uint public currentRootIndexSubset;
    uint public nextIndexSubset;

    constructor(address poseidon, uint zeroValueSubset) {
        hasherSubset = PoseidonSubset(poseidon);
        for (uint i; i < levelsSubset;) {
            zerosSubset[i] = zeroValueSubset;
            filledSubtreesSubset[i] = zeroValueSubset;
            zeroValueSubset = hasherSubset.poseidon([zeroValueSubset, zeroValueSubset]);
            unchecked { ++i; }
        }
        rootsSubset[0] = zeroValueSubset;
    }

    function getLastRootSubset() public view returns (uint) {
        return rootsSubset[currentRootIndexSubset];
    }

    function isKnownRootSubset(uint root) public view returns (bool) {
        if (root == 0) return false;
        uint checkIndex = currentRootIndexSubset;
        for (uint i; i < ROOT_HISTORY_SIZE_SUBSET;) {
            if (root == rootsSubset[checkIndex]) return true;
            if (checkIndex == 0) checkIndex = ROOT_HISTORY_SIZE_SUBSET;
            unchecked {
                ++i;
                --checkIndex;
            }
        }
        return false;
    }

    function insertSubset(uint isBanned) internal returns (uint) {
        if (nextIndexSubset == 1 << levelsSubset) revert MerkleTreeSubsetCapacity();
        uint currentIndex = nextIndexSubset;
        uint currentHash = isBanned;
        uint left;
        uint right;
        for (uint i; i < levelsSubset;) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zerosSubset[i];
                filledSubtreesSubset[i] = currentHash;
            } else {
                left = filledSubtreesSubset[i];
                right = currentHash;
            }

            require(
            left < FIELD_SIZE_SUBSET,
            "left should be inside the field");

            require(
            right < FIELD_SIZE_SUBSET,
            "right should be inside the field"
            );

            currentHash = hasherSubset.poseidon([left, right]);
            unchecked {
                ++i;
                currentIndex >>= 1;
            }
        }
        unchecked {
            currentRootIndexSubset = addmod(currentRootIndexSubset, 1, ROOT_HISTORY_SIZE_SUBSET);
            rootsSubset[currentRootIndexSubset] = currentHash;
            return nextIndexSubset++;
        }
    }

    function testInsertSubset(uint leaf) public returns (uint) {
        if (nextIndexSubset == 1 << levelsSubset) revert MerkleTreeSubsetCapacity();
        uint currentIndex = nextIndexSubset;
        uint currentHash = leaf;
        uint left;
        uint right;
        for (uint i; i < levelsSubset;) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zerosSubset[i];
                filledSubtreesSubset[i] = currentHash;
            } else {
                left = filledSubtreesSubset[i];
                right = currentHash;
            }
            currentHash = hasherSubset.poseidon([left, right]);
            unchecked {
                ++i;
                currentIndex >>= 1;
            }
        }
        unchecked {
            currentRootIndexSubset = addmod(currentRootIndexSubset, 1, ROOT_HISTORY_SIZE_SUBSET);
            rootsSubset[currentRootIndexSubset] = currentHash;
            return nextIndexSubset++;
        }
    }
}
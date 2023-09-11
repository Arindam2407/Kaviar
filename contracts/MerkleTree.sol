// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface Poseidon {
    function poseidon(uint256[2] calldata) external pure returns (uint);
}

contract MerkleTree {

    uint256 public constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
        
    uint public constant ROOT_HISTORY_SIZE = 30;

    uint32 public immutable levels = 20;

    error MerkleTreeCapacity();

    Poseidon public hasher;
    mapping (uint => uint) public zeros;
    mapping (uint => uint) public filledSubtrees;
    mapping (uint => uint) public roots;    
    uint public currentRootIndex;
    uint public nextIndex;

    constructor(address poseidon, uint zeroValue) {
        hasher = Poseidon(poseidon);
        for (uint i; i < levels;) {
            zeros[i] = zeroValue;
            filledSubtrees[i] = zeroValue;
            zeroValue = hasher.poseidon([zeroValue, zeroValue]);
            unchecked { ++i; }
        }
        roots[0] = zeroValue;
    }

    function getLastRoot() public view returns (uint) {
        return roots[currentRootIndex];
    }

    function isKnownRoot(uint root) public view returns (bool) {
        if (root == 0) return false;
        uint checkIndex = currentRootIndex;
        for (uint i; i < ROOT_HISTORY_SIZE;) {
            if (root == roots[checkIndex]) return true;
            if (checkIndex == 0) checkIndex = ROOT_HISTORY_SIZE;
            unchecked {
                ++i;
                --checkIndex;
            }
        }
        return false;
    }

    function insert(uint leaf) internal returns (uint) {
        if (nextIndex == 1 << levels) revert MerkleTreeCapacity();
        uint currentIndex = nextIndex;
        uint currentHash = leaf;
        uint left;
        uint right;
        for (uint i; i < levels;) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zeros[i];
                filledSubtrees[i] = currentHash;
            } else {
                left = filledSubtrees[i];
                right = currentHash;
            }

            require(
            left < FIELD_SIZE,
            "left should be inside the field");

            require(
            right < FIELD_SIZE,
            "right should be inside the field"
            );

            currentHash = hasher.poseidon([left, right]);
            unchecked {
                ++i;
                currentIndex >>= 1;
            }
        }
        unchecked {
            currentRootIndex = addmod(currentRootIndex, 1, ROOT_HISTORY_SIZE);
            roots[currentRootIndex] = currentHash;
            return nextIndex++;
        }
    }

    function testInsert(uint leaf) public returns (uint) {
        if (nextIndex == 1 << levels) revert MerkleTreeCapacity();
        uint currentIndex = nextIndex;
        uint currentHash = leaf;
        uint left;
        uint right;
        for (uint i; i < levels;) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zeros[i];
                filledSubtrees[i] = currentHash;
            } else {
                left = filledSubtrees[i];
                right = currentHash;
            }
            currentHash = hasher.poseidon([left, right]);
            unchecked {
                ++i;
                currentIndex >>= 1;
            }
        }
        unchecked {
            currentRootIndex = addmod(currentRootIndex, 1, ROOT_HISTORY_SIZE);
            roots[currentRootIndex] = currentHash;
            return nextIndex++;
        }
    }
}
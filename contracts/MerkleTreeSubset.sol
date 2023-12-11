// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface HasherSubset {
    function poseidon(
        bytes32[2] calldata leftRight
    ) external pure returns (bytes32);
}

contract MerkleTreeSubset {
    uint256 public constant FIELD_SIZE_SUBSET =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant ZERO_VALUE_SUBSET =
        21663839004416932945382355908790599225266501822907911457504978515578255421292; // = keccak256("test") % FIELD_SIZE

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

    event RootAddedSubset(uint32 index, bytes32 hashValue);

    address public owner;
    bool public typeOfList;
    mapping(address => bool) public blacklist;
    mapping(address => bool) public allowlist;

    modifier isOwnable() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _hasher, bool _typeOfList) {
        owner = msg.sender;
        typeOfList = _typeOfList;
        hasherSubset = HasherSubset(_hasher);

        bytes32 currentZeroSubset = bytes32(ZERO_VALUE_SUBSET);
        zerosSubset.push(currentZeroSubset);
        filledSubtreesSubset.push(currentZeroSubset);

        for (uint32 i = 1; i < levelsSubset; i++) {
            currentZeroSubset = hashLeftRightSubset(
                currentZeroSubset,
                currentZeroSubset
            );
            zerosSubset.push(currentZeroSubset);
            filledSubtreesSubset.push(currentZeroSubset);
        }

        rootsSubset[0] = hashLeftRightSubset(
            currentZeroSubset,
            currentZeroSubset
        );
    }

    /**
    @dev Hash 2 tree leaves, returns MiMC(_left, _right)
  */
    function hashLeftRightSubset(
        bytes32 _left,
        bytes32 _right
    ) public view returns (bytes32) {
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

    function _insertSubset(
        bytes32 _leafSubset
    )
        public
        returns (
            uint32 index,
            bytes32 rootSubset,
            bytes32[20] memory pathElementsSubset
        )
    {
        uint32 currentIndexSubset = nextIndexSubset;
        require(
            currentIndexSubset != uint32(2) ** levelsSubset,
            "Merkle tree is full. No more leafs can be added"
        );
        nextIndexSubset += 1;
        bytes32 currentLevelHashSubset = _leafSubset;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < levelsSubset; i++) {
            if (currentIndexSubset % 2 == 0) {
                left = currentLevelHashSubset;
                right = zerosSubset[i];

                filledSubtreesSubset[i] = currentLevelHashSubset;
                pathElementsSubset[i] = zerosSubset[i];
            } else {
                left = filledSubtreesSubset[i];
                right = currentLevelHashSubset;

                pathElementsSubset[i] = filledSubtreesSubset[i];
            }

            currentLevelHashSubset = hashLeftRightSubset(left, right);

            currentIndexSubset /= 2;
        }

        currentRootIndexSubset =
            (currentRootIndexSubset + 1) %
            ROOT_HISTORY_SIZE_SUBSET;
        rootsSubset[currentRootIndexSubset] = currentLevelHashSubset;
        emit RootAddedSubset(currentRootIndexSubset, currentLevelHashSubset);
        return (
            nextIndexSubset - 1,
            currentLevelHashSubset,
            pathElementsSubset
        );
    }

    function blacklistAddress(address badActor) public isOwnable {
        require(!(isBlacklisted(badActor)), "Address already blacklisted");
        blacklist[badActor] = true;
    }

    function unBlacklistAddress(address goodActor) public isOwnable {
        require(isBlacklisted(goodActor), "Address not blacklisted");
        blacklist[goodActor] = false;
    }

    function isBlacklisted(address actor) public view returns (bool) {
        return blacklist[actor];
    }

    function allowlistAddress(address goodActor) public isOwnable {
        require(!(isAllowlisted(goodActor)), "Address already allowed");
        blacklist[goodActor] = true;
    }

    function unAllowlistAddress(address badActor) public isOwnable {
        require(isAllowlisted(badActor), "Address not allowed");
        blacklist[badActor] = false;
    }

    function isAllowlisted(address actor) public view returns (bool) {
        return allowlist[actor];
    }
}

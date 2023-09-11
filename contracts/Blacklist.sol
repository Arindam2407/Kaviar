// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Blacklist {
    address public owner;
    mapping(address => bool) public blacklist;

    modifier isOwnable {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function blacklistAddress(address badActor) public isOwnable {
        blacklist[badActor] = true;
    }

    function isBlacklisted(address actor) public view returns(bool) {
        return blacklist[actor];
    }
}
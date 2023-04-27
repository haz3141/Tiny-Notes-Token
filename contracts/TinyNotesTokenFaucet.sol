// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./TinyNotesToken.sol";

contract TinyNotesTokenFaucet {
    TinyNotesToken public token;
    uint256 public maxTokensPerRequest;

    constructor(address _tokenAddress, uint256 _maxTokensPerRequest, uint8 _decimals) {
        token = TinyNotesToken(_tokenAddress);
        maxTokensPerRequest = _maxTokensPerRequest * (10 ** _decimals);
    }

    function requestTokens() public {
        require(token.balanceOf(msg.sender) == 0, "You must have 0 balance to request tokens.");
        token.transfer(msg.sender, maxTokensPerRequest);
    }
}
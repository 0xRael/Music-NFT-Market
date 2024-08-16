// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MusicNFT is ERC721URIStorage{
    uint256 public nextTokenId;

    constructor() ERC721("MusicNFT", "MNFT") {}

    function mint(string memory _tokenURI) public {
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
    }
}
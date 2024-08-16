// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Music NFT's Marketplace
/// @author 0xRael
/// @notice A NFT marketplace that supports both ERC721 and ERC1155 tokens, which allows you to place, buy or even cancel listings
/// TODO: test security
/// TODO: upgrade ERC1155 integration
contract NFTMarketplace is ERC721Holder, ERC1155Holder {
    enum TokenType { Unknown, ERC721, ERC1155 }

    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        TokenType tokenType;
    }

    uint256 public listingIdCounter;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed listingId, address indexed seller, address indexed tokenContract, uint256 tokenId, uint256 amount, uint256 price);
    event Sold(uint256 indexed listingId, address indexed buyer);
    event Cancelled(uint256 indexed listingId);

    error NonexistentListing(uint listingId);
    error UnsupportedToken(address tokenContract);
    error IncorrectValue(uint valueSent, uint expectedValue);
    error IncorrectOwner(address sender);
    error InvalidListing();

    function listToken(
        address tokenContract, 
        uint256 tokenId, 
        uint256 price
    ) external {
        TokenType tokenType = _getTokenType(tokenContract);

        _listToken(tokenContract, tokenId, 1, price, tokenType);
    }

    function listToken(
        address tokenContract, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 price
    ) external {
        TokenType tokenType = _getTokenType(tokenContract);

        _listToken(tokenContract, tokenId, amount, price, tokenType);
    }

    function listToken(
        address tokenContract, 
        uint256 tokenId, 
        uint256 price, 
        TokenType tokenType
    ) external {
        _listToken(tokenContract, tokenId, 1, price, tokenType);
    }

    function listToken(
        address tokenContract, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 price, 
        TokenType tokenType
    ) external {
        _listToken(tokenContract, tokenId, amount, price, tokenType);
    }

    function buyToken(uint256 listingId) external payable {
        Listing memory listing = listings[listingId];
        if(listing.price == 0) {
            revert NonexistentListing(listingId);
        }
        if(msg.value != listing.price){
            revert IncorrectValue(msg.value, listing.price);
        }

        delete listings[listingId];

        if (listing.tokenType == TokenType.ERC721) {
            IERC721(listing.tokenContract).transferFrom(
                address(this), 
                msg.sender, 
                listing.tokenId
            );
        } else if (listing.tokenType == TokenType.ERC1155) {
            IERC1155(listing.tokenContract).safeTransferFrom(
                address(this), 
                msg.sender, 
                listing.tokenId, 
                listing.amount, 
                ""
            );
        }

        payable(listing.seller).transfer(listing.price);

        emit Sold(listingId, msg.sender);
    }

    function cancelListing(uint256 listingId) external {
        Listing memory listing = listings[listingId];
        if(listing.seller != msg.sender) {
            revert IncorrectOwner(msg.sender);
        }

        delete listings[listingId];

        if (listing.tokenType == TokenType.ERC721) {
            IERC721(listing.tokenContract).transferFrom(
                address(this), 
                msg.sender, 
                listing.tokenId
            );
        } else if (listing.tokenType == TokenType.ERC1155) {
            IERC1155(listing.tokenContract).safeTransferFrom(
                address(this), 
                msg.sender, 
                listing.tokenId, 
                listing.amount, 
                ""
            );
        }

        emit Cancelled(listingId);
    }

    function _getTokenType(address tokenContract) internal view returns(TokenType) {
        if(!IERC165(tokenContract).supportsInterface(type(IERC165).interfaceId)) {
            // Both ERC721 and ERC1155 supports ERC165 by default
            revert UnsupportedToken(tokenContract); 
        }

        if(IERC165(tokenContract).supportsInterface(type(IERC1155).interfaceId)){
            return(TokenType.ERC1155);
        } else if(IERC165(tokenContract).supportsInterface(type(IERC721).interfaceId)) {
            return(TokenType.ERC721);
        } else {
            revert UnsupportedToken(tokenContract);
        }
    }

    function _listToken(
        address tokenContract, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 price, 
        TokenType tokenType
    ) internal {
        if (price == 0 || amount == 0) {
            revert InvalidListing();
        }

        if (tokenType == TokenType.ERC721) {
            IERC721(tokenContract).transferFrom(
                msg.sender, 
                address(this), 
                tokenId
            );
            amount = 1; // NFTs can only be 1
        } else if (tokenType == TokenType.ERC1155) {
            IERC1155(tokenContract).safeTransferFrom(
                msg.sender, 
                address(this), 
                tokenId, 
                amount, 
                ""
            );
        } else {
            revert UnsupportedToken(tokenContract);
        }

        uint256 listingId = listingIdCounter++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            tokenType: tokenType
        });

        emit Listed(listingId, msg.sender, tokenContract, tokenId, amount, price);
    }
}
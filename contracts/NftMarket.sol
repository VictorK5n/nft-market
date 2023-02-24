// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftMarket is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    struct NFTItem {
        uint tokenId;
        uint price;
        address creator;
        bool isListed;
    }

    uint public listingPrice = 0.025 ether;

    Counters.Counter private _listedItems;
    Counters.Counter private _tokenIds;

    mapping(string => bool) private _usedTokenURIs;
    mapping(uint => NFTItem) private _idToNFTItem;

    // {
    //     0x2c : {
    //         0: 1, //index: tokenId
    //         1: 2, //index: tokenId
    //         2: 3, //index: tokenId
    //     }
    // }
    mapping(address => mapping(uint => uint)) private _ownedTokens;
    // {
    //     0: 1, //tokenId: index
    //     1: 2, //tokenId: index
    //     2: 3, //tokenId: index
    // }
    mapping(uint => uint) private _idToOwnedIndex;

    uint256[] private _allNfts; // all tokenIds in array
    mapping(uint => uint) private _idToNftIndex;

    event NFTItemCreated (
        uint tokenId,
        uint price,
        address creator,
        bool isListed
    );

    constructor() ERC721('CreaturesNFT', "CNFT") { // 1 - collections of NFTS, 2 - token name
    }

    function setListingPrice(uint newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be at least 1 wei");
        listingPrice = newPrice;
    }

    function getNFTItem(uint tokenId) public view returns (NFTItem memory) {
        return _idToNFTItem[tokenId];
    }

    function listedItemsCount() public view returns (uint) {
        return _listedItems.current();
    }

    function totalSupply() public view returns (uint) {
        return _allNfts.length;
    }

    function tokenByIndex(uint index) public view returns (uint) {
        require(index < totalSupply(), "Index out of the bounds");
        return _allNfts[index];
    }

    function tokenOfOwnerByIndex(address owner, uint index) public view returns (uint) {
        require(index < ERC721.balanceOf(owner), "Index out of the bounds");
        return _ownedTokens[owner][index];
    }

    function tokenURIExists(string memory tokenURI) public view returns (bool) {
        return _usedTokenURIs[tokenURI] == true;
    }

    function burnToken(uint tokenId) public {
        _burn(tokenId);
    }

    function getAllNftsOnSale() public view returns (NFTItem[] memory) {
        uint allItemsCount = totalSupply();
        uint currentIndex = 0;
        NFTItem[] memory items = new NFTItem[](_listedItems.current());

        for (uint i = 0; i < allItemsCount; i++) {
            uint tokenId = tokenByIndex(i);
            NFTItem storage item = _idToNFTItem[tokenId];

            if (item.isListed == true) {
                items[currentIndex] = item;
                currentIndex += 1;
            }
        }

        return items;
    }

    function getOwnedNfts() public view returns (NFTItem[] memory) {
        uint ownedItemsCount = ERC721.balanceOf(msg.sender);
        NFTItem[] memory items = new NFTItem[](ownedItemsCount);

        for (uint i = 0; i < ownedItemsCount; i++) {
            uint tokenId = tokenOfOwnerByIndex(msg.sender, i);
            NFTItem storage item = _idToNFTItem[tokenId];
            items[i] = item;
        }

        return items;
    }

    function mintToken(string memory tokenURI, uint price) public payable returns (uint) {
        require(!tokenURIExists(tokenURI), "Token URI already exists");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _tokenIds.increment();
        _listedItems.increment();

        uint newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _createNFTItem(newTokenId, price);
        _usedTokenURIs[tokenURI] = true;

        return newTokenId;
    }

    function buyNft(uint tokenId)  public payable {
        uint price = _idToNFTItem[tokenId].price;
        address owner = ERC721.ownerOf(tokenId);

        require(msg.sender != owner, "You already won this NFT");
        require(msg.value == price, "Please, sumbit the asking price");

        _idToNFTItem[tokenId].isListed = false;
        _listedItems.decrement();

        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);
    }

    function placeNftOnSale(uint tokenId, uint newPrice) public payable  {
        require(ERC721.ownerOf(tokenId) == msg.sender, "You are not owner of this NFT");
        require(_idToNFTItem[tokenId].isListed == false, "Item is already on safe");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _idToNFTItem[tokenId].isListed = true;
        _idToNFTItem[tokenId].price = newPrice;
        _listedItems.increment();
    }

    function _createNFTItem(uint tokenId, uint price) private {
        require(price > 0, "Price must be at least 1 wei");

        _idToNFTItem[tokenId] = NFTItem(
            tokenId,
            price,
            msg.sender,
            true
        );

        emit NFTItemCreated(tokenId, price,  msg.sender, true);
    }

    function _beforeTokenTransfer(address from, address to, uint tokenId, uint batchSize) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // minting token
        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }

        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    function _addTokenToAllTokensEnumeration(uint tokenId) private {
        _idToNftIndex[tokenId] = _allNfts.length;
        _allNfts.push(tokenId);
    }

    function _addTokenToOwnerEnumeration(address to, uint tokenId) private {
        uint length = ERC721.balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _idToOwnedIndex[tokenId] = length;
    }
    function _removeTokenFromOwnerEnumeration(address from, uint tokenId) private {
        // {
            //     0x2c : {
            //         0: 1, //index: tokenId || 1:0 tokenId:index
            //         1: 2, //index: tokenId || 2:1 tokenId:index
            //         2: 3, //index: tokenId || 3:2 tokenId:index
            //     }
        // }
       
        uint lastTokenIndex = ERC721.balanceOf(from) - 1; // 2
        uint tokenIndex = _idToOwnedIndex[lastTokenIndex]; // 1

        if (tokenIndex != lastTokenIndex) {
            uint lastTokenId = _ownedTokens[from][lastTokenIndex]; // 3

            _ownedTokens[from][tokenIndex] = lastTokenId;
            _idToOwnedIndex[lastTokenId] = tokenIndex;
        }

        delete _idToOwnedIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];

        // {
            //     0x2c : {
            //         0: 1, //index: tokenId || 1:0 tokenId:index
            //         1: 2 => 3, //index: tokenId || 
            //                                     || 3:2 => 1 tokenId:index
            //     }
        // }
    }

    function _removeTokenFromAllTokensEnumeration(uint tokenId) private {
        uint lastTokenIndex = _allNfts.length - 1;
        uint tokenIndex = _idToNftIndex[tokenId];
        uint lastTokenId = _idToNftIndex[lastTokenIndex];
 
        _allNfts[tokenIndex] = lastTokenId;
        _idToNftIndex[lastTokenId] = tokenIndex;

        delete _idToNftIndex[tokenId];
        _allNfts.pop();
    }
}

const NftMarket = artifacts.require("NftMarket");
const { ethers } = require("ethers");

contract("NftMarket", (accounts) => {
  let _contract = null;
  let _nftPrice = ethers.utils.parseEther("0.3").toString();
  let _listingPrice = ethers.utils.parseEther("0.025").toString();

  before(async () => {
    _contract = await NftMarket.deployed();
  });

  describe("Mint token", () => {
    const tokenURI = "https://test.com";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });

    it("owner of the first token should be address[0]", async () => {
      const owner = await _contract.ownerOf(1); // 1 - tokenId
      assert(
        owner === accounts[0],
        "Owner of token is not matching address[0]"
      );
    });

    it("the first token should point to the correct tokenURI", async () => {
      const actualTokenURI = await _contract.tokenURI(1); // 1 - tokenId
      assert(
        actualTokenURI === tokenURI,
        "The first token pointed to another tokenURI"
      );
    });

    it("should not be possible to create NFT with already used tokenURI", async () => {
      try {
        await _contract.mintToken(tokenURI, _nftPrice, {
          from: accounts[0],
          value: _listingPrice,
        });
      } catch (error) {
        assert(error, "NFT was minted with previously used tokenURI");
      }
    });

    it("should have one listed item", async () => {
      const listedItems = await _contract.listedItemsCount();
      assert(listedItems.toNumber() === 1, "Listed items count is not 1");
    });

    it("should have created NFT item", async () => {
      const nftItem = await _contract.getNFTItem(1);

      assert.equal(nftItem.tokenId, 1, "Token id is not 1");
      assert.equal(nftItem.price, _nftPrice, "Nft price is not correct");
      assert.equal(nftItem.creator, accounts[0], "Creator is not account[0]");
      assert.equal(nftItem.isListed, true, "Nft item is not listed");
    });
  });

  describe("Buy NFT", () => {
    before(async () => {
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice,
      });
    });
    it("Should unlist the item", async () => {
      const listedItem = await _contract.getNFTItem(1);
      assert(listedItem.isListed === false, "Item is still listed");
    });

    it("Should descrese listedItems count", async () => {
      const listedItemsCount = await _contract.listedItemsCount();
      assert(listedItemsCount.toNumber() === 0, "Items is not descresed");
    });

    it("Should change the owner", async () => {
      const currentOwner = await _contract.ownerOf(1);
      assert(currentOwner === accounts[1], "Owner is still previous");
    });
  });

  describe("Token transfers", () => {
    const tokenURI = "https://test-json-2.com";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });

    it("Should have two NFTs created", async () => {
      const totalSupply = await _contract.totalSupply();
      assert(totalSupply.toNumber() === 2, "Not have two NFTs");
    });

    it("Should be able to retreive NFT by index", async () => {
      const nftId1 = await _contract.tokenByIndex(0);
      const nftId2 = await _contract.tokenByIndex(1);
      assert(nftId1.toNumber() === 1, "NFT by index is not exact");
      assert(nftId2.toNumber() === 2, "NFT by index is not exact");
    });

    it("Should have 1 NFTs for listing", async () => {
      const totalListedNfts = await _contract.getAllNftsOnSale();
      assert(totalListedNfts.length === 1, "The count is wrong");
      assert.equal(totalListedNfts[0].tokenId, 2, "The owner is wrong");
    });

    it("Account[1] should have 1 owned NFT", async () => {
      const ownedNFTs = await _contract.getOwnedNfts({
        from: accounts[1],
      });

      assert.equal(ownedNFTs[0].tokenId, 1, "The owner is wrong");
    });

    it("Account[0] should have 1 owned NFT", async () => {
      const ownedNFTs = await _contract.getOwnedNfts({
        from: accounts[0],
      });

      assert.equal(ownedNFTs[0].tokenId, 2, "The owner is wrong");
    });
  });

  describe("Token transfer to new owner", () => {
    before(async () => {
      await _contract.transferFrom(accounts[0], accounts[1], 2);
    });

    it("Account[0] should own zero tokens", async () => {
      const ownedNFTs = await _contract.getOwnedNfts({
        from: accounts[0],
      });

      assert.equal(ownedNFTs.length, 0, "The count tokens of owner is wrong");
    });

    it("Account[1] should own two tokens", async () => {
      const ownedNFTs = await _contract.getOwnedNfts({
        from: accounts[1],
      });

      assert.equal(ownedNFTs.length, 2, "The count tokens of owner is wrong");
    });
  });

  describe("List an Nft", () => {
    before(async () => {
      await _contract.placeNftOnSale(1, _nftPrice, {
        from: accounts[1],
        value: _listingPrice,
      });
    });

    it("Should have two listed items", async () => {
      const allNfts = await _contract.getAllNftsOnSale();

      assert.equal(allNfts.length, 2, "Invalid length of listed Nfts");
    });

    it("Should set new listing price", async () => {
      await _contract.setListingPrice(_listingPrice, {
        from: accounts[0],
      });

      const listingPrice = await _contract.listingPrice();

      assert.equal(
        listingPrice.toString(),
        _listingPrice,
        "Listing price is not equal"
      );
    });
  });

  //   describe("Burn token", () => {
  //     const tokenURI = "https://test-json3.com";
  //     before(async () => {
  //       await _contract.mintToken(tokenURI, _nftPrice, {
  //         from: accounts[2],
  //         value: _listingPrice,
  //       });
  //     });

  //     it("Account[2] should own zero tokens", async () => {
  //       const ownedNFTs = await _contract.getOwnedNfts({
  //         from: accounts[2],
  //       });

  //       assert.equal(ownedNFTs.length, 1, "The count tokens of owner is wrong");
  //     });

  //     it("Account[2] should own zero NFTs", async () => {
  //       await _contract.burnToken(3, {
  //         from: accounts[2],
  //       });

  //       const ownedNFTs = await _contract.getOwnedNfts({
  //         from: accounts[2],
  //       });

  //       assert.equal(ownedNFTs.length, 0, "The count NFTs of owner is wrong");
  //     });
  //   });
});

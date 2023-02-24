const instance = await NftMarket.deployed();

instance.mintToken(
  "https://gateway.pinata.cloud/ipfs/Qmb4aom5xNRE5CBRHZsxCsYSdcmX8zfHXgM7ovZxLp3CqL?_gl=1*1vkqk5u*_ga*MTU1NzA2ODU1My4xNjc2MjExOTYz*_ga_5RMPXG14TE*MTY3NjIxMTk2My4xLjEuMTY3NjIxMjU4MS41Ni4wLjA.",
  "500000000000000000",
  { value: "25000000000000000", from: accounts[0] }
);

instance.mintToken(
  "https://gateway.pinata.cloud/ipfs/QmcqxBeE2XfagzEBYnaCUfHHTRLMiHi6xap6BDFLoNUfTN?_gl=1*13rinyd*_ga*MTU1NzA2ODU1My4xNjc2MjExOTYz*_ga_5RMPXG14TE*MTY3NjIxMTk2My4xLjEuMTY3NjIxMjU5Mi40NS4wLjA.",
  "300000000000000000",
  { value: "25000000000000000", from: accounts[0] }
);

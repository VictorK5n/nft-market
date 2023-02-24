const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("./keys.json");

module.exports = {
  contracts_build_directory: "./public/contracts",
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
    sepolia: {
      provider: () =>
        new HDWalletProvider(keys.PRIVATE_KEY, keys.INFURA_SEPOLIA_URL),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 30000000,
      conformations: 2,
      timeoutBlocks: 200,
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.18", // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
};

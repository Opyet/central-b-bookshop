const path = require("path");

const infuraURL = 'https://ropsten.infura.io/v3/b85073b90dae4be0b74b274025002a01';
const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  compilers: {
    solc: {
      version: "0.6.11",
    },
  },
  networks: {
    develop: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*"        // Any network (default: none)           
    },


    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, infuraURL),
      network_id: 3,       // Ropsten's id
      gas: 5500000       // Ropsten has a lower block limit than mainnet
      //confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      //timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      //skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  }
};

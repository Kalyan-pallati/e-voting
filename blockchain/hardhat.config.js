require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    // We add a specific network for Ganache
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337, // Ganache GUI often uses 1337 for localhost compatibility, or 5777
    },
  },
};
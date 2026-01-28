const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingModule", (m) => {
  // This deploys the contract "VotingSystem"
  const voting = m.contract("VotingSystem");

  // Returns the deployed contract instance
  return { voting };
});
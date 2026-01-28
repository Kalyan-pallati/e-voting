import React, { useContext } from "react";
import { BlockchainContext } from "../context/BlockChainContext";

export default function ConnectWallet() {
  const { connectWallet, account } = useContext(BlockchainContext);

  return (
    <div>
      {account ? (
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm font-semibold">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
            alt="MetaMask" 
            className="w-5 h-5"
          />
          Connect Wallet
        </button>
      )}
    </div>
  );
}
import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

export const BlockchainContext = createContext();

export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask!");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      initializeContract();
    } catch (error) {
      console.error(error);
    }
  };

  const changeAccount = async () => {
    try {
      if (!window.ethereum) return;
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      setAccount(accounts[0]);
      initializeContract();
    } catch (error) {
      console.error("User cancelled account switch");
    }
  };

  const disconnectLocal = () => {
    setAccount("");
    setContract(null);
    setProvider(null);
  };

  const initializeContract = async () => {
    if (window.ethereum) {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await _provider.getSigner();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      window.contract = contract;
      setProvider(_provider);
      setContract(_contract);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        initializeContract();
      }
    };
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            window.location.reload(); 
        } else {
            disconnectLocal();
        }
      });
    }
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        account,
        connectWallet,
        changeAccount,    // <--- NEW FUNCTION
        disconnectLocal,  // <--- NEW FUNCTION
        contract,
        provider
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};
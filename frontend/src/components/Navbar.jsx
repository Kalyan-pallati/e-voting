import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BlockchainContext } from "../context/BlockchainContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, changeAccount, connectWallet, disconnectLocal } = useContext(BlockchainContext);
  
  // Get role to decide what links to show
  const role = localStorage.getItem("role"); 

  const handleLogout = () => {
    localStorage.clear();
    disconnectLocal();
    navigate("/login");
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LEFT: Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                V
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 tracking-tight">
                VoteChain
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex gap-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              <NavLink to="/dashboard" active={location.pathname === "/dashboard"}>
                Dashboard
              </NavLink>
              
              {role === "admin" ? (
                <>
                  <NavLink to="/admin/elections" active={location.pathname.includes("/elections")}>
                    Elections
                  </NavLink>
                  <NavLink to="/admin/candidates" active={location.pathname.includes("/candidates")}>
                    Candidates
                  </NavLink>
                </>
              ) : (
                <NavLink to="/elections" active={location.pathname.includes("/elections")}>
                  Active Vote
                </NavLink>
              )}
            </div>
          </div>

          {/* RIGHT: Wallet & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Wallet Switcher */}
            {account ? (
                <button 
                    onClick={changeAccount}
                    className="group relative flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-green-200"
                >
                    {/* Metamask Icon */}
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                      alt="MetaMask" 
                      className="w-6 h-6 drop-shadow-sm group-hover:scale-110 transition-transform"
                    />
                    
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 uppercase tracking-wide">
                        Connected
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </span>
                      {/* Address preview (Tiny) */}
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {account.slice(0, 5)}...{account.slice(-4)}
                      </span>
                    </div>

                    {/* Tooltip on Hover */}
                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                      Click to Switch Wallet
                      {/* Little arrow pointing up */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                </button>
            ) : (
                <button
                    onClick={connectWallet}
                    className="flex items-center gap-2 bg-[#F6851B] hover:bg-[#e2761b] text-white px-5 py-2.5 rounded-full font-bold transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                      alt="MetaMask" 
                      className="w-5 h-5 filter brightness-0 invert" 
                    />
                    <span>Connect</span>
                </button>
            )}

            <div className="h-8 w-px bg-gray-200 mx-2"></div>

            <button 
                onClick={handleLogout} 
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 group"
                title="Logout" 
            >
                Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link 
      to={to} 
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        active 
          ? "bg-white text-blue-600 shadow-sm scale-120" 
          : "text-gray-500 hover:text-blue-600 hover:bg-white/50"
      }`}
    >
      {children}
    </Link>
  );
}
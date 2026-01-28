import React from "react";
import { useNavigate } from "react-router-dom";

export default function UserDashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] bg-gray-50 p-8">
      <main className="max-w-6xl mx-auto">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Voter Dashboard
            </h1>
            <p className="text-gray-500">
              Welcome back, <span className="font-semibold text-blue-600">{user?.email}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
             <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border border-green-100">
                Verified Voter
             </span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Active Elections */}
          <div 
            onClick={() => navigate("/elections")}
            className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between h-56"
          >
             <div>
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Active Elections</h3>
                <p className="text-gray-500 mt-2 leading-relaxed">
                    Cast your secure, blockchain-verified vote in ongoing elections.
                </p>
             </div>
             <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Vote Now &rarr;
             </div>
          </div>

          {/* Card 2: View Results (New Addition for better UX) */}
          <div 
            onClick={() => navigate("/elections")} // Goes to same list, user can click "Results" there
            className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer flex flex-col justify-between h-56"
          >
             <div>
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Election Results</h3>
                <p className="text-gray-500 mt-2 leading-relaxed">
                    View transparency reports and live vote counts for all elections.
                </p>
             </div>
             <div className="flex items-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                View Outcomes &rarr;
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
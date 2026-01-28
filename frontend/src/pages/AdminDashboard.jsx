import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] bg-gray-50 p-8">
      <main className="max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">
              Welcome back, <span className="font-semibold text-blue-600">{user?.email}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
             <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                System Administrator
             </span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Elections */}
          <div 
            onClick={() => navigate("/admin/elections")}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between h-48"
          >
             <div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Manage Elections</h3>
                <p className="text-sm text-gray-500 mt-2">Create new elections, publish drafts, and close voting.</p>
             </div>
          </div>

          {/* Card 2: Candidates (Drafting) */}
          <div 
            onClick={() => navigate("/admin/candidates")}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer flex flex-col justify-between h-48"
          >
             <div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">Draft Candidates</h3>
                <p className="text-sm text-gray-500 mt-2">Add candidates to specific draft elections before they go live.</p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
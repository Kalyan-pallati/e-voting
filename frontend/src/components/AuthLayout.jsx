import React from 'react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">
      
      {/* Left Branding Section - The "Alive" Visuals */}
      <div className="hidden md:flex relative flex-col justify-center px-16 text-white overflow-hidden bg-slate-900">
        
        {/* Animated/Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 opacity-90 z-10"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse z-0"></div>
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 z-0"></div>

        {/* Content */}
        <div className="relative z-20 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 mb-6">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium tracking-wide">Secure Digital Voting v1.0</span>
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-lg">
              Democracy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">
                Redefined.
              </span>
            </h1>
            
            <p className="text-lg text-blue-100 max-w-lg leading-relaxed">
              Experience the future of voting. A tamper-resistant, end-to-end secure platform built for integrity and trust.
            </p>
          </div>

          <div className="grid gap-4">
            {['End-to-end Encryption', 'Immutable Ledger', 'Real-time Analytics'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-50 group">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
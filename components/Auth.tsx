
import React, { useState } from 'react';
import { db } from '../services/db';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const user = db.login(email, password);
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
          name
        };
        db.register(newUser);
        db.login(email, password);
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const usps = [
    {
      title: "Audit by Exception",
      description: "Only touch documents that need your attention. Auto-clear the rest.",
      icon: "⚡"
    },
    {
      title: "Evidence-Linked Extractions",
      description: "Click any field to see the exact text on the document it came from.",
      icon: "🔍"
    },
    {
      title: "Duplicate Firewall",
      description: "Stop $20k double-payments before they hit your ERP system.",
      icon: "🛡️"
    },
    {
      title: "ERP Native Sync",
      description: "Seamless push to SAP Ariba, NetSuite, Coupa, and more.",
      icon: "🔌"
    }
  ];

  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Left Panel: USP & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-16 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">D</div>
            <h1 className="text-2xl font-black text-white uppercase tracking-widest">DocFlow</h1>
          </div>

          <div className="space-y-12 max-w-md">
            <h2 className="text-4xl font-black text-white leading-[1.1]">
              The Audit Engine for <span className="text-blue-500">Modern AP Teams.</span>
            </h2>
            
            <div className="grid gap-8">
              {usps.map((usp, i) => (
                <div key={i} className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl border border-slate-800 transition-colors group-hover:border-blue-500/50">
                    {usp.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{usp.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{usp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Trusted by 500+ Global Finance Teams
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center space-x-3 mb-12 justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">D</div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">DocFlow</h1>
          </div>

          <div className="bg-white p-8 lg:p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                {isLogin ? 'Sign In' : 'Join the Batch'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isLogin 
                  ? 'Access your accounts payable command center.' 
                  : 'Start automating your document workflows today.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
                    placeholder="Jane Cooper"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
                  placeholder="jane.cooper@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
                  {isLogin && <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Forgot?</button>}
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 transform active:scale-[0.98]"
              >
                {isLogin ? 'Enter Workspace' : 'Create Account'}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium mb-2">
                {isLogin ? "Don't have an auditor account yet?" : "Already have access to the engine?"}
              </p>
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                {isLogin ? "Join the Batch" : "Secure Sign In"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secured with AES-256 & Enterprise MFA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

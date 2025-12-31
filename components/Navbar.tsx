
import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight">
          DocFlow
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Audit Engine Ready</span>
        </div>
        
        <div className="flex items-center space-x-3 group">
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{user.name}</span>
            <button 
              onClick={onLogout}
              className="text-[9px] font-bold text-red-500 hover:underline uppercase"
            >
              Sign Out
            </button>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/10">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

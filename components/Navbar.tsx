
import React, { useState } from 'react';
import { User } from '../types';
import { Logo } from './Logo';
import LegendModal from './LegendModal';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-40">
      <div className="flex items-center space-x-4">
        <Logo size={36} />
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setIsLegendOpen(true)}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all font-bold text-sm shadow-sm"
          title="System Legend"
        >
          ?
        </button>

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
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-105">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>

      <LegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
    </header>
  );
};

export default Navbar;

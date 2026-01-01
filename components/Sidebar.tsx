
import React from 'react';
import { db } from '../services/db';
import { UserRole } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: string;
  setView: (v: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const user = db.getCurrentUser();
  
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.AUDITOR, UserRole.VIEWER] },
    { id: 'documents', label: 'Documents', icon: '📄', roles: [UserRole.ADMIN, UserRole.AUDITOR, UserRole.VIEWER] },
    { id: 'reports', label: 'Intelligence', icon: '📈', roles: [UserRole.ADMIN, UserRole.AUDITOR, UserRole.VIEWER] },
    { id: 'developers', label: 'Connectors', icon: '🔌', roles: [UserRole.ADMIN] },
    { id: 'admin', label: 'Admin', icon: '⚙️', roles: [UserRole.ADMIN] },
  ];

  const filteredNavItems = allNavItems.filter(item => user && item.roles.includes(user.role));

  const resolvedAddress = user?.orgHandle 
    ? `${user.orgHandle}@inbound.docflow.io` 
    : (user?.inboundAddress || 'Generating...');

  const copyToClipboard = () => {
    if (resolvedAddress !== 'Generating...') {
      navigator.clipboard.writeText(resolvedAddress);
      alert('Address copied to clipboard!');
    }
  };

  return (
    <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col font-sans border-r border-slate-800">
      <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
        <Logo size={36} inverse={true} hideText={true} />
        <div className="ml-3 flex flex-col">
          <span className="text-white font-black text-[10px] tracking-widest uppercase">Node Context</span>
          <span className="text-blue-500 font-black text-[9px] tracking-widest uppercase opacity-80">{user?.role}</span>
        </div>
      </div>
      
      <nav className="flex-1 mt-8 px-4 space-y-2">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40 translate-x-1' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="uppercase tracking-widest font-black text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 space-y-6 border-t border-slate-800">
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/50 hover:border-blue-500/30 transition-all">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Inbound Gateway
          </p>
          <div className="flex items-center justify-between group">
            <span className="text-[10px] font-mono text-blue-400 truncate pr-2 font-bold group-hover:text-blue-300 transition-colors">
              {resolvedAddress}
            </span>
            <button 
              onClick={copyToClipboard}
              className="text-slate-600 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
              title="Copy Address"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
          </div>
        </div>

        <div className="bg-slate-800/20 rounded-2xl p-4 border border-slate-800/30">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Quota</p>
            <span className="text-[9px] font-black text-blue-500">12%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-600 w-[12%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
          </div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">12 / 100 Documents</p>
        </div>

        <div className="pt-2 text-center opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
            Founder — Sourabh Bodkhe
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

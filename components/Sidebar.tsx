
import React from 'react';
import { db } from '../services/db';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: string;
  setView: (v: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const user = db.getCurrentUser();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

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
    <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col font-sans">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <Logo size={36} hideText={true} className="invert brightness-200" />
        <span className="ml-3 text-white font-black text-xs tracking-widest uppercase opacity-80">Workspace Alpha</span>
      </div>
      
      <nav className="flex-1 mt-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="uppercase tracking-tighter font-black">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 space-y-4 border-t border-slate-800">
        {/* Inbound Email Component */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Inbound Channel</p>
          <div className="flex items-center justify-between group">
            <span className="text-[10px] font-mono text-blue-400 truncate pr-2 font-bold">
              {resolvedAddress}
            </span>
            <button 
              onClick={copyToClipboard}
              className="text-slate-500 hover:text-white transition-colors"
              title="Copy Address"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
          </div>
          <p className="text-[8px] text-slate-500 mt-2 leading-relaxed uppercase font-black">
            Branded AI Gateway
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Quota Usage</p>
          <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-500 w-[12%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">12 / 100 Documents</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

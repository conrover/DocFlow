
import React from 'react';

interface SidebarProps {
  currentView: string;
  setView: (v: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'admin', label: 'Destinations', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-white font-semibold text-lg">Workspaces</span>
      </div>
      
      <nav className="flex-1 mt-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4 text-xs">
          <p className="text-slate-400 mb-2">QUOTA USAGE</p>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-500 w-[12%] rounded-full"></div>
          </div>
          <p className="text-slate-300 font-medium">12 / 100 Documents</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

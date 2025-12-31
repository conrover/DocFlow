
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Destination, DestinationType } from '../types';

const INTEGRATION_CATALOG: { type: DestinationType; label: string; icon: string; description: string }[] = [
  { type: 'webhook', label: 'Standard Webhook', icon: '🔗', description: 'Generic JSON POST for custom endpoints and middleware.' },
  { type: 'ariba_cxml', label: 'SAP Ariba (cXML)', icon: '📦', description: 'Native cXML format for seamless Ariba Network ingestion.' },
  { type: 'netsuite', label: 'Oracle NetSuite', icon: '☁️', description: 'Direct integration via NetSuite REST API and Token Auth.' },
  { type: 'coupa', label: 'Coupa BSM', icon: '💰', description: 'Push approved invoices directly to Coupa AP automation.' },
  { type: 'dynamics', label: 'Microsoft Dynamics', icon: '🏢', description: 'OData connection for 365 Finance & Operations.' },
  { type: 'csv', label: 'Flat File (CSV)', icon: '📄', description: 'GCS/S3 bucket export for legacy bulk imports.' },
];

const AdminPanel: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DestinationType>('webhook');
  const [newConfig, setNewConfig] = useState('{\n  "url": "",\n  "headers": {}\n}');

  useEffect(() => {
    setDestinations(db.getDestinations());
  }, []);

  const handleAdd = () => {
    try {
      const parsedConfig = JSON.parse(newConfig);
      const user = db.getCurrentUser();
      if (!user) return;

      const newDest: Destination = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        name: newName,
        type: newType,
        config: parsedConfig
      };
      db.saveDestination(newDest);
      setDestinations([...destinations, newDest]);
      setIsAdding(false);
      setNewName('');
      setNewConfig('{\n  "url": "",\n  "headers": {}\n}');
    } catch (e) {
      alert('Invalid JSON config');
    }
  };

  const getIcon = (type: DestinationType) => INTEGRATION_CATALOG.find(i => i.type === type)?.icon || '🔌';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Downstream Integrations</h2>
          <p className="text-sm text-slate-500 font-medium">Configure secure pipelines to your ERP or Financial system.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
          >
            New Connection
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border border-blue-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Setup New Endpoint</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Friendly Name</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="NetSuite Production"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Type</label>
              <select 
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700 bg-white"
              >
                {INTEGRATION_CATALOG.map(item => (
                  <option key={item.type} value={item.type}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connection Configuration (JSON)</label>
            <textarea 
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              rows={4}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs transition-all bg-slate-50"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={handleAdd}
              disabled={!newName}
              className={`px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-white transition-all text-xs ${
                !newName ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'
              }`}
            >
              Authorize Connection
            </button>
          </div>
        </div>
      )}

      {/* Integration Catalog Section */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Configured Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.length > 0 ? destinations.map((dest) => (
            <div key={dest.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-[9px] font-bold text-slate-200">#{dest.id}</div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">
                  {getIcon(dest.type)}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm leading-tight">{dest.name}</h4>
                  <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-widest mt-1 inline-block">
                    {dest.type}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-900 p-4 rounded-2xl overflow-hidden">
                <pre className="text-[9px] text-slate-300 font-mono scrollbar-none max-h-24 overflow-auto">
                  {JSON.stringify(dest.config, null, 2)}
                </pre>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-300">
               <span className="text-3xl mb-2 block">📡</span>
               <p className="text-sm font-bold text-slate-400 uppercase">No active connections found.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-8">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Possible Integrations Catalog</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATION_CATALOG.map((item) => (
            <div key={item.type} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-all cursor-pointer hover:border-blue-200">
               <div className="flex items-start space-x-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{item.description}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

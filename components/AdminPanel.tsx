
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Destination, DestinationType, User } from '../types';

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
  
  const [user, setUser] = useState<User | null>(null);
  const [orgHandle, setOrgHandle] = useState('');
  const [isUpdatingHandle, setIsUpdatingHandle] = useState(false);

  useEffect(() => {
    setDestinations(db.getDestinations());
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    if (currentUser?.orgHandle) {
      setOrgHandle(currentUser.orgHandle);
    }
  }, []);

  const handleAddDestination = () => {
    try {
      const parsedConfig = JSON.parse(newConfig);
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

  const handleSaveOrgHandle = () => {
    if (!user) return;
    setIsUpdatingHandle(true);
    // Sanitize handle
    const sanitized = orgHandle.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const updatedUser = { ...user, orgHandle: sanitized };
    db.updateUser(updatedUser);
    setUser(updatedUser);
    setOrgHandle(sanitized);
    setTimeout(() => {
      setIsUpdatingHandle(false);
      alert('Inbound email branding updated successfully.');
    }, 500);
  };

  const getIcon = (type: DestinationType) => INTEGRATION_CATALOG.find(i => i.type === type)?.icon || '🔌';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Admin</h2>
          <p className="text-sm text-slate-500 font-medium">Manage organization settings and downstream data pipelines.</p>
        </div>
      </div>

      {/* Workspace Configuration Section */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Workspace Gateway</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configure your branded inbound email address.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Routing Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inbound Custom Handle</label>
            <div className="flex items-stretch">
              <input 
                type="text" 
                value={orgHandle}
                onChange={(e) => setOrgHandle(e.target.value)}
                placeholder="company.ap"
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-l-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
              />
              <div className="px-5 flex items-center bg-slate-100 border-y border-r border-slate-200 rounded-r-2xl text-[10px] font-black text-slate-400 uppercase">
                @inbound.docflow.io
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic ml-1 font-medium">Use alphanumeric characters and periods only. Example: "netflix.ap"</p>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleSaveOrgHandle}
              disabled={isUpdatingHandle || !orgHandle}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                isUpdatingHandle ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/10 active:scale-95'
              }`}
            >
              {isUpdatingHandle ? 'Updating DNS...' : 'Apply Branding'}
            </button>
          </div>
        </div>

        {orgHandle && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black shadow-sm">@</div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Live Gateway URL</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-1">{orgHandle.toLowerCase()}@inbound.docflow.io</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Destinations</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-[10px]"
          >
            Add Connector
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] border border-blue-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
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
              onClick={handleAddDestination}
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

      {/* Integration List Section */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Sync Pipelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.length > 0 ? destinations.map((dest) => (
            <div key={dest.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-blue-300 transition-all hover:shadow-xl group relative overflow-hidden">
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
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">System Catalog</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATION_CATALOG.map((item) => (
            <div key={item.type} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-all cursor-pointer hover:border-blue-200">
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

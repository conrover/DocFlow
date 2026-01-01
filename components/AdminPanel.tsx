
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Destination, DestinationType, User, UserRole } from '../types';

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
  
  // Auto-Approve State
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(98);

  // 3-Way Match Tolerance State
  const [priceTolerance, setPriceTolerance] = useState(2);
  const [qtyTolerance, setQtyTolerance] = useState(0);

  useEffect(() => {
    setDestinations(db.getDestinations());
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    if (currentUser?.orgHandle) {
      setOrgHandle(currentUser.orgHandle);
    }
    if (currentUser) {
      setAutoApproveEnabled(currentUser.autoApproveEnabled ?? false);
      setAutoApproveThreshold(currentUser.autoApproveThreshold ?? 98);
    }
  }, []);

  const handleUpdateRole = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    db.updateUser(updated);
    setUser(updated);
    alert(`Security role updated to ${role}.`);
  };

  const handleSaveAutomation = () => {
    if (!user) return;
    const updatedUser = { 
      ...user, 
      autoApproveEnabled, 
      autoApproveThreshold 
    };
    db.updateUser(updatedUser);
    setUser(updatedUser);
    alert('Global automation policies and match tolerances synchronized.');
  };

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
    const sanitized = orgHandle.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const updatedUser = { ...user, orgHandle: sanitized };
    db.updateUser(updatedUser);
    setUser(updatedUser);
    setOrgHandle(sanitized);
    setTimeout(() => {
      setIsUpdatingHandle(false);
      alert('Inbound email gateway rebranded.');
    }, 500);
  };

  const getIcon = (type: DestinationType) => INTEGRATION_CATALOG.find(i => i.type === type)?.icon || '🔌';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">System Admin</h2>
          <p className="text-sm text-slate-500 font-medium">Manage organization settings and security protocols.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Management */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Identity & Access (RBAC)</h3>
          <div className="flex flex-wrap gap-3">
            {Object.values(UserRole).map((role) => (
              <button
                key={role}
                onClick={() => handleUpdateRole(role)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  user?.role === role 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                    : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase italic leading-relaxed">
            Note: Role changes affect document modification permissions across all workspaces.
          </p>
        </div>

        {/* 3-Way Match & Automation Settings */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Match Tolerance Policy</h3>
            <button 
              onClick={handleSaveAutomation}
              className="text-[9px] font-black bg-slate-900 text-white px-4 py-1.5 rounded-xl uppercase tracking-widest hover:bg-black transition-colors"
            >
              Sync Policies
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price Variance</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="number" 
                    value={priceTolerance}
                    onChange={(e) => setPriceTolerance(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-black text-slate-400">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity Buffer</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="number" 
                    value={qtyTolerance}
                    onChange={(e) => setQtyTolerance(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-black text-slate-400">UNITS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Auto-Approve STP</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Bypass human review on high confidence matches.</p>
              </div>
              <button 
                onClick={() => setAutoApproveEnabled(!autoApproveEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${autoApproveEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoApproveEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Configuration */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Inbound Gateway Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Handle</label>
            <div className="flex items-stretch shadow-sm">
              <input 
                type="text" 
                value={orgHandle}
                onChange={(e) => setOrgHandle(e.target.value)}
                placeholder="acme.ap"
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-l-2xl font-bold text-slate-800 outline-none transition-all"
              />
              <div className="px-5 flex items-center bg-slate-100 border-y border-r border-slate-200 rounded-r-2xl text-[9px] font-black text-slate-400 uppercase">
                @inbound.docflow.io
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleSaveOrgHandle}
              disabled={isUpdatingHandle || !orgHandle}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${
                isUpdatingHandle ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              {isUpdatingHandle ? 'Syncing MX Records...' : 'Update Handle'}
            </button>
          </div>
        </div>
      </div>

      {/* Connectors Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ERP Integration Connectors</h3>
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Add Endpoint</button>
          )}
        </div>

        {isAdding && (
          <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-blue-200 space-y-6 animate-in zoom-in-95">
            <div className="grid grid-cols-2 gap-6">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Endpoint Name" className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs" />
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs">
                {INTEGRATION_CATALOG.map(i => <option key={i.type} value={i.type}>{i.label}</option>)}
              </select>
            </div>
            <textarea value={newConfig} onChange={(e) => setNewConfig(e.target.value)} className="w-full bg-white px-4 py-4 rounded-xl border border-slate-200 font-mono text-[10px] h-32" />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsAdding(false)} className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
              <button onClick={handleAddDestination} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Authorize</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div key={dest.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-slate-100">{getIcon(dest.type)}</div>
                <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xs">{dest.name}</h4>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl"><pre className="text-[8px] text-blue-400 font-mono overflow-hidden">{JSON.stringify(dest.config, null, 2)}</pre></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

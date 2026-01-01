
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { APIToken } from '../types';
import { workflowService } from '../services/workflow';

const DeveloperPortal: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);
  
  // Simulation State
  const [payloadType, setPayloadType] = useState<'invoice' | 'po' | 'packing_slip'>('invoice');
  const [simPayload, setSimPayload] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setTokens(db.getTokens());
    
    // Default payload based on type
    const payloads = {
      invoice: JSON.stringify({
        vendor_name: "Global Logistics Ltd",
        invoice_number: "INV-998822",
        amount: 2500.00,
        currency: "USD",
        po_reference: "PO-2025-001"
      }, null, 2),
      po: JSON.stringify({
        po_number: "PO-2025-001",
        vendor: "Global Logistics Ltd",
        total: 2500.00,
        items: [{ desc: "Sea Freight Services", qty: 1, price: 2500 }]
      }, null, 2),
      packing_slip: JSON.stringify({
        packing_slip_id: "PS-8877",
        po_reference: "PO-2025-001",
        received_items: [{ sku: "SVR-01", qty: 1 }]
      }, null, 2)
    };
    setSimPayload(payloads[payloadType]);
  }, [payloadType]);

  const handleCreateToken = () => {
    const user = db.getCurrentUser();
    if (!user || !newTokenName) return;

    const token = `df_${Math.random().toString(36).substr(2, 32)}`;
    const newToken: APIToken = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      name: newTokenName,
      token: token,
      createdAt: Date.now()
    };

    db.saveToken(newToken);
    setTokens([...tokens, newToken]);
    setNewTokenName('');
    setShowToken(token);
  };

  const handleDeleteToken = (id: string) => {
    if (confirm("Revoking this token will immediately disconnect any external systems using it. Continue?")) {
      db.deleteToken(id);
      setTokens(tokens.filter(t => t.id !== id));
    }
  };

  const handleSimulateRequest = async () => {
    setIsSimulating(true);
    try {
      // Simulate API network latency
      await new Promise(r => setTimeout(r, 1200));
      
      const data = JSON.parse(simPayload);
      const filename = `api_ingest_${payloadType}_${Date.now()}.json`;
      
      // We simulate an API call by routing it through the workflow service with 'API' source
      // In a real system, the API would accept JSON and store it. Here we convert JSON to a "file" for our processing pipeline.
      const blob = new Blob([simPayload], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });
      
      await workflowService.processInboundDocument(file, 'API');
      alert(`Simulation Success: ${payloadType.toUpperCase()} received and queued for audit.`);
    } catch (e) {
      alert("Invalid JSON Payload.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">API Connector Hub</h2>
          <p className="text-sm text-slate-500 font-medium">Connect external ERPs, Warehouse systems, and Vendor portals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* API Token Management */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Authorization Tokens</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <input 
                type="text" 
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="Token Description (e.g. 'Production NetSuite')"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button 
                onClick={handleCreateToken}
                disabled={!newTokenName}
                className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
              >
                Generate Token
              </button>
            </div>

            {showToken && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-in zoom-in-95">
                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Secret Token Generated</p>
                <code className="text-[10px] font-mono font-bold break-all block text-blue-900">{showToken}</code>
                <p className="text-[8px] text-blue-400 font-bold uppercase italic">Store this securely. It won't be shown again.</p>
                <button onClick={() => setShowToken(null)} className="text-[8px] font-black uppercase text-blue-600 hover:underline">Dismiss</button>
              </div>
            )}

            <div className="space-y-3 pt-4">
              {tokens.map((t) => (
                <div key={t.id} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all">
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{t.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Created {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteToken(t.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {tokens.length === 0 && (
                <p className="text-[9px] text-slate-400 font-black uppercase text-center py-4">No Active Tokens</p>
              )}
            </div>
          </div>
        </div>

        {/* Documentation & Simulation */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-950 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Public Endpoint</span>
              <code className="text-[11px] font-mono font-bold text-blue-400">POST https://api.docflow.io/v1/ingest</code>
            </div>
            
            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">cURL Integration Example</h4>
               <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-slate-300 overflow-x-auto">
                 <pre>{`curl -X POST https://api.docflow.io/v1/ingest \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "invoice",
    "payload": {
      "vendor_name": "ACME Corp",
      "amount": 1250.50,
      "currency": "USD"
    }
  }'`}</pre>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Step 1: Authenticate</p>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">Use your generated secret key in the Bearer Authorization header.</p>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Step 2: Post Schema</p>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">Send structured JSON for instant matching or raw binary for AI extraction.</p>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inbound Simulation Terminal</h3>
              <div className="flex space-x-2">
                {(['invoice', 'po', 'packing_slip'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setPayloadType(t)}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      payloadType === t ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea 
                  value={simPayload}
                  onChange={(e) => setSimPayload(e.target.value)}
                  className="w-full h-48 bg-slate-900 text-blue-400 font-mono text-[11px] p-6 rounded-[24px] border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="absolute top-4 right-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">JSON Payload</div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase italic max-w-sm">
                  Simulate a direct POST request from an external system to test your 3-way match logic.
                </p>
                <button 
                  onClick={handleSimulateRequest}
                  disabled={isSimulating}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSimulating ? 'Establishing Connection...' : 'Push to API Endpoint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;

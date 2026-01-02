
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { APIToken } from '../types';
import { apiService } from '../services/api';
import { workflowService } from '../services/workflow';

const DeveloperPortal: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string>('');
  
  // Simulation State
  const [payloadType, setPayloadType] = useState<'invoice' | 'invalid'>('invoice');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const tks = db.getTokens();
    setTokens(tks);
    if (tks.length > 0) setActiveToken(tks[0].token);
  }, []);

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
    setActiveToken(token);
  };

  const handleSimulateRealRequest = async () => {
    if (!activeToken) {
      alert("Please generate an API token first.");
      return;
    }

    setIsSimulating(true);
    try {
      // We simulate a file for the backend test
      const dummyContent = payloadType === 'invalid' 
        ? "This is a random letter about a pizza party." 
        : "INVOICE #1234\nVendor: Global Corp\nTotal: $500.00";
      
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const file = new File([blob], `test_${payloadType}.txt`, { type: 'text/plain' });
      
      const result = await apiService.ingestDocument(activeToken, file);
      
      // Integrate the backend result into our local workflow for display
      await workflowService.processInboundDocument(file, 'API');
      
      alert(`Backend Response: ${result.status.toUpperCase()}. Document processed by Vercel Serverless Function.`);
    } catch (e: any) {
      alert(`API Error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const endpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ingest` : 'https://your-app.vercel.app/api/ingest';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Backend API Gateway</h2>
          <p className="text-sm text-slate-500 font-medium">Production serverless endpoints for external integrations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Auth Tokens</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="Token Name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
              <button onClick={handleCreateToken} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase">Create Token</button>
              
              <div className="pt-4 space-y-2">
                {tokens.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveToken(t.token)}
                    className={`w-full text-left p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${activeToken === t.token ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-950 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-green-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Live Endpoint</span>
              <code className="text-[11px] font-mono font-bold text-blue-400">{endpointUrl}</code>
            </div>
            
            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Production Integration (Node.js)</h4>
               <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-slate-300">
                 <pre>{`const response = await fetch('${endpointUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeToken || 'YOUR_TOKEN'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filename: 'invoice.pdf',
    mimeType: 'application/pdf',
    base64Data: '...' 
  })
});`}</pre>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Server-Side Test Bench</h3>
              <div className="flex space-x-2">
                <button onClick={() => setPayloadType('invoice')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${payloadType === 'invoice' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>Valid Invoice</button>
                <button onClick={() => setPayloadType('invalid')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${payloadType === 'invalid' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Invalid Doc</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Trigger Serverless Function</p>
                <p className="text-[10px] text-slate-400 font-medium">This will hit your real Vercel backend and execute Gemini on the server.</p>
              </div>
              <button 
                onClick={handleSimulateRealRequest}
                disabled={isSimulating}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {isSimulating ? 'Processing on Vercel...' : 'Execute API Call'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;

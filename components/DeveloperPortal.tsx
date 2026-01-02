import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { APIToken } from '../types';
import { workflowService } from '../services/workflow';

const DeveloperPortal: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [activeToken, setActiveToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'api' | 'email'>('api');
  
  // Email Simulation State
  const [sender, setSender] = useState('vendor@supplies.com');
  const [subject, setSubject] = useState('Invoice for June Services - #INV-2025-01');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
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
    setActiveToken(token);
  };

  const handleSimulateEmail = async () => {
    if (!activeToken) return alert("Generate an API token first to authorize the gateway.");
    if (!attachedFile) return alert("Please 'attach' a document to the email.");

    setIsSimulating(true);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(attachedFile);
      });

      // Call our real Vercel backend
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: attachedFile.name,
          mimeType: attachedFile.type,
          base64Data,
          emailMetadata: {
            from: sender,
            subject: subject
          }
        })
      });

      const result = await response.json();
      
      // Update local state to show the document arrived
      await workflowService.processInboundDocument(attachedFile, 'EMAIL');
      
      if (result.status === 'rejected') {
        alert("GATEWAY REJECTION: The AI identified this as an invalid document. It has been flagged in your queue.");
      } else {
        alert("SUCCESS: Inbound email received. Document extracted and matched.");
      }
    } catch (e: any) {
      alert(`Connection Error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const endpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ingest` : 'https://your-app.vercel.app/api/ingest';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Inbound Connectors</h2>
          <p className="text-sm text-slate-500 font-medium">Configure automated ingestion via API or Email Webhooks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Token Management */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Gateway Authorization</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="e.g. 'Email Gateway'"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
            <button onClick={handleCreateToken} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Create Secret Token</button>
            <div className="pt-4 space-y-2">
              {tokens.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveToken(t.token)}
                  className={`w-full text-left p-3 rounded-xl border text-[10px] font-bold uppercase transition-all truncate ${activeToken === t.token ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulator Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('api')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'api' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              REST API Endpoint
            </button>
            <button 
              onClick={() => setActiveTab('email')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Email Inbound (Webhook)
            </button>
          </div>

          {activeTab === 'api' ? (
            <div className="bg-slate-950 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center space-x-3 mb-4">
                <span className="bg-green-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Live Endpoint</span>
                <code className="text-[11px] font-mono font-bold text-blue-400">{endpointUrl}</code>
              </div>
              <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-slate-300">
                <pre>{`POST /api/ingest
Authorization: Bearer ${activeToken || 'YOUR_TOKEN'}
Content-Type: application/json

{
  "filename": "invoice_123.pdf",
  "base64Data": "...",
  "mimeType": "application/pdf"
}`}</pre>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Inbound Simulator</h3>
                <p className="text-xs text-slate-500 font-medium">Verify how the AI classifies and extracts data from email attachments.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase">From Address</label>
                  <input value={sender} onChange={e => setSender(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Subject Line</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold" />
                </div>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] text-center space-y-4">
                 <input type="file" id="email-file" className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                 <label htmlFor="email-file" className="cursor-pointer block">
                    {attachedFile ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <span className="text-3xl mb-2">📎</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{attachedFile.name}</span>
                        <span className="text-[8px] font-bold opacity-60">Ready to "Send"</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <span className="text-3xl mb-2">📂</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Select Attachment to Test</span>
                        <span className="text-[8px] font-bold opacity-60">PDF, JPG, PNG or Scan</span>
                      </div>
                    )}
                 </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                 <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Target: /api/ingest</span>
                 </div>
                 <button 
                  onClick={handleSimulateEmail}
                  disabled={isSimulating || !attachedFile}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                 >
                   {isSimulating ? 'Establishing SMTP Handshake...' : 'Simulate Inbound Email'}
                 </button>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed italic">
                   Note: For live production emails, connect your domain's MX records to a provider like CloudMailin or SendGrid and point their Webhook at the "Live Endpoint" shown in the API tab.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;

import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { APIToken } from '../types';
import { workflowService } from '../services/workflow';

const DeveloperPortal: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [activeToken, setActiveToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'api' | 'setup' | 'test'>('api');
  
  // Email Simulation State (Local Testing)
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
    if (!activeToken) return alert("Generate an API token first.");
    if (!attachedFile) return alert("Attach a file.");

    setIsSimulating(true);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(attachedFile);
      });

      const response = await fetch(`/api/ingest?token=${activeToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: attachedFile.name,
          mimeType: attachedFile.type,
          base64Data,
          emailMetadata: { from: sender, subject: subject }
        })
      });

      const result = await response.json();
      await workflowService.processInboundDocument(attachedFile, 'EMAIL');
      alert(result.status === 'rejected' ? "Rejected by AI firewall." : "Document ingested via simulated webhook.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  const webhookUrl = `${baseUrl}/api/ingest?token=${activeToken || 'YOUR_TOKEN'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Inbound Connectors</h2>
          <p className="text-sm text-slate-500 font-medium">Connect real Gmail accounts or use our REST API.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Token Management */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Authorization Tokens</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="e.g. 'Gmail Webhook'"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button onClick={handleCreateToken} className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Generate Gateway Token</button>
            <div className="pt-4 space-y-2">
              {tokens.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveToken(t.token)}
                  className={`w-full text-left p-4 rounded-xl border text-[10px] font-bold uppercase transition-all truncate ${activeToken === t.token ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabbed Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => setActiveTab('api')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'api' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>REST API</button>
            <button onClick={() => setActiveTab('setup')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Gmail Integration Guide</button>
            <button onClick={() => setActiveTab('test')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'test' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Inbound Simulator</button>
          </div>

          {activeTab === 'api' && (
            <div className="bg-slate-950 p-10 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Direct Extraction Endpoint</h4>
                  <span className="bg-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">v2.5 Stable</span>
               </div>
               <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-300">Your unique API webhook for direct system-to-system integration:</p>
                  <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                    <code className="text-blue-400 font-mono text-[11px] truncate pr-4">{webhookUrl}</code>
                    <button onClick={() => { navigator.clipboard.writeText(webhookUrl); alert('Copied!'); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Copy</button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Connect Your Real Gmail</h3>
                <p className="text-sm text-slate-500 font-medium">Because your current URL is private, you need an SMTP-to-Webhook bridge.</p>
              </div>

              <div className="space-y-6">
                {[
                  { step: "1", title: "Select a Mail Bridge", desc: "Sign up for a free account at CloudMailin.com or PostmarkApp.com. These services provide a real email address (e.g. invoice-target@cloudmailin.net)." },
                  { step: "2", title: "Configure the Webhook", desc: `In their dashboard, set the 'Target URL' to your DocFlow endpoint: ${webhookUrl}` },
                  { step: "3", title: "Test with Gmail", desc: "Go to your Gmail, compose a message, attach a PDF invoice, and send it to your new @cloudmailin.net address. It will appear in your queue within seconds." }
                ].map((s) => (
                  <div key={s.step} className="flex space-x-6">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">{s.step}</div>
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-widest">{s.title}</h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase italic">
                  Tip: Most users set up a Gmail "Forwarding Rule" to automatically send all emails with the subject "Invoice" or "Receipt" to their CloudMailin address.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Simulator (Sandbox)</h3>
                <p className="text-sm text-slate-500 font-medium">Verify extraction logic without setting up a real email account.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulated Sender</label>
                  <input value={sender} onChange={e => setSender(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulated Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div className="p-12 border-2 border-dashed border-slate-100 rounded-[40px] text-center space-y-4 hover:border-blue-200 transition-all cursor-pointer">
                 <input type="file" id="email-file-test" className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                 <label htmlFor="email-file-test" className="cursor-pointer block">
                    {attachedFile ? (
                      <div className="flex flex-col items-center text-blue-600 animate-in zoom-in-95">
                        <span className="text-4xl mb-4">📄</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{attachedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <span className="text-4xl mb-4 grayscale opacity-40">📂</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Click to Attach Invoice</span>
                      </div>
                    )}
                 </label>
              </div>

              <button 
                onClick={handleSimulateEmail}
                disabled={isSimulating || !attachedFile}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSimulating ? 'Processing...' : 'Send Simulated Inbound'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;

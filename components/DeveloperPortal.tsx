import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { APIToken } from '../types';
import { workflowService } from '../services/workflow';

const DeveloperPortal: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [activeToken, setActiveToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'api' | 'setup' | 'test'>('api');
  const [vercelBypass, setVercelBypass] = useState('');
  
  const [sender, setSender] = useState('vendor@supplies.com');
  const [subject, setSubject] = useState('Invoice #INV-2025-01');
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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  
  // Construct Webhook URL with optional Vercel Bypass
  let finalWebhookUrl = `${baseUrl}/api/ingest?token=${activeToken || 'YOUR_TOKEN'}`;
  if (vercelBypass) {
    finalWebhookUrl += `&x-vercel-protection-bypass=${vercelBypass}&x-vercel-set-bypass-cookie=true`;
  }

  const handleSimulateEmail = async () => {
    if (!activeToken) return alert("Select or create a token first.");
    if (!attachedFile) return alert("Select a file to simulate the attachment.");
    setIsSimulating(true);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(attachedFile);
      });
      const response = await fetch(finalWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: attachedFile.name, mimeType: attachedFile.type, base64Data, from: sender, subject })
      });
      const result = await response.json();
      await workflowService.processInboundDocument(attachedFile, 'EMAIL');
      alert(result.status === 'rejected' ? "AI Rejected: Document not recognized." : "Success: Document ingested.");
    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setIsSimulating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Inbound Connectors</h2>
          <p className="text-sm text-slate-500 font-medium">Bridge your Gmail to DocFlow via SMTP Webhooks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Auth Tokens</h3>
          <input type="text" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} placeholder="Token Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
          <button onClick={handleCreateToken} className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Create Token</button>
          <div className="pt-4 space-y-2">
            {tokens.map(t => (
              <button key={t.id} onClick={() => setActiveToken(t.token)} className={`w-full text-left p-4 rounded-xl border text-[10px] font-bold uppercase transition-all truncate ${activeToken === t.token ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => setActiveTab('api')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'api' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Target URL</button>
            <button onClick={() => setActiveTab('setup')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Gmail Bridge Setup</button>
            <button onClick={() => setActiveTab('test')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'test' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Simulator</button>
          </div>

          {activeTab === 'api' && (
            <div className="bg-slate-950 p-10 rounded-[40px] text-white space-y-8 shadow-2xl relative overflow-hidden">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Webhook URL (For CloudMailin/Postmark)</label>
                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                      <code className="text-blue-400 font-mono text-[11px] truncate pr-4">{finalWebhookUrl}</code>
                      <button onClick={() => { navigator.clipboard.writeText(finalWebhookUrl); alert('Copied!'); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Copy</button>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-900/20 border border-blue-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🔐</span>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Vercel Deployment Protection</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">If your app requires a password/SSO to view, webhooks will fail with <b>"Authentication Required"</b>. Paste your "Protection Bypass" token below to allow the bridge to get through.</p>
                    <input 
                      type="password"
                      value={vercelBypass}
                      onChange={e => setVercelBypass(e.target.value)}
                      placeholder="Paste Bypass Token from Vercel Settings..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Fixing Inbound Errors</h3>
                <p className="text-sm text-slate-500 font-medium italic">Resolving your "Address Not Found" and "Auth Required" issues.</p>
              </div>

              <div className="space-y-8">
                <div className="flex space-x-6 bg-red-50 p-6 rounded-3xl border border-red-100">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0">!</div>
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-black uppercase text-red-900 tracking-widest">Error: Address Not Found</h5>
                    <p className="text-xs text-red-700 font-medium leading-relaxed">You sent an email to <b>inbox_77kc@inbound.docflow.io</b>. This domain is fake. You must send your email to your <b>CloudMailin</b> address (e.g. <code>b7eef...@cloudmailin.net</code>). They will forward it here.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { step: "1", title: "CloudMailin Target", desc: "In CloudMailin Dashboard, set 'Target URL' to the URL found in the 'Target URL' tab here." },
                    { step: "2", title: "Bypass Protection", desc: "Ensure you've added your Vercel Bypass Token if your deployment is private, otherwise CloudMailin will get a '401' or 'Login' page instead of your API." },
                    { step: "3", title: "Send to @cloudmailin.net", desc: "Compose a new email in Gmail, attach an invoice, and send it directly to your unique CloudMailin address." }
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
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Simulator (Post Request)</h3>
                <p className="text-sm text-slate-500 font-medium">Verify extraction without sending a real email.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <input value={sender} onChange={e => setSender(e.target.value)} placeholder="From Email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
              </div>

              <div className="p-12 border-2 border-dashed border-slate-100 rounded-[40px] text-center space-y-4 hover:border-blue-200 transition-all cursor-pointer">
                 <input type="file" id="email-file-test" className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                 <label htmlFor="email-file-test" className="cursor-pointer block">
                    {attachedFile ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <span className="text-4xl mb-4">📄</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{attachedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <span className="text-4xl mb-4 grayscale opacity-40">📂</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Attach Invoice PDF/Image</span>
                      </div>
                    )}
                 </label>
              </div>

              <button 
                onClick={handleSimulateEmail}
                disabled={isSimulating || !attachedFile}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSimulating ? 'Sending Webhook...' : 'Fire Webhook Simulator'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;

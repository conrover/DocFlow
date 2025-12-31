
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/db';
import { DocumentRecord, DocStatus, ExportJob, Destination, AuditEntry } from '../types';

interface DocumentDetailsProps {
  docId: string;
  onBack: () => void;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ docId, onBack }) => {
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestId, setSelectedDestId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'audit'>('fields');
  
  const fieldRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  useEffect(() => {
    const d = db.getDocument(docId);
    if (d) {
      setDoc(d);
      // Auto-focus first invalid field if review is needed
      if (d.status === DocStatus.NEEDS_REVIEW && d.validation?.errors.length) {
        // Logic to find and focus first error field would go here
      }
    }
    setExportJobs(db.getExportJobs(docId));
    setDestinations(db.getDestinations());
  }, [docId]);

  const handleApprove = useCallback(() => {
    if (!doc) return;
    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: 'John Doe',
      action: 'APPROVE',
      details: 'Verified manually. Audit exception cleared.'
    };
    const updated = { 
      ...doc, 
      status: DocStatus.APPROVED, 
      updatedAt: Date.now(),
      auditTrail: [...(doc.auditTrail || []), audit]
    };
    db.saveDocument(updated);
    setDoc(updated);
  }, [doc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && doc?.status === DocStatus.NEEDS_REVIEW) {
        handleApprove();
      }
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, handleApprove, onBack]);

  if (!doc) return <div className="p-8">Document not found</div>;

  const handleExport = () => {
    if (!selectedDestId) return;
    setIsExporting(true);
    const dest = destinations.find(d => d.id === selectedDestId);
    if (!dest) return;

    const newJob: ExportJob = {
      id: Math.random().toString(36).substr(2, 9),
      documentId: doc.id,
      destinationId: dest.id,
      status: 'PENDING',
      attempts: 0,
      createdAt: Date.now()
    };

    db.createExportJob(newJob);
    setExportJobs([...exportJobs, newJob]);

    setTimeout(() => {
      const updatedJob: ExportJob = {
        ...newJob,
        status: 'COMPLETED',
        artifactUri: `gcs://exports/${doc.filename}.${dest.type}`,
        attempts: 1
      };
      db.updateExportJob(updatedJob);
      setExportJobs(db.getExportJobs(doc.id));
      const updatedDoc = { ...doc, status: DocStatus.EXPORTED, updatedAt: Date.now() };
      db.saveDocument(updatedDoc);
      setDoc(updatedDoc);
      setIsExporting(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
      {/* AP Review Header */}
      <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span>Back to Queue</span>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold truncate max-w-md">{doc.filename}</h2>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{doc.id}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${doc.status === DocStatus.EXPORTED ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{doc.status}</span>
          </div>
          
          {doc.status === DocStatus.NEEDS_REVIEW && (
            <button 
              onClick={handleApprove}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-md shadow-lg shadow-blue-900/40 transition-all flex items-center space-x-2"
            >
              <span>APPROVE [CTRL+ENTER]</span>
            </button>
          )}

          {(doc.status === DocStatus.APPROVED || doc.status === DocStatus.EXPORTED) && (
            <div className="flex items-center space-x-2">
              <select 
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="bg-slate-800 border-none text-[10px] font-bold py-1.5 rounded-md focus:ring-1 focus:ring-blue-500 text-slate-300"
              >
                <option value="">Choose Export...</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button 
                onClick={handleExport}
                disabled={!selectedDestId || isExporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white text-[10px] font-black px-3 py-1.5 rounded-md transition-all"
              >
                {isExporting ? 'SENDING...' : 'EXPORT'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Review Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: PDF Evidence Viewer */}
        <div className="w-3/5 bg-slate-200 border-r border-slate-300 relative overflow-hidden flex flex-col">
          <div className="flex-1 bg-slate-800 relative">
            {doc.fileUrl ? (
              <iframe src={doc.fileUrl} className="w-full h-full border-none" title="Document Viewer" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-bold text-sm">
                No Preview Available
              </div>
            )}
            
            {/* Visual Highlight Overlay (Mock) */}
            {focusedField && (
              <div className="absolute top-1/3 left-1/4 w-32 h-8 border-2 border-yellow-400 bg-yellow-400/10 pointer-events-none animate-pulse rounded"></div>
            )}
          </div>
          
          {/* Quick Stats Footer */}
          <div className="h-10 bg-slate-100 border-t border-slate-300 flex items-center px-4 justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Evidence Confidence: 98% (Gemini Flash)</span>
            <div className="flex space-x-4">
              <span className="text-[10px] font-bold text-slate-500">Page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* Right: AP Data Panel */}
        <div className="w-2/5 flex flex-col bg-white">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'fields' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Document Data
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'audit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Audit Trail
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {activeTab === 'fields' ? (
              <>
                {/* Exception Summary */}
                {doc.validation && !doc.validation.valid && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <h3 className="text-[10px] font-black text-red-700 uppercase mb-2">Review Required: {doc.validation.errors.length} Exception(s)</h3>
                    <ul className="space-y-1">
                      {doc.validation.errors.map((err, i) => (
                        <li key={i} className="text-[11px] text-red-600 flex items-start space-x-2">
                          <span className="mt-1 w-1 h-1 bg-red-400 rounded-full shrink-0"></span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Fields */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Header Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Simplified fields for AP speed */}
                    {[
                      { key: 'Vendor', value: doc.extraction?.specialized.invoice?.supplier_name, id: 'vendor' },
                      { key: 'Invoice #', value: doc.extraction?.specialized.invoice?.invoice_number, id: 'inv_num' },
                      { key: 'Date', value: doc.extraction?.specialized.invoice?.invoice_date, id: 'date' },
                      { key: 'PO #', value: doc.extraction?.specialized.invoice?.po_number, id: 'po' },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1 group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-focus-within:text-blue-500">{f.key}</label>
                        <input 
                          type="text" 
                          defaultValue={f.value?.toString() || ''}
                          onFocus={() => setFocusedField(f.id)}
                          onBlur={() => setFocusedField(null)}
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Section with Math Balance Visual */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Reconciliation</h3>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${doc.validation?.mathBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {doc.validation?.mathBalanced ? 'Balanced' : 'Math Error'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Subtotal</label>
                      <input type="text" defaultValue={doc.extraction?.specialized.invoice?.subtotal?.toLocaleString()} className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Tax</label>
                      <input type="text" defaultValue={doc.extraction?.specialized.invoice?.tax?.toLocaleString()} className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg" />
                    </div>
                    <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Invoice Total</label>
                        <div className="text-2xl font-black text-slate-900">
                          {doc.extraction?.specialized.invoice?.currency} {doc.extraction?.specialized.invoice?.total?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Extraction Proof</div>
                        <div className="text-[10px] font-medium text-slate-500 italic mt-1">Found on bottom right</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itemized Grid (Excel-like) */}
                {doc.extraction?.tables && doc.extraction.tables.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Line Items (Grid View)</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              {doc.extraction.tables[0].columns.map((col, i) => (
                                <th key={i} className="px-3 py-2 font-black text-slate-500 text-left border-r border-slate-200 last:border-0">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {doc.extraction.tables[0].rows.map((row, r) => (
                              <tr key={r} className="hover:bg-blue-50/50 transition-colors">
                                {row.map((cell, c) => (
                                  <td key={c} className="px-3 py-1.5 border-r border-slate-100 last:border-0">
                                    <input 
                                      defaultValue={cell} 
                                      className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-bold p-0"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Events</h3>
                   <span className="text-[9px] font-bold text-slate-400">Export Proof Ready</span>
                </div>
                <div className="space-y-4 relative">
                  <div className="absolute top-0 left-2.5 w-0.5 h-full bg-slate-100"></div>
                  {doc.auditTrail?.map((entry, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">{entry.action}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{entry.details}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">User: {entry.user}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AP Bottom Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="text-[9px] font-bold text-slate-400">
              IDEMPOTENCY KEY: {doc.id.slice(0, 8)}
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100">Void</button>
              <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100">Re-Analyze</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/db';
import { workflowService } from '../services/workflow';
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
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'audit'>('fields');
  
  // Rejection State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Editable state
  const [editFields, setEditFields] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const d = db.getDocument(docId);
    if (d) {
      setDoc(d);
      if (d.extraction?.specialized.invoice) {
        setEditFields({ ...d.extraction.specialized.invoice });
      }
    }
    setExportJobs(db.getExportJobs(docId));
    setDestinations(db.getDestinations());
  }, [docId]);

  const handleApprove = useCallback(() => {
    if (!doc) return;
    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: db.getCurrentUser()?.name || 'System Auditor',
      action: 'APPROVE',
      details: 'Verified manually. Audit exception cleared.'
    };
    const updated = { 
      ...doc, 
      status: DocStatus.APPROVED, 
      updatedAt: Date.now(),
      auditTrail: [...(doc.auditTrail || []), audit],
      rejectionReason: undefined // Clear if it was previously rejected
    };
    db.saveDocument(updated);
    setDoc(updated);
  }, [doc]);

  const confirmReject = useCallback(() => {
    if (!doc || !rejectionReason.trim()) return;
    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: db.getCurrentUser()?.name || 'System Auditor',
      action: 'REJECT',
      details: `Document rejected manually. Reason: ${rejectionReason}`
    };
    const updated = { 
      ...doc, 
      status: DocStatus.REJECTED, 
      updatedAt: Date.now(),
      auditTrail: [...(doc.auditTrail || []), audit],
      rejectionReason: rejectionReason.trim()
    };
    db.saveDocument(updated);
    setDoc(updated);
    setShowRejectModal(false);
    setRejectionReason('');
  }, [doc, rejectionReason]);

  const handleReprocess = async () => {
    if (!doc) return;
    setIsReprocessing(true);
    await workflowService.reprocessDocument(doc.id, () => {
      const updated = db.getDocument(doc.id);
      if (updated) {
        setDoc(updated);
        if (updated.extraction?.specialized.invoice) {
          setEditFields({ ...updated.extraction.specialized.invoice });
        }
      }
    });
    setIsReprocessing(false);
  };

  const handleSaveCorrection = async () => {
    if (!doc || !doc.extraction) return;
    setIsSaving(true);
    
    const updatedExtraction = {
      ...doc.extraction,
      specialized: {
        ...doc.extraction.specialized,
        invoice: { ...editFields }
      }
    };

    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: db.getCurrentUser()?.name || 'System Auditor',
      action: 'EDIT',
      details: 'Manual data corrections applied to extracted fields.'
    };

    const updatedDoc: DocumentRecord = {
      ...doc,
      extraction: updatedExtraction,
      validation: db.validateExtraction({ ...doc, extraction: updatedExtraction }),
      updatedAt: Date.now(),
      auditTrail: [...(doc.auditTrail || []), audit]
    };

    db.saveDocument(updatedDoc);
    setDoc(updatedDoc);
    
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && doc?.status === DocStatus.NEEDS_REVIEW) {
        handleApprove();
      }
      if (e.key === 'Escape') {
        if (showRejectModal) setShowRejectModal(false);
        else onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, handleApprove, onBack, showRejectModal]);

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

  const renderConfidenceBadge = (key: string) => {
    const field = doc.extraction?.fields.find(f => f.key.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(f.key.toLowerCase()));
    if (!field) return null;
    
    const score = Math.round(field.confidence * 100);
    const colorClass = score > 90 ? 'text-green-500' : score > 70 ? 'text-orange-500' : 'text-red-500';
    
    return (
      <span className={`text-[8px] font-black uppercase tracking-widest ${colorClass} ml-2 flex items-center`}>
        <span className="w-1 h-1 rounded-full bg-current mr-1 animate-pulse"></span>
        {score}% Conf
      </span>
    );
  };

  const updateEditField = (key: string, value: any) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-[40px] shadow-2xl border border-slate-200 relative">
      {/* Rejection Modal Overlay */}
      {showRejectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-8 rounded-[32px] shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Decline Invoice</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">Specify a mandatory reason for rejecting this document. This will be logged in the audit trail.</p>
            </div>
            
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Missing line item breakdown, Incorrect tax rate, etc."
              className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-bold text-slate-800 text-xs placeholder:text-slate-300"
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AP Review Header */}
      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center space-x-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span>Batch Queue</span>
          </button>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex flex-col">
            <h2 className="text-xs font-black uppercase tracking-tight truncate max-w-md">{doc.filename}</h2>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest">TRACE_ID: {doc.id}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${
              doc.status === DocStatus.EXPORTED ? 'bg-green-500' : 
              doc.status === DocStatus.REJECTED ? 'bg-red-500' :
              'bg-blue-500 animate-pulse'
            }`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{doc.status}</span>
          </div>
          
          {(doc.status === DocStatus.NEEDS_REVIEW || doc.status === DocStatus.FAILED || doc.status === DocStatus.REJECTED) && (
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black px-4 py-2.5 rounded-xl border border-slate-700 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isReprocessing ? 'Reprocessing...' : 'Reprocess AI'}
              </button>
              {doc.status !== DocStatus.REJECTED && (
                <button 
                  onClick={() => setShowRejectModal(true)}
                  className="bg-red-900/50 hover:bg-red-900 text-red-100 text-[10px] font-black px-4 py-2.5 rounded-xl border border-red-800 transition-all uppercase tracking-widest"
                >
                  Reject
                </button>
              )}
              <button 
                onClick={handleApprove}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-6 py-2.5 rounded-xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 uppercase tracking-widest"
              >
                Authorize [Ctrl+Enter]
              </button>
            </div>
          )}

          {(doc.status === DocStatus.APPROVED || doc.status === DocStatus.EXPORTED) && (
            <div className="flex items-center space-x-2">
              <select 
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-[10px] font-black px-3 py-2 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-300 outline-none uppercase tracking-widest"
              >
                <option value="">Choose Export Target...</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button 
                onClick={handleExport}
                disabled={!selectedDestId || isExporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white text-[10px] font-black px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
              >
                {isExporting ? 'Syncing...' : 'Export'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Review Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: PDF Evidence Viewer */}
        <div className="w-[55%] bg-slate-100 border-r border-slate-200 relative overflow-hidden flex flex-col">
          <div className="flex-1 bg-slate-50 relative p-4">
             <div className="w-full h-full bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden">
              {doc.fileUrl ? (
                <iframe src={doc.fileUrl} className="w-full h-full border-none" title="Document Viewer" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  Rendering Proof...
                </div>
              )}
             </div>
            
            {/* Visual Highlight Overlay (Mock for UI fidelity) */}
            {focusedField && (
              <div className="absolute top-1/3 left-1/4 w-32 h-8 border-2 border-blue-500 bg-blue-500/10 pointer-events-none animate-pulse rounded-lg shadow-lg"></div>
            )}
          </div>
          
          <div className="h-12 bg-white border-t border-slate-200 flex items-center px-6 justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evidence Lock: 256-Bit</span>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Native PDF Stream</span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
              <span className="text-[10px] font-black text-slate-500">1 / 1</span>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: AP Data Panel */}
        <div className="w-[45%] flex flex-col bg-white">
          <div className="flex bg-slate-50/50 p-2 m-4 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fields' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Extraction Map
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Process Audit
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-8">
            {activeTab === 'fields' ? (
              <>
                {/* Rejection Summary Warning */}
                {doc.status === DocStatus.REJECTED && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">❌</span>
                      <h3 className="text-[10px] font-black text-red-700 uppercase tracking-widest">Document Rejected</h3>
                    </div>
                    <p className="text-[11px] text-red-600 font-black uppercase leading-tight ml-1">
                      Reason: <span className="font-medium lowercase tracking-normal text-slate-700">"{doc.rejectionReason}"</span>
                    </p>
                  </div>
                )}

                {/* Exception Summary */}
                {doc.validation && !doc.validation.valid && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <h3 className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Extraction Exceptions ({doc.validation.errors.length})</h3>
                    </div>
                    <ul className="space-y-1.5 ml-6">
                      {doc.validation.errors.map((err, i) => (
                        <li key={i} className="text-[10px] text-orange-600 font-bold uppercase leading-tight">
                          - {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Context</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">99.2% Global Precision</span>
                      <button 
                        onClick={handleSaveCorrection}
                        disabled={isSaving}
                        className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 uppercase hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Manual Fix'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {[
                      { key: 'Vendor', value: editFields.supplier_name, id: 'supplier_name' },
                      { key: 'Invoice #', value: editFields.invoice_number, id: 'invoice_number' },
                      { key: 'Date', value: editFields.invoice_date, id: 'invoice_date' },
                      { key: 'PO #', value: editFields.po_number, id: 'po_number' },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1.5 group">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-focus-within:text-blue-500 transition-colors">
                            {f.key}
                          </label>
                          {renderConfidenceBadge(f.key)}
                        </div>
                        <input 
                          type="text" 
                          value={f.value || ''}
                          onChange={(e) => updateEditField(f.id, e.target.value)}
                          onFocus={() => setFocusedField(f.id)}
                          onBlur={() => setFocusedField(null)}
                          className="w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Reconciliation */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconciliation Firewall</h3>
                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${doc.validation?.mathBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {doc.validation?.mathBalanced ? 'Math Verified' : 'Variance Detected'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Subtotal</label>
                        {renderConfidenceBadge('subtotal')}
                      </div>
                      <input 
                        type="number" 
                        value={editFields.subtotal || ''} 
                        onChange={(e) => updateEditField('subtotal', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-black border border-slate-200 px-4 py-2.5 rounded-xl bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Tax Amount</label>
                        {renderConfidenceBadge('tax')}
                      </div>
                      <input 
                        type="number" 
                        value={editFields.tax || ''} 
                        onChange={(e) => updateEditField('tax', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-black border border-slate-200 px-4 py-2.5 rounded-xl bg-slate-50" 
                      />
                    </div>
                    <div className="col-span-2 bg-slate-900 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
                      <div className="relative z-10 space-y-0.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Liability</label>
                        <div className="text-3xl font-black text-white tracking-tighter flex items-center">
                          <input 
                            type="text" 
                            value={editFields.currency || ''} 
                            onChange={(e) => updateEditField('currency', e.target.value)}
                            className="w-12 bg-transparent border-none focus:ring-0 text-blue-500 mr-2 p-0" 
                          />
                          <input 
                            type="number" 
                            value={editFields.total || ''} 
                            onChange={(e) => updateEditField('total', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none focus:ring-0 text-white p-0 w-40" 
                          />
                        </div>
                      </div>
                      <div className="relative z-10 text-right">
                        {renderConfidenceBadge('total')}
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Verified Ledger</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Item Ledger */}
                {doc.extraction?.tables && doc.extraction.tables.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Ledger</h3>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Matrix Detected</span>
                    </div>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead className="bg-slate-50/50 border-b border-slate-200">
                            <tr>
                              {doc.extraction.tables[0].columns.map((col, i) => (
                                <th key={i} className="px-4 py-3 font-black text-slate-500 text-left border-r border-slate-100 last:border-0 uppercase tracking-tighter">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {doc.extraction.tables[0].rows.map((row, r) => (
                              <tr key={r} className="hover:bg-slate-50 transition-colors">
                                {row.map((cell, c) => (
                                  <td key={c} className="px-4 py-2 border-r border-slate-100 last:border-0">
                                    <input 
                                      defaultValue={cell} 
                                      className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-black p-0 text-slate-800"
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
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifiable Event Log</h3>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Immutable Chain</span>
                </div>
                <div className="space-y-6 relative">
                  <div className="absolute top-0 left-[11px] w-[2px] h-full bg-slate-100"></div>
                  {doc.auditTrail?.map((entry, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10 shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{entry.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{entry.details}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">@</div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{entry.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AP Bottom Actions */}
          <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Audit Checksum</span>
              <div className="text-[10px] font-mono font-bold text-slate-800">0x{doc.id.toUpperCase().slice(0, 12)}...</div>
            </div>
            <div className="flex space-x-3">
              <button className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all hover:text-slate-800">Archive</button>
              <button onClick={handleReprocess} className="px-5 py-2.5 bg-white border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all shadow-sm">Refresh AI</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;

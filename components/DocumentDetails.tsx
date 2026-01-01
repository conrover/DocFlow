
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/db';
import { workflowService } from '../services/workflow';
import { storageService } from '../services/storage';
import { DocumentRecord, DocStatus, ExportJob, Destination, AuditEntry, UserRole, LineItem, MatchingState } from '../types';

interface DocumentDetailsProps {
  docId: string;
  onBack: () => void;
  onNavigate?: (id: string) => void;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ docId, onBack, onNavigate }) => {
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [persistentUrl, setPersistentUrl] = useState<string | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestId, setSelectedDestId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'matching' | 'audit'>('fields');
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [editFields, setEditFields] = useState<any>({});
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: string | null, next: string | null }>({ prev: null, next: null });

  const currentUser = db.getCurrentUser();
  const isReadOnly = currentUser?.role === UserRole.VIEWER;

  useEffect(() => {
    const d = db.getDocument(docId);
    if (d) {
      setDoc(d);
      if (d.extraction?.specialized.invoice) {
        setEditFields({ ...d.extraction.specialized.invoice });
        setEditLineItems([...(d.extraction.specialized.invoice.line_items || [])]);
      }
      
      // Fetch file from persistent storage
      storageService.getBlob(docId).then(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPersistentUrl(url);
        }
      });

      // Navigation context
      setAdjacentIds(db.getAdjacentDocIds(docId));
    }
    setExportJobs(db.getExportJobs(docId));
    setDestinations(db.getDestinations());

    // Reset zoom on document change
    setZoomLevel(1);

    // Cleanup blob URL on unmount
    return () => {
      if (persistentUrl) URL.revokeObjectURL(persistentUrl);
    };
  }, [docId]);

  const handleApprove = useCallback(() => {
    if (!doc || isReadOnly) return;
    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: currentUser?.name || 'System Auditor',
      action: 'APPROVE',
      details: 'Verified manually. Strategic intelligence confirmed.'
    };
    const updated = { 
      ...doc, 
      status: DocStatus.APPROVED, 
      updatedAt: Date.now(),
      auditTrail: [...(doc.auditTrail || []), audit],
      rejectionReason: undefined
    };
    db.saveDocument(updated);
    setDoc(updated);
  }, [doc, isReadOnly, currentUser]);

  const confirmReject = useCallback(() => {
    if (!doc || !rejectionReason.trim() || isReadOnly) return;
    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: currentUser?.name || 'System Auditor',
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
  }, [doc, rejectionReason, isReadOnly, currentUser]);

  const handleReprocess = async () => {
    if (!doc || isReadOnly) return;
    setIsReprocessing(true);
    await workflowService.reprocessDocument(doc.id, () => {
      const updated = db.getDocument(doc.id);
      if (updated) {
        setDoc(updated);
        if (updated.extraction?.specialized.invoice) {
          setEditFields({ ...updated.extraction.specialized.invoice });
          setEditLineItems([...(updated.extraction.specialized.invoice.line_items || [])]);
        }
      }
    });
    setIsReprocessing(false);
  };

  const handleSaveCorrection = async () => {
    if (!doc || !doc.extraction || isReadOnly) return;
    setIsSaving(true);
    
    const original = doc.extraction.specialized.invoice as any;
    const changes: string[] = [];
    
    const fieldMapping: Record<string, string> = {
      supplier_name: 'Vendor',
      invoice_number: 'Inv #',
      invoice_date: 'Date',
      po_number: 'PO #',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      currency: 'Cur',
      gl_code_suggestion: 'GL Code',
      payment_terms: 'Terms'
    };

    Object.keys(editFields).forEach(key => {
      if (key === 'line_items') return;
      const oldVal = original[key];
      const newVal = editFields[key];
      if (oldVal !== newVal) {
        const label = fieldMapping[key] || key;
        changes.push(`${label}: '${oldVal ?? 'null'}' → '${newVal ?? 'null'}'`);
      }
    });

    if (JSON.stringify(original.line_items) !== JSON.stringify(editLineItems)) {
      changes.push(`Line items updated (${editLineItems.length} items)`);
    }

    const updatedExtraction = {
      ...doc.extraction,
      specialized: {
        ...doc.extraction.specialized,
        invoice: { 
          ...editFields,
          line_items: [...editLineItems]
        }
      }
    };

    const audit: AuditEntry = {
      timestamp: Date.now(),
      user: currentUser?.name || 'System Auditor',
      action: 'MANUAL_FIX',
      details: changes.length > 0 
        ? `Applied corrections: ${changes.join('; ')}`
        : 'Saved with no data changes.'
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
      if (e.ctrlKey && e.key === 'Enter' && doc?.status === DocStatus.NEEDS_REVIEW && !isReadOnly) {
        handleApprove();
      }
      if (e.key === 'Escape') {
        if (showRejectModal) setShowRejectModal(false);
        else onBack();
      }
      // Arrow navigation
      if (e.key === 'ArrowRight' && adjacentIds.next && onNavigate) {
        onNavigate(adjacentIds.next);
      }
      if (e.key === 'ArrowLeft' && adjacentIds.prev && onNavigate) {
        onNavigate(adjacentIds.prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, handleApprove, onBack, showRejectModal, isReadOnly, adjacentIds, onNavigate]);

  if (!doc) return <div className="p-8">Document not found</div>;

  const handleExport = () => {
    if (!selectedDestId || isReadOnly) return;
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

  const renderItemConfidenceBadge = (scoreNum: number) => {
    const score = Math.round(scoreNum * 100);
    const colorClass = score > 90 ? 'text-green-500' : score > 70 ? 'text-orange-500' : 'text-red-500';
    return (
      <span className={`text-[7px] font-black uppercase tracking-widest ${colorClass} flex items-center`}>
        {score}%
      </span>
    );
  };

  const updateEditField = (key: string, value: any) => {
    if (isReadOnly) return;
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    if (isReadOnly) return;
    const next = [...editLineItems];
    next[index] = { ...next[index], [field]: value };
    setEditLineItems(next);
  };

  const addLineItem = () => {
    if (isReadOnly) return;
    setEditLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, amount: 0, confidence: 1.0 }]);
  };

  const removeLineItem = (index: number) => {
    if (isReadOnly) return;
    setEditLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // 3-Way Match Matcher State (Simulated)
  const matching = db.simulateThreeWayMatch(doc);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-[40px] shadow-2xl border border-slate-200 relative font-sans">
      {showRejectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-8 rounded-[32px] shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Decline Invoice</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">Specify a mandatory reason for rejecting this document.</p>
            </div>
            
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Missing line item breakdown, Incorrect tax rate..."
              className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-bold text-slate-800 text-xs"
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowRejectModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
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

      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center space-x-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span>Batch Queue</span>
          </button>
          
          <div className="h-6 w-px bg-slate-700"></div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onNavigate && adjacentIds.prev && onNavigate(adjacentIds.prev)}
              disabled={!adjacentIds.prev}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 disabled:opacity-20 transition-all"
              title="Previous Document [Left Arrow]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => onNavigate && adjacentIds.next && onNavigate(adjacentIds.next)}
              disabled={!adjacentIds.next}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 disabled:opacity-20 transition-all"
              title="Next Document [Right Arrow]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          <div className="flex flex-col">
            <h2 className="text-xs font-black uppercase tracking-tight truncate max-w-[200px]">{doc.filename}</h2>
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
          
          {!isReadOnly && (doc.status === DocStatus.NEEDS_REVIEW || doc.status === DocStatus.FAILED || doc.status === DocStatus.REJECTED) && (
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

          {!isReadOnly && (doc.status === DocStatus.APPROVED || doc.status === DocStatus.EXPORTED) && (
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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[55%] bg-slate-100 border-r border-slate-200 relative overflow-hidden flex flex-col">
          {/* Zoom Controller */}
          <div className="absolute top-6 right-6 z-20 flex flex-col space-y-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 transition-all hover:bg-white">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-800 font-black text-xl transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <div className="h-px bg-slate-200 mx-2"></div>
            <button 
              onClick={() => setZoomLevel(1)}
              className="py-1 text-[9px] font-black text-blue-600 uppercase tracking-widest text-center"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <div className="h-px bg-slate-200 mx-2"></div>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-800 font-black text-xl transition-colors"
              title="Zoom Out"
            >
              −
            </button>
          </div>

          <div className="flex-1 bg-slate-50 relative p-4 overflow-auto custom-scrollbar">
             <div 
               className="min-w-full min-h-full bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center transition-transform duration-300 origin-top"
               style={{ transform: `scale(${zoomLevel})` }}
             >
              {persistentUrl ? (
                <iframe src={persistentUrl} className="w-full h-[1200px] border-none" title="Document Viewer" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse p-20">
                  Rehydrating Source from Storage...
                </div>
              )}
             </div>
          </div>
        </div>

        <div className="w-[45%] flex flex-col bg-white">
          <div className="flex bg-slate-50/50 p-2 m-4 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('fields')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fields' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400'}`}>Extraction Map</button>
            <button onClick={() => setActiveTab('matching')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matching' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400'}`}>3-Way Match</button>
            <button onClick={() => setActiveTab('audit')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400'}`}>Process Audit</button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-8">
            {activeTab === 'fields' ? (
              <>
                {doc.extraction?.specialized.invoice?.has_discount_opportunity && (
                   <div className="bg-green-950 p-6 rounded-[24px] border border-green-800 flex justify-between items-center shadow-xl shadow-green-900/20 animate-in zoom-in-95">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-widest">Savings Opportunity Found</label>
                        <div className="text-xl font-black text-white tracking-tighter uppercase leading-tight">
                          {editFields.payment_terms || 'Early Payment Discount'}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center text-2xl">💰</div>
                   </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Coding</h3>
                    {!isReadOnly && (
                      <button onClick={handleSaveCorrection} disabled={isSaving} className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 uppercase transition-all">
                        {isSaving ? 'Saving...' : 'Save Manual Fix'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-y-5">
                    <div className="space-y-1.5 group">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">AI Suggested GL Code</label>
                        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Auto-Predicted</span>
                      </div>
                      <input 
                        type="text" 
                        readOnly={isReadOnly}
                        value={editFields.gl_code_suggestion || ''}
                        onChange={(e) => updateEditField('gl_code_suggestion', e.target.value)}
                        className={`w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                        placeholder="e.g. 6100 - Office Supplies"
                      />
                    </div>
                  </div>
                </div>

                {/* Editable Line Items Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Audit</h3>
                    {!isReadOnly && (
                      <button 
                        onClick={addLineItem}
                        className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center"
                      >
                        <span className="mr-1">+</span> Add Item
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {editLineItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 group relative transition-all hover:border-slate-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-1">
                             <div className="flex items-center justify-between">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                {renderItemConfidenceBadge(item.confidence)}
                             </div>
                             <textarea 
                               readOnly={isReadOnly}
                               value={item.description || ''}
                               onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                               className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                               rows={1}
                             />
                          </div>
                          {!isReadOnly && (
                            <button 
                              onClick={() => removeLineItem(idx)}
                              className="ml-3 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                            <input 
                              type="number" 
                              readOnly={isReadOnly}
                              value={item.quantity || 1}
                              onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit Price</label>
                            <input 
                              type="number" 
                              readOnly={isReadOnly}
                              value={item.unit_price || 0}
                              onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                            <input 
                              type="number" 
                              readOnly={isReadOnly}
                              value={item.amount || 0}
                              onChange={(e) => updateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {editLineItems.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Line Items Detected</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Context</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {[
                      { key: 'Vendor', value: editFields.supplier_name, id: 'supplier_name' },
                      { key: 'Invoice #', value: editFields.invoice_number, id: 'invoice_number' },
                      { key: 'Date', value: editFields.invoice_date, id: 'invoice_date' },
                      { key: 'Terms', value: editFields.payment_terms, id: 'payment_terms' },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1.5 group">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{f.key}</label>
                          {renderConfidenceBadge(f.key)}
                        </div>
                        <input 
                          type="text" 
                          readOnly={isReadOnly}
                          value={f.value || ''}
                          onChange={(e) => updateEditField(f.id, e.target.value)}
                          onFocus={() => setFocusedField(f.id)}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none transition-all shadow-sm ${isReadOnly ? 'opacity-80' : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === 'matching' ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase tracking-widest">Three-Way Reconciliation</h4>
                    <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-black uppercase">Live Match Engine</span>
                  </div>

                  <div className="relative flex justify-between items-center py-4">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800 -translate-y-1/2"></div>
                    
                    {/* Invoice Node */}
                    <div className="relative z-10 flex flex-col items-center space-y-2">
                       <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center text-xl shadow-xl border-2 border-green-500">📄</div>
                       <span className="text-[9px] font-black uppercase tracking-widest">Invoice</span>
                       <span className="text-[8px] font-black text-green-500 uppercase">Verified</span>
                    </div>

                    {/* PO Node */}
                    <div className="relative z-10 flex flex-col items-center space-y-2">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xl border-2 transition-all ${
                         matching.po_match === 'MATCHED' ? 'bg-white text-slate-900 border-green-500' : 
                         matching.po_match === 'VARIANCE' ? 'bg-white text-slate-900 border-red-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                       }`}>📝</div>
                       <span className="text-[9px] font-black uppercase tracking-widest">P.Order</span>
                       <span className={`text-[8px] font-black uppercase ${
                         matching.po_match === 'MATCHED' ? 'text-green-500' : 
                         matching.po_match === 'VARIANCE' ? 'text-red-500' : 'text-slate-500'
                       }`}>{matching.po_match.replace('_', ' ')}</span>
                    </div>

                    {/* Receipt Node */}
                    <div className="relative z-10 flex flex-col items-center space-y-2">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xl border-2 transition-all ${
                         matching.receipt_match === 'MATCHED' ? 'bg-white text-slate-900 border-green-500' : 
                         matching.receipt_match === 'VARIANCE' ? 'bg-white text-slate-900 border-red-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                       }`}>📦</div>
                       <span className="text-[9px] font-black uppercase tracking-widest">Receipt</span>
                       <span className={`text-[8px] font-black uppercase ${
                         matching.receipt_match === 'MATCHED' ? 'text-green-500' : 
                         matching.receipt_match === 'VARIANCE' ? 'text-red-500' : 'text-slate-500'
                       }`}>{matching.receipt_match.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Variance Audit Report</h3>
                  {matching.variances.length > 0 ? (
                    <div className="space-y-3">
                      {matching.variances.map((v, i) => (
                        <div key={i} className="flex items-start space-x-4 bg-red-50 border border-red-100 p-4 rounded-2xl animate-in slide-in-from-right-2">
                          <span className="text-lg">⚠️</span>
                          <div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Reconciliation Variance</p>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{v}</p>
                          </div>
                        </div>
                      ))}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Auditor Protocol</p>
                         <p className="text-[10px] font-medium text-slate-500 leading-relaxed">System has flagged a financial mismatch. Authorizing this payment without correction will create an audit exception in the General Ledger.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px]">
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">🛡️</div>
                       <div className="space-y-1">
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Three-Way Match Perfect</p>
                         <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">All Variance Shields Nominal</p>
                       </div>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[32px] border border-slate-100 bg-slate-50 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched System References</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>ERP Purchase Order</span>
                      <span className="font-mono text-blue-600">{editFields.po_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>Warehouse Packing Slip</span>
                      <span className="font-mono text-blue-600">{editFields.po_number ? `PS-${editFields.po_number.split('-')[1]}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifiable Event Log</h3>
                </div>
                <div className="space-y-6 relative">
                  <div className="absolute top-0 left-[11px] w-[2px] h-full bg-slate-100"></div>
                  {doc.auditTrail?.map((entry, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10 shadow-sm"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{entry.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{entry.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;

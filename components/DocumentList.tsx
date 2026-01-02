
import React, { useState, useCallback, useMemo } from 'react';
import { db } from '../services/db';
import { workflowService } from '../services/workflow';
import { DocumentRecord, DocStatus, UserRole } from '../types';

interface DocumentListProps {
  docs: DocumentRecord[];
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

interface FilterState {
  search: string;
  status: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  hasRisk: boolean;
  isHighConf: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ docs, onSelect, onRefresh }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    hasRisk: false,
    isHighConf: false
  });
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currentUser = db.getCurrentUser();
  const isReadOnly = currentUser?.role === UserRole.VIEWER;

  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const fields = doc.extraction?.fields || [];
      const avgConf = fields.length 
        ? fields.reduce((acc, f) => acc + f.confidence, 0) / fields.length 
        : 0;

      if (filters.status !== 'all' && doc.status !== filters.status) return false;
      
      if (filters.isHighConf && avgConf < 0.98) return false;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const vendor = doc.extraction?.specialized.invoice?.supplier_name?.toLowerCase() || '';
        const invNum = doc.extraction?.specialized.invoice?.invoice_number?.toLowerCase() || '';
        if (!vendor.includes(searchLower) && !invNum.includes(searchLower)) return false;
      }
      
      if (filters.dateRange !== 'all') {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (filters.dateRange === 'today' && now - doc.createdAt > oneDay) return false;
        if (filters.dateRange === 'week' && now - doc.createdAt > oneDay * 7) return false;
        if (filters.dateRange === 'month' && now - doc.createdAt > oneDay * 30) return false;
      }
      
      if (filters.hasRisk) {
        const matching = db.simulateThreeWayMatch(doc);
        const isCritical = doc.validation?.isDuplicate || !doc.validation?.mathBalanced || matching.po_match === 'VARIANCE' || matching.receipt_match === 'VARIANCE';
        if (!isCritical) return false;
      }

      return true;
    });
  }, [docs, filters]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const fileArray = Array.from(files);
    setUploadProgress({ current: 0, total: fileArray.length });
    
    let completed = 0;
    await Promise.all(fileArray.map(async (file) => {
      try {
        await workflowService.processInboundDocument(file, 'MANUAL', onRefresh);
      } finally {
        completed++;
        setUploadProgress({ current: completed, total: fileArray.length });
      }
    }));
    
    setIsUploading(false);
    onRefresh();
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const handleBulkApprove = () => {
    if (isReadOnly) return;
    const toUpdate = docs.filter(d => selectedIds.has(d.id) && d.status === DocStatus.NEEDS_REVIEW);
    const updated = toUpdate.map(doc => ({
      ...doc,
      status: DocStatus.APPROVED,
      updatedAt: Date.now(),
      auditTrail: [
        ...doc.auditTrail,
        {
          timestamp: Date.now(),
          user: currentUser?.name || 'System Auditor',
          action: 'APPROVE',
          details: 'Bulk authorized from batch queue view.'
        }
      ]
    }));
    db.bulkUpdateDocuments(updated);
    onRefresh();
    setSelectedIds(new Set());
  };

  const handleSendForPayment = () => {
    const selectedDocs = docs.filter(d => selectedIds.has(d.id));
    const approvedDocs = selectedDocs.filter(d => d.status === DocStatus.APPROVED || d.status === DocStatus.EXPORTED);
    
    if (approvedDocs.length === 0) {
      alert("No approved invoices selected. Please approve invoices before sending for payment.");
      return;
    }

    const csvContent = db.generateCSVFromDocs(approvedDocs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payment_batch_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!isReadOnly) {
      const updated = approvedDocs.map(doc => ({
        ...doc,
        status: DocStatus.EXPORTED,
        updatedAt: Date.now(),
        auditTrail: [
          ...doc.auditTrail,
          {
            timestamp: Date.now(),
            user: currentUser?.name || 'System Auditor',
            action: 'SEND_PAYMENT',
            details: 'Sent for payment. All extracted attributes exported to CSV batch file.'
          }
        ]
      }));
      db.bulkUpdateDocuments(updated);
      onRefresh();
      setSelectedIds(new Set());
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateRange: 'all',
      hasRisk: false,
      isHighConf: false
    });
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Invoice Queue</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Advanced financial audit stream.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 w-40 transition-all"
            />
            <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <button 
            onClick={() => setFilters(prev => ({ ...prev, isHighConf: !prev.isHighConf }))}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center space-x-2 ${
              filters.isHighConf 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Eyeball Bucket</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">
              {docs.filter(d => {
                const f = d.extraction?.fields || [];
                return (f.length ? (f.reduce((acc, field) => acc + field.confidence, 0) / f.length) : 0) >= 0.98;
              }).length}
            </span>
          </button>

          <button 
            onClick={() => setFilters(prev => ({ ...prev, hasRisk: !prev.hasRisk }))}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filters.hasRisk 
                ? 'bg-red-50 border-red-200 text-red-600' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            Exceptions Only
          </button>

          {(filters.search || filters.status !== 'all' || filters.hasRisk || filters.isHighConf) && (
            <button 
              onClick={resetFilters}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative h-24 border-2 border-dashed rounded-[32px] transition-all flex items-center justify-center space-x-4 overflow-hidden ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 ring-8 ring-blue-50' 
            : 'border-slate-200 bg-white hover:border-blue-300'
        }`}
      >
        <input 
          type="file" 
          multiple 
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Streaming Batch {uploadProgress.current}/{uploadProgress.total}</span>
            <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">+</div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Upload Documents</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">PDF, Image or Scan</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 w-10">
                  <div 
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                      selectedIds.size > 0 && selectedIds.size === filteredDocs.length 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {selectedIds.size > 0 && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d={selectedIds.size === filteredDocs.length ? "M5 13l4 4L19 7" : "M20 12H4"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-4 py-5 w-12 text-center">Risk</th>
                <th className="px-8 py-5">Vendor</th>
                <th className="px-8 py-5">Invoice #</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Total</th>
                <th className="px-8 py-5">3-Way Match</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? filteredDocs.sort((a,b) => b.createdAt - a.createdAt).map((doc) => {
                const matching = db.simulateThreeWayMatch(doc);
                const hasCriticalMatch = matching.po_match === 'VARIANCE' || matching.receipt_match === 'VARIANCE';

                return (
                  <tr 
                    key={doc.id} 
                    className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${selectedIds.has(doc.id) ? 'bg-blue-50/30' : ''}`}
                    onClick={() => onSelect(doc.id)}
                  >
                    <td className="px-8 py-5" onClick={(e) => toggleSelect(doc.id, e)}>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedIds.has(doc.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                        {selectedIds.has(doc.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      {doc.validation?.isDuplicate || hasCriticalMatch ? (
                        <div className="w-6 h-6 mx-auto rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs font-black">!</div>
                      ) : doc.validation?.valid && doc.status !== DocStatus.REJECTED ? (
                        <div className="w-6 h-6 mx-auto rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-black">✓</div>
                      ) : (
                        <div className="w-6 h-6 mx-auto rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-black">?</div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {doc.extraction?.specialized.invoice?.supplier_name || 'Extracting...'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-400">
                      {doc.extraction?.specialized.invoice?.invoice_number || '---'}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        doc.status === DocStatus.EXPORTED ? 'bg-green-100 text-green-700' :
                        doc.status === DocStatus.REJECTED ? 'bg-red-50 text-red-600' :
                        doc.status === DocStatus.NEEDS_REVIEW ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-slate-800 text-right">
                      {doc.extraction?.specialized.invoice?.currency} {doc.extraction?.specialized.invoice?.total?.toLocaleString() || '---'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${matching.po_match === 'MATCHED' ? 'bg-green-500' : matching.po_match === 'VARIANCE' ? 'bg-red-500' : 'bg-slate-200'}`} title="PO Match"></div>
                        <div className={`w-2 h-2 rounded-full ${matching.receipt_match === 'MATCHED' ? 'bg-green-500' : matching.receipt_match === 'VARIANCE' ? 'bg-red-500' : 'bg-slate-200'}`} title="Receipt Match"></div>
                        <span className={`text-[8px] font-black uppercase ml-1 ${hasCriticalMatch ? 'text-red-600' : 'text-slate-400'}`}>
                          {hasCriticalMatch ? 'Variance' : matching.po_match === 'NOT_FOUND' ? 'No PO' : 'Reconciled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-blue-600 font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 hover:underline uppercase transition-opacity">
                        Review
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="py-32 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">Queue is Empty</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 px-8 py-5 rounded-[32px] shadow-2xl border border-slate-800 flex items-center space-x-8 animate-in slide-in-from-bottom-10">
          <div className="flex items-center space-x-4 pr-8 border-r border-slate-800">
            <span className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs">{selectedIds.size}</span>
            <p className="text-white text-xs font-black uppercase tracking-widest">Batch Selected</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleBulkApprove} className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Approve Selected</button>
            <button onClick={handleSendForPayment} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all">Export for Payment</button>
            <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-white px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;

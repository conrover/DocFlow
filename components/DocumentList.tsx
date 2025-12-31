
import React, { useState, useCallback } from 'react';
import { workflowService } from '../services/workflow';
import { DocumentRecord, DocStatus } from '../types';

interface DocumentListProps {
  docs: DocumentRecord[];
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ docs, onSelect, onRefresh }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<string>('all');

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

  const filteredDocs = docs.filter(doc => {
    if (filter === 'all') return true;
    if (filter === 'exceptions') return (doc.status === DocStatus.NEEDS_REVIEW && !doc.validation?.valid) || doc.status === DocStatus.REJECTED;
    if (filter === 'cleared') return doc.status === DocStatus.APPROVED || doc.status === DocStatus.EXPORTED;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Queue</h2>
          <p className="text-sm text-slate-500 font-medium">Exception-based audit engine enabled.</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
          {['all', 'exceptions', 'cleared'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative h-32 border-2 border-dashed rounded-[32px] transition-all flex items-center justify-center space-x-6 group overflow-hidden ${
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
          <div className="flex flex-col items-center animate-in zoom-in-95">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Analyzing Batch Stream... {uploadProgress.current}/{uploadProgress.total}</span>
            <div className="w-80 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" 
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-slate-900 text-white rounded-[20px] flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform shadow-xl shadow-slate-900/20">+</div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Transmit Invoices</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Parallel Audit Engine (PDF, JPEG, PNG)</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 w-12">Risk</th>
                <th className="px-8 py-5">Source</th>
                <th className="px-8 py-5">Vendor / Supplier</th>
                <th className="px-8 py-5">Invoice #</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Total</th>
                <th className="px-8 py-5">Audit</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? filteredDocs.sort((a,b) => b.createdAt - a.createdAt).map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => onSelect(doc.id)}>
                  <td className="px-8 py-5">
                    {doc.validation?.isDuplicate ? (
                      <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-600 text-xs font-black shadow-sm">!</div>
                    ) : doc.validation?.valid && doc.status !== DocStatus.REJECTED ? (
                      <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-black shadow-sm">✓</div>
                    ) : doc.status === DocStatus.REJECTED ? (
                       <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shadow-sm">✕</div>
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-black shadow-sm">?</div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      doc.source === 'EMAIL' ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}>
                      {doc.source || 'MANUAL'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-sm font-black tracking-tight uppercase ${doc.status === DocStatus.EXTRACTING ? 'text-slate-300 italic animate-pulse' : 'text-slate-800'}`}>
                      {doc.extraction?.specialized.invoice?.supplier_name || 'Processing...'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-400 tracking-widest">
                    {doc.extraction?.specialized.invoice?.invoice_number || '---'}
                  </td>
                  <td className="px-8 py-5 relative">
                    <div className="group/status relative inline-block">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        doc.status === DocStatus.EXPORTED ? 'bg-green-100 text-green-700' :
                        doc.status === DocStatus.REJECTED ? 'bg-red-50 text-red-600 border border-red-100' :
                        doc.status === DocStatus.NEEDS_REVIEW ? 'bg-orange-100 text-orange-700' :
                        doc.status === DocStatus.FAILED ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.status === DocStatus.REJECTED && doc.rejectionReason && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-50 pointer-events-none">
                          <p className="font-black uppercase tracking-widest text-red-400 mb-1">Rejection Reason</p>
                          <p className="font-medium leading-relaxed">{doc.rejectionReason}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-800 text-right tracking-tighter">
                    {doc.extraction?.specialized.invoice?.currency} {doc.extraction?.specialized.invoice?.total?.toLocaleString() || '---'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {doc.validation?.isDuplicate && (
                        <span className="bg-red-50 text-red-700 text-[8px] font-black px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-widest">Duplicate</span>
                      )}
                      {!doc.validation?.mathBalanced && (
                        <span className="bg-orange-50 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-lg border border-orange-100 uppercase tracking-widest">Math</span>
                      )}
                      {doc.status === DocStatus.REJECTED && (
                        <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-widest">Rejected</span>
                      )}
                      {doc.validation?.valid && doc.status === DocStatus.NEEDS_REVIEW && (
                        <span className="text-green-600 text-[9px] font-black uppercase tracking-widest">Ready</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-blue-600 font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 hover:underline transition-opacity uppercase">
                      Review
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                      <span className="text-5xl mb-6 grayscale opacity-20">📂</span>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Queue is Empty</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">All items processed via manual or email channels.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;


import React, { useState, useCallback } from 'react';
import { db } from '../services/db';
import { geminiService } from '../services/gemini';
import { DocumentRecord, DocStatus, DocType } from '../types';

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

  const processFile = async (file: File, onDone: () => void) => {
    // Fix: Retrieve current user to populate required userId field
    const currentUser = db.getCurrentUser();
    if (!currentUser) return;

    const newDoc: DocumentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      filename: file.name,
      status: DocStatus.EXTRACTING,
      type: DocType.UNKNOWN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileUrl: URL.createObjectURL(file),
      auditTrail: [{
        timestamp: Date.now(),
        user: 'System',
        action: 'UPLOAD',
        details: 'Batch ingestion triggered.'
      }]
    };
    
    db.saveDocument(newDoc);
    onRefresh();

    try {
      const extraction = await geminiService.extractFromDocument(file);
      const updatedDoc = {
        ...newDoc,
        status: DocStatus.NEEDS_REVIEW,
        type: extraction.doc_type,
        extraction,
        validation: db.validateExtraction({ ...newDoc, extraction }),
        updatedAt: Date.now()
      };
      db.saveDocument(updatedDoc);
    } catch (error: any) {
      const failedDoc = {
        ...newDoc,
        status: DocStatus.FAILED,
        lastError: { code: 'AI_FAILURE', message: error.message },
        updatedAt: Date.now()
      };
      db.saveDocument(failedDoc);
    } finally {
      onDone();
      onRefresh();
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const fileArray = Array.from(files);
    setUploadProgress({ current: 0, total: fileArray.length });
    let completed = 0;
    await Promise.all(fileArray.map(file => processFile(file, () => {
      completed++;
      setUploadProgress({ current: completed, total: fileArray.length });
    })));
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
    if (filter === 'exceptions') return doc.status === DocStatus.NEEDS_REVIEW && !doc.validation?.valid;
    if (filter === 'cleared') return doc.status === DocStatus.APPROVED || doc.status === DocStatus.EXPORTED;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Queue</h2>
          <p className="text-sm text-slate-500 font-medium">Exception-based audit engine enabled.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['all', 'exceptions', 'cleared'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* High Performance Drop Zone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative h-24 border-2 border-dashed rounded-2xl transition-all flex items-center justify-center space-x-4 group ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50' 
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
            <span className="text-[10px] font-black text-blue-600 uppercase mb-2">Analyzing Batch... {uploadProgress.current}/{uploadProgress.total}</span>
            <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">+</div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Transmit Invoices</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Parallel Audit Engine (PDF, Images supported)</p>
            </div>
          </>
        )}
      </div>

      {/* AP Dense List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12">Risk</th>
                <th className="px-6 py-4">Vendor / Supplier</th>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4">Audit Exceptions</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? filteredDocs.sort((a,b) => b.createdAt - a.createdAt).map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelect(doc.id)}>
                  <td className="px-6 py-4">
                    {doc.validation?.isDuplicate ? (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-black">!</div>
                    ) : doc.validation?.valid ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[8px] font-black">✓</div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-black">?</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${doc.status === DocStatus.EXTRACTING ? 'text-slate-300 italic animate-pulse' : 'text-slate-900'}`}>
                      {doc.extraction?.specialized.invoice?.supplier_name || 'Queued...'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {doc.extraction?.specialized.invoice?.invoice_number || '---'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      doc.status === DocStatus.EXPORTED ? 'bg-green-100 text-green-700' :
                      doc.status === DocStatus.NEEDS_REVIEW ? 'bg-orange-100 text-orange-700' :
                      doc.status === DocStatus.FAILED ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-700 text-right">
                    {doc.extraction?.specialized.invoice?.currency} {doc.extraction?.specialized.invoice?.total?.toLocaleString() || '---'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.validation?.isDuplicate && (
                        <span className="bg-red-50 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-100 uppercase">Duplicate</span>
                      )}
                      {!doc.validation?.mathBalanced && (
                        <span className="bg-orange-50 text-orange-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-orange-100 uppercase">Math Error</span>
                      )}
                      {doc.validation?.valid && doc.status === DocStatus.NEEDS_REVIEW && (
                        <span className="text-green-600 text-[9px] font-bold">Clear for Approval</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 hover:underline transition-opacity">
                      REVIEW
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-4">🥂</span>
                      <h3 className="text-sm font-bold text-slate-800">Inbox is empty</h3>
                      <p className="text-xs text-slate-400 mt-1">All invoices are processed or cleared.</p>
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

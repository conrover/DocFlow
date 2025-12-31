
import React from 'react';
import { DocStatus } from '../types';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const statuses = [
    { status: DocStatus.EXTRACTING, label: 'Extracting', desc: 'Gemini AI is currently reading the OCR layer and reasoning about the financial data.', color: 'bg-blue-100 text-blue-700' },
    { status: DocStatus.NEEDS_REVIEW, label: 'Needs Review', desc: 'Human intervention required. Triggered by low AI confidence scores, math imbalances, or duplicate flags.', color: 'bg-orange-100 text-orange-700' },
    { status: DocStatus.APPROVED, label: 'Approved', desc: 'Auditor has verified the data. The record is ready for final export to your ERP.', color: 'bg-indigo-100 text-indigo-700' },
    { status: DocStatus.EXPORTED, label: 'Exported', desc: 'Successfully transmitted to the downstream system (SAP, NetSuite, etc.).', color: 'bg-green-100 text-green-700' },
    { status: DocStatus.FAILED, label: 'Failed', desc: 'Processing error. Usually caused by corrupt files, unsupported languages, or AI time-outs.', color: 'bg-red-100 text-red-700' },
  ];

  const risks = [
    { icon: '🛑', label: 'Critical Risk', desc: 'Duplicate document detected in your historical database.' },
    { icon: '⚠️', label: 'Math Exception', desc: 'Line items + Tax + Shipping do not equal the total amount.' },
    { icon: '📉', label: 'Low Confidence', desc: 'AI confidence score is below 70%. Manual verification advised.' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Legend</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Statuses & Exception Codes</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Document Life-Cycle</h3>
            <div className="space-y-4">
              {statuses.map((s) => (
                <div key={s.status} className="flex items-start space-x-4">
                  <span className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest min-w-[100px] text-center ${s.color}`}>
                    {s.label}
                  </span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Risk Identifiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {risks.map((r) => (
                <div key={r.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{r.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-900 flex justify-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DocFlow Audit Intelligence v2.5-Native</p>
        </div>
      </div>
    </div>
  );
};

export default LegendModal;

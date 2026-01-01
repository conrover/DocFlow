
import React from 'react';
import { db } from '../services/db';
import { DocumentRecord, DocStatus } from '../types';

interface DashboardProps {
  docs: DocumentRecord[];
  onViewDocs: () => void;
  onSelectDoc: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ docs, onViewDocs, onSelectDoc }) => {
  const duplicateDollars = docs
    .filter(d => d.validation?.isDuplicate)
    .reduce((sum, d) => sum + (d.extraction?.specialized.invoice?.total || 0), 0);

  const totalProcessed = docs.filter(d => d.status === DocStatus.EXPORTED).length;
  const totalUploaded = docs.length;
  const stpRate = totalUploaded > 0 ? Math.round((totalProcessed / totalUploaded) * 100) : 0;

  const stats = [
    { label: 'Cycle Velocity', value: `${stpRate}% STP`, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Straight-Through rate' },
    { label: 'Risk Blocked', value: `$${duplicateDollars.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50', sub: 'Duplicate prevention' },
    { label: 'Needs Review', value: docs.filter(d => d.status === DocStatus.NEEDS_REVIEW).length, color: 'text-orange-600', bg: 'bg-orange-50', sub: 'Exceptions queue' },
    { label: 'Audit Ready', value: totalProcessed, color: 'text-green-600', bg: 'bg-green-50', sub: 'Invoices exported' },
  ];

  const recentDocs = [...docs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">AP Command Center</h2>
          <p className="text-slate-500 font-medium text-sm">Monitor extraction velocity and financial risk controls.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onViewDocs}
            className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all"
          >
            Full Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-blue-200 transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${stat.color.replace('text', 'bg')} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex flex-col mt-2">
              <span className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Critical Batch Items</h3>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Real-time Stream</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Channel</th>
                <th className="px-8 py-4">Vendor</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Risk Level</th>
                <th className="px-8 py-4 text-right">Total</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.length > 0 ? recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => onSelectDoc(doc.id)}>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      doc.source === 'EMAIL' ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}>
                      {doc.source || 'MANUAL'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-transparent group-hover:border-slate-200">
                        {doc.extraction?.specialized.invoice?.supplier_name || 'Processing...'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono tracking-widest">#{doc.extraction?.specialized.invoice?.invoice_number || '---'}</span>
                    </div>
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
                  <td className="px-8 py-5">
                    {doc.validation?.isDuplicate ? (
                      <span className="text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center">
                        <span className="mr-1 text-xs">🛑</span> Critical
                      </span>
                    ) : doc.validation?.valid && doc.status !== DocStatus.REJECTED ? (
                      <span className="text-green-500 text-[9px] font-black uppercase tracking-widest flex items-center">
                        <span className="mr-1 text-xs">✓</span> Verified
                      </span>
                    ) : (
                      <span className="text-orange-500 text-[9px] font-black uppercase tracking-widest flex items-center">
                        <span className="mr-1 text-xs">⚠️</span> Exception
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-800 text-right">
                    {doc.extraction?.specialized.invoice ? `${doc.extraction.specialized.invoice.currency} ${doc.extraction.specialized.invoice.total?.toLocaleString()}` : '---'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-blue-600 font-black tracking-widest text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-all hover:underline">Review</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-4 grayscale opacity-20">📥</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">Inbox Zero</p>
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

export default Dashboard;

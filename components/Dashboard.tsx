
import React from 'react';
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AP Command Center</h2>
          <p className="text-slate-500">Monitor extraction velocity and financial risk controls.</p>
        </div>
        <button 
          onClick={onViewDocs}
          className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"
        >
          View Full Queue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color.replace('text', 'bg')}`}></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <div className="flex flex-col mt-2">
              <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-1">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Critical Batch Items</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Real-time update</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Risk Level</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.length > 0 ? recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelectDoc(doc.id)}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {doc.extraction?.specialized.invoice?.supplier_name || 'Pending Extraction'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">#{doc.extraction?.specialized.invoice?.invoice_number || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      doc.status === DocStatus.EXPORTED ? 'bg-green-100 text-green-700' :
                      doc.status === DocStatus.NEEDS_REVIEW ? 'bg-orange-100 text-orange-700' :
                      doc.status === DocStatus.FAILED ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {doc.validation?.isDuplicate ? (
                      <span className="text-red-500 text-[10px] font-black uppercase tracking-tighter flex items-center">
                        <span className="mr-1">🛑</span> Critical Duplicate
                      </span>
                    ) : doc.validation?.valid ? (
                      <span className="text-green-500 text-[10px] font-bold uppercase tracking-tighter flex items-center">
                        <span className="mr-1">✓</span> Low Risk
                      </span>
                    ) : (
                      <span className="text-orange-500 text-[10px] font-bold uppercase tracking-tighter flex items-center">
                        <span className="mr-1">⚠️</span> Needs Audit
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-700">
                    {doc.extraction?.specialized.invoice ? `${doc.extraction.specialized.invoice.currency} ${doc.extraction.specialized.invoice.total?.toLocaleString()}` : '---'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 font-bold hover:underline text-xs">REVIEW</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No documents in queue.
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

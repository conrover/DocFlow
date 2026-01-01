
import React from 'react';
import { db } from '../services/db';

const Reports: React.FC = () => {
  const stats = db.getAnalytics();
  const docs = db.getDocuments();

  // Calculate 3-Way Match Health
  const matchedCount = docs.filter(d => {
    const m = db.simulateThreeWayMatch(d);
    return m.po_match === 'MATCHED' && m.receipt_match === 'MATCHED';
  }).length;
  
  const varianceCount = docs.filter(d => {
    const m = db.simulateThreeWayMatch(d);
    return m.po_match === 'VARIANCE' || m.receipt_match === 'VARIANCE';
  }).length;

  const matchRate = docs.length > 0 ? Math.round((matchedCount / docs.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-20 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Intelligence Reporting</h2>
          <p className="text-slate-500 font-medium text-sm">Automated audit volume and reconciliation health.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">Export JSON</button>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all">Download Audit PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconciliation Health</p>
          <div className="flex items-end space-x-3">
            <span className="text-5xl font-black text-blue-600 tracking-tighter">{matchRate}%</span>
            <span className="text-green-600 font-black text-[10px] mb-2 uppercase">Match Rate</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">3-Way Match Verified</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Variances</p>
          <div className="flex items-end space-x-3 relative z-10">
            <span className="text-5xl font-black text-white tracking-tighter">{varianceCount}</span>
            <span className="text-red-400 font-black text-[10px] mb-2 uppercase">Exceptions</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">Requiring Manual Resolution</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AP Recovery Accrual</p>
          <div className="flex items-end space-x-2">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">${(stats.totalProcessed * 12.45).toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated ROI for Current Period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Match Variance Distribution */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Variance Root Cause Analysis</h3>
          <div className="space-y-6 pt-4">
            {[
              { label: 'Price Mismatch vs PO', value: 45, color: 'bg-red-500' },
              { label: 'Quantity Shortfall (Dock)', value: 30, color: 'bg-orange-500' },
              { label: 'Unrecognized Vendor Identity', value: 15, color: 'bg-slate-400' },
              { label: 'Tax Jurisdiction Error', value: 10, color: 'bg-blue-400' }
            ].map(v => (
              <div key={v.label} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-500">{v.label}</span>
                  <span className="text-slate-900">{v.value}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${v.color}`} style={{ width: `${v.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Velocity */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">System Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Extraction Time</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">8.4s</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Match Latency</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">1.2s</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-blue-950 rounded-[32px] text-white">
             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Automated Optimization</p>
             <p className="text-xs font-medium leading-relaxed uppercase opacity-80">
               Based on the current 3-way match accuracy, we recommend increasing your Price Tolerance to 3% to reduce human review by 22% without increasing risk.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

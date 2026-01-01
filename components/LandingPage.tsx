
import React, { useState, useCallback } from 'react';
import { Logo } from './Logo';
import VideoDemoModal from './VideoDemoModal';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Programmatic scroll helper for high-precision navigation
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-[100] h-20 flex items-center justify-between px-8 lg:px-20">
        <Logo size={40} />
        
        {/* Navigation "Tabs" - fully functional */}
        <div className="hidden md:flex items-center space-x-10">
          <button 
            onClick={() => scrollToSection('features')}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors focus:outline-none"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('solutions')}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors focus:outline-none"
          >
            Solutions
          </button>
          <button 
            onClick={() => scrollToSection('pricing')}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors focus:outline-none"
          >
            Pricing
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={onLogin} className="text-xs font-black uppercase tracking-widest text-slate-900 px-6 py-3 hover:bg-slate-50 rounded-2xl transition-all">Log In</button>
          <button onClick={onGetStarted} className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-8 lg:px-20 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -mr-40 -mt-20"></div>
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">v2.5 Audit Engine Now Live</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Automate Accounts Payable with <span className="text-blue-600">Forensic Precision.</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Stop manual data entry and math checks. DocFlow uses Gemini-powered reasoning to extract, validate, and sync financial data with 99.2% accuracy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-6">
            <button onClick={onGetStarted} className="w-full sm:w-auto bg-slate-900 text-white text-sm font-black uppercase tracking-widest px-12 py-6 rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95">
              Launch Your Workspace
            </button>
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-black uppercase tracking-widest px-12 py-6 rounded-3xl hover:bg-slate-50 transition-all group"
            >
              Watch Product Demo
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">▶</span>
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Intelligence & Features Section */}
      <section id="features" className="py-32 px-8 lg:px-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-24 text-center">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4">The Intelligence Layer</h2>
            <h3 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-none mb-6">Auditing with the brain <br/> of a Strategic Controller.</h3>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">DocFlow goes beyond simple text recognition. We use a multi-modal reasoning stack to understand the context, intent, and math behind every financial document.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Primary AI Extraction Card */}
            <div className="md:col-span-8 bg-white p-12 rounded-[56px] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-12 group hover:border-blue-300 transition-all duration-500">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase tracking-widest">GEMINI-3 FLASH CORE</span>
                </div>
                <h4 className="text-3xl font-black tracking-tight uppercase leading-none">Deterministic Audit Engine</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Our core engine performs real-time financial reconciliation. It doesn't just "see" text; it reconciles line items against totals, validates tax jurisdictions, and flags anomalies before they hit your ledger.
                </p>
                <ul className="space-y-3">
                  {['Math-Verified Reconciliation', 'Vendor Identity Graphing', 'Duplicate Risk Firewall'].map(item => (
                    <li key={item} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3 text-[8px]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-64 bg-slate-900 rounded-[40px] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Reliability Score</p>
                  <p className="text-4xl font-black text-white tracking-tighter">99.2%</p>
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-4 leading-relaxed">Zero-shot accuracy on multi-page complex schemas.</p>
              </div>
            </div>

            {/* Strategic Insights Card */}
            <div className="md:col-span-4 bg-slate-900 p-10 rounded-[56px] text-white space-y-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center text-2xl border border-white/10">💰</div>
                <h4 className="text-2xl font-black uppercase tracking-tight">Strategic Intelligence</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Automatically discover Early Payment Discounts and receive Automated GL Coding suggestions based on vendor history and item analysis.
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-blue-400">Discount Found</span>
                  <span className="text-[9px] font-bold text-green-400">2% Net 30</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Feature Bento: Three-Way Match */}
            <div className="md:col-span-4 bg-white p-10 rounded-[48px] border border-slate-200 space-y-6 hover:shadow-2xl transition-all group">
              <div className="text-4xl group-hover:-translate-y-2 transition-transform">🔄</div>
              <h4 className="text-lg font-black uppercase tracking-tight">Three-Way Match</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Automatically reconcile Purchase Orders, Packing Slips, and Invoices to ensure consistency across the entire supply chain.</p>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compliance Verified</span>
              </div>
            </div>

            {/* Feature Bento: Line Item Audit */}
            <div className="md:col-span-4 bg-white p-10 rounded-[48px] border border-slate-200 space-y-6 hover:shadow-2xl transition-all group">
              <div className="text-4xl group-hover:-translate-y-2 transition-transform">📋</div>
              <h4 className="text-lg font-black uppercase tracking-tight">Granular Audit</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">SKU-level extraction with individual confidence scores. Edit line items manually while maintaining math reconciliation.</p>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">98% Line Accuracy</span>
              </div>
            </div>

            {/* Feature Bento: Data Chat */}
            <div className="md:col-span-4 bg-white p-10 rounded-[48px] border border-slate-200 space-y-6 hover:shadow-2xl transition-all group">
              <div className="text-4xl group-hover:-translate-y-2 transition-transform">💬</div>
              <h4 className="text-lg font-black uppercase tracking-tight">DocFlow Assistant</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Interact with your entire invoice database using Gemini 3 Pro. Query trends, compare vendors, or ask for AP advice.</p>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemini-3 Pro Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-32 px-8 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Vertical Specialization</h2>
              <h3 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9]">Built for every <br/> industry scale.</h3>
            </div>
            <p className="text-slate-500 font-medium max-w-sm">DocFlow adapts to your specific organizational taxonomy and accounting workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'Retail & CPG', icon: '🛍️', color: 'hover:bg-blue-600', emoji: '📦' },
              { label: 'Manufacturing', icon: '🏗️', color: 'hover:bg-slate-900', emoji: '⚙️' },
              { label: 'Prof. Services', icon: '⚖️', color: 'hover:bg-blue-500', emoji: '💼' }
            ].map((sol) => (
              <div key={sol.label} className={`group bg-slate-50 p-12 rounded-[48px] border border-slate-100 ${sol.color} transition-all duration-500 overflow-hidden relative`}>
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">{sol.icon}</div>
                  <h4 className="text-2xl font-black uppercase tracking-tight group-hover:text-white transition-colors">{sol.label}</h4>
                  <p className="text-slate-500 font-medium text-sm group-hover:text-white/80 transition-colors">Optimized extraction workflows for {sol.label.toLowerCase()} specific document types and reconciliation needs.</p>
                  <button onClick={onGetStarted} className="text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:text-white flex items-center focus:outline-none">Explore Vertical <span className="ml-2">→</span></button>
                </div>
                <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 group-hover:opacity-10 group-hover:-translate-y-4 transition-all">{sol.emoji}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-8 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-20 space-y-4">
          <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Scalable Investment</h2>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">Simple, volume-based pricing.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { name: "Starter", price: "$499", docs: "500 Docs", dark: false },
            { name: "Professional", price: "$1,299", docs: "2,000 Docs", dark: true },
            { name: "Enterprise", price: "Custom", docs: "Unlimited", dark: false },
          ].map((plan) => (
            <div key={plan.name} className={`p-12 rounded-[48px] border border-slate-200 flex flex-col justify-between space-y-10 transition-all hover:shadow-2xl ${plan.dark ? 'bg-slate-900 text-white border-none' : 'bg-white'}`}>
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-500">{plan.name}</h4>
                <div className="text-5xl font-black tracking-tighter">{plan.price}</div>
                <p className={`text-sm font-bold ${plan.dark ? 'text-slate-400' : 'text-slate-500'}`}>per workspace / month</p>
              </div>
              <ul className={`space-y-4 text-xs font-black uppercase tracking-widest ${plan.dark ? 'text-slate-300' : 'text-slate-500'}`}>
                <li className="flex items-center"><span className="mr-3 text-blue-500">✓</span> {plan.docs} / month</li>
                <li className="flex items-center"><span className="mr-3 text-blue-500">✓</span> Gemini Flash Audit</li>
                <li className="flex items-center"><span className="mr-3 text-blue-500">✓</span> ERP Webhook Exports</li>
              </ul>
              <button 
                onClick={onGetStarted} 
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${plan.dark ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl' : 'bg-slate-900 text-white hover:bg-black shadow-lg'}`}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 lg:px-20 border-t border-slate-100 bg-slate-50 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-10 md:space-y-0">
          <Logo size={32} />
          <div className="flex space-x-10">
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Privacy</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Terms</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Contact</button>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60 mb-1">Founder — Sourabh Bodkhe</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">© 2025 DocFlow Systems Inc.</p>
          </div>
        </div>
      </footer>

      {/* Video Demo Modal */}
      <VideoDemoModal 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;

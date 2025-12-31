
import React, { useState } from 'react';
import { Logo } from './Logo';
import VideoDemoModal from './VideoDemoModal';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-[100] h-20 flex items-center justify-between px-8 lg:px-20">
        <Logo size={40} />
        <div className="hidden md:flex items-center space-x-10">
          <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Features</a>
          <a href="#solutions" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Solutions</a>
          <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Pricing</a>
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

        {/* Floating App Preview Card */}
        <div className="mt-24 max-w-6xl mx-auto rounded-[48px] border border-slate-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
            alt="DocFlow Interface" 
            className="w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
          />
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-32 px-8 lg:px-20 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Core Infrastructure</h2>
            <h3 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-none">Intelligence built for <br/> financial accuracy.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">⚡</div>
                <h4 className="text-2xl font-black tracking-tight uppercase">Deterministic Extraction</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Unlike basic OCR, our Audit Engine reasons about the document structure. It reconciles line items against totals and validates tax calculations in real-time.
                </p>
              </div>
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by Gemini-3 Flash</span>
                <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Learn More →</span>
              </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[48px] text-white flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl border border-white/10">📧</div>
                <h4 className="text-2xl font-black tracking-tight uppercase">Inbound Gateway</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Every workspace gets a branded email address. Invoices sent to your handle are automatically ingested, parsed, and queued for review.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-8">
                <span className="text-[10px] font-mono text-blue-400">acme.ap@docflow.io</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-200 flex flex-col items-center text-center space-y-4">
              <div className="text-4xl">🔗</div>
              <h4 className="text-lg font-black uppercase tracking-tight">ERP Native Sync</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Push approved data directly to SAP Ariba, NetSuite, Coupa, or custom webhooks.</p>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-200 flex flex-col items-center text-center space-y-4">
              <div className="text-4xl">🛡️</div>
              <h4 className="text-lg font-black uppercase tracking-tight">Audit Firewall</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Automatic duplicate detection and vendor fraud protection using historic data graph.</p>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-200 flex flex-col items-center text-center space-y-4">
              <div className="text-4xl">📊</div>
              <h3 className="text-lg font-black uppercase tracking-tight">Audit by Exception</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Humans only touch documents that fail AI confidence thresholds or math checks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-8 lg:px-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-blue-600/10 blur-[120px]"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">Velocity without compromise.</h2>
            <p className="text-slate-400 text-lg font-medium max-w-md">Our processing layer is optimized for the highest-throughput AP teams in the world.</p>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-6xl font-black text-blue-500">99.2%</span>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Extraction Accuracy</p>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-6xl font-black text-white">8.4s</span>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Avg. Processing Time</p>
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
            { name: "Starter", price: "$499", docs: "500 Docs", color: "slate-100" },
            { name: "Professional", price: "$1,299", docs: "2,000 Docs", color: "blue-600", dark: true },
            { name: "Enterprise", price: "Custom", docs: "Unlimited", color: "slate-100" },
          ].map((plan) => (
            <div key={plan.name} className={`p-12 rounded-[48px] border border-slate-200 flex flex-col justify-between space-y-10 transition-all hover:shadow-2xl ${plan.dark ? 'bg-slate-900 text-white border-none' : 'bg-white'}`}>
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-500">{plan.name}</h4>
                <div className="text-5xl font-black tracking-tighter">{plan.price}</div>
                <p className={`text-sm font-bold ${plan.dark ? 'text-slate-400' : 'text-slate-500'}`}>per workspace / month</p>
              </div>
              <ul className={`space-y-4 text-xs font-black uppercase tracking-widest ${plan.dark ? 'text-slate-300' : 'text-slate-500'}`}>
                <li className="flex items-center"><span className="mr-3">✓</span> {plan.docs} / month</li>
                <li className="flex items-center"><span className="mr-3">✓</span> Gemini Flash Audit</li>
                <li className="flex items-center"><span className="mr-3">✓</span> Custom Inbound Email</li>
                <li className="flex items-center"><span className="mr-3">✓</span> ERP Webhook Exports</li>
              </ul>
              <button onClick={onGetStarted} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${plan.dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}>
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
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">© 2025 DocFlow Systems Inc.</p>
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

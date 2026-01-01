
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, UserRole } from '../types';
import { Logo } from './Logo';

interface AuthProps {
  initialMode: 'LOGIN' | 'REGISTER';
  onAuthSuccess: (user: User) => void;
  onBackToHome?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const Auth: React.FC<AuthProps> = ({ initialMode, onAuthSuccess, onBackToHome }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Sync mode with prop if it changes externally
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (mode === 'LOGIN') {
        const user = db.login(email, password, rememberMe);
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Authentication failed. Check your credentials or reset your security key.');
        }
      } else if (mode === 'REGISTER') {
        if (!acceptTerms) {
          setError('Consent to Terms of Service is required for workspace initialization.');
          setLoading(false);
          return;
        }
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
          name,
          role: UserRole.ADMIN,
          autoApproveEnabled: false,
          autoApproveThreshold: 98
        };
        db.register(newUser);
        // Automatically login the newly registered user
        db.login(email, password, rememberMe);
        onAuthSuccess(newUser);
      } else if (mode === 'FORGOT_PASSWORD') {
        alert(`Encrypted recovery sequence dispatched to ${email}. Check your primary inbox.`);
        setMode('LOGIN');
      }
    } catch (err: any) {
      if (err.message === "User already exists") {
        setError("An account with this email already exists. Please log in instead.");
      } else {
        setError(err.message || 'An unexpected error occurred during the auth handshake.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans selection:bg-blue-100 overflow-hidden">
      <div className="hidden lg:flex lg:w-[45%] bg-slate-950 p-16 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        <div className="relative z-10">
          <Logo className="mb-16 invert brightness-200" size={48} />
          <div className="space-y-12 max-w-md">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase">
              Audit <span className="text-blue-500">Cloud</span> Infrastructure.
            </h2>
            <div className="grid gap-8">
              <div className="flex items-start space-x-5 group">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl border border-slate-800 transition-all group-hover:border-blue-500/50 group-hover:scale-105 shadow-xl">⚡</div>
                <div>
                  <h4 className="text-white font-black text-lg mb-1 uppercase tracking-tight">Zero-Touch AP</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Auto-pilot for standard invoices with 99%+ accuracy thresholds.</p>
                </div>
              </div>
              <div className="flex items-start space-x-5 group">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl border border-slate-800 transition-all group-hover:border-blue-500/50 group-hover:scale-105 shadow-xl">🛡️</div>
                <div>
                  <h4 className="text-white font-black text-lg mb-1 uppercase tracking-tight">Enterprise RBAC</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Role-based access control and immutable audit trails for SOC2 compliance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            Verified Secure Node • 256-Bit Cryptography • DocFlow v2.5
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 relative overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-10 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-200 relative overflow-hidden">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                {mode === 'LOGIN' ? 'Sign In' : mode === 'REGISTER' ? 'Create Account' : 'Reset Access'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {mode === 'LOGIN' ? 'Access your financial intelligence dashboard.' : mode === 'REGISTER' ? 'Register a new administrative auditor account.' : 'Request a secure recovery link.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-[20px] text-xs font-black uppercase flex items-center space-x-3 animate-in zoom-in-95">
                  <span className="text-xl">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {mode === 'REGISTER' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800" 
                    placeholder="Jane Doe" 
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800" 
                  placeholder="admin@enterprise.com" 
                />
              </div>

              {mode !== 'FORGOT_PASSWORD' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Key</label>
                    {mode === 'LOGIN' && (
                      <button type="button" onClick={() => setMode('FORGOT_PASSWORD')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Lost Key?</button>
                    )}
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800" 
                    placeholder="••••••••" 
                  />
                </div>
              )}

              <div className="flex items-center space-x-3 ml-1">
                <button 
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white border-slate-200'}`}
                >
                  {rememberMe && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>Stay Authenticated</span>
              </div>

              {mode === 'REGISTER' && (
                <div className="flex items-start space-x-3 ml-1">
                  <button 
                    type="button"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`mt-0.5 w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0 ${acceptTerms ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                  >
                    {acceptTerms && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed select-none">
                    I authorize the processing of financial data in accordance with the Security Policy.
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl text-xs disabled:opacity-50"
              >
                {loading ? 'Decrypting...' : (mode === 'LOGIN' ? 'Authorize Dashboard' : 'Initialize Workspace')}
              </button>
              
              <button 
                type="button"
                onClick={onBackToHome}
                className="w-full text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              {mode === 'LOGIN' ? (
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  New to the network? {' '}
                  <button onClick={() => { setMode('REGISTER'); setError(''); }} className="text-blue-600 hover:text-blue-700 transition-colors uppercase font-black tracking-widest text-[10px]">Create Identity</button>
                </p>
              ) : (
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  Already registered? {' '}
                  <button onClick={() => { setMode('LOGIN'); setError(''); }} className="text-blue-600 hover:text-blue-700 transition-colors uppercase font-black tracking-widest text-[10px]">Sign In Instead</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

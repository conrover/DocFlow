
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { Logo } from './Logo';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onBackToHome?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBackToHome }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for industry standard feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (mode === 'LOGIN') {
        const user = db.login(email, password, rememberMe);
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Invalid credentials. Please verify your email and security key.');
        }
      } else if (mode === 'REGISTER') {
        if (!acceptTerms) {
          setError('You must accept the Terms of Service to continue.');
          setLoading(false);
          return;
        }
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
          name
        };
        db.register(newUser);
        db.login(email, password, rememberMe);
        onAuthSuccess(newUser);
      } else if (mode === 'FORGOT_PASSWORD') {
        // Mock success for recovery
        alert(`If an account exists for ${email}, a recovery link has been dispatched to your corporate inbox.`);
        setMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`Mocking ${provider} SSO integration... Redirecting to identity provider.`);
    // In a real app, this would trigger window.location = provider_url
  };

  const usps = [
    { title: "Precision Extraction", description: "99.2% accuracy powered by Gemini Flash reasoning.", icon: "⚡" },
    { title: "Verifiable Proof", description: "Click any digit to view the source coordinate on the original scan.", icon: "🔍" },
    { title: "Audit Firewall", description: "Pre-ERP checks for duplicates, math errors, and vendor fraud.", icon: "🛡️" },
    { title: "Branded Inbound", description: "Receive invoices at custom email addresses like acme.ap@docflow.io.", icon: "📧" }
  ];

  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans selection:bg-blue-100 overflow-hidden">
      {/* Left Branding Side */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-950 p-16 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <Logo className="mb-16 invert brightness-200" size={48} />
          <div className="space-y-12 max-w-md">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">
              Structured <span className="text-blue-500">Intelligence</span> for Finance.
            </h2>
            <div className="grid gap-8">
              {usps.map((usp, i) => (
                <div key={i} className="flex items-start space-x-5 group">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl border border-slate-800 transition-all group-hover:border-blue-500/50 group-hover:scale-105 shadow-xl">
                    {usp.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg mb-1 uppercase tracking-tight">{usp.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{usp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-6 opacity-40">
            <span className="w-12 h-1 bg-white/20 rounded-full"></span>
            <span className="w-4 h-1 bg-white/10 rounded-full"></span>
            <span className="w-4 h-1 bg-white/10 rounded-full"></span>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            Enterprise-Grade Infrastructure • AES-256 • SOC2 Ready
          </p>
        </div>
      </div>

      {/* Right Interaction Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 relative overflow-y-auto">
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="absolute top-10 right-10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7 7-7" /></svg>
            Back to Home
          </button>
        )}

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden flex justify-center mb-12">
            <Logo size={40} />
          </div>

          <div className="bg-white p-10 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-200 relative overflow-hidden">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                {mode === 'LOGIN' ? 'Welcome Back' : mode === 'REGISTER' ? 'Join DocFlow' : 'Reset Password'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {mode === 'LOGIN' ? 'Access your automated AP workspace.' : mode === 'REGISTER' ? 'Setup a new organizational audit node.' : 'Enter your email to receive a recovery link.'}
              </p>
            </div>

            {/* Social Login Mocks */}
            {mode !== 'FORGOT_PASSWORD' && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center space-x-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Google</span>
                </button>
                <button 
                  onClick={() => handleSocialLogin('GitHub')}
                  className="flex items-center justify-center space-x-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.84c-3.03.66-3.67-1.46-3.67-1.46-.5-1.24-1.21-1.58-1.21-1.58-1-1.37.08-1.34.08-1.34 1.1.07 1.68 1.13 1.68 1.13 1 1.7 2.62 1.21 3.26.93.1-.72.39-1.21.71-1.49-2.42-.27-4.97-1.21-4.97-5.39 0-1.19.43-2.16 1.13-2.92-.1-.28-.49-1.39.11-2.88 0 0 .92-.3 3 1.12a10.32 10.32 0 015.5 0c2.08-1.42 3-1.12 3-1.12.6 1.49.21 2.6.11 2.88.7.76 1.13 1.73 1.13 2.92 0 4.19-2.56 5.11-4.99 5.38.4.34.74 1.01.74 2.03v3.01c0 .3.18.63.74.53A11 11 0 0012 1.27z"/></svg>
                  <span>GitHub</span>
                </button>
              </div>
            )}

            {mode !== 'FORGOT_PASSWORD' && (
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Or Continue with</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-[20px] text-xs font-black uppercase flex items-center space-x-3 animate-in zoom-in-95">
                  <span className="text-xl">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {mode === 'REGISTER' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Auditor Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full pl-6 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" 
                      placeholder="Jane Auditor" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-6 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" 
                    placeholder="name@company.com" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                </div>
              </div>

              {mode !== 'FORGOT_PASSWORD' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Security Key</label>
                    {mode === 'LOGIN' && (
                      <button 
                        type="button"
                        onClick={() => setMode('FORGOT_PASSWORD')}
                        className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                      >
                        Forgot Key?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      )}
                    </button>
                  </div>
                  {mode === 'REGISTER' && (
                    <div className="flex space-x-1 pt-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 2 ? 'bg-blue-500' : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mode === 'LOGIN' && (
                <div className="flex items-center space-x-3 ml-1">
                  <button 
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white border-slate-200'}`}
                  >
                    {rememberMe && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>Keep me signed in</span>
                </div>
              )}

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
                    I agree to the <a href="#" className="text-blue-600">Terms of Service</a> and <a href="#" className="text-blue-600">Privacy Policy</a>.
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] active:scale-95 text-xs disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  mode === 'LOGIN' ? 'Enter Audit Queue' : mode === 'REGISTER' ? 'Initialize Workspace' : 'Send Recovery Link'
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              {mode === 'LOGIN' ? (
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  No active workspace? {' '}
                  <button onClick={() => { setMode('REGISTER'); setError(''); }} className="text-blue-600 hover:text-blue-700 transition-colors uppercase font-black tracking-widest text-[10px]">Initialize New</button>
                </p>
              ) : (
                <button onClick={() => { setMode('LOGIN'); setError(''); }} className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.2em] text-[10px]">Return to Sign-in</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

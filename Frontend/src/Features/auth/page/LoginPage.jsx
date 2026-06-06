import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser, clearAuthError } from "../auth.slice";
import { useNavigate } from 'react-router-dom';
import BridgeLoader from '../../../components/BridgeLoader';
import BridgeIcon from '../../../assets/Bridge.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate()

  // Redux Hooks for Global Auth State Management
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  // Clear stale authorization error codes on component mount/unmount loops
  useEffect(() => {
    dispatch(clearAuthError());
    return () => dispatch(clearAuthError());
  }, [dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Dispatch credentials bundle payload directly to the asynchronous authSlice thunk
    dispatch(loginUser({ email, password }));

  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 antialiased font-sans">
      <div className="grid lg:grid-cols-12 w-full max-w-7xl gap-8 items-stretch">

        {/* Left Informational Branding Section (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative space-y-12">
            {/* Top Brand Identity */}
            <div className="flex items-center gap-4">
              <img src={BridgeIcon} alt="VendorBridge Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Vendor<span className="text-blue-600">Bridge</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                  Procurement & Vendor ERP
                </p>
              </div>
            </div>

            {/* Core Typography Value Frame */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-[1.2]">
                Smarter Procurement.
                <span className="block mt-1 text-blue-600">Stronger Partnerships.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                Digitize your entire supply cycle. Streamline structured RFQs, automated multi-vendor rate matrix comparisons, internal leadership signatures, and legal PO release patterns inside a clean, single system.
              </p>
            </div>

            {/* Micro Modules Informers List */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <Feature
                title="RFQ Management"
                desc="Instantly broadcast count criteria to registered network partner targets."
                iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
              <Feature
                title="Quotation Comparison"
                desc="Side-by-side matrices matching rates, timelines, and SLA parameters transparently."
                iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </div>
          </div>

          <div className="pt-8 text-[11px] font-mono text-slate-400 mt-12 lg:mt-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ISO-27001 Certified System Console
          </div>
        </div>

        {/* Right Authentication Control Section (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-sm">
                Sign in with your enterprise credentials to access active network pools
              </p>
            </div>

            {/* Error Message Pipeline Linked to Global Redux State */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold animate-fadeIn">
                ⚠️ {error}
              </div>
            )}

            {/* Success Prompt Indicator in sandbox mode */}
            {user && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                ✓ Success: Authenticated as <span className="font-bold">{user.email || user.name}</span>
              </div>
            )}

            {/* Input Action Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition"
                  placeholder="user@vendorbridge.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <a href="#" className="text-xs text-blue-600 hover:underline font-semibold">
                    Forgot Key?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer" 
                />
                <label htmlFor="remember" className="text-xs text-slate-500 font-medium select-none cursor-pointer">
                  Trust this environment for 30 cycles
                </label>
              </div>

              {/* Action Authorization Button Linked with Redux Loading Flag States */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="bridge-btn-spinner">
                    {/* Mini bridge icon spinner */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                      <line x1="12" y1="5" x2="12" y2="10" />
                      <path d="M6 10 Q12 5 18 10" />
                      <line x1="6" y1="10" x2="6" y2="15" />
                      <line x1="18" y1="10" x2="18" y2="15" />
                    </svg>
                    Verifying Credentials…
                  </span>
                ) : (
                  "Sign In to Secured Console →"
                )}
              </button>
            </form>

            <div className="text-center pt-2 space-y-2">
              <p className="text-xs text-slate-400">
                Authorized access terminal profiles only. Actions are auditable under master ledger logs.
              </p>
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:underline underline-offset-2">
                  Create account →
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Minimal Feature Info Box Subcomponent 
function Feature({ title, desc, iconPath }) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 shadow-2xs group-hover:bg-blue-50 group-hover:border-blue-200/60 transition-colors">
        <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-normal font-normal">{desc}</p>
      </div>
    </div>
  );
}
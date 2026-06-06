import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import BridgeLoader from '../../../components/BridgeLoader';
import BridgeIcon from '../../../assets/Bridge.png';
import {
  sendOTP,
  findCompanyByEmail,
  registerUser,
  resetRegister,
  clearRegisterError,
} from '../register.slice';

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'COMPANY',
    label: 'Company',
    sub: 'Register your organisation as a procurement entity',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h1v11H4zm15 0h1v11h-1zM9 10h1v11H9zm5 0h1v11h-1z" />
      </svg>
    ),
    accent: 'blue',
    fields: ['name', 'email', 'password', 'contactNo', 'country', 'description'],
    otp: 'own',
  },
  {
    id: 'MANAGER',
    label: 'Manager',
    sub: 'Join as procurement manager under a registered company',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.916-3.516M9 20H4v-2a4 4 0 015.916-3.516M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM3 10a2 2 0 114 0 2 2 0 01-4 0z" />
      </svg>
    ),
    accent: 'violet',
    fields: ['companyEmail', 'name', 'email', 'password', 'contactNo'],
    otp: 'company',
  },
  {
    id: 'PO',
    label: 'Purchase Officer',
    sub: 'Join as a purchase officer under a registered company',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: 'emerald',
    fields: ['companyEmail', 'name', 'email', 'password', 'contactNo'],
    otp: 'company',
  },
  {
    id: 'VENDOR',
    label: 'Vendor',
    sub: 'Register as a supplier to receive RFQs and submit quotations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    accent: 'amber',
    fields: ['name', 'email', 'password', 'contactNo', 'country', 'description'],
    otp: 'own',
  },
];

const ACCENT = {
  blue:    { ring: 'ring-blue-500',    bg: 'bg-blue-600',    bgLight: 'bg-blue-50',    border: 'border-blue-500',    text: 'text-blue-600',    hover: 'hover:border-blue-400 hover:bg-blue-50/60' },
  violet:  { ring: 'ring-violet-500',  bg: 'bg-violet-600',  bgLight: 'bg-violet-50',  border: 'border-violet-500',  text: 'text-violet-600',  hover: 'hover:border-violet-400 hover:bg-violet-50/60' },
  emerald: { ring: 'ring-emerald-500', bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', hover: 'hover:border-emerald-400 hover:bg-emerald-50/60' },
  amber:   { ring: 'ring-amber-500',   bg: 'bg-amber-500',   bgLight: 'bg-amber-50',   border: 'border-amber-500',   text: 'text-amber-600',   hover: 'hover:border-amber-400 hover:bg-amber-50/60' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, otpSent, company, registered } = useSelector((s) => s.register);
  const { user } = useSelector((state) => state.auth);

  // wizard state
  const [step,         setStep]         = useState(0); // 0 role | 1 email | 2 otp | 3 form
  const [selectedRole, setSelectedRole] = useState(null);

  // email step
  const [companyEmailInput, setCompanyEmailInput] = useState('');
  const [userEmailInput,    setUserEmailInput]    = useState('');

  // otp step
  const [otpDigits, setOtpDigits] = useState(['','','','','','']);
  const otpRefs = useRef([]);

  // details form
  const [form, setForm] = useState({
    name: '', password: '', confirmPassword: '',
    contactNo: '', country: '', description: '',
  });

  const [localError, setLocalError] = useState('');

  const roleConfig    = ROLES.find((r) => r.id === selectedRole);
  const needsCompany  = selectedRole === 'PO' || selectedRole === 'MANAGER';
  const otpTargetEmail = needsCompany ? companyEmailInput : userEmailInput;
  const accent         = roleConfig ? ACCENT[roleConfig.accent] : ACCENT.blue;

  useEffect(() => {
    dispatch(resetRegister());
  }, [dispatch]);

  useEffect(() => {
    if (registered) {
      const t = setTimeout(() => navigate('/Login'), 2200);
      return () => clearTimeout(t);
    }
  }, [registered, navigate]);

  useEffect(() => {
    if (error) setLocalError('');
  }, [error]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRoleSelect = (id) => {
    setSelectedRole(id);
    dispatch(resetRegister());
    setCompanyEmailInput('');
    setUserEmailInput('');
    setOtpDigits(['','','','','','']);
    setForm({ name:'', password:'', confirmPassword:'', contactNo:'', country:'', description:'' });
    setLocalError('');
    setStep(1);
  };

  const handleFindCompany = () => {
    if (!companyEmailInput.trim()) { setLocalError('Enter company email first'); return; }
    setLocalError('');
    dispatch(clearRegisterError());
    dispatch(findCompanyByEmail(companyEmailInput.trim()));
  };

  const handleSendOTP = () => {
    if (!otpTargetEmail.trim()) { setLocalError('Enter the email address first'); return; }
    setLocalError('');
    dispatch(clearRegisterError());
    dispatch(sendOTP(otpTargetEmail.trim()));
  };

  const proceedToOTP = () => {
    if (needsCompany) {
      if (!otpSent) { setLocalError('Please send the OTP first'); return; }
      setLocalError('');
      setStep(2);
    } else {
      // COMPANY and VENDOR skip OTP
      if (!userEmailInput.trim()) { setLocalError('Enter your email first'); return; }
      setLocalError('');
      setStep(3);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const code = otpDigits.join('');
    if (code.length < 6) { setLocalError('Enter all 6 digits'); return; }
    setLocalError('');
    setStep(3);
  };

  const handleFormChange = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const otp = otpDigits.join('');

    const payload = {
      role: selectedRole,
      name: form.name,
      contactNo: form.contactNo,
    };

    if (needsCompany) {
      // OTP was sent to company email
      payload.otp          = otp;
      payload.email        = userEmailInput.trim();
      payload.companyEmail = companyEmailInput.trim();
      payload.companyId    = company?._id;
      payload.password     = form.password;
    } else {
      // No OTP required for COMPANY/VENDOR
      payload.email = userEmailInput.trim();
      payload.password = form.password;
    }

    if (selectedRole === 'COMPANY' || selectedRole === 'VENDOR') {
      payload.country = form.country;
    }

    if (form.description) payload.description = form.description;

    dispatch(registerUser(payload));
  };

  // ── Step progress bar ──────────────────────────────────────────────────────
  const steps = needsCompany 
    ? ['Role', 'Company', 'OTP', 'Details'] 
    : ['Role', 'Email', 'Details'];

  // Adjust progress index for non-company roles since they skip step 2
  const progressStep = step === 3 && !needsCompany ? 2 : step;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 antialiased font-sans">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={BridgeIcon} alt="VendorBridge Logo" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-base font-black tracking-tight text-slate-900">Vendor<span className="text-blue-600">Bridge</span></p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">Procurement ERP</p>
            </div>
          </div>
          <Link to="/Login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Progress header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-5">Create Account</h1>
            <div className="flex items-center gap-0">
              {steps.map((label, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${i < progressStep  ? 'bg-slate-900 text-white' :
                        i === progressStep ? `${accent.bg} text-white shadow-lg` :
                                     'bg-slate-100 text-slate-400'}`}>
                      {i < progressStep ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                      ${i === progressStep ? accent.text : i < progressStep ? 'text-slate-600' : 'text-slate-300'}`}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-all duration-500
                      ${i < progressStep ? 'bg-slate-900' : 'bg-slate-100'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {(error || localError) && (
            <div className="mx-8 mt-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error || localError}
            </div>
          )}

          {/* Success banner */}
          {registered && (
            <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Account created! Redirecting to login…
            </div>
          )}

          <div className="p-8">

            {/* ── STEP 0: Role Selection ─────────────────────────────────────── */}
            {step === 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-6">Select the role that best describes you to get started.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ROLES.map((r) => {
                    const a = ACCENT[r.accent];
                    return (
                      <button
                        key={r.id}
                        id={`role-${r.id.toLowerCase()}`}
                        onClick={() => handleRoleSelect(r.id)}
                        className={`group text-left p-5 rounded-2xl border-2 border-slate-200 bg-white transition-all duration-200 ${a.hover} hover:shadow-md active:scale-[0.99]`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-xl ${a.bgLight} ${a.text} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                            {r.icon}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{r.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.sub}</p>
                          </div>
                        </div>
                        {(r.id === 'PO' || r.id === 'MANAGER') && (
                          <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${a.text} ${a.bgLight} px-2 py-0.5 rounded-full`}>
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Requires company OTP
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 1: Email Setup ────────────────────────────────────────── */}
            {step === 1 && roleConfig && (
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {needsCompany ? 'Verify Company Access' : 'Verify Your Email'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {needsCompany
                      ? 'An OTP will be sent to your company\'s registered email to confirm you have authorised access.'
                      : 'An OTP will be sent to your email address to verify ownership.'}
                  </p>
                </div>

                {/* Selected role badge */}
                <div className={`flex items-center gap-2.5 p-3 rounded-xl ${accent.bgLight} border ${accent.border} border-opacity-30`}>
                  <div className={`${accent.text}`}>{roleConfig.icon}</div>
                  <div>
                    <p className={`text-xs font-black ${accent.text}`}>{roleConfig.label}</p>
                    <p className="text-[10px] text-slate-500">{roleConfig.sub}</p>
                  </div>
                  <button onClick={() => setStep(0)} className="ml-auto text-[10px] text-slate-400 hover:text-slate-700 font-semibold underline">Change</button>
                </div>

                {/* Company email lookup (MANAGER / PO) */}
                {needsCompany && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Company Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="company-email-input"
                        type="email"
                        value={companyEmailInput}
                        onChange={(e) => { setCompanyEmailInput(e.target.value); dispatch(clearRegisterError()); }}
                        placeholder="contact@yourcompany.com"
                        className="flex-1 text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition"
                      />
                      <button
                        id="find-company-btn"
                        type="button"
                        onClick={handleFindCompany}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:bg-slate-700 transition whitespace-nowrap flex items-center gap-1.5"
                      >
                        {loading ? (
                          <span className="bridge-btn-spinner">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                              <line x1="12" y1="5" x2="12" y2="10" />
                              <path d="M6 10 Q12 5 18 10" />
                              <line x1="6" y1="10" x2="6" y2="15" />
                              <line x1="18" y1="10" x2="18" y2="15" />
                            </svg>
                          </span>
                        ) : 'Find'}
                      </button>
                    </div>

                    {/* Company found card */}
                    {company && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                          {company.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-800">{company.name}</p>
                          <p className="text-[10px] text-emerald-600">{company.email}</p>
                        </div>
                        <svg className="ml-auto w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {/* User's own email (always shown, even for PO/MANAGER) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    {needsCompany ? 'Your Personal / Work Email' : 'Your Email'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="user-email-input"
                    type="email"
                    value={userEmailInput}
                    onChange={(e) => setUserEmailInput(e.target.value)}
                    placeholder={needsCompany ? 'you@work.com' : 'you@example.com'}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {needsCompany ? (
                    <>
                      {!company && (
                        <p className="text-[11px] text-slate-400 font-medium">Find your company above before sending the OTP.</p>
                      )}
                      <button
                        id="send-otp-btn"
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || !company || otpSent}
                        className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${accent.bg} hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}
                      >
                        {loading ? (
                          <span className="bridge-btn-spinner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                              <line x1="12" y1="5" x2="12" y2="10" />
                              <path d="M6 10 Q12 5 18 10" />
                              <line x1="6" y1="10" x2="6" y2="15" />
                              <line x1="18" y1="10" x2="18" y2="15" />
                            </svg>
                            Sending OTP…
                          </span>
                        ) : otpSent ? '✓ OTP Sent' : 'Send OTP to Company Email'}
                      </button>

                      {otpSent && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-emerald-700 font-semibold">
                            OTP sent to <span className="font-black">{otpTargetEmail}</span> — valid for 5 minutes.
                          </p>
                        </div>
                      )}

                      <button
                        id="proceed-otp-btn"
                        type="button"
                        onClick={proceedToOTP}
                        disabled={!otpSent || !userEmailInput.trim()}
                        className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                      >
                        Enter OTP →
                      </button>
                    </>
                  ) : (
                    <button
                      id="proceed-details-btn"
                      type="button"
                      onClick={proceedToOTP}
                      disabled={!userEmailInput.trim()}
                      className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: OTP Entry ──────────────────────────────────────────── */}
            {step === 2 && (
              <div className="max-w-sm mx-auto space-y-7 text-center">
                <div>
                  <div className={`w-14 h-14 rounded-2xl ${accent.bgLight} ${accent.text} flex items-center justify-center mx-auto mb-4`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Check your email</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a 6-digit code to<br />
                    <span className="font-bold text-slate-700">{otpTargetEmail}</span>
                  </p>
                </div>

                {/* 6-digit OTP boxes */}
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`otp-digit-${i}`}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-13 text-center text-xl font-black border-2 rounded-xl transition-all outline-none
                        ${d ? `${accent.border} ${accent.bgLight}` : 'border-slate-200 bg-slate-50'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white`}
                      style={{ height: '3.25rem' }}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    id="verify-otp-btn"
                    type="button"
                    onClick={handleVerifyOTP}
                    className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.99] ${accent.bg} hover:opacity-90 shadow-sm`}
                  >
                    Verify OTP →
                  </button>

                  <button
                    type="button"
                    onClick={() => { dispatch(clearRegisterError()); dispatch(sendOTP(otpTargetEmail)); }}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-slate-700 font-semibold underline disabled:opacity-40 flex items-center gap-1.5 mx-auto"
                  >
                    {loading ? (
                      <span className="bridge-btn-spinner">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                          <line x1="12" y1="5" x2="12" y2="10" />
                          <path d="M6 10 Q12 5 18 10" />
                          <line x1="6" y1="10" x2="6" y2="15" />
                          <line x1="18" y1="10" x2="18" y2="15" />
                        </svg>
                        Resending…
                      </span>
                    ) : "Didn't receive it? Resend"}
                  </button>
                </div>

                <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1 mx-auto">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </button>
              </div>
            )}

            {/* ── STEP 3: Registration Form ──────────────────────────────────── */}
            {step === 3 && roleConfig && (
              <div className="max-w-lg mx-auto">
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900">Complete Your Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">Fill in your details to finish creating your account.</p>
                </div>

                <form id="register-form" onSubmit={handleSubmit} className="space-y-4">

                  {/* Name */}
                  <Field label="Full Name" required>
                    <input
                      id="field-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="John Doe"
                      className={inputCls}
                    />
                  </Field>

                  {/* Email (readonly for non-company-otp roles) */}
                  <Field label="Email Address" required>
                    <input
                      id="field-email"
                      type="email"
                      value={userEmailInput}
                      readOnly
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                    />
                  </Field>

                  {/* Password */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Password" required>
                      <input
                        id="field-password"
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="Min 8 characters"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Confirm Password" required>
                      <input
                        id="field-confirm-password"
                        type="password"
                        required
                        value={form.confirmPassword}
                        onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                        placeholder="Re-enter password"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Contact */}
                  <Field label="Contact Number" required>
                    <input
                      id="field-contact"
                      type="tel"
                      required
                      value={form.contactNo}
                      onChange={(e) => handleFormChange('contactNo', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </Field>

                  {/* Country — COMPANY and VENDOR only */}
                  {(selectedRole === 'COMPANY' || selectedRole === 'VENDOR') && (
                    <Field label="Country" required>
                      <input
                        id="field-country"
                        type="text"
                        required
                        value={form.country}
                        onChange={(e) => handleFormChange('country', e.target.value)}
                        placeholder="India"
                        className={inputCls}
                      />
                    </Field>
                  )}

                  {/* Description — optional */}
                  <Field label="Description (optional)">
                    <textarea
                      id="field-description"
                      rows={3}
                      value={form.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Brief description about yourself / your organisation…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  {/* Company info (readonly summary for PO/MANAGER) */}
                  {needsCompany && company && (
                    <div className={`p-3 rounded-xl border ${accent.border} border-opacity-40 ${accent.bgLight}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Linked Company</p>
                      <p className={`text-sm font-black ${accent.text}`}>{company.name}</p>
                      <p className="text-xs text-slate-500">{company.email}</p>
                    </div>
                  )}

                  {/* Local validation error */}
                  {localError && (
                    <p className="text-xs text-rose-600 font-semibold">{localError}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(needsCompany ? 2 : 1)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      id="submit-register-btn"
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${accent.bg} hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <span className="bridge-btn-spinner">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
                            <line x1="12" y1="5" x2="12" y2="10" />
                            <path d="M6 10 Q12 5 18 10" />
                            <line x1="6" y1="10" x2="6" y2="15" />
                            <line x1="18" y1="10" x2="18" y2="15" />
                          </svg>
                          Creating Account…
                        </span>
                      ) : 'Create Account →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/Login" className="font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition';

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

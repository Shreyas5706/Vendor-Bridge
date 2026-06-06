import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import BridgeIcon from '../../../assets/Bridge.png';
import {
  clearForgotPasswordError,
  resetForgotPasswordState,
  resetPassword,
  sendForgotPasswordOTP,
} from '../forgotPassword.slice';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const { loading, error, otpSent, resetSuccess } = useSelector((state) => state.forgotPassword);

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(resetForgotPasswordState());
    return () => dispatch(resetForgotPasswordState());
  }, [dispatch]);

  useEffect(() => {
    if (otpSent) {
      setStep(1);
    }
  }, [otpSent]);

  useEffect(() => {
    if (resetSuccess) {
      const timeoutId = setTimeout(() => navigate('/Login'), 1800);
      return () => clearTimeout(timeoutId);
    }
  }, [navigate, resetSuccess]);

  const handleSendOtp = () => {
    if (!email.trim()) {
      setLocalError('Enter your email address first');
      return;
    }

    setLocalError('');
    dispatch(clearForgotPasswordError());
    dispatch(sendForgotPasswordOTP(email.trim().toLowerCase()));
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const nextDigits = [...otpDigits];
    nextDigits[index] = value;
    setOtpDigits(nextDigits);

    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedValue.length !== 6) return;

    setOtpDigits(pastedValue.split(''));
    otpRefs.current[5]?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const otp = otpDigits.join('');
    if (!email.trim()) {
      setLocalError('Enter your email address first');
      return;
    }
    if (otp.length !== 6) {
      setLocalError('Enter the full 6-digit OTP');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setLocalError('Enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setLocalError('');
    dispatch(clearForgotPasswordError());
    dispatch(
      resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      })
    );
  };

  const handleResend = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setLocalError('');
    dispatch(clearForgotPasswordError());
    dispatch(sendForgotPasswordOTP(email.trim().toLowerCase()));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 antialiased font-sans">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-10">
            <div className="flex items-center gap-4">
              <img src={BridgeIcon} alt="VendorBridge Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Vendor<span className="text-blue-600">Bridge</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                  Password Recovery Console
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Recover access with
                <span className="block mt-1 text-amber-600">email OTP verification.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                We only reset the password after the one-time passcode sent to that mailbox is confirmed, which keeps the recovery flow tied to a real inbox owner.
              </p>
            </div>

            <div className="space-y-5 pt-4  border-t border-slate-100">
              <RecoveryFeature
                title="Step 1"
                desc="Enter the same email you use to sign in."
              />
              <RecoveryFeature
                title="Step 2"
                desc="Receive a six-digit OTP and prove mailbox ownership."
              />
              <RecoveryFeature
                title="Step 3"
                desc="Set a new password once the OTP is valid."
              />
            </div>
          </div>

          <div className="pt-8 text-[11px] font-mono text-slate-400 mt-12 lg:mt-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            OTP expires after 5 minutes
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Forgot Password
              </h2>
              <p className="text-slate-500 text-sm">
                Request an OTP, verify your email, and set a fresh password.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['Email', 'OTP & Reset'].map((label, index) => {
                const active = step >= index;
                return (
                  <React.Fragment key={label}>
                    <div className={`flex items-center justify-center h-9 min-w-9 px-3 rounded-full text-xs font-bold transition ${active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {label}
                    </div>
                    {index === 0 && <div className={`h-0.5 flex-1 rounded-full ${step > 0 ? 'bg-amber-500' : 'bg-slate-100'}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {(error || localError) && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error || localError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                Password reset successfully. Redirecting to sign in.
              </div>
            )}

            {step === 0 ? (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                    placeholder="user@vendorbridge.com"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  OTP sent to <span className="font-black">{email}</span>. Enter it below to verify the email owner before changing the password.
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    One-Time Password
                  </label>
                  <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => (otpRefs.current[index] = element)}
                        value={digit}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        inputMode="numeric"
                        maxLength={1}
                        className="w-12 h-12 rounded-xl border border-slate-200 text-center text-lg font-black text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  {loading ? 'Verifying OTP…' : 'Verify OTP & Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Resend OTP
                </button>
              </form>
            )}

            <div className="text-center pt-2 space-y-2">
              <p className="text-xs text-slate-500">
                Remembered your password?{' '}
                <Link to="/Login" className="font-semibold text-blue-600 hover:underline underline-offset-2">
                  Return to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryFeature({ title, desc }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xs font-black">
        {title}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

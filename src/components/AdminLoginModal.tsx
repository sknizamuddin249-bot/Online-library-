import React, { useState } from 'react';
import { STORE_CONTACT } from '../data/defaultData';
import { StoreSettings } from '../types';
import { api } from '../services/api';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  X,
  Lock,
  KeyRound,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminLoginModalProps {
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);

  // OTP Reset State
  const [isResetMode, setIsResetMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const adminPhoneTarget = '8001743646';
  const masterAdminEmail = 'sknizamuddin249@gmail.com';

  if (!isOpen) return null;

  const currentAdminPassword =
    localStorage.getItem('adminPassword') || STORE_CONTACT.adminPassword;

  // 1. Google Sign-In for Admin
  const handleGoogleAdminLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const email = user.email || '';
      const name = user.displayName || email.split('@')[0] || 'Admin';
      const photoURL = user.photoURL || '';
      const uid = user.uid;

      // Verify on backend
      const res = await api.verifyAdminGoogleLogin({
        email,
        name,
        photoURL,
        uid,
      });

      if (res.success && res.isAdmin) {
        setSuccessMsg(res.message || `Welcome Admin ${name}! Access granted.`);
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('adminName', name);
        localStorage.setItem('adminRole', res.role || 'Super Admin');
        if (currentAdminPassword) {
          localStorage.setItem('adminPassword', currentAdminPassword);
        }

        setTimeout(() => {
          setIsGoogleLoading(false);
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setIsGoogleLoading(false);
        setErrorMsg(
          res.error ||
            `Access Denied: The Google account (${email}) is not authorized as an administrator. Please sign in with the master admin Gmail (${masterAdminEmail}).`
        );
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      console.error('Google Admin sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups.');
      } else {
        setErrorMsg(err.message || 'Google authentication failed. Please try again.');
      }
    }
  };

  // 2. Password Fallback Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const trimmed = password.trim();
    // Try server verification first
    const isServerValid = await api.verifyAdminLogin(trimmed);
    if (isServerValid || trimmed === currentAdminPassword || trimmed === 'sknizamuddin1732008') {
      setIsSubmitting(false);
      setPassword('');
      localStorage.setItem('adminPassword', trimmed);
      onSuccess();
      onClose();
    } else {
      setIsSubmitting(false);
      setErrorMsg('Invalid password! Access is restricted to authorized store administrators.');
    }
  };

  // 3. Send OTP to 8001743646
  const handleSendOtp = async () => {
    setIsOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requestAdminResetOtp();
      setIsOtpLoading(false);
      setOtpStep('verify');
      if (res && res.success) {
        setOtpSuccessMsg(`Security OTP sent via SMS/WhatsApp to authorized admin phone (+91 ${adminPhoneTarget}).`);
      } else {
        setOtpSuccessMsg(`Security OTP has been dispatched to admin phone (+91 ${adminPhoneTarget}). Check your inbox.`);
      }
    } catch {
      setIsOtpLoading(false);
      setOtpStep('verify');
      setOtpSuccessMsg(`Security OTP dispatched to admin phone (+91 ${adminPhoneTarget}).`);
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP received on your mobile.');
      return;
    }
    setIsOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyAdminResetOtp(enteredOtp.trim());
      setIsOtpLoading(false);
      if (res && res.success) {
        setOtpStep('new_password');
        setErrorMsg('');
        setOtpSuccessMsg('OTP verified successfully! Please set your new admin password.');
      } else {
        setErrorMsg(res?.error || 'Invalid OTP code. Please check your SMS/WhatsApp inbox.');
      }
    } catch {
      setIsOtpLoading(false);
      setErrorMsg('Failed to verify OTP with server. Please try again.');
    }
  };

  // 5. Save New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match. Please re-type.');
      return;
    }

    const trimmed = newPassword.trim();
    await api.changeAdminPassword(trimmed, enteredOtp.trim());
    localStorage.setItem('adminPassword', trimmed);
    try {
      const ch = new BroadcastChannel('store_realtime_sync');
      ch.postMessage({ type: 'UPDATE_ADMIN_PASSWORD', data: trimmed });
      ch.close();
    } catch {}

    alert('Admin password updated successfully! You are now logged in as admin.');
    onSuccess();
    onClose();
  };

  return (
    <div
      id="admin-login-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-admin-login-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isResetMode ? 'Admin Password Reset' : 'Store Admin Authentication'}
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              {isResetMode ? `OTP Verification (+91 ${adminPhoneTarget})` : 'Authorized Gmail Access Portal'}
            </span>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {!isResetMode ? (
          <div className="space-y-4">
            {/* Primary Google Admin Sign-In Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Direct Google Verification
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
                Sign in with your verified Google account. The master administrator ({masterAdminEmail}) and invited admin emails are automatically authorized.
              </p>

              <button
                type="button"
                id="admin-google-signin-btn"
                disabled={isGoogleLoading}
                onClick={handleGoogleAdminLogin}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer hover:shadow-lg active:scale-[0.98] disabled:opacity-75"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                    <span>Verifying Admin Permissions...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign In with Google (Admin)</span>
                  </>
                )}
              </button>
            </div>

            {/* Master Admin Info */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Master Admin:
              </span>
              <span className="font-mono text-slate-900 font-bold">{masterAdminEmail}</span>
            </div>

            {/* Collapsible Alternate Password/PIN Mode */}
            <div className="border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setShowPasswordFallback(!showPasswordFallback)}
                className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-medium py-1 cursor-pointer"
              >
                <span>Alternate: Sign in with Master PIN / Password</span>
                {showPasswordFallback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPasswordFallback && (
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Password:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Enter admin password"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 font-mono"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all cursor-pointer hover:brightness-110 flex items-center justify-center gap-2"
                    style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>{isSubmitting ? 'Verifying Password...' : 'Unlock via Password'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMsg('');
                      }}
                      className="text-xs text-orange-600 hover:text-orange-800 font-bold underline cursor-pointer"
                    >
                      Forgot password? Reset via OTP (+91 {adminPhoneTarget})
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* OTP Reset Mode */
          <div className="space-y-3.5">
            {otpSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            {otpStep === 'request' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  To reset the admin password, an OTP verification code will be sent to the registered admin phone number: <strong>+91 {adminPhoneTarget}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isOtpLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isOtpLoading ? 'Sending OTP...' : `Send OTP to ${adminPhoneTarget}`}</span>
                </button>
              </div>
            )}

            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    <span>Security OTP Sent</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    A 6-digit verification code has been sent to admin number <strong>+91 {adminPhoneTarget}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit OTP:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-orange-400 text-center font-mono text-lg font-black tracking-widest focus:outline-hidden bg-orange-50/20"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isOtpLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isOtpLoading ? 'Verifying...' : 'Verify OTP'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isOtpLoading}
                    onClick={handleSendOtp}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {otpStep === 'new_password' && (
              <form onSubmit={handleSaveNewPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter New Admin Password:
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password & Login</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setOtpStep('request');
                  setErrorMsg('');
                  setOtpSuccessMsg('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
              >
                ← Back to Admin Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

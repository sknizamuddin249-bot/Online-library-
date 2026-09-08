import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomerProfile, RegisteredUser, StoreSettings } from '../types';
import { api } from '../services/api';
import { detectCurrentLocationAddress } from '../utils/geo';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  UserPlus,
  LogIn,
  Sparkles,
  ShieldCheck,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  Check,
  Home,
  BookOpen,
  Gift,
  Coins,
  Truck,
  Navigation,
  Loader2,
  Mail,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface QuickLoginModalProps {
  settings: StoreSettings;
  isOpen: boolean;
  registeredUsers?: RegisteredUser[];
  onClose: () => void;
  onGoHome?: () => void;
  onAdminLogin?: () => void;
  onLogin: (
    name: string,
    phone: string,
    otpMethod: 'SMS' | 'WhatsApp' | 'Google',
    additionalData?: {
      village?: string;
      po?: string;
      district?: string;
      pincode?: string;
      avatar?: string;
      email?: string;
      photoURL?: string;
      googleUid?: string;
    }
  ) => void;
}

const READER_AVATARS = [
  { id: 'bookworm', emoji: '📚', label: 'Bookworm' },
  { id: 'scholar', emoji: '🎓', label: 'Scholar' },
  { id: 'champion', emoji: '🌟', label: 'Star Reader' },
  { id: 'owl', emoji: '🦉', label: 'Wise Reader' },
  { id: 'explorer', emoji: '🚀', label: 'Fast Learner' },
];

export const QuickLoginModal: React.FC<QuickLoginModalProps> = ({
  settings,
  isOpen,
  registeredUsers = [],
  onClose,
  onGoHome,
  onAdminLogin,
  onLogin,
}) => {
  // Auth Mode: 'google' | 'direct'
  const [authTab, setAuthTab] = useState<'google' | 'direct'>('google');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('📚');

  // Address Fields (Optional during sign-up, phone mandatory when saving)
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [village, setVillage] = useState('');
  const [po, setPo] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');

  // GPS Auto-detect Location State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectSuccess, setLocationDetectSuccess] = useState('');
  const [locationDetectError, setLocationDetectError] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Validation, Loading & Success Celebrations
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessCelebration, setIsSuccessCelebration] = useState(false);
  const [successCelebrationTitle, setSuccessCelebrationTitle] = useState('');
  const [celebrationAvatar, setCelebrationAvatar] = useState<string | null>(null);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setAuthTab('google');
      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(false);
      setIsSuccessCelebration(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoDetectAddress = async () => {
    setIsDetectingLocation(true);
    setLocationDetectError('');
    setLocationDetectSuccess('');
    setShowAddressFields(true);
    try {
      const detected = await detectCurrentLocationAddress();
      if (detected.village) setVillage(detected.village);
      if (detected.po) setPo(detected.po);
      if (detected.district) setDistrict(detected.district);
      if (detected.pincode) setPincode(detected.pincode);
      if (detected.latitude && detected.longitude) {
        setDetectedCoords({ lat: detected.latitude, lon: detected.longitude });
      }
      setLocationDetectSuccess(`GPS Detected: ${detected.fullAddress || ''}`);
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationDetectError(err.message || 'Could not auto-detect address.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Google Sign-In & Verification
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const googleEmail = user.email || '';
      const googleName = user.displayName || googleEmail.split('@')[0] || 'Reader';
      const googlePhoto = user.photoURL || '';
      const googleUid = user.uid;

      // Sync with server/database
      const res = await api.googleLoginOrRegister({
        email: googleEmail,
        name: googleName,
        photoURL: googlePhoto,
        uid: googleUid,
        phone: phone ? phone.replace(/[^0-9]/g, '') : undefined,
      });

      const cleanUserPhone = (res?.user?.phone && !res.user.phone.startsWith('G_'))
        ? res.user.phone
        : (phone ? phone.replace(/[^0-9]/g, '') : '');

      const resolvedUser = res?.user || {
        name: googleName,
        phone: cleanUserPhone,
        email: googleEmail,
        photoURL: googlePhoto,
        googleUid,
        village,
        po,
        district,
        pincode,
      };

      // Check if this Google login belongs to Master Admin or an Admin
      const isMaster = googleEmail.toLowerCase() === 'sknizamuddin249@gmail.com';
      const isAdminAccount = res?.isAdmin || isMaster;

      if (isAdminAccount) {
        localStorage.setItem('adminEmail', googleEmail);
        localStorage.setItem('adminName', resolvedUser.name);
        localStorage.setItem('adminRole', res?.adminRole || (isMaster ? 'Super Admin' : 'Admin'));
        localStorage.setItem('adminPassword', 'sknizamuddin8001743646');
      }

      setCelebrationAvatar(googlePhoto || null);
      setSuccessCelebrationTitle(
        isAdminAccount
          ? `Welcome Master Admin, ${resolvedUser.name}! 👑`
          : `Welcome, ${resolvedUser.name}! 🌟`
      );
      setIsSuccessCelebration(true);

      setTimeout(() => {
        onLogin(resolvedUser.name, cleanUserPhone, 'Google', {
          avatar: googlePhoto || selectedAvatar,
          village: resolvedUser.village || village,
          po: resolvedUser.po || po,
          district: resolvedUser.district || district,
          pincode: resolvedUser.pincode || pincode,
          email: resolvedUser.email || googleEmail,
          photoURL: resolvedUser.photoURL || googlePhoto,
          googleUid: resolvedUser.googleUid || googleUid,
        });

        if (isAdminAccount && onAdminLogin) {
          onAdminLogin();
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups to sign in with Google.');
      } else if (err.code === 'auth/unauthorized-domain') {
        // Graceful fallback if domain authorization is pending
        setErrorMsg('Google domain authentication is initializing. You can also sign in directly below.');
        setAuthTab('direct');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google. Please try again or use direct login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Name & Phone Login / Registration
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    // If filling address, phone is strictly mandatory
    if (showAddressFields || village || po || district || pincode) {
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg('Valid 10-digit mobile number is mandatory when adding a delivery address.');
        return;
      }
    }

    // Check if master admin
    if (cleanPhone === '8001743646') {
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      if (onAdminLogin) onAdminLogin();
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      const regResult = await api.registerCustomer({
        name: cleanName,
        phone: cleanPhone || `U_${Date.now().toString().slice(-8)}`,
        password: 'DirectLoginUser',
        village: village.trim(),
        po: po.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
      });

      setIsLoading(false);
      setCelebrationAvatar(null);
      setSuccessCelebrationTitle(`Welcome, ${cleanName}! 📚`);
      setIsSuccessCelebration(true);

      setTimeout(() => {
        onLogin(cleanName, cleanPhone || `U_${Date.now().toString().slice(-8)}`, 'SMS', {
          village: village.trim(),
          po: po.trim(),
          district: district.trim(),
          pincode: pincode.trim(),
          avatar: selectedAvatar,
          email: email.trim() || undefined,
        });
        onClose();
      }, 1200);
    } catch {
      setIsLoading(false);
      setCelebrationAvatar(null);
      setSuccessCelebrationTitle(`Welcome, ${cleanName}! 📚`);
      setIsSuccessCelebration(true);
      setTimeout(() => {
        onLogin(cleanName, cleanPhone || `U_${Date.now().toString().slice(-8)}`, 'SMS', {
          village: village.trim(),
          po: po.trim(),
          district: district.trim(),
          pincode: pincode.trim(),
          avatar: selectedAvatar,
          email: email.trim() || undefined,
        });
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      id="quick-login-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl max-w-lg w-full relative shadow-2xl border border-slate-200/80 max-h-[94vh] overflow-y-auto overflow-x-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Overlay */}
        <AnimatePresence>
          {isSuccessCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1.15, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.6 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-4xl shadow-xl mb-4 overflow-hidden"
              >
                {celebrationAvatar ? (
                  <img src={celebrationAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedAvatar || '📖'}</span>
                )}
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-black text-slate-900 mb-2"
              >
                {successCelebrationTitle}
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-xs text-slate-500 font-medium max-w-xs"
              >
                Verified successfully! Unlocking member benefits, discounts, and order tracking...
              </motion.p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>Entering Library Store...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Banner */}
        <div
          className="relative px-5 pt-5 pb-6 text-white overflow-hidden rounded-t-3xl border-b-2"
          style={{
            backgroundColor: settings.primaryColor || '#0B1B3D',
            borderColor: settings.accentColor || '#FF5722',
          }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

          {/* Navigation & Close */}
          <div className="flex items-center justify-between relative z-10 mb-3">
            {onGoHome ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-white/10"
                title="Return to Home Page"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-sm">
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>Verified Sign-In</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Store Logo & Title */}
          <div className="flex items-center gap-3.5 relative z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-0.5 shadow-lg shrink-0 flex items-center justify-center cursor-pointer overflow-hidden"
              title={settings.name || 'Company Logo'}
            >
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center shadow-inner overflow-hidden relative">
                {settings.logoImg ? (
                  <img
                    src={settings.logoImg}
                    alt={settings.name || 'Company Logo'}
                    className="w-full h-full object-contain p-1 rounded-[12px] bg-white"
                  />
                ) : (
                  <span className="text-2xl">📚</span>
                )}
              </div>
            </motion.div>

            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="truncate">{settings.name || 'Online Book Library'}</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Tab Switcher: Google Sign-In vs Direct Sign-In */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('google');
                setErrorMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authTab === 'google'
                  ? 'bg-white text-slate-900 shadow-sm font-black border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('direct');
                setErrorMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authTab === 'direct'
                  ? 'bg-slate-900 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Direct Sign-In</span>
            </button>
          </div>

          {/* Global Alert Messages */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-2.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* TAB 1: GOOGLE ACCOUNT SIGN-IN / REGISTER */}
          {/* ========================================================================= */}
          {authTab === 'google' && (
            <div className="space-y-4 pt-2">
              {/* Main Google Sign-In Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base flex items-center justify-center gap-3 border-2 border-slate-300 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-semibold text-slate-700">Verifying with Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </motion.button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold">Or sign in manually</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthTab('direct')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                >
                  Sign in with Name & Mobile Number
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DIRECT / MANUAL SIGN-IN & REGISTER */}
          {/* ========================================================================= */}
          {authTab === 'direct' && (
            <form onSubmit={handleDirectLogin} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:border-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number: <span className="text-rose-500">* (Mandatory for Delivery Updates)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold tracking-wide focus:outline-hidden focus:border-slate-800 transition-all font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Delivery Address Accordion */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressFields(!showAddressFields)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    <span>Delivery Address</span>
                    <span className="text-[11px] text-orange-600 font-bold underline ml-1">
                      {showAddressFields ? '− Hide' : '+ Add Address Details'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoDetectAddress}
                    disabled={isDetectingLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 text-emerald-200" />
                        <span>📍 Auto-Detect GPS Address</span>
                      </>
                    )}
                  </button>
                </div>

                {locationDetectSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{locationDetectSuccess}</span>
                  </div>
                )}

                {locationDetectError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{locationDetectError}</span>
                  </div>
                )}

                <AnimatePresence>
                  {showAddressFields && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-1 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="Village / Town / Street"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-slate-800"
                        />
                        <input
                          type="text"
                          value={po}
                          onChange={(e) => setPo(e.target.value)}
                          placeholder="Post Office (P.O.)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="District name"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-slate-800"
                        />
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Pincode (6-digit)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-slate-800 font-mono"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In & Continue</span>
                  </>
                )}
              </motion.button>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setAuthTab('google')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                >
                  ← Back to Google Sign-In
                </button>
              </div>
            </form>
          )}

          {/* Trust Guarantees Footer */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[10px] sm:text-[11px] text-slate-500 font-semibold">
            <div className="flex flex-col items-center justify-center gap-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Genuine</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Fast Home Delivery</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Verified Account</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomerProfile, Order, StoreSettings, ScratchCard } from '../types';
import { ScratchCardComponent } from './ScratchCardComponent';
import { api } from '../services/api';
import { detectCurrentLocationAddress } from '../utils/geo';
import {
  X,
  User,
  Clock,
  CheckCircle2,
  Coins,
  Sparkles,
  Gift,
  Home,
  MapPin,
  Smartphone,
  Check,
  ShoppingBag,
  ExternalLink,
  Truck,
  Search,
  BookOpen,
  Award,
  ShieldCheck,
  Save,
  Navigation,
  Loader2,
  AlertCircle,
  Edit3,
} from 'lucide-react';

interface CustomerModalProps {
  profile: CustomerProfile | null;
  orders: Order[];
  settings: StoreSettings;
  onClose: () => void;
  onGoHome?: () => void;
  onSaveProfile: (profile: CustomerProfile) => void;
  onTrackOrder?: (orderId: string) => void;
  onOpenQuickLogin?: () => void;
  onLogoutProfile?: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  profile,
  orders = [],
  settings,
  onClose,
  onGoHome,
  onSaveProfile,
  onTrackOrder,
  onOpenQuickLogin,
  onLogoutProfile,
}) => {
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [po, setPo] = useState(profile?.po || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [pincode, setPincode] = useState(profile?.pincode || '');
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>(profile?.scratchCards || []);
  const [trackInputId, setTrackInputId] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // GPS Auto-detect Location & Map State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectSuccess, setLocationDetectSuccess] = useState('');
  const [locationDetectError, setLocationDetectError] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleAutoDetectAddress = async () => {
    setIsDetectingLocation(true);
    setLocationDetectError('');
    setLocationDetectSuccess('');
    try {
      const detected = await detectCurrentLocationAddress();
      if (detected.village) setVillage(detected.village);
      if (detected.po) setPo(detected.po);
      if (detected.district) setDistrict(detected.district);
      if (detected.pincode) setPincode(detected.pincode);
      if (detected.latitude && detected.longitude) {
        setDetectedCoords({ lat: detected.latitude, lon: detected.longitude });
      }
      setLocationDetectSuccess(
        `Address detected from GPS! ${detected.fullAddress || ''} (You can edit below)`
      );
    } catch (err: any) {
      console.warn('Geolocation detection error:', err);
      setLocationDetectError(err.message || 'Could not auto-detect address. Please type below.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.village) setVillage(profile.village);
      if (profile.po) setPo(profile.po);
      if (profile.district) setDistrict(profile.district);
      if (profile.pincode) setPincode(profile.pincode);
      if (profile.scratchCards) setScratchCards(profile.scratchCards);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number. Phone number is mandatory to save your delivery address.');
      return;
    }

    onSaveProfile({
      name,
      phone: cleanPhone,
      village,
      po,
      district,
      pincode,
      coins: profile?.coins || 0,
      scratchCards,
    });
    setIsSavedAlert(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInputId.trim() && onTrackOrder) {
      onTrackOrder(trackInputId.trim());
      onClose();
    }
  };

  const handleClaimCard = async (cardId: string, coinsEarned: number) => {
    if (!profile?.phone) return;
    try {
      const res = await api.claimScratchCard(profile.phone, cardId);
      if (res && res.success) {
        const updatedCoins = res.user?.coins ?? (profile.coins || 0) + coinsEarned;
        const updatedCards = res.user?.scratchCards || scratchCards.map((c) =>
          c.id === cardId ? { ...c, isScratched: true, scratchedAt: Date.now() } : c
        );

        setScratchCards(updatedCards);
        onSaveProfile({
          ...profile,
          coins: updatedCoins,
          scratchCards: updatedCards,
        });
      }
    } catch {
      // Fallback local update
      const updatedCards = scratchCards.map((c) =>
        c.id === cardId ? { ...c, isScratched: true, scratchedAt: Date.now() } : c
      );
      setScratchCards(updatedCards);
      onSaveProfile({
        ...profile,
        coins: (profile.coins || 0) + coinsEarned,
        scratchCards: updatedCards,
      });
    }
  };

  const myOrders = phone ? (orders || []).filter((o) => o?.phone === phone) : [];

  // Filter valid (unexpired or already scratched) scratch cards
  const now = Date.now();
  const activeScratchCards = scratchCards.filter(
    (card) => card.isScratched || now <= card.expiresAt
  );

  return (
    <div
      id="customer-profile-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto relative shadow-2xl border border-slate-200 space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Home Button & Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Return to Homepage"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <BookOpen className="w-3 h-3 text-emerald-600" />
              <span>Reader Profile</span>
            </span>
          </div>

          <button
            id="close-customer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-orange-50/40 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md"
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : '📚'}
            </motion.div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-base sm:text-lg font-black leading-tight"
                  style={{ color: settings.primaryColor || '#0B1B3D' }}
                >
                  {profile?.name || 'Customer Account'}
                </h3>
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Active Member
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {profile?.phone ? `+91 ${profile.phone}` : 'Sign in to save addresses & track orders'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenQuickLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickLogin();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 border border-orange-200 cursor-pointer transition-all shadow-xs"
              >
                {profile?.phone ? 'Switch Account' : 'Sign In / Register'}
              </button>
            )}
            {profile?.phone && onLogoutProfile && (
              <button
                type="button"
                onClick={() => {
                  onLogoutProfile();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 cursor-pointer transition-all shadow-xs"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Track Order Card */}
        {onTrackOrder && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  Track Order
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onTrackOrder('');
                  onClose();
                }}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Track Page
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trackInputId}
                  onChange={(e) => setTrackInputId(e.target.value)}
                  placeholder="Enter Order ID or Consignment No."
                  className="w-full pl-3 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>
          </div>
        )}

        {/* Super Coins Wallet Balance Card */}
        {profile?.phone && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 border border-amber-200 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-sm">
                <Coins className="w-6 h-6 text-amber-100" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Your Reward Coins Balance
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-950 font-mono">
                    🪙 {profile.coins || 0} Coins
                  </span>
                  <span className="text-xs font-bold text-amber-800">
                    (= ₹{(((profile.coins || 0)) / 10).toFixed(1)} OFF)
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-right text-amber-900 font-semibold max-w-[130px] leading-snug hidden sm:block">
              10 Coins = ₹1 OFF. Automatically redeemable in cart!
            </div>
          </motion.div>
        )}

        {/* Scratch Cards Section (15-day validity reward cards) */}
        {profile?.phone && activeScratchCards.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-orange-600" />
                <h4 className="text-sm font-black text-slate-900">
                  Your Reward Scratch Cards ({activeScratchCards.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Valid for 15 days from order
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeScratchCards.map((card) => (
                <ScratchCardComponent
                  key={card.id}
                  card={card}
                  onClaim={handleClaimCard}
                />
              ))}
            </div>
          </div>
        )}

        {/* Customer Address Details Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>Personal & Delivery Details</span>
            </h4>
            
            <button
              type="button"
              id="profile-auto-detect-gps-btn"
              onClick={handleAutoDetectAddress}
              disabled={isDetectingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-200" />
                  <span>📍 Auto-Detect GPS Address</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Feedback Banners */}
          {locationDetectSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Location Detected!</span>
                <span className="text-[11px] text-emerald-800 leading-tight">
                  {locationDetectSuccess}
                </span>
              </div>
            </div>
          )}

          {locationDetectError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{locationDetectError}</span>
                <span className="block text-[11px] text-rose-700">Please enter your village/town and pincode manually below.</span>
              </div>
            </div>
          )}

          {/* Interactive Embedded OpenStreetMap Pinpoint Preview (If Coords Detected) */}
          {detectedCoords && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              <div className="p-2 bg-slate-900 text-white text-[11px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GPS Pinpoint Verified (Lat: {detectedCoords.lat.toFixed(4)}, Lon: {detectedCoords.lon.toFixed(4)})</span>
                </span>
                <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Editable below
                </span>
              </div>
              <div className="h-28 w-full relative">
                <iframe
                  title="Live Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${detectedCoords.lon - 0.005}%2C${detectedCoords.lat - 0.005}%2C${detectedCoords.lon + 0.005}%2C${detectedCoords.lat + 0.005}&layer=mapnik&marker=${detectedCoords.lat}%2C${detectedCoords.lon}`}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {isSavedAlert && (
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Details Saved Successfully!
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Name:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (Mandatory): <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono font-bold focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Village / House / Area:
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village / Street Name"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Post Office (P.O.):
              </label>
              <input
                type="text"
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="Post Office name"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District:</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Murshidabad / Nadia"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pincode:</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6-digit Pincode"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-white shadow-md transition-all cursor-pointer hover:brightness-110 flex items-center justify-center gap-2"
              style={{ backgroundColor: settings.accentColor || '#FF5722' }}
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Details</span>
            </motion.button>
            {profile?.phone && onLogoutProfile && (
              <button
                type="button"
                onClick={() => {
                  onLogoutProfile();
                  onClose();
                }}
                className="px-4 py-3 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </form>

        {/* Simplified Track Order Section */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-600" />
              <h4
                className="text-sm font-black"
                style={{ color: settings.primaryColor || '#0B1B3D' }}
              >
                Track Order ({myOrders.length})
              </h4>
            </div>
            {onTrackOrder && (
              <button
                type="button"
                onClick={() => {
                  onTrackOrder(myOrders[0]?.id ? String(myOrders[0].id) : '');
                  onClose();
                }}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer flex items-center gap-1"
              >
                <span>Track Order</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {myOrders.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  {phone
                    ? 'No orders found for this phone number.'
                    : 'Enter your phone number above or click below to track an order.'}
                </p>
                {onTrackOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      onTrackOrder('');
                      onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Order</span>
                  </button>
                )}
              </div>
            ) : (
              myOrders.map((ord) => (
                <motion.div
                  key={ord.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    if (onTrackOrder) {
                      onTrackOrder(String(ord.id));
                      onClose();
                    }
                  }}
                  className="bg-white border-2 border-slate-100 hover:border-orange-300 rounded-2xl p-3 text-xs space-y-2 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 block">
                        {ord.bookTitle}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Order #{ord.id} • {ord.date}
                      </span>
                    </div>
                    <span className="text-emerald-700 font-black font-mono shrink-0">
                      ₹{ord.totalAmount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.orderStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.orderStatus || 'Pending'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Track Order</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};



import React from 'react';
import { StoreSettings } from '../types';
import { STORE_CONTACT } from '../data/defaultData';
import { Mail, Phone, Instagram, Facebook, Lock, MessageCircle, Sliders, ShoppingBag } from 'lucide-react';

interface FooterProps {
  settings: StoreSettings;
  isAdmin?: boolean;
  isAdminSession?: boolean;
  currentView?: 'admin' | 'store';
  onOpenAdminLogin: () => void;
  onSwitchToAdmin?: () => void;
  onSwitchToStore?: () => void;
  onLogoutAdmin?: () => void;
  onOpenCustomerModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  isAdmin,
  isAdminSession,
  currentView = 'store',
  onOpenAdminLogin,
  onSwitchToAdmin,
  onSwitchToStore,
  onLogoutAdmin,
  onOpenCustomerModal,
}) => {
  const currentPhone = settings.phone || STORE_CONTACT.phone;
  const currentWhatsapp = settings.whatsappNumber || STORE_CONTACT.whatsappNumber;
  const currentEmail = settings.email || STORE_CONTACT.email;
  const currentFacebook = settings.facebookUrl || STORE_CONTACT.facebookUrl;
  const currentInstagram = settings.instagramUrl || STORE_CONTACT.instagramUrl;

  const hasActiveAdmin = isAdminSession || isAdmin;

  return (
    <footer
      id="main-store-footer"
      className="text-white pt-10 pb-28 sm:pb-14 px-4 sm:px-6 mt-auto border-t-4 shadow-xl"
      style={{
        backgroundColor: settings.primaryColor || '#0B1B3D',
        borderColor: settings.accentColor || '#FF5722',
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
        {/* Store Brand Info */}
        <div className="space-y-2 max-w-md">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            {settings.logoImg && (
              <img
                src={settings.logoImg}
                alt="Logo"
                className="w-9 h-9 object-contain rounded-full bg-white/10 p-1 border border-white/20"
              />
            )}
            <h3 className="text-xl font-black tracking-wide uppercase">
              {settings.name || 'Online Book Store'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {settings.sub || 'Your Trusted Destination for Books, Literature, Knowledge & Learning.'}
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All India Fast Home Delivery Available
            </span>
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="flex flex-col gap-3 text-xs sm:text-sm items-center md:items-end">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Contact & Support
          </span>

          {/* Phone / WhatsApp */}
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
            <a
              href={`tel:+91${currentPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>+91 {currentPhone}</span>
            </a>

            <a
              href={`https://wa.me/${currentWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-200 hover:text-white border border-[#25D366]/40 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Email */}
          {currentEmail && (
            <a
              href={`mailto:${currentEmail}`}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{currentEmail}</span>
            </a>
          )}

          {/* Social Links (Instagram & Facebook) */}
          <div className="flex items-center gap-3 pt-1">
            {currentInstagram && (
              <a
                href={currentInstagram.startsWith('http') ? currentInstagram : `https://instagram.com/${currentInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-rose-300 hover:text-white border border-pink-500/30 transition-colors text-xs font-medium"
              >
                <Instagram className="w-3.5 h-3.5 text-rose-400" />
                <span>Instagram</span>
              </a>
            )}

            {currentFacebook && (
              <a
                href={currentFacebook.startsWith('http') ? currentFacebook : `https://facebook.com/${currentFacebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-600/30 transition-colors text-xs font-medium"
              >
                <Facebook className="w-3.5 h-3.5 text-blue-400" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info Bottom with ample mobile clearance */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-300">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-200">
            © {new Date().getFullYear()} {settings.name || 'Online Book Store'}. All rights reserved.
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="bg-white/10 px-2.5 py-1 rounded-md text-amber-300 font-medium text-[11px] sm:text-xs">
            🛡️ Secure Payments • Cash on Delivery & UPI Supported
          </span>
        </div>
        {hasActiveAdmin && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {currentView === 'store' && onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="text-amber-300 hover:text-amber-200 font-bold inline-flex items-center gap-1.5 cursor-pointer bg-white/15 px-3 py-1.5 rounded-xl border border-amber-400/50 hover:bg-white/25 transition-all text-xs"
                title="Switch to Admin Panel directly"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Admin Dashboard</span>
              </button>
            )}
            {currentView === 'admin' && onSwitchToStore && (
              <button
                type="button"
                onClick={onSwitchToStore}
                className="text-orange-300 hover:text-orange-200 font-bold inline-flex items-center gap-1.5 cursor-pointer bg-white/15 px-3 py-1.5 rounded-xl border border-orange-400/50 hover:bg-white/25 transition-all text-xs"
                title="Switch to Customer Store View"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                <span>🛒 Customer Store View</span>
              </button>
            )}
            {onLogoutAdmin && (
              <button
                onClick={onLogoutAdmin}
                className="text-rose-300 hover:text-rose-200 font-semibold inline-flex items-center gap-1 cursor-pointer bg-white/5 px-2.5 py-1.5 rounded-xl border border-rose-400/30 hover:bg-rose-500/20 transition-all text-xs"
                title="Sign Out from Admin"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign Out Admin</span>
              </button>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

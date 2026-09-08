import React from 'react';
import { StoreSettings } from '../types';
import { Share2, LogOut, Sliders, ShoppingBag, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  customerName?: string;
  isAdmin?: boolean;
  isAdminSession?: boolean;
  currentView?: 'admin' | 'store';
  cartCount?: number;
  onGoHome?: () => void;
  onOpenCart?: () => void;
  onOpenShare: () => void;
  onOpenCustomerModal?: () => void;
  onOpenTrackOrder?: () => void;
  onSwitchToAdmin?: () => void;
  onSwitchToStore?: () => void;
  onLogoutAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isAdmin,
  isAdminSession,
  currentView = 'store',
  onGoHome,
  onOpenShare,
  onSwitchToAdmin,
  onSwitchToStore,
  onLogoutAdmin,
}) => {
  const hasActiveAdmin = isAdminSession || isAdmin;

  return (
    <header
      id="main-store-header"
      className="sticky top-0 z-40 text-white px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-md transition-all"
      style={{
        backgroundColor: settings.primaryColor || '#0B1B3D',
        borderBottom: `3px solid ${settings.accentColor || '#FF5722'}`,
      }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
        {/* Logo & Store Name */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 cursor-pointer group"
          title="Go to Homepage"
        >
          <div
            id="logo-icon-box"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white p-0.5 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0 border-2 border-white/90 group-hover:scale-105 transition-transform"
          >
            <img
              src={settings.logoImg || '/logo.svg'}
              alt="Logo"
              className="w-full h-full object-contain rounded-full bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              id="display-store-name"
              className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white leading-tight truncate group-hover:text-amber-200 transition-colors"
            >
              {settings.name || 'Online Library'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Seamless Admin/Store Switcher & Share */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Admin Panel / Customer View Seamless Switch Toggle */}
          {hasActiveAdmin && currentView === 'store' && onSwitchToAdmin && (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 transition-all shadow-md cursor-pointer active:scale-95 border border-amber-300/80"
              title="Seamlessly switch to Admin Panel without re-entering password"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="font-extrabold">Admin Panel</span>
            </button>
          )}

          {hasActiveAdmin && currentView === 'admin' && onSwitchToStore && (
            <button
              type="button"
              onClick={onSwitchToStore}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md cursor-pointer active:scale-95 border border-white/30"
              title="Switch to Customer Store View"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="font-extrabold">Store View</span>
            </button>
          )}

          {hasActiveAdmin && onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white transition-all shadow-xs cursor-pointer"
              title="Logout completely from Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs">Sign Out</span>
            </button>
          )}

          {/* Share Button */}
          <button
            id="share-header-btn"
            onClick={onOpenShare}
            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-white cursor-pointer min-h-[38px] active:scale-95 shadow-xs"
            title="Share Website"
          >
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold">Share</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { StoreSettings } from '../types';
import { Home, MoreHorizontal, ShoppingCart, User, Coins, Search } from 'lucide-react';

interface BottomNavProps {
  settings: StoreSettings;
  cartCount: number;
  customerName?: string;
  coinsBalance?: number;
  onGoHome: () => void;
  onOpenCategories: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onFocusSearch?: () => void;
  activeCategory?: string | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  settings,
  cartCount = 0,
  customerName,
  coinsBalance = 0,
  onGoHome,
  onOpenCategories,
  onOpenCart,
  onOpenProfile,
  onFocusSearch,
  activeCategory,
}) => {
  return (
    <nav
      id="bottom-thumb-nav"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5 transition-all"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around gap-1">
        {/* 1. Home Button */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition-all cursor-pointer group active:scale-95"
          title="Home"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Home className="w-5 h-5 group-hover:text-orange-600 transition-colors" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-orange-600 leading-tight mt-0.5">
            Home
          </span>
        </button>

        {/* 2. Categories Button */}
        <button
          type="button"
          onClick={onOpenCategories}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer group active:scale-95 ${
            activeCategory
              ? 'text-orange-600 font-black'
              : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50'
          }`}
          title="Categories"
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative ${
              activeCategory ? 'bg-orange-500 text-white shadow-xs' : 'group-hover:bg-orange-100'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            {activeCategory && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5 truncate max-w-[65px] ${
              activeCategory ? 'text-orange-700 font-black' : 'text-slate-700 group-hover:text-orange-600'
            }`}
          >
            {activeCategory ? activeCategory : 'Categories'}
          </span>
        </button>

        {/* 3. Cart Button */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition-all cursor-pointer group active:scale-95"
          title="Cart"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors relative">
            <ShoppingCart className="w-5 h-5 group-hover:text-orange-600 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-orange-600 leading-tight mt-0.5">
            Cart {cartCount > 0 ? `(${cartCount})` : ''}
          </span>
        </button>

        {/* 4. Search Button */}
        {onFocusSearch && (
          <button
            type="button"
            onClick={onFocusSearch}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition-all cursor-pointer group active:scale-95"
            title="Search"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <Search className="w-5 h-5 group-hover:text-orange-600 transition-colors" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-orange-600 leading-tight mt-0.5">
              Search
            </span>
          </button>
        )}

        {/* 5. Profile & Track Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition-all cursor-pointer group active:scale-95"
          title="Profile"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors relative">
            <User className="w-5 h-5 group-hover:text-orange-600 transition-colors" />
            {coinsBalance > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full border border-white shadow-xs">
                🪙
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-orange-600 leading-tight mt-0.5 truncate max-w-[65px]">
            {customerName ? customerName.split(' ')[0] : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};

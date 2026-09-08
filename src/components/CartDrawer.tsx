import React from 'react';
import { CartItem, StoreSettings } from '../types';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Home,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  cart?: CartItem[];
  cartItems?: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onGoHome?: () => void;
  onUpdateQuantity: (bookId: number, delta: number) => void;
  onRemoveItem: (bookId: number) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  cartItems,
  settings,
  onClose,
  onGoHome,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const items: CartItem[] = Array.isArray(cart) ? cart : (Array.isArray(cartItems) ? cartItems : []);
  const totalItemsCount = items.reduce((acc, item) => acc + (item?.quantity || 0), 0);
  const itemsSubtotal = items.reduce((acc, item) => acc + (item?.book?.price || 0) * (item?.quantity || 0), 0);
  const estimatedDelivery = itemsSubtotal > 0 ? 50 : 0; // standard prepaid preview
  const grandTotal = itemsSubtotal + estimatedDelivery;

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between text-white shadow-xs"
          style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Your Book Cart</h3>
              <span className="text-xs text-slate-300">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-1"
                title="Go to Homepage"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Home</span>
              </button>
            )}
            {items.length > 0 && onClearCart && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-rose-300 hover:text-rose-100 font-semibold px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer mr-1"
                title="Empty cart"
              >
                Clear
              </button>
            )}
            <button
              id="close-cart-btn"
              onClick={onClose}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center text-orange-500">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">Your Cart is Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explore our library catalog and add books to your cart to order multiple books in one package!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all cursor-pointer hover:brightness-110"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              >
                Browse Books Catalog
              </button>
            </div>
          ) : (
            items.map((item) => {
              if (!item?.book) return null;
              const itemTotal = (item.book.price || 0) * (item.quantity || 1);
              return (
                <div
                  key={item.book.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex gap-3 items-center transition-all hover:border-slate-300"
                >
                  {/* Book Cover Thumbnail */}
                  <div className="w-14 h-18 sm:w-16 sm:h-20 bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 flex-shrink-0">
                    <img
                      src={item.book.img}
                      alt={item.book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info & Quantity Controls */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                      {item.book.title}
                    </h4>
                    <div className="flex items-baseline gap-1.5 text-xs">
                      <span className="font-bold text-orange-600">₹{item.book.price}</span>
                      {item.book.oldPrice && item.book.oldPrice > item.book.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{item.book.oldPrice}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.book.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.book.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        ₹{itemTotal}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.book.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3 shadow-lg">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Books Subtotal ({totalItemsCount} items):</span>
                <span className="font-bold text-slate-800">₹{itemsSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge (Single combined package):</span>
                <span className="font-semibold text-emerald-700">₹50 (UPI) / ₹75 (COD)</span>
              </div>
              <div className="border-t border-slate-100 pt-1.5 flex justify-between items-baseline text-sm sm:text-base font-black text-slate-900">
                <span>Total Amount:</span>
                <span style={{ color: settings.accentColor || '#FF5722' }}>
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              id="cart-proceed-checkout-btn"
              type="button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:brightness-110 active:scale-98"
              style={{ backgroundColor: settings.accentColor || '#FF5722' }}
            >
              <span>Proceed to Order ({totalItemsCount} Books)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Combined safe packaging for all books</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

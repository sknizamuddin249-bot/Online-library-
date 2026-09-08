import React, { useState, useEffect } from 'react';
import { Order, CustomerProfile, ScratchCard, StoreSettings } from '../types';
import { ScratchCardComponent } from './ScratchCardComponent';
import { api } from '../services/api';
import {
  X,
  CheckCircle2,
  Gift,
  Coins,
  Sparkles,
  MessageCircle,
  Truck,
  ShoppingBag,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface OrderSuccessScratchModalProps {
  order: Order;
  scratchCard: ScratchCard;
  profile?: CustomerProfile | null;
  settings: StoreSettings;
  onClose: () => void;
  onClaimCoins: (cardId: string, coinsEarned: number) => Promise<void> | void;
  onTrackOrder: (orderId: string) => void;
  onContinueShopping: () => void;
}

export const OrderSuccessScratchModal: React.FC<OrderSuccessScratchModalProps> = ({
  order,
  scratchCard,
  profile,
  settings,
  onClose,
  onClaimCoins,
  onTrackOrder,
  onContinueShopping,
}) => {
  const [currentCard, setCurrentCard] = useState<ScratchCard>(scratchCard);
  const [coinsClaimed, setCoinsClaimed] = useState<boolean>(scratchCard.isScratched);
  const activeWhatsapp = settings.whatsappNumber || '918001743646';

  const handleClaim = async (cardId: string, coinsEarned: number) => {
    setCurrentCard((prev) => ({ ...prev, isScratched: true, scratchedAt: Date.now() }));
    setCoinsClaimed(true);
    try {
      await onClaimCoins(cardId, coinsEarned);
    } catch {
      // handled
    }
  };

  // Pre-formatted WhatsApp order message
  const handleOpenWhatsApp = () => {
    let msg = `🛒 *ORDER CONFIRMATION - ${settings.name || 'Online Library'}*%0A`;
    msg += `🆔 *Order ID:* #${order.id}%0A`;
    msg += `🕒 *Date:* ${order.date}%0A%0A`;
    msg += `👤 *Name:* ${order.customerName}%0A`;
    msg += `📱 *Phone:* ${order.phone}%0A`;
    msg += `📍 *Address:* ${order.village}, P.O: ${order.po}, ${order.district} - ${order.pincode}%0A`;
    if (order.landmark) {
      msg += `• Landmark: ${order.landmark}%0A`;
    }
    msg += `%0A📚 *Books:* ${order.bookTitle}%0A`;
    msg += `💰 *Total Amount:* ₹${order.totalAmount}%0A`;
    msg += `💳 *Payment Method:* ${order.paymentMethod}%0A`;
    msg += `📦 *Status:* ${order.paymentStatus}%0A%0A`;
    msg += `🙏 *Thank you! Please process my delivery soon.*`;

    const wpUrl = `https://wa.me/${activeWhatsapp}?text=${msg}`;
    window.open(wpUrl, '_blank');
  };

  return (
    <div
      id="order-success-scratch-modal"
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 max-h-[94vh] overflow-y-auto relative shadow-2xl border-2 border-amber-300 animate-in zoom-in-95 duration-200 space-y-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Order Confirmed Banner */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-13 h-13 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            Order Placed Successfully!
          </h3>
          <p className="text-xs text-slate-500">
            Order #{order.id} • {order.paymentMethod}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mt-1">
            <span>Payable: ₹{order.totalAmount}</span>
            <span>•</span>
            <span>Doorstep Courier Delivery</span>
          </div>
        </div>

        {/* Reward Scratch Card Container */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
              <Gift className="w-4 h-4 text-orange-600 animate-pulse" />
              <span>🎁 Your Reward Scratch Card</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              15 Days Validity
            </span>
          </div>

          {/* Render Interactive Scratch Card */}
          <div className="transform hover:scale-[1.01] transition-transform">
            <ScratchCardComponent card={currentCard} onClaim={handleClaim} />
          </div>

          <p className="text-[11px] text-slate-500 text-center font-medium bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
            Scratch now or access anytime from your <strong>Profile</strong> within 15 days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {/* WhatsApp Confirmation Button (Optional) */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp / Send Receipt (Optional)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Track Order Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(String(order.id));
              }}
              className="py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Delivery</span>
            </button>

            {/* Continue Shopping Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onContinueShopping();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

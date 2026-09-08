import React, { useState } from 'react';
import { STORE_CONTACT } from '../data/defaultData';
import { MessageCircle, X } from 'lucide-react';

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
  storeName?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  whatsappNumber,
  storeName = 'Online Book Store',
}) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const rawNumber = (whatsappNumber || STORE_CONTACT.whatsappNumber || '916297744675').replace(/[^0-9]/g, '');
  const cleanNumber = rawNumber.length === 10 ? `91${rawNumber}` : rawNumber;
  const displayPhone = cleanNumber.startsWith('91') && cleanNumber.length === 12 ? cleanNumber.slice(2) : cleanNumber;

  const defaultMsg = encodeURIComponent(
    `Hello ${storeName}! I am interested in books from your library and would like some assistance.`
  );

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2">
      {/* Informative Floating Tooltip Bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs font-bold py-2 px-3 rounded-2xl shadow-xl border border-emerald-200 animate-in fade-in slide-in-from-right-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            WhatsApp Chat: <strong className="text-emerald-700 font-mono">+91 {displayPhone}</strong>
          </span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded cursor-pointer"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating WhatsApp Action Button */}
      <a
        id="floating-whatsapp-btn"
        href={`https://wa.me/${cleanNumber}?text=${defaultMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group relative"
        style={{ backgroundColor: '#25D366' }}
        title={`Chat with us on WhatsApp (+91 ${displayPhone})`}
        aria-label="Contact via WhatsApp"
      >
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
          1
        </span>
        <MessageCircle className="w-7 h-7 fill-white group-hover:rotate-12 transition-transform" />
      </a>
    </div>
  );
};

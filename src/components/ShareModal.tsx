import React, { useState } from 'react';
import { Book, StoreSettings } from '../types';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';

interface ShareModalProps {
  settings: StoreSettings;
  book?: Book | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ settings, book, onClose }) => {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = book ? `${baseUrl}#book=${book.id}` : window.location.href;
  const storeName = settings.name || 'Online Library';

  const shareText = book
    ? `📚 *${book.title}*\n💰 Price: ₹${book.price}${
        book.oldPrice && book.oldPrice > book.price ? ` (MRP: ₹${book.oldPrice})` : ''
      }\n✨ Order now at ${storeName}:\n`
    : `Check out books at ${storeName}!`;

  const handleShareToPlatform = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'native') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    if (platform === 'native' && navigator.share) {
      navigator
        .share({
          title: book ? book.title : storeName,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {
          // fallback
        });
      return;
    }

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied! Open Instagram and paste it in your Story, DM, or Post.');
    }
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 relative shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-share-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-black"
              style={{ color: settings.primaryColor || '#0B1B3D' }}
            >
              {book ? 'Share Product' : 'Share Store Link'}
            </h3>
            <p className="text-xs text-slate-500">
              {book ? 'Share this book with friends & groups' : `Share ${storeName} with friends`}
            </p>
          </div>
        </div>

        {/* Book Preview Card if sharing specific book */}
        {book && (
          <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center gap-3">
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              <img
                src={book.img}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                {book.title}
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-black text-orange-600">₹{book.price}</span>
                {book.oldPrice && book.oldPrice > book.price && (
                  <span className="text-[10px] text-slate-400 line-through">₹{book.oldPrice}</span>
                )}
                {book.stock > 0 && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    In Stock
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 my-4">
          <button
            onClick={() => handleShareToPlatform('whatsapp')}
            className="py-3 px-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: '#25D366' }}
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleShareToPlatform('facebook')}
            className="py-3 px-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: '#1877F2' }}
          >
            <i className="fa-brands fa-facebook text-lg"></i>
            <span>Facebook</span>
          </button>

          <button
            onClick={() => handleShareToPlatform('instagram')}
            className="py-3 px-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-110 cursor-pointer bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600"
          >
            <i className="fa-brands fa-instagram text-lg"></i>
            <span>Instagram</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono truncate">
          <span className="truncate mr-2 text-[11px]">{shareUrl}</span>
          <button
            onClick={handleCopyLink}
            className="text-xs font-bold text-orange-600 hover:underline shrink-0 cursor-pointer"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};


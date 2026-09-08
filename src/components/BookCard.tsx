import React from 'react';
import { Book, StoreSettings } from '../types';
import { ShoppingCart, Star, Plus, Check, Share2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  settings: StoreSettings;
  isInCart?: boolean;
  onViewDetails: (book: Book) => void;
  onOrderNow: (book: Book) => void;
  onAddToCart?: (book: Book) => void;
  onShareBook?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  settings,
  isInCart = false,
  onViewDetails,
  onOrderNow,
  onAddToCart,
  onShareBook,
}) => {
  const isAvailable = book.stock > 0;
  const hasDiscount = book.oldPrice && book.oldPrice > book.price;
  const discountPerc = hasDiscount
    ? Math.round(((book.oldPrice! - book.price) / book.oldPrice!) * 100)
    : 0;

  const ratingVal = book.rating || 4.8;
  const reviewsCount = book.reviewsCount || 12;

  return (
    <div
      id={`book-card-${book.id}`}
      onClick={() => onViewDetails(book)}
      className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-slate-200/90 hover:border-slate-300 transition-all duration-300 flex flex-col relative cursor-pointer hover:-translate-y-1"
    >
      {/* Discount & Combo Badges */}
      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10">
        {book.isCombo && (
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
            <span>🔥 {book.comboBadge || 'Combo Set'}</span>
          </div>
        )}
        {discountPerc > 0 && (
          <div className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-md w-fit">
            {discountPerc}% OFF
          </div>
        )}
      </div>

      {/* Top Right Action Icons: Share + Quick Add to Cart */}
      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex items-center gap-1 z-10">
        {onShareBook && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShareBook(book);
            }}
            className="p-1.5 sm:p-2 rounded-xl shadow-md transition-all cursor-pointer bg-white/90 backdrop-blur-xs text-slate-700 hover:bg-orange-500 hover:text-white border border-slate-200"
            title="Share this book"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}

        {isAvailable && onAddToCart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(book);
            }}
            className={`p-1.5 sm:p-2 rounded-xl shadow-md transition-all cursor-pointer ${
              isInCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white/90 backdrop-blur-xs text-slate-700 hover:bg-orange-600 hover:text-white border border-slate-200'
            }`}
            title={isInCart ? 'Already in Cart (+1)' : 'Add to Cart'}
          >
            {isInCart ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
          </button>
        )}
      </div>

      {/* Book Cover Container with responsive aspect ratio */}
      <div className="w-full aspect-[3/4] bg-slate-100 overflow-hidden relative">
        <img
          src={book.img}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
          loading="lazy"
        />
      </div>

      {/* Card Details Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Rating Stars & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({reviewsCount})</span>
            </div>
            <div className="flex items-center gap-1">
              {book.targetClass && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {book.targetClass}
                </span>
              )}
              {book.category && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                  {book.category}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-bold text-xs sm:text-sm md:text-base text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-700 transition-colors">
            {book.title}
          </h3>

          {/* Stock Indicator Status */}
          <div className="mt-1.5 mb-2 flex items-center gap-1 flex-wrap">
            {book.stock <= 0 ? (
              <span className="text-[10px] sm:text-xs font-bold inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                Out of Stock
              </span>
            ) : book.stock < 10 ? (
              <span className="text-[10px] sm:text-xs font-bold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                <span>🔥 Only {book.stock} left!</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs font-semibold inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                In Stock
              </span>
            )}
          </div>

          {/* Price Block */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span
              className="text-base sm:text-lg md:text-xl font-black"
              style={{ color: settings.accentColor || '#FF5722' }}
            >
              ₹{book.price}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                ₹{book.oldPrice}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Add to Cart + Order Now + Share */}
        <div className="flex items-center gap-1.5 pt-1">
          {onAddToCart && (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(book);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                isInCart
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
              title="Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{isInCart ? 'Added' : 'Cart'}</span>
            </button>
          )}

          <button
            id={`order-btn-${book.id}`}
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onOrderNow(book);
            }}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs min-h-[38px] ${
              isAvailable
                ? 'text-white cursor-pointer hover:brightness-110 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: isAvailable ? settings.primaryColor || '#0B1B3D' : undefined,
            }}
          >
            <span>{isAvailable ? 'Order Now' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


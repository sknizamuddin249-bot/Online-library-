import React, { useRef } from 'react';
import { Book, StoreSettings } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ComboSliderProps {
  books: Book[];
  settings: StoreSettings;
  onSelectBook: (book: Book) => void;
  onOrderNow?: (book: Book) => void;
  onAddToCart?: (book: Book) => void;
}

export const ComboSlider: React.FC<ComboSliderProps> = ({
  books,
  settings,
  onSelectBook,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter combo books
  const comboBooks = books.filter(
    (b) =>
      b.isCombo ||
      b.category?.toLowerCase().includes('combo') ||
      b.title.toLowerCase().includes('combo') ||
      (b.oldPrice && b.oldPrice >= b.price + 150)
  );

  if (comboBooks.length === 0) return null;

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="compact-combo-offers-section"
      className="my-3 sm:my-4 w-full overflow-hidden"
    >
      {/* Section Header: Clearly indicates Combo Products */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Combo Offers & Sets</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-500 text-white rounded-md uppercase tracking-wider">
              Combo
            </span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            Curated book sets & multi-book bundles
          </p>
        </div>

        {/* Scroll navigation buttons for convenience */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleScrollLeft}
            type="button"
            className="p-1 sm:p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleScrollRight}
            type="button"
            className="p-1 sm:p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Compact Combo Cards (Direct Book List Only) */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-2.5 sm:gap-3.5 overflow-x-auto py-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {comboBooks.map((book) => {
          const discountAmt =
            book.oldPrice && book.oldPrice > book.price ? book.oldPrice - book.price : 0;
          const discountPerc =
            book.oldPrice && book.oldPrice > book.price
              ? Math.round((discountAmt / book.oldPrice) * 100)
              : 0;

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="w-[125px] sm:w-[145px] md:w-[160px] flex-shrink-0 snap-start bg-white rounded-2xl p-2 sm:p-2.5 border-2 border-amber-200/90 hover:border-orange-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              title={`Click to view details for ${book.title}`}
            >
              {/* 1. Book Picture with Combo Set Tag */}
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 mb-1.5 border border-slate-200/80 shadow-xs">
                <img
                  src={book.img}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-1 left-1 bg-slate-900/85 backdrop-blur-xs text-amber-300 font-bold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs">
                  Combo Set
                </span>
              </div>

              {/* 2. Book Title (single clean line) */}
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight mb-1">
                {book.title}
              </h4>

              {/* 3. Book Price Section */}
              <div className="pt-1 border-t border-slate-100 flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-xs sm:text-sm font-black"
                    style={{ color: settings.accentColor || '#FF5722' }}
                  >
                    ₹{book.price}
                  </span>
                  {book.oldPrice && book.oldPrice > book.price && (
                    <span className="text-[10px] text-slate-400 line-through">
                      ₹{book.oldPrice}
                    </span>
                  )}
                </div>

                {discountPerc > 0 ? (
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {discountPerc}% OFF
                  </span>
                ) : discountAmt > 0 ? (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                    -₹{discountAmt}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

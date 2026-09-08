import React, { useState, useEffect, useRef } from 'react';
import { Book, StoreSettings } from '../types';
import { Search, X, ShoppingBag, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  books: Book[];
  settings: StoreSettings;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectBook: (book: Book) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  books,
  settings,
  searchQuery,
  onSearchChange,
  onSelectBook,
  onClose,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalQuery(searchQuery);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const filteredBooks = books.filter((b) => {
    const q = localQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.comboBadge && b.comboBadge.toLowerCase().includes(q))
    );
  });

  const handleApplyAndClose = (book?: Book) => {
    onSearchChange(localQuery);
    if (book) {
      onSelectBook(book);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden mt-8 sm:mt-16 border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
      >
        {/* Search Header */}
        <div
          className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-100"
          style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              id="search-modal-input"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearchChange(e.target.value);
              }}
              placeholder="Search books by title, author, or publisher..."
              className="w-full pl-11 pr-10 py-3 bg-white text-slate-900 rounded-2xl text-sm font-medium focus:outline-hidden shadow-inner placeholder:text-slate-400"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  onSearchChange('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
          {filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">No books matched "{localQuery}"</p>
              <p className="text-xs text-slate-400">Try searching for a different author or title</p>
            </div>
          ) : (
            filteredBooks.slice(0, 15).map((book) => (
              <div
                key={book.id}
                onClick={() => handleApplyAndClose(book)}
                className="p-3 hover:bg-orange-50/60 rounded-2xl flex items-center gap-3.5 transition-colors cursor-pointer group"
              >
                <img
                  src={book.img || '/placeholder.png'}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{book.description || book.category || 'Quality Book'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs sm:text-sm font-black text-orange-600"
                      style={{ color: settings.accentColor || '#FF5722' }}
                    >
                      ₹{book.price}
                    </span>
                    {book.oldPrice && book.oldPrice > book.price && (
                      <span className="text-[11px] text-slate-400 line-through">₹{book.oldPrice}</span>
                    )}
                    {book.category && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {book.category}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-5">
          <span>Found {filteredBooks.length} books</span>
          <button
            type="button"
            onClick={() => handleApplyAndClose()}
            className="font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            Show All in Grid →
          </button>
        </div>
      </div>
    </div>
  );
};

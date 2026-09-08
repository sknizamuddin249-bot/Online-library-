import React, { useState, useRef } from 'react';
import { Book, BookReview, CustomerProfile, StoreSettings } from '../types';
import {
  X,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Star,
  MessageSquarePlus,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Check,
  Home,
  Sparkles,
  ArrowRight,
  BookOpen,
  Share2,
  ZoomIn,
} from 'lucide-react';

interface BookDetailsModalProps {
  book: Book;
  books?: Book[];
  allBooks?: Book[];
  reviews?: BookReview[];
  profile?: CustomerProfile | null;
  customerProfile?: CustomerProfile | null;
  settings: StoreSettings;
  isInCart?: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  onSelectBook?: (book: Book) => void;
  onOrder: (book: Book) => void;
  onAddToCart?: (book: Book) => void;
  onShareBook?: (book: Book) => void;
  onAddReview?: (review: BookReview) => void;
  onSubmitReview?: (review: BookReview) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  books = [],
  allBooks = [],
  reviews = [],
  profile,
  customerProfile,
  settings,
  isInCart = false,
  onClose,
  onGoHome,
  onSelectBook,
  onOrder,
  onAddToCart,
  onShareBook,
  onAddReview,
  onSubmitReview,
}) => {
  const activeProfile = profile || customerProfile || null;
  const activeReviews = Array.isArray(reviews) ? reviews : [];
  const handleReviewSubmission = onAddReview || onSubmitReview;
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewerName, setReviewerName] = useState(activeProfile?.name || '');
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Photo Lightbox modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  const isAvailable = (book?.stock ?? 0) > 0;
  const hasDiscount = Boolean(book?.oldPrice && book.oldPrice > book.price);
  const discountPerc = hasDiscount
    ? Math.round(((book.oldPrice! - book.price) / book.oldPrice!) * 100)
    : 0;

  // Filter reviews for this book
  const bookReviews = activeReviews.filter((r) => r?.bookId === book?.id);
  const avgRating =
    bookReviews.length > 0
      ? bookReviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / bookReviews.length
      : book?.rating || 4.8;
  const totalReviewsCount = bookReviews.length || book?.reviewsCount || 12;

  // Collect all photos from reviews of this book
  const allReviewPhotos = bookReviews.flatMap((r) => r.photos || []).filter(Boolean);

  // Suggested / Recommended Books (Filtered to exclude current book)
  const fullBookList = Array.isArray(books) && books.length > 0 ? books : (Array.isArray(allBooks) ? allBooks : []);
  const suggestedBooks = fullBookList
    .filter((b) => b && b.id !== book.id)
    .sort((a, b) => {
      // Prioritize same category first
      if (a.category === book.category && b.category !== book.category) return -1;
      if (b.category === book.category && a.category !== book.category) return 1;
      return 0;
    })
    .slice(0, 6);

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setReviewPhotos((prev) => [...prev, loadEvt.target!.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReviewPhoto = (indexToRemove: number) => {
    setReviewPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Please write your feedback/review message');
      return;
    }

    const newReview: BookReview = {
      id: `rev_${Date.now()}`,
      bookId: book.id,
      customerName: reviewerName.trim(),
      customerPhone: activeProfile?.phone || '',
      rating: ratingScore,
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString('en-IN'),
      isVerifiedBuyer: true,
      photos: reviewPhotos.length > 0 ? reviewPhotos : undefined,
    };

    if (handleReviewSubmission) {
      handleReviewSubmission(newReview);
    }
    setSubmitSuccess(true);
    setReviewComment('');
    setReviewPhotos([]);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowReviewForm(false);
      setActiveTab('reviews');
    }, 1500);
  };

  return (
    <div
      id="book-details-modal"
      className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-7 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto relative shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions: Home & Share & Close Buttons */}
        <div className="flex items-center justify-between z-10 relative">
          {onGoHome ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoHome();
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              title="Return to Homepage"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-1.5">
            {onShareBook && (
              <button
                type="button"
                onClick={() => onShareBook(book)}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                title="Share this product"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}

            <button
              id="close-details-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsive Body: Column on mobile, Grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6 items-start pt-1">
          {/* Cover Photo */}
          <div className="sm:col-span-2 flex justify-center">
            <div className="w-40 sm:w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200/80 relative">
              <img
                src={book.img}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              {discountPerc > 0 && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-md">
                  {discountPerc}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Book Info */}
          <div className="sm:col-span-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              {book.category && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full inline-block">
                  {book.category}
                </span>
              )}

              {/* Star Rating Badge */}
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-900">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{avgRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({totalReviewsCount} reviews)</span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-tight">
              {book.title}
            </h2>

            {/* Price & Discount */}
            <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
              <span
                className="text-2xl sm:text-3xl font-black"
                style={{ color: settings.accentColor || '#FF5722' }}
              >
                ₹{book.price}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base text-slate-400 line-through">
                  ₹{book.oldPrice}
                </span>
              )}
              {discountPerc > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                  Save ₹{book.oldPrice! - book.price}
                </span>
              )}
            </div>

            {/* Stock Status Badge */}
            <div>
              {book.stock <= 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 inline-block">
                  Out of Stock
                </span>
              ) : book.stock < 10 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                  <span>🔥 Only {book.stock} left in stock!</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                  ✓ Available in Stock
                </span>
              )}
            </div>

            {/* Prominent Action Buttons right below the Book Header & Price */}
            <div className="flex items-center gap-2 pt-2">
              {onAddToCart && (
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onAddToCart(book)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 border ${
                    isInCart
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-orange-600 hover:bg-orange-700 text-white border-transparent'
                  }`}
                  style={{
                    backgroundColor: !isInCart && isAvailable ? settings.accentColor || '#FF5722' : undefined,
                  }}
                  title="Add this book to Cart"
                >
                  {isInCart ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingCart className="w-4 h-4" />}
                  <span>{isInCart ? 'Added to Cart' : 'Add to Cart'}</span>
                </button>
              )}

              {onShareBook && (
                <button
                  type="button"
                  onClick={() => onShareBook(book)}
                  className="py-3 px-3.5 rounded-xl border border-slate-300 hover:border-orange-400 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0"
                  title="Share this product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation: Details & Synopsis vs Reviews & Feedback */}
        <div className="flex border-b border-slate-200 gap-4 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'details'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Book Synopsis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all cursor-pointer relative flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Customer Reviews & Feedback</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px]">
              {bookReviews.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Synopsis / Description */}
        {activeTab === 'details' && (
          <div className="space-y-3">
            {/* Combo Bundle items list if combo book */}
            {(book.isCombo || (book.comboItems && book.comboItems.length > 0)) && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border-2 border-orange-300 space-y-2">
                <div className="flex items-center gap-1.5 text-orange-900 font-black text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Books Included in this Combo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {(book.comboItems || ['Literature Collection', 'Modern Science', 'Mindful Living']).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-orange-200 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
              <span className="font-bold text-slate-800 block mb-1">Book Summary:</span>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                {book.description || 'Verified authentic book with fast door-to-door delivery.'}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 text-center text-[11px] text-slate-600 font-medium py-1">
              <div className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Genuine Book</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 bg-blue-50/70 rounded-xl border border-blue-200/60">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Fast Express Courier</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Customer Reviews & Ratings */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating Overview Box & Write Review Button */}
            <div className="bg-orange-50/50 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {avgRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(avgRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Based on {totalReviewsCount} reader reviews
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
              </button>
            </div>

            {/* Write Review Form */}
            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-sm space-y-3 animate-in fade-in duration-200"
              >
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Rate & Review this Book</span>
                </h4>

                {submitSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Thank you! Your review and rating have been posted.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Star Rating:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingScore(s)}
                        onMouseEnter={() => setHoverScore(s)}
                        onMouseLeave={() => setHoverScore(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-120 active:scale-95"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (hoverScore || ratingScore)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {ratingScore} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Feedback / Review: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this book (content, printing, packaging)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Upload Real Customer Photos / Unboxing Pictures */}
                <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-orange-600" />
                      <span>Add Unboxing / Book Photos (Optional):</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Max 4 photos</span>
                  </div>

                  <input
                    type="file"
                    ref={reviewFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleReviewPhotoUpload}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer"
                  />

                  {reviewPhotos.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {reviewPhotos.map((photo, pIdx) => (
                        <div key={pIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                          <img src={photo} alt={`Review photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewPhoto(pIdx)}
                            className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}

            {/* Customer Photo Gallery Strip if any photo reviews exist */}
            {allReviewPhotos.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5 text-orange-950">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    <span>Customer Photos & Delivered Parcels ({allReviewPhotos.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Click to zoom</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allReviewPhotos.map((imgSrc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewPhotoUrl(imgSrc)}
                      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-xs hover:scale-105 transition-transform flex-shrink-0 cursor-pointer relative group"
                    >
                      <img src={imgSrc} alt="Customer delivery unboxing" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of Reviews */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {bookReviews.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  No written reviews yet for this book. Be the first to rate and write feedback!
                </div>
              ) : (
                bookReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-[10px]">
                          {rev.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{rev.customerName}</span>
                        {rev.isVerifiedBuyer && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.date}</span>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-slate-700 leading-relaxed">{rev.comment}</p>

                    {/* Review Attached Photos */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {rev.photos.map((pUrl, pIndex) => (
                          <button
                            key={pIndex}
                            type="button"
                            onClick={() => setPreviewPhotoUrl(pUrl)}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer relative group"
                          >
                            <img src={pUrl} alt="Review attachment" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Action Buttons: Add to Cart & Buy Now & Share */}
        <div className="flex items-center gap-2 pt-2">
          {onAddToCart && (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onAddToCart(book)}
              className={`py-3.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs border cursor-pointer shrink-0 ${
                isInCart
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
              title="Add this book to Cart"
            >
              {isInCart ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingCart className="w-4 h-4" />}
              <span>{isInCart ? 'Added' : 'Add to Cart'}</span>
            </button>
          )}

          <button
            id="detail-order-btn"
            disabled={!isAvailable}
            onClick={() => {
              onClose();
              onOrder(book);
            }}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px] active:scale-98 ${
              isAvailable
                ? 'text-white hover:brightness-110'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: isAvailable ? settings.accentColor || '#FF5722' : undefined,
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{isAvailable ? 'Order Now' : 'Out of Stock'}</span>
          </button>

          {onShareBook && (
            <button
              type="button"
              onClick={() => onShareBook(book)}
              className="py-3.5 px-3.5 rounded-xl border border-slate-300 hover:border-orange-400 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0"
              title="Share this product"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product Suggestions / Recommended Books under this product */}
        {suggestedBooks.length > 0 && (
          <div className="pt-5 border-t-2 border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>Recommended Books</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Other popular titles you might like</p>
                </div>
              </div>
              <span className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 font-bold px-2 py-0.5 rounded-full">
                {suggestedBooks.length} Suggestions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {suggestedBooks.map((sBook) => {
                const sDiscount = sBook.oldPrice && sBook.oldPrice > sBook.price
                  ? Math.round(((sBook.oldPrice - sBook.price) / sBook.oldPrice) * 100)
                  : 0;

                return (
                  <div
                    key={sBook.id}
                    className="bg-white hover:bg-orange-50/40 p-2.5 rounded-2xl border-2 border-slate-200/90 transition-all flex flex-col justify-between group hover:border-orange-300 hover:shadow-md cursor-pointer"
                    onClick={() => {
                      if (onSelectBook) {
                        onSelectBook(sBook);
                      }
                    }}
                  >
                    <div>
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 mb-2 shadow-xs border border-slate-200/60 relative">
                        <img
                          src={sBook.img}
                          alt={sBook.title}
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                        />
                        {sDiscount > 0 && (
                          <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            {sDiscount}% OFF
                          </span>
                        )}
                        {sBook.isCombo && (
                          <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            COMBO
                          </span>
                        )}
                      </div>

                      <h5 className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                        {sBook.title}
                      </h5>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span
                          className="text-xs font-black text-orange-600"
                          style={{ color: settings.accentColor || '#FF5722' }}
                        >
                          ₹{sBook.price}
                        </span>
                        {sBook.oldPrice && sBook.oldPrice > sBook.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{sBook.oldPrice}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {onAddToCart && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(sBook);
                            }}
                            className="p-1.5 rounded-lg bg-white hover:bg-orange-100 border border-slate-300 hover:border-orange-400 text-slate-700 hover:text-orange-700 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Add to cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectBook) {
                              onSelectBook(sBook);
                            }
                          }}
                          className="py-1 px-2 rounded-lg bg-slate-900 hover:bg-orange-600 text-white transition-all cursor-pointer text-[10px] font-bold shadow-xs active:scale-95"
                          title="View Details"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom modal for customer review photos */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Customer photo review preview"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <span className="text-white text-xs font-semibold mt-3 bg-black/50 px-3 py-1 rounded-full">
              📸 Real Customer Unboxing & Delivery Photo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

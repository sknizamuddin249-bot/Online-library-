import React, { useState, useEffect } from 'react';
import { Book, StoreSettings } from '../types';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import {
  Eye,
  TrendingUp,
  Flame,
  Sparkles,
  BarChart3,
  DollarSign,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

interface VisitorAnalyticsTabProps {
  books: Book[];
  settings: StoreSettings;
  onEditBook?: (book: Book) => void;
}

export const VisitorAnalyticsTab: React.FC<VisitorAnalyticsTabProps> = ({
  books = [],
  settings,
  onEditBook,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>(analyticsService.getAnalytics());
  const [searchTerm, setSearchTerm] = useState('');

  // Auto refresh or listen for updates
  useEffect(() => {
    const handleStorage = () => {
      setAnalytics(analyticsService.getAnalytics());
    };

    window.addEventListener('storage', handleStorage);

    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('store_realtime_sync');
      ch.onmessage = (e) => {
        if (e.data?.type === 'UPDATE_ANALYTICS') {
          setAnalytics(e.data.data);
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (ch) ch.close();
    };
  }, []);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all visitor view statistics and price range logs?')) {
      const resetData = analyticsService.resetAnalytics();
      setAnalytics(resetData);
    }
  };

  // Merge books with their view counts
  const booksWithViews = books.map((b) => {
    const count = analytics.bookViews[b.id] || b.viewsCount || 0;
    return {
      ...b,
      currentViews: count,
    };
  });

  // Sort by view count descending
  const sortedBooks = [...booksWithViews].sort((a, b) => b.currentViews - a.currentViews);

  const filteredBooks = sortedBooks.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.category && b.category.toLowerCase().includes(q));
  });

  const totalCalculatedViews = sortedBooks.reduce((sum, b) => sum + b.currentViews, 0);
  const mostViewedBook = sortedBooks[0];

  // Price range counts & percentages
  const pViews = analytics.priceRangeViews || {
    under300: 0,
    range300to500: 0,
    range500to800: 0,
    above800: 0,
  };

  const totalRangeViews =
    (pViews.under300 || 0) +
    (pViews.range300to500 || 0) +
    (pViews.range500to800 || 0) +
    (pViews.above800 || 0) || 1;

  const percUnder300 = Math.round(((pViews.under300 || 0) / totalRangeViews) * 100);
  const perc300to500 = Math.round(((pViews.range300to500 || 0) / totalRangeViews) * 100);
  const perc500to800 = Math.round(((pViews.range500to800 || 0) / totalRangeViews) * 100);
  const percAbove800 = Math.round(((pViews.above800 || 0) / totalRangeViews) * 100);

  // Determine top price bracket
  let topPriceBracket = '₹300 - ₹500';
  let maxBracketVal = pViews.range300to500 || 0;
  if ((pViews.under300 || 0) > maxBracketVal) {
    topPriceBracket = 'Under ₹300 (Budget)';
    maxBracketVal = pViews.under300 || 0;
  }
  if ((pViews.range500to800 || 0) > maxBracketVal) {
    topPriceBracket = '₹500 - ₹800 (Combo Sets)';
    maxBracketVal = pViews.range500to800 || 0;
  }
  if ((pViews.above800 || 0) > maxBracketVal) {
    topPriceBracket = '₹800+ (Grand Bundles)';
    maxBracketVal = pViews.above800 || 0;
  }

  return (
    <div id="visitor-analytics-tab" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner & Reset Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Customer Interest & Book Views Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Real-time tracking of which books and price ranges visitors are exploring the most
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/20 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Stats</span>
        </button>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Views */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Book Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalCalculatedViews} <span className="text-xs font-bold text-slate-400">Views</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            ✓ Across {books.length} catalog items
          </span>
        </div>

        {/* Card 2: Most Viewed Book */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">#1 Most Popular Book</span>
            <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">
            {mostViewedBook ? mostViewedBook.title : 'N/A'}
          </div>
          <span className="text-[11px] text-orange-600 font-black block">
            🔥 {mostViewedBook ? mostViewedBook.currentViews : 0} Views (₹{mostViewedBook?.price})
          </span>
        </div>

        {/* Card 3: Top Price Bracket */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Top Price Preference</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono line-clamp-1">
            {topPriceBracket}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block">
            Highest customer engagement
          </span>
        </div>

        {/* Card 4: Combo Packages View Share */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Combo Offers Demand</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
            {sortedBooks.filter((b) => b.isCombo).reduce((s, b) => s + b.currentViews, 0)}{' '}
            <span className="text-xs font-bold text-slate-400">Views</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold block">
            Multi-book bundles interest
          </span>
        </div>
      </div>

      {/* SECTION 1: PRICE RANGE PREFERENCE BREAKDOWN */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Price Range Interest
              </h4>
              <p className="text-xs text-slate-500">
                Visitor browsing distribution across price points
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Total Checks: {totalRangeViews}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Bracket 1: Under ₹300 */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Under ₹300</span>
              <span className="font-mono text-emerald-700">{percUnder300}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percUnder300}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Views: {pViews.under300 || 0}</span>
              <span>Pocket Friendly</span>
            </div>
          </div>

          {/* Bracket 2: ₹300 - ₹500 */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>₹300 - ₹500</span>
              <span className="font-mono text-blue-700">{perc300to500}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${perc300to500}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Views: {pViews.range300to500 || 0}</span>
              <span>Single Titles</span>
            </div>
          </div>

          {/* Bracket 3: ₹500 - ₹800 */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>₹500 - ₹800</span>
              <span className="font-mono text-orange-700">{perc500to800}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${perc500to800}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Views: {pViews.range500to800 || 0}</span>
              <span>Combo Offers</span>
            </div>
          </div>

          {/* Bracket 4: Above ₹800 */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>₹800+</span>
              <span className="font-mono text-purple-700">{percAbove800}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percAbove800}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Views: {pViews.above800 || 0}</span>
              <span>Mega Bundles</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RANKED LIST OF MOST VIEWED BOOKS */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Book Views Leaderboard
              </h4>
              <p className="text-xs text-slate-500">
                Ranked by customer views and detail checks
              </p>
            </div>
          </div>

          {/* Search within books */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search in ranking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 rounded-l-xl w-14 text-center">Rank</th>
                <th className="py-3 px-3">Book Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3 text-center">Total Views</th>
                <th className="py-3 px-3 text-center">Interest Badge</th>
                <th className="py-3 px-3 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.map((b, index) => {
                const isTop1 = index === 0;
                const isTop3 = index < 3;
                const viewsPerc =
                  totalCalculatedViews > 0
                    ? Math.round((b.currentViews / totalCalculatedViews) * 100)
                    : 0;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Rank */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          isTop1
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : isTop3
                            ? 'bg-orange-100 text-orange-800 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>

                    {/* Book Details */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.img}
                          alt={b.title}
                          className="w-9 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {b.title}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            ⭐ {(b.rating || 4.9).toFixed(1)} ({b.reviewsCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {b.category || 'General'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-mono font-black text-slate-900">
                      ₹{b.price}
                      {b.oldPrice && b.oldPrice > b.price && (
                        <span className="text-[10px] text-slate-400 font-normal line-through ml-1">
                          ₹{b.oldPrice}
                        </span>
                      )}
                    </td>

                    {/* Views Count */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-black text-sm text-slate-900 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.currentViews}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {viewsPerc}% of total
                        </span>
                      </div>
                    </td>

                    {/* Interest Badge */}
                    <td className="py-3 px-3 text-center">
                      {isTop1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                          <Flame className="w-3 h-3 fill-rose-600" />
                          🔥 #1 Top Hot
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          ⭐ High Demand
                        </span>
                      ) : b.currentViews > 10 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          📈 Trending
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regular</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      {onEditBook && (
                        <button
                          type="button"
                          onClick={() => onEditBook(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Edit Book
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: RECENT VISITOR LIVE ACTIVITY STREAM */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-black text-slate-900">
              Live Activity Stream
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {analytics.recentLogs.length} events logged
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {analytics.recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center p-3">
              No recent view logs yet. Browse store items to log activity.
            </p>
          ) : (
            analytics.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-900 truncate">{log.title}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">({log.category})</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-emerald-700">₹{log.price}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timeString}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

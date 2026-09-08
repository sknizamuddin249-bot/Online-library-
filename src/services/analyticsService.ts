import { Book } from '../types';

export interface ViewLogItem {
  id: string;
  bookId: number;
  title: string;
  price: number;
  category: string;
  timestamp: number;
  timeString: string;
}

export interface AnalyticsData {
  bookViews: Record<number, number>; // bookId -> count
  priceRangeViews: {
    under300: number;
    range300to500: number;
    range500to800: number;
    above800: number;
  };
  recentLogs: ViewLogItem[];
  totalViews: number;
}

const STORAGE_KEY = 'store_book_views_analytics_v1';

// Seed initial realistic analytics if empty
const getInitialAnalytics = (): AnalyticsData => {
  return {
    bookViews: {
      1: 42,
      2: 38,
      3: 56,
      4: 29,
      5: 87, // Mega Combo is popular
      6: 64, // Dual Combo is popular
    },
    priceRangeViews: {
      under300: 56,
      range300to500: 109,
      range500to800: 93,
      above800: 58,
    },
    recentLogs: [
      {
        id: 'log_1',
        bookId: 5,
        title: 'Grand 3-in-1 Knowledge Mega Combo Pack',
        price: 799,
        category: 'Combo Offer',
        timestamp: Date.now() - 1000 * 60 * 5,
        timeString: '5 mins ago',
      },
      {
        id: 'log_2',
        bookId: 3,
        title: 'The Art of Mindful Living & Philosophy',
        price: 299,
        category: 'Self-Help',
        timestamp: Date.now() - 1000 * 60 * 12,
        timeString: '12 mins ago',
      },
      {
        id: 'log_3',
        bookId: 6,
        title: 'Philosophy & World History Dual Combo Pack',
        price: 599,
        category: 'Combo Offer',
        timestamp: Date.now() - 1000 * 60 * 25,
        timeString: '25 mins ago',
      },
    ],
    totalViews: 316,
  };
};

export const analyticsService = {
  getAnalytics(): AnalyticsData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    const initial = getInitialAnalytics();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  },

  trackBookView(book: Book): AnalyticsData {
    if (!book || !book.id) return this.getAnalytics();

    const current = this.getAnalytics();
    const currentCount = (current.bookViews[book.id] || 0) + 1;
    current.bookViews[book.id] = currentCount;
    current.totalViews = (current.totalViews || 0) + 1;

    // Price range tracking
    const price = book.price || 0;
    if (price < 300) {
      current.priceRangeViews.under300 = (current.priceRangeViews.under300 || 0) + 1;
    } else if (price <= 500) {
      current.priceRangeViews.range300to500 = (current.priceRangeViews.range300to500 || 0) + 1;
    } else if (price <= 800) {
      current.priceRangeViews.range500to800 = (current.priceRangeViews.range500to800 || 0) + 1;
    } else {
      current.priceRangeViews.above800 = (current.priceRangeViews.above800 || 0) + 1;
    }

    // Add to recent view logs (keep last 40 logs)
    const newLog: ViewLogItem = {
      id: `view_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookId: book.id,
      title: book.title,
      price: book.price,
      category: book.category || 'General',
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    current.recentLogs = [newLog, ...(current.recentLogs || [])].slice(0, 40);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      const ch = new BroadcastChannel('store_realtime_sync');
      ch.postMessage({ type: 'UPDATE_ANALYTICS', data: current });
      ch.close();
    } catch {}

    return current;
  },

  resetAnalytics(): AnalyticsData {
    const empty: AnalyticsData = {
      bookViews: {},
      priceRangeViews: {
        under300: 0,
        range300to500: 0,
        range500to800: 0,
        above800: 0,
      },
      recentLogs: [],
      totalViews: 0,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      const ch = new BroadcastChannel('store_realtime_sync');
      ch.postMessage({ type: 'UPDATE_ANALYTICS', data: empty });
      ch.close();
    } catch {}
    return empty;
  },
};

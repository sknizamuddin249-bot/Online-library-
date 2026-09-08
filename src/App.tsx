import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Book,
  Banner,
  Order,
  CustomerProfile,
  StoreSettings,
  RegisteredUser,
  BookReview,
  CartItem,
  Coupon,
  ScratchCard,
} from './types';
import {
  defaultSettings,
  defaultBanners,
  defaultBooks,
  defaultReviews,
  DEFAULT_LOGO_DATA,
} from './data/defaultData';
import { api } from './services/api';
import { firebaseService } from './services/firebaseService';
import { analyticsService } from './services/analyticsService';
import { Header } from './components/Header';
import { BannerSlider } from './components/BannerSlider';
import { ComboSlider } from './components/ComboSlider';
import { BookCard } from './components/BookCard';
import { BookDetailsModal } from './components/BookDetailsModal';
import { OrderModal } from './components/OrderModal';
import { CustomerModal } from './components/CustomerModal';
import { ShareModal } from './components/ShareModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { QuickLoginModal } from './components/QuickLoginModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessScratchModal } from './components/OrderSuccessScratchModal';
import { BottomNav } from './components/BottomNav';
import { CategoryQuickBar } from './components/CategoryQuickBar';
import { CategoryDrawerModal } from './components/CategoryDrawerModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Search, BookMarked, Truck, UserPlus, ShoppingCart, Star, Layers, X, Check, ShieldCheck, Sliders, ShoppingBag } from 'lucide-react';

export default function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('storeSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.logoImg || parsed.logoImg.startsWith('data:image/jpeg;base64,/9j/4AAQSk')) {
          parsed.logoImg = DEFAULT_LOGO_DATA;
        }
        if (!parsed.name || parsed.name === 'ONLINE LIBRARY') {
          parsed.name = 'Online Library';
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return defaultSettings;
  });

  // 2. Banners State
  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem('banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultBanners;
  });

  // 3. Books State
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultBooks;
  });

  // 4. Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('my_personal_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 5. Customer Profile State (Logged In Customer)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() => {
    try {
      const saved = localStorage.getItem('customerProfile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  // 6. Registered Users Log (Visible to Admin & for device-to-device phone sync)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem('registeredUsers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 7. Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopping_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 8. Book Reviews & Feedback State
  const [reviews, setReviews] = useState<BookReview[]>(() => {
    try {
      const saved = localStorage.getItem('book_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultReviews;
  });

  // 9. Admin Session & View States (Persistent admin session with seamless 1-click panel switching)
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => {
    return (
      localStorage.getItem('isAdminSessionActive') === 'true' ||
      sessionStorage.getItem('isAdminLoggedIn') === 'true'
    );
  });

  const [currentView, setCurrentView] = useState<'admin' | 'store'>(() => {
    const isSession =
      localStorage.getItem('isAdminSessionActive') === 'true' ||
      sessionStorage.getItem('isAdminLoggedIn') === 'true';
    return isSession ? 'admin' : 'store';
  });

  const isAdmin = isAdminSession && currentView === 'admin';

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [selectedTrackOrderId, setSelectedTrackOrderId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForOrder, setSelectedBookForOrder] = useState<Book | null>(null);
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedBookToShare, setSelectedBookToShare] = useState<Book | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [cartToast, setCartToast] = useState<{ bookTitle: string; count: number } | null>(null);

  // Scratch card modal popup immediately after order placement
  const [placedOrderForScratch, setPlacedOrderForScratch] = useState<{
    order: Order;
    scratchCard: ScratchCard;
  } | null>(null);

  // Quick Login Modal for First-time / Unlogged Visitors
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);

  // Initial & Continuous Server & Firebase Firestore Real-Time Sync
  const syncWithServer = useCallback(async () => {
    const data = await api.getStoreData();
    if (!data) return;

    if (Array.isArray(data.books)) {
      setBooks(data.books);
      localStorage.setItem('books', JSON.stringify(data.books));
    }
    if (Array.isArray(data.banners)) {
      setBanners(data.banners);
      localStorage.setItem('banners', JSON.stringify(data.banners));
    }
    if (data.settings) {
      setSettings(data.settings);
      localStorage.setItem('storeSettings', JSON.stringify(data.settings));
    }
    if (Array.isArray(data.reviews)) {
      setReviews(data.reviews);
      localStorage.setItem('book_reviews', JSON.stringify(data.reviews));
    }
    if (Array.isArray(data.orders)) {
      setOrders(data.orders);
      localStorage.setItem('my_personal_orders', JSON.stringify(data.orders));
    }
    if (Array.isArray(data.registeredUsers)) {
      setRegisteredUsers(data.registeredUsers);
      localStorage.setItem('registeredUsers', JSON.stringify(data.registeredUsers));

      // Sync active customer profile's coins if registered user exists
      setCustomerProfile((prevProfile) => {
        if (!prevProfile || !prevProfile.phone) return prevProfile;
        const matched = data.registeredUsers.find((u) => u.phone === prevProfile.phone);
        if (matched && matched.coins !== undefined && matched.coins !== prevProfile.coins) {
          const updated = { ...prevProfile, coins: matched.coins };
          localStorage.setItem('customerProfile', JSON.stringify(updated));
          return updated;
        }
        return prevProfile;
      });
    }
  }, []);

  // Firebase Real-time Firestore Listener
  useEffect(() => {
    // 1. Seed initial data to cloud Firestore if empty
    firebaseService.seedInitialDataIfEmpty();

    // 2. Subscribe to instant cloud updates across all customer phones
    const unsubscribe = firebaseService.subscribeStoreData((data) => {
      if (data.settings) {
        setSettings(data.settings);
        localStorage.setItem('storeSettings', JSON.stringify(data.settings));
      }
      if (Array.isArray(data.books) && data.books.length > 0) {
        setBooks(data.books);
        localStorage.setItem('books', JSON.stringify(data.books));
      }
      if (Array.isArray(data.banners) && data.banners.length > 0) {
        setBanners(data.banners);
        localStorage.setItem('banners', JSON.stringify(data.banners));
      }
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        localStorage.setItem('book_reviews', JSON.stringify(data.reviews));
      }
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        localStorage.setItem('my_personal_orders', JSON.stringify(data.orders));
      }
      if (Array.isArray(data.registeredUsers)) {
        setRegisteredUsers(data.registeredUsers);
        localStorage.setItem('registeredUsers', JSON.stringify(data.registeredUsers));

        setCustomerProfile((prevProfile) => {
          if (!prevProfile || !prevProfile.phone) return prevProfile;
          const matched = data.registeredUsers.find((u) => u.phone === prevProfile.phone);
          if (matched && matched.coins !== undefined && matched.coins !== prevProfile.coins) {
            const updated = { ...prevProfile, coins: matched.coins };
            localStorage.setItem('customerProfile', JSON.stringify(updated));
            return updated;
          }
          return prevProfile;
        });
      }
    });

    // 3. Fallback immediate sync and periodic check
    syncWithServer();
    const pollInterval = setInterval(() => {
      syncWithServer();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [syncWithServer]);

  // Trigger quick login popup for new visitor if not logged in and not admin
  useEffect(() => {
    if (!customerProfile && !isAdmin) {
      const timer = setTimeout(() => {
        setIsQuickLoginOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [customerProfile, isAdmin]);

  // Set document title and CSS variables dynamically
  useEffect(() => {
    document.title = `${settings.name || 'Online Book Store'} - ${settings.sub || 'Book Store'}`;
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor || '#0B1B3D');
    document.documentElement.style.setProperty('--accent-orange', settings.accentColor || '#FF5722');
    document.documentElement.style.setProperty('--bg-color', settings.bgColor || '#F5F7FA');
  }, [settings]);

  // Check URL hash or query params for #track=ORDER_ID or #book=BOOK_ID
  useEffect(() => {
    const handleUrlParams = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);

      if (hash.startsWith('#track=')) {
        const orderId = hash.replace('#track=', '').trim();
        if (orderId) {
          setSelectedTrackOrderId(orderId);
          setIsTrackModalOpen(true);
        }
      } else if (urlParams.get('track')) {
        const orderId = urlParams.get('track')!.trim();
        if (orderId) {
          setSelectedTrackOrderId(orderId);
          setIsTrackModalOpen(true);
        }
      }

      if (hash.startsWith('#book=')) {
        const bookId = hash.replace('#book=', '').trim();
        const found = books.find((b) => String(b.id) === bookId);
        if (found) {
          setSelectedBookForDetails(found);
        }
      } else if (urlParams.get('book')) {
        const bookId = urlParams.get('book')!.trim();
        const found = books.find((b) => String(b.id) === bookId);
        if (found) {
          setSelectedBookForDetails(found);
        }
      }
    };

    handleUrlParams();
    window.addEventListener('hashchange', handleUrlParams);
    return () => window.removeEventListener('hashchange', handleUrlParams);
  }, [books]);

  // Auto-hide cart notification toast after 3 seconds
  useEffect(() => {
    if (cartToast) {
      const timer = setTimeout(() => {
        setCartToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cartToast]);

  // Realtime Broadcast Channel & LocalStorage Event Listeners (Multi-tab Sync)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('store_realtime_sync');
      channel.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'UPDATE_SETTINGS') setSettings(data);
        if (type === 'UPDATE_BOOKS') setBooks(data);
        if (type === 'UPDATE_BANNERS') setBanners(data);
        if (type === 'UPDATE_ORDERS') setOrders(data);
        if (type === 'UPDATE_USERS') setRegisteredUsers(data);
        if (type === 'UPDATE_REVIEWS') setReviews(data);
      };
    } catch {
      // BroadcastChannel fallback
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'books' && e.newValue) {
        try {
          setBooks(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'storeSettings' && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'banners' && e.newValue) {
        try {
          setBanners(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'my_personal_orders' && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'registeredUsers' && e.newValue) {
        try {
          setRegisteredUsers(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'book_reviews' && e.newValue) {
        try {
          setReviews(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Broadcast helper for real-time synchronization
  const broadcastSync = (type: string, data: any) => {
    try {
      const channel = new BroadcastChannel('store_realtime_sync');
      channel.postMessage({ type, data });
      channel.close();
    } catch {}
  };

  // Filtered books (By Category, Class/Exam & Search)
  const filteredBooks = useMemo(() => {
    let list = Array.isArray(books) ? books : [];
    if (selectedCategory) {
      const sel = selectedCategory.trim().toLowerCase();
      if (sel.includes('combo')) {
        list = list.filter(
          (b) => b.isCombo || (b.category || '').toLowerCase().includes('combo')
        );
      } else {
        list = list.filter((b) => {
          const bCat = (b.category || 'General').trim().toLowerCase();
          const bTarget = (b.targetClass || '').trim().toLowerCase();
          return (
            bCat === sel ||
            bCat.includes(sel) ||
            sel.includes(bCat) ||
            bTarget === sel ||
            bTarget.includes(sel) ||
            sel.includes(bTarget)
          );
        });
      }
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (b) =>
        (b?.title && b.title.toLowerCase().includes(q)) ||
        (b?.description && b.description.toLowerCase().includes(q)) ||
        (b?.category && b.category.toLowerCase().includes(q)) ||
        (b?.targetClass && b.targetClass.toLowerCase().includes(q)) ||
        (b?.comboBadge && b.comboBadge.toLowerCase().includes(q))
    );
  }, [books, searchQuery, selectedCategory]);

  // Total cart items count
  const totalCartCount = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  }, [cart]);

  // Cart Management Functions - Adds items smoothly without interrupting shopping / forcing cart drawer open
  const handleAddToCart = (book: Book) => {
    if (book.stock <= 0) {
      alert('Sorry, this book is currently out of stock.');
      return;
    }

    let updatedCount = 0;
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.book.id === book.id);
      let updated: CartItem[];

      if (existingIdx >= 0) {
        const currentQty = prevCart[existingIdx].quantity;
        if (currentQty >= book.stock) {
          alert(`Only ${book.stock} copy/copies available in stock.`);
          return prevCart;
        }
        updated = prevCart.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prevCart, { book, quantity: 1 }];
      }

      updatedCount = updated.reduce((sum, item) => sum + item.quantity, 0);
      localStorage.setItem('shopping_cart', JSON.stringify(updated));
      return updated;
    });

    // Smooth feedback toast showing addition without forcing cart panel open
    setCartToast({
      bookTitle: book.title,
      count: updatedCount || (totalCartCount + 1),
    });
  };

  // Open Share Dialog for a specific product
  const handleOpenShareProduct = (book: Book) => {
    setSelectedBookToShare(book);
    setIsShareModalOpen(true);
  };

  const handleUpdateCartQuantity = (bookId: number, delta: number) => {
    setCart((prevCart) => {
      const targetItem = prevCart.find((i) => i.book.id === bookId);
      if (!targetItem) return prevCart;

      const newQty = targetItem.quantity + delta;
      let updated: CartItem[];

      if (newQty <= 0) {
        updated = prevCart.filter((i) => i.book.id !== bookId);
      } else {
        if (newQty > targetItem.book.stock) {
          alert(`Only ${targetItem.book.stock} copy/copies available in stock.`);
          return prevCart;
        }
        updated = prevCart.map((item) =>
          item.book.id === bookId ? { ...item, quantity: newQty } : item
        );
      }

      localStorage.setItem('shopping_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromCart = (bookId: number) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((i) => i.book.id !== bookId);
      localStorage.setItem('shopping_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('shopping_cart');
  };

  // Review & Rating Submission
  const handleSubmitReview = async (newReview: BookReview) => {
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('book_reviews', JSON.stringify(updatedReviews));
    broadcastSync('UPDATE_REVIEWS', updatedReviews);

    // Save directly to Firebase Firestore
    firebaseService.submitReview(newReview);

    // Save to persistent server
    const serverResult = await api.submitReview(newReview);
    if (serverResult) {
      setReviews(serverResult.reviews);
      setBooks(serverResult.books);
      localStorage.setItem('book_reviews', JSON.stringify(serverResult.reviews));
      localStorage.setItem('books', JSON.stringify(serverResult.books));
    } else {
      // Fallback local calculation
      const bookReviewsList = updatedReviews.filter((r) => r.bookId === newReview.bookId);
      const avgRating =
        bookReviewsList.reduce((sum, r) => sum + r.rating, 0) / bookReviewsList.length;

      const updatedBooks = books.map((b) =>
        b.id === newReview.bookId
          ? {
              ...b,
              rating: Number(avgRating.toFixed(1)),
              reviewsCount: bookReviewsList.length,
            }
          : b
      );

      setBooks(updatedBooks);
      localStorage.setItem('books', JSON.stringify(updatedBooks));
      broadcastSync('UPDATE_BOOKS', updatedBooks);
    }

    alert('Thank you! Your feedback and rating have been posted.');
  };

  // Delete Review (Admin action)
  const handleDeleteReview = async (reviewId: string) => {
    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);
    localStorage.setItem('book_reviews', JSON.stringify(updatedReviews));
    broadcastSync('UPDATE_REVIEWS', updatedReviews);

    // Delete directly from Firebase Firestore
    firebaseService.deleteReview(reviewId);

    const serverResult = await api.deleteReview(reviewId);
    if (serverResult) {
      setReviews(serverResult.reviews);
      setBooks(serverResult.books);
      localStorage.setItem('book_reviews', JSON.stringify(serverResult.reviews));
      localStorage.setItem('books', JSON.stringify(serverResult.books));
    }
  };

  // Quick Visitor Login / Registration (Name & Phone with automatic cross-device profile restore)
  const handleQuickLogin = async (
    name: string,
    phone: string,
    otpMethod: 'SMS' | 'WhatsApp' | 'Google' = 'Google',
    additionalData?: {
      village?: string;
      po?: string;
      district?: string;
      pincode?: string;
      avatar?: string;
      email?: string;
      photoURL?: string;
      googleUid?: string;
    }
  ) => {
    const timestamp =
      new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString();

    // Check if this phone or email already has a profile in registeredUsers or previous orders
    const existingUser = registeredUsers.find(
      (u) => (phone && u.phone === phone) || (additionalData?.email && u.email === additionalData.email)
    );
    const existingOrder = orders.find((o) => phone && o.phone === phone);

    const resolvedName =
      name.trim() || existingUser?.name || existingOrder?.customerName || customerProfile?.name || 'Valued Customer';
    const restoredVillage =
      additionalData?.village || existingUser?.village || existingOrder?.village || customerProfile?.village || '';
    const restoredPo =
      additionalData?.po || existingUser?.po || existingOrder?.po || customerProfile?.po || '';
    const restoredDistrict =
      additionalData?.district || existingUser?.district || existingOrder?.district || customerProfile?.district || '';
    const restoredPincode =
      additionalData?.pincode || existingUser?.pincode || existingOrder?.pincode || customerProfile?.pincode || '';
    const email = additionalData?.email || existingUser?.email || customerProfile?.email || '';
    const photoURL = additionalData?.photoURL || existingUser?.photoURL || customerProfile?.photoURL || '';
    const avatar = additionalData?.avatar || existingUser?.avatar || customerProfile?.avatar || '📚';
    const googleUid = additionalData?.googleUid || existingUser?.googleUid || customerProfile?.googleUid || '';

    // Create or update customerProfile
    const profile: CustomerProfile = {
      name: resolvedName,
      phone,
      email,
      photoURL,
      avatar,
      googleUid,
      village: restoredVillage,
      po: restoredPo,
      district: restoredDistrict,
      pincode: restoredPincode,
      isOtpVerified: true,
      otpMethod,
      coins: existingUser?.coins !== undefined ? existingUser.coins : (customerProfile?.coins || 50),
    };

    setCustomerProfile(profile);
    localStorage.setItem('customerProfile', JSON.stringify(profile));

    // Register / Log this user in registeredUsers on server
    const serverUsers = await api.saveUser({
      name: resolvedName,
      phone,
      email,
      photoURL,
      avatar,
      googleUid,
      village: restoredVillage,
      po: restoredPo,
      district: restoredDistrict,
      pincode: restoredPincode,
    });

    if (serverUsers) {
      setRegisteredUsers(serverUsers);
      localStorage.setItem('registeredUsers', JSON.stringify(serverUsers));
      broadcastSync('UPDATE_USERS', serverUsers);
    } else {
      let updatedUsers = [...registeredUsers];
      const existingIndex = updatedUsers.findIndex(
        (u) => (phone && u.phone === phone) || (email && u.email === email)
      );

      if (existingIndex >= 0) {
        updatedUsers[existingIndex] = {
          ...updatedUsers[existingIndex],
          name: resolvedName,
          email: email || updatedUsers[existingIndex].email,
          photoURL: photoURL || updatedUsers[existingIndex].photoURL,
          avatar: avatar || updatedUsers[existingIndex].avatar,
          googleUid: googleUid || updatedUsers[existingIndex].googleUid,
          lastLoginAt: timestamp,
          village: restoredVillage || updatedUsers[existingIndex].village,
          po: restoredPo || updatedUsers[existingIndex].po,
          district: restoredDistrict || updatedUsers[existingIndex].district,
          pincode: restoredPincode || updatedUsers[existingIndex].pincode,
        };
      } else {
        const newUser: RegisteredUser = {
          id: `user_${Date.now()}`,
          name: resolvedName,
          phone,
          email,
          photoURL,
          avatar,
          googleUid,
          village: restoredVillage,
          po: restoredPo,
          district: restoredDistrict,
          pincode: restoredPincode,
          registeredAt: timestamp,
          lastLoginAt: timestamp,
          isOtpVerified: true,
          otpMethod,
          coins: 50,
          totalOrdersCount: 0,
          totalSpent: 0,
        };
        updatedUsers = [newUser, ...updatedUsers];
      }

      setRegisteredUsers(updatedUsers);
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      broadcastSync('UPDATE_USERS', updatedUsers);
    }
  };

  // Admin Session & Panel Switch Actions
  const handleLogoutAdmin = () => {
    setIsAdminSession(false);
    setCurrentView('store');
    localStorage.removeItem('isAdminSessionActive');
    sessionStorage.setItem('isAdminLoggedIn', 'false');
  };

  const handleSwitchToStore = () => {
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToAdmin = () => {
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminSession(true);
    setCurrentView('admin');
    localStorage.setItem('isAdminSessionActive', 'true');
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    setIsAdminLoginOpen(false);
    setIsQuickLoginOpen(false);
  };

  // Book Admin Actions (Immediate server & Firebase Cloud Firestore sync)
  const handleSaveBook = async (book: Book, isEdit: boolean) => {
    let updated: Book[];
    if (isEdit) {
      updated = books.map((b) => (b.id === book.id ? book : b));
    } else {
      updated = [book, ...books];
    }
    setBooks(updated);
    localStorage.setItem('books', JSON.stringify(updated));
    broadcastSync('UPDATE_BOOKS', updated);

    // Save directly to Firebase Firestore
    firebaseService.saveBook(book);

    // Also persist via server API
    const serverBooks = await api.saveBook(book, isEdit);
    if (serverBooks) {
      setBooks(serverBooks);
      localStorage.setItem('books', JSON.stringify(serverBooks));
      broadcastSync('UPDATE_BOOKS', serverBooks);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (confirm('Are you sure you want to delete this book from catalog?')) {
      const updated = books.filter((b) => b.id !== id);
      setBooks(updated);
      localStorage.setItem('books', JSON.stringify(updated));
      broadcastSync('UPDATE_BOOKS', updated);

      // Delete directly from Firebase Firestore
      firebaseService.deleteBook(id);

      const serverBooks = await api.deleteBook(id);
      if (serverBooks) {
        setBooks(serverBooks);
        localStorage.setItem('books', JSON.stringify(serverBooks));
        broadcastSync('UPDATE_BOOKS', serverBooks);
      }
    }
  };

  // Banner Admin Actions
  const handleAddBanner = async (imgData: string) => {
    const newBanner: Banner = { id: Date.now(), img: imgData };
    const updated = [...banners, newBanner];
    setBanners(updated);
    localStorage.setItem('banners', JSON.stringify(updated));
    broadcastSync('UPDATE_BANNERS', updated);

    // Save directly to Firebase Firestore
    firebaseService.addBanner(newBanner);

    const serverBanners = await api.addBanner(imgData);
    if (serverBanners) {
      setBanners(serverBanners);
      localStorage.setItem('banners', JSON.stringify(serverBanners));
      broadcastSync('UPDATE_BANNERS', serverBanners);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
      localStorage.setItem('banners', JSON.stringify(updated));
      broadcastSync('UPDATE_BANNERS', updated);

      // Delete directly from Firebase Firestore
      firebaseService.deleteBanner(id);

      const serverBanners = await api.deleteBanner(id);
      if (serverBanners) {
        setBanners(serverBanners);
        localStorage.setItem('banners', JSON.stringify(serverBanners));
        broadcastSync('UPDATE_BANNERS', serverBanners);
      }
    }
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    if (!newSettings.logoImg) newSettings.logoImg = DEFAULT_LOGO_DATA;
    setSettings(newSettings);
    localStorage.setItem('storeSettings', JSON.stringify(newSettings));
    broadcastSync('UPDATE_SETTINGS', newSettings);

    // Save directly to Firebase Firestore
    firebaseService.saveSettings(newSettings);

    const serverSettings = await api.saveSettings(newSettings);
    if (serverSettings) {
      setSettings(serverSettings);
      localStorage.setItem('storeSettings', JSON.stringify(serverSettings));
      broadcastSync('UPDATE_SETTINGS', serverSettings);
    }
  };

  // Customer Profile Save
  const handleSaveProfile = async (newProfile: CustomerProfile) => {
    setCustomerProfile(newProfile);
    localStorage.setItem('customerProfile', JSON.stringify(newProfile));

    const serverUsers = await api.saveUser({
      name: newProfile.name,
      phone: newProfile.phone,
      village: newProfile.village,
      po: newProfile.po,
      district: newProfile.district,
      pincode: newProfile.pincode,
    });

    if (serverUsers) {
      setRegisteredUsers(serverUsers);
      localStorage.setItem('registeredUsers', JSON.stringify(serverUsers));
      broadcastSync('UPDATE_USERS', serverUsers);
    }
  };

  // Handle Book selection with visitor analytics tracking
  const handleSelectBook = (book: Book) => {
    analyticsService.trackBookView(book);
    setSelectedBookForDetails(book);
  };

  // Order Placed Action (Full Address & Payment confirmed)
  const handleOrderPlaced = async (
    newOrder: Order,
    updatedBooksList: Book[],
    updatedProfile: CustomerProfile
  ) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('my_personal_orders', JSON.stringify(updatedOrders));
    broadcastSync('UPDATE_ORDERS', updatedOrders);

    // Update book stock
    let newBooksState = [...books];
    updatedBooksList.forEach((updBook) => {
      newBooksState = newBooksState.map((b) => (b.id === updBook.id ? updBook : b));
    });

    setBooks(newBooksState);
    localStorage.setItem('books', JSON.stringify(newBooksState));
    broadcastSync('UPDATE_BOOKS', newBooksState);

    // If this was a cart order, clear the cart
    if (cartCheckoutOpen) {
      handleClearCart();
      setCartCheckoutOpen(false);
    }

    setCustomerProfile(updatedProfile);
    localStorage.setItem('customerProfile', JSON.stringify(updatedProfile));

    // Instant Trigger: Show scratch card reward modal in front of customer
    const generatedCard =
      updatedProfile.scratchCards?.find((sc) => sc.orderId === newOrder.id) ||
      (updatedProfile.scratchCards && updatedProfile.scratchCards.length > 0
        ? updatedProfile.scratchCards[updatedProfile.scratchCards.length - 1]
        : {
            id: `sc_${newOrder.id}`,
            orderId: newOrder.id,
            coinsAmount: newOrder.coinsEarned || 50,
            title: `Order #${newOrder.id} Mystery Reward`,
            description: '15-Day validity reward for your book order',
            createdAt: Date.now(),
            expiresAt: Date.now() + 15 * 86400 * 1000,
            isScratched: false,
          });

    setPlacedOrderForScratch({
      order: newOrder,
      scratchCard: generatedCard,
    });

    // Save order directly to Firebase Firestore
    firebaseService.placeOrder(newOrder, updatedBooksList, updatedProfile);

    // Save order to server
    const serverResult = await api.placeOrder(newOrder, updatedBooksList, updatedProfile);
    if (serverResult) {
      setOrders(serverResult.orders);
      setBooks(serverResult.books);
      setRegisteredUsers(serverResult.registeredUsers);
      localStorage.setItem('my_personal_orders', JSON.stringify(serverResult.orders));
      localStorage.setItem('books', JSON.stringify(serverResult.books));
      localStorage.setItem('registeredUsers', JSON.stringify(serverResult.registeredUsers));
      broadcastSync('UPDATE_ORDERS', serverResult.orders);
      broadcastSync('UPDATE_BOOKS', serverResult.books);
      broadcastSync('UPDATE_USERS', serverResult.registeredUsers);
    }
  };

  // Claim scratch card coins directly from order success modal or profile
  const handleClaimScratchCoins = async (cardId: string, coinsEarned: number) => {
    if (customerProfile?.phone) {
      try {
        await api.claimScratchCard(customerProfile.phone, cardId);
      } catch {
        // Fallback local update
      }
    }

    if (customerProfile) {
      const updatedCards = (customerProfile.scratchCards || []).map((c) =>
        c.id === cardId ? { ...c, isScratched: true, scratchedAt: Date.now() } : c
      );
      const updatedProfile: CustomerProfile = {
        ...customerProfile,
        coins: (customerProfile.coins || 0) + coinsEarned,
        scratchCards: updatedCards,
      };
      setCustomerProfile(updatedProfile);
      localStorage.setItem('customerProfile', JSON.stringify(updatedProfile));
      broadcastSync('UPDATE_PROFILE', updatedProfile);
    }

    // Update the scratch card inside placedOrderForScratch state if open
    setPlacedOrderForScratch((prev) => {
      if (!prev || prev.scratchCard.id !== cardId) return prev;
      return {
        ...prev,
        scratchCard: {
          ...prev.scratchCard,
          isScratched: true,
          scratchedAt: Date.now(),
        },
      };
    });
  };

  // Delete User Log
  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove this user from directory?')) {
      const updated = registeredUsers.filter((u) => u.id !== id);
      setRegisteredUsers(updated);
      localStorage.setItem('registeredUsers', JSON.stringify(updated));
      broadcastSync('UPDATE_USERS', updated);

      const serverUsers = await api.deleteUser(id);
      if (serverUsers) {
        setRegisteredUsers(serverUsers);
        localStorage.setItem('registeredUsers', JSON.stringify(serverUsers));
        broadcastSync('UPDATE_USERS', serverUsers);
      }
    }
  };

  // Bulk Update Books (e.g. from AI Customizer percentage discount)
  const handleBulkUpdateBooks = async (newBooks: Book[]) => {
    setBooks(newBooks);
    localStorage.setItem('books', JSON.stringify(newBooks));
    broadcastSync('UPDATE_BOOKS', newBooks);

    const serverBooks = await api.bulkUpdateBooks(newBooks);
    if (serverBooks) {
      setBooks(serverBooks);
      localStorage.setItem('books', JSON.stringify(serverBooks));
      broadcastSync('UPDATE_BOOKS', serverBooks);
    }
  };

  // Update Order Status / Tracking (Called by Admin)
  const handleUpdateOrder = async (updatedOrder: Order) => {
    const updated = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updated);
    localStorage.setItem('my_personal_orders', JSON.stringify(updated));
    broadcastSync('UPDATE_ORDERS', updated);

    // Save directly to Firebase Firestore
    firebaseService.updateOrder(updatedOrder);

    const serverOrders = await api.updateOrder(updatedOrder);
    if (serverOrders) {
      setOrders(serverOrders);
      localStorage.setItem('my_personal_orders', JSON.stringify(serverOrders));
      broadcastSync('UPDATE_ORDERS', serverOrders);
    }
  };

  // Coupon Admin Actions
  const handleSaveCoupon = async (coupon: Coupon) => {
    const prevCoupons = settings.coupons || [];
    const updatedCoupons = [coupon, ...prevCoupons.filter((c) => c.id !== coupon.id)];
    const updatedSettings: StoreSettings = { ...settings, coupons: updatedCoupons };
    setSettings(updatedSettings);
    localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    broadcastSync('UPDATE_SETTINGS', updatedSettings);

    const serverCoupons = await api.saveCoupon(coupon);
    if (serverCoupons) {
      const syncdSettings: StoreSettings = { ...settings, coupons: serverCoupons };
      setSettings(syncdSettings);
      localStorage.setItem('storeSettings', JSON.stringify(syncdSettings));
      broadcastSync('UPDATE_SETTINGS', syncdSettings);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const prevCoupons = settings.coupons || [];
    const updatedCoupons = prevCoupons.filter((c) => c.id !== couponId && c.code !== couponId);
    const updatedSettings: StoreSettings = { ...settings, coupons: updatedCoupons };
    setSettings(updatedSettings);
    localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    broadcastSync('UPDATE_SETTINGS', updatedSettings);

    const serverCoupons = await api.deleteCoupon(couponId);
    if (serverCoupons) {
      const syncdSettings: StoreSettings = { ...settings, coupons: serverCoupons };
      setSettings(syncdSettings);
      localStorage.setItem('storeSettings', JSON.stringify(syncdSettings));
      broadcastSync('UPDATE_SETTINGS', syncdSettings);
    }
  };

  // User Coins Admin Action
  const handleUpdateUserCoins = async (userId: string, newCoins: number) => {
    const updated = registeredUsers.map((u) => (u.id === userId ? { ...u, coins: newCoins } : u));
    setRegisteredUsers(updated);
    localStorage.setItem('registeredUsers', JSON.stringify(updated));
    broadcastSync('UPDATE_USERS', updated);

    const targetUser = registeredUsers.find((u) => u.id === userId);
    if (targetUser && customerProfile && customerProfile.phone === targetUser.phone) {
      const updatedProfile = { ...customerProfile, coins: newCoins };
      setCustomerProfile(updatedProfile);
      localStorage.setItem('customerProfile', JSON.stringify(updatedProfile));
    }

    const serverUsers = await api.saveUser({ id: userId, phone: targetUser?.phone, coins: newCoins });
    if (serverUsers) {
      setRegisteredUsers(serverUsers);
      localStorage.setItem('registeredUsers', JSON.stringify(serverUsers));
      broadcastSync('UPDATE_USERS', serverUsers);
    }
  };

  const handleOpenTrackSpecificOrder = (orderId: string) => {
    setSelectedTrackOrderId(orderId);
    setIsTrackModalOpen(true);
  };

  // One-click Home navigation from any screen / modal
  const handleGoHome = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    setIsCategoryModalOpen(false);
    setIsSearchModalOpen(false);
    setSelectedBookForDetails(null);
    setSelectedBookForOrder(null);
    setSelectedBookToShare(null);
    setCartToast(null);
    setCartCheckoutOpen(false);
    setIsCustomerModalOpen(false);
    setIsShareModalOpen(false);
    setIsCartOpen(false);
    setIsTrackModalOpen(false);
    setIsQuickLoginOpen(false);
    setIsAdminLoginOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: settings.bgColor || '#F5F7FA' }}
    >
      {/* Header */}
      <Header
        settings={settings}
        customerName={customerProfile?.name}
        isAdmin={isAdmin}
        isAdminSession={isAdminSession}
        currentView={currentView}
        cartCount={totalCartCount}
        onGoHome={handleGoHome}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        onOpenTrackOrder={() => {
          setSelectedTrackOrderId('');
          setIsTrackModalOpen(true);
        }}
        onSwitchToAdmin={handleSwitchToAdmin}
        onSwitchToStore={handleSwitchToStore}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Sticky Quick-Switch Admin Bar when Admin is browsing store */}
      {isAdminSession && currentView === 'store' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-3 sm:px-6 py-2 text-xs flex items-center justify-between shadow-md border-b-2 border-amber-400 sticky top-[53px] sm:top-[61px] z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-black text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Logged In</span>
            </span>
            <span className="hidden md:inline text-slate-300 text-[11px]">
              • Previewing Store as Customer (Switch between panels freely without re-entering password)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 border border-amber-300"
              title="Return to Admin Panel Dashboard"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>⚡ Switch to Admin Panel</span>
            </button>
            <button
              type="button"
              onClick={handleLogoutAdmin}
              className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer px-1 transition-colors"
              title="Sign out completely from Admin"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container (Mobile Phone & Computer responsive) */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 sm:pb-32 flex-1">
        {/* Banner Slider with touch swipe, size adjustments & arrow navigation */}
        <BannerSlider banners={banners} settings={settings} accentColor={settings.accentColor} />

        {/* Combo Offers Slider Section */}
        {!isAdmin && (
          <ComboSlider
            books={books}
            settings={settings}
            onSelectBook={(book) => handleSelectBook(book)}
            onOrderNow={(book) => {
              analyticsService.trackBookView(book);
              setSelectedBookForOrder(book);
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* View Switch: Only authenticated Admins can see the AdminPanel */}
        {isAdmin ? (
          <AdminPanel
            books={books}
            banners={banners}
            orders={orders}
            registeredUsers={registeredUsers}
            reviews={reviews}
            settings={settings}
            onSaveBook={handleSaveBook}
            onDeleteBook={handleDeleteBook}
            onAddBanner={handleAddBanner}
            onDeleteBanner={handleDeleteBanner}
            onSaveSettings={handleSaveSettings}
            onLogoutAdmin={handleLogoutAdmin}
            onSwitchToStore={handleSwitchToStore}
            onUpdateOrder={handleUpdateOrder}
            onBulkUpdateBooks={handleBulkUpdateBooks}
            onDeleteUser={handleDeleteUser}
            onDeleteReview={handleDeleteReview}
            onAddReview={handleSubmitReview}
            onSaveCoupon={handleSaveCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onUpdateUserCoins={handleUpdateUserCoins}
          />
        ) : (
          /* Regular Customers see Store View Only */
          <div id="customer-store-view" className="space-y-5">
            {/* Active Search & Category Filter Indicator */}
            {(searchQuery || selectedCategory) && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2.5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {searchQuery && (
                    <div className="flex items-center gap-1.5 bg-white border border-orange-200 px-3 py-1 rounded-xl text-xs">
                      <Search className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-slate-600">Search:</span>
                      <span className="font-bold text-slate-900">"{searchQuery}"</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="flex items-center gap-1.5 bg-orange-200/80 px-3 py-1 rounded-xl text-xs font-bold text-orange-950">
                      <span>Category: {selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="text-orange-900 hover:text-orange-950 ml-1 cursor-pointer"
                        title="Clear Category"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 hover:text-orange-950 hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>View All Books</span>
                </button>
              </div>
            )}

            {/* Section Heading */}
            <div className="flex items-center gap-2.5 pt-1">
              <div
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              />
              <h2
                className="text-xl sm:text-2xl font-black"
                style={{ color: settings.primaryColor || '#0B1B3D' }}
              >
                {selectedCategory ? `${selectedCategory} Books` : 'Available Books in Store'}
              </h2>
            </div>

            {/* Books Grid: Responsive 2-col on mobile phones, 3-col on tablets, 4-col on computers */}
            {filteredBooks.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs max-w-md mx-auto my-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No books found</h3>
                <p className="text-xs text-slate-500">
                  {selectedCategory
                    ? `No books found in "${selectedCategory}".`
                    : 'Try searching with different keywords or clear your search query.'}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    View All Books
                  </button>
                )}
              </div>
            ) : (
              <div
                id="books-grid"
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
              >
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    settings={settings}
                    isInCart={cart.some((c) => c.book.id === book.id)}
                    onViewDetails={(b) => handleSelectBook(b)}
                    onOrderNow={(b) => {
                      analyticsService.trackBookView(b);
                      setSelectedBookForOrder(b);
                    }}
                    onAddToCart={(b) => handleAddToCart(b)}
                    onShareBook={(b) => handleOpenShareProduct(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating WhatsApp Action Button (8001743646) */}
      <FloatingWhatsApp
        whatsappNumber={settings.whatsappNumber || defaultSettings.whatsappNumber}
        storeName={settings.name}
      />

      {/* Smooth Floating Cart Added Notification */}
      {cartToast && (
        <div
          id="cart-added-toast"
          className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/90 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-xs sm:max-w-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-tight">Added to Cart (+1)</p>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{cartToast.bookTitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCartToast(null);
              setIsCartOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            Cart ({cartToast.count})
          </button>
        </div>
      )}

      {/* Cart Drawer for multi-book cart items & direct checkout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onGoHome={handleGoHome}
        cart={cart}
        cartItems={cart}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setCartCheckoutOpen(true);
        }}
      />

      {/* Footer */}
      <Footer
        settings={settings}
        isAdmin={isAdmin}
        isAdminSession={isAdminSession}
        currentView={currentView}
        onOpenAdminLogin={() => {
          if (isAdminSession) {
            handleSwitchToAdmin();
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onSwitchToAdmin={handleSwitchToAdmin}
        onSwitchToStore={handleSwitchToStore}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
      />

      {/* MODALS */}

      {/* 1. Quick Login Modal (SMS & WhatsApp OTP support, Unified Admin & Customer) */}
      <QuickLoginModal
        settings={settings}
        isOpen={isQuickLoginOpen}
        registeredUsers={registeredUsers}
        onClose={() => setIsQuickLoginOpen(false)}
        onLogin={handleQuickLogin}
        onAdminLogin={handleAdminLoginSuccess}
      />

      {/* 2. Admin Authentication Modal (With OTP Reset to 8001743646 support) */}
      <AdminLoginModal
        settings={settings}
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* 3. Book Details Modal (With customer reviews and ratings feedback form & product recommendations) */}
      {selectedBookForDetails && (
        <BookDetailsModal
          book={selectedBookForDetails}
          books={books}
          allBooks={books}
          settings={settings}
          reviews={reviews}
          isInCart={cart.some((c) => c.book.id === selectedBookForDetails.id)}
          customerProfile={customerProfile}
          onClose={() => setSelectedBookForDetails(null)}
          onGoHome={handleGoHome}
          onSelectBook={(b) => handleSelectBook(b)}
          onOrder={(b) => {
            setSelectedBookForDetails(null);
            setSelectedBookForOrder(b);
          }}
          onAddToCart={(b) => {
            handleAddToCart(b);
          }}
          onShareBook={(b) => handleOpenShareProduct(b)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* 4. Single Book Order Modal */}
      {selectedBookForOrder && (
        <OrderModal
          book={selectedBookForOrder}
          settings={settings}
          profile={customerProfile}
          onClose={() => setSelectedBookForOrder(null)}
          onGoHome={handleGoHome}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* 4b. Multi-Book Cart Checkout Modal */}
      {cartCheckoutOpen && (
        <OrderModal
          cartItems={cart}
          settings={settings}
          profile={customerProfile}
          onClose={() => setCartCheckoutOpen(false)}
          onGoHome={handleGoHome}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* 5. Customer Profile Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          profile={customerProfile}
          orders={orders}
          settings={settings}
          onClose={() => setIsCustomerModalOpen(false)}
          onGoHome={handleGoHome}
          onSaveProfile={handleSaveProfile}
          onTrackOrder={handleOpenTrackSpecificOrder}
          onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
          onLogoutProfile={() => {
            setCustomerProfile(null);
            localStorage.removeItem('customerProfile');
          }}
        />
      )}

      {/* 6. Share Modal (Supports Store Share & Individual Book Share) */}
      {isShareModalOpen && (
        <ShareModal
          settings={settings}
          book={selectedBookToShare}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedBookToShare(null);
          }}
        />
      )}

      {/* 7. Track Order Modal */}
      {isTrackModalOpen && (
        <TrackOrderModal
          orders={orders}
          profile={customerProfile}
          customerProfile={customerProfile}
          settings={settings}
          initialOrderId={selectedTrackOrderId}
          onGoHome={handleGoHome}
          onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
          onClose={() => {
            setIsTrackModalOpen(false);
            setSelectedTrackOrderId('');
            if (window.location.hash.startsWith('#track=')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      )}

      {/* 8. Immediate Post-Order Mystery Scratch Card & WhatsApp Confirmation Modal */}
      {placedOrderForScratch && (
        <OrderSuccessScratchModal
          order={placedOrderForScratch.order}
          scratchCard={placedOrderForScratch.scratchCard}
          profile={customerProfile}
          settings={settings}
          onClaimCoins={handleClaimScratchCoins}
          onClose={() => setPlacedOrderForScratch(null)}
          onTrackOrder={(orderId) => {
            setPlacedOrderForScratch(null);
            setSelectedTrackOrderId(orderId);
            setIsTrackModalOpen(true);
          }}
          onContinueShopping={() => setPlacedOrderForScratch(null)}
        />
      )}

      {/* 9. Category Drawer Modal (Accessed from bottom three dots & header category button) */}
      <CategoryDrawerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        books={books}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const gridEl = document.getElementById('books-grid') || document.getElementById('customer-store-view');
          if (gridEl) {
            gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        settings={settings}
      />

      {/* 10. Search Modal (Instant search with live filtering & book select) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        books={books}
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectBook={handleSelectBook}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* 11. Fixed Bottom Navigation Bar (Right at thumb's reach for mobile & responsive) */}
      {!isAdmin && (
        <BottomNav
          settings={settings}
          cartCount={totalCartCount}
          customerName={customerProfile?.name}
          coinsBalance={customerProfile?.coins || 0}
          onGoHome={handleGoHome}
          onOpenCategories={() => setIsCategoryModalOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => setIsCustomerModalOpen(true)}
          onFocusSearch={() => setIsSearchModalOpen(true)}
          activeCategory={selectedCategory}
        />
      )}
    </div>
  );
}

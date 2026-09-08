import {
  db,
  auth,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from './firebase';
import {
  Book,
  Banner,
  StoreSettings,
  BookReview,
  Order,
  RegisteredUser,
  CustomerProfile,
  Coupon,
} from '../types';
import {
  defaultSettings,
  defaultBanners,
  defaultBooks,
  defaultReviews,
} from '../data/defaultData';

export interface FirebaseStoreData {
  books: Book[];
  banners: Banner[];
  settings: StoreSettings;
  reviews: BookReview[];
  orders: Order[];
  registeredUsers: RegisteredUser[];
  coupons?: Coupon[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error(`[Firebase Firestore Error] ${operationType.toUpperCase()} at "${path}":`, JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Deeply sanitizes any payload before sending to Firestore by removing keys with `undefined` values.
 * Firestore setDoc() and updateDoc() throw an uncaught exception if ANY object property is `undefined`.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

const SETTINGS_DOC_ID = 'store_configuration';

export const firebaseService = {
  // 1. Listen to real-time store updates (Books, Banners, Settings, Reviews, Orders, Users, Coupons)
  subscribeStoreData(
    callback: (data: FirebaseStoreData) => void,
    onError?: (err: any) => void
  ) {
    const unsubscribers: (() => void)[] = [];

    let currentSettings: StoreSettings = defaultSettings;
    let currentBooks: Book[] = defaultBooks;
    let currentBanners: Banner[] = defaultBanners;
    let currentReviews: BookReview[] = defaultReviews;
    let currentOrders: Order[] = [];
    let currentUsers: RegisteredUser[] = [];
    let currentCoupons: Coupon[] = [];

    const notify = () => {
      callback({
        settings: currentSettings,
        books: currentBooks,
        banners: currentBanners,
        reviews: currentReviews,
        orders: currentOrders,
        registeredUsers: currentUsers,
        coupons: currentCoupons,
      });
    };

    try {
      // Listen to Settings
      const unsubSettings = onSnapshot(
        doc(db, 'settings', SETTINGS_DOC_ID),
        (snap) => {
          if (snap.exists()) {
            currentSettings = { ...defaultSettings, ...(snap.data() as StoreSettings) };
            if (currentSettings.coupons) {
              currentCoupons = currentSettings.coupons;
            }
          }
          notify();
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, `settings/${SETTINGS_DOC_ID}`);
          if (onError) onError(err);
        }
      );
      unsubscribers.push(unsubSettings);

      // Listen to Books collection
      const unsubBooks = onSnapshot(
        collection(db, 'books'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Book[] = [];
            snapshot.forEach((d) => list.push(d.data() as Book));
            list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
            currentBooks = list;
          }
          notify();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'books')
      );
      unsubscribers.push(unsubBooks);

      // Listen to Banners collection
      const unsubBanners = onSnapshot(
        collection(db, 'banners'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Banner[] = [];
            snapshot.forEach((d) => list.push(d.data() as Banner));
            list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
            currentBanners = list;
          }
          notify();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'banners')
      );
      unsubscribers.push(unsubBanners);

      // Listen to Reviews collection
      const unsubReviews = onSnapshot(
        collection(db, 'reviews'),
        (snapshot) => {
          const list: BookReview[] = [];
          snapshot.forEach((d) => list.push(d.data() as BookReview));
          currentReviews = list.length > 0 ? list : defaultReviews;
          notify();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
      );
      unsubscribers.push(unsubReviews);

      // Listen to Orders collection
      const unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push(d.data() as Order));
          list.sort((a, b) => {
            const dateA = new Date(a.date || '').getTime() || 0;
            const dateB = new Date(b.date || '').getTime() || 0;
            return dateB - dateA;
          });
          currentOrders = list;
          notify();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
      );
      unsubscribers.push(unsubOrders);

      // Listen to Users collection
      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: RegisteredUser[] = [];
          snapshot.forEach((d) => list.push(d.data() as RegisteredUser));
          currentUsers = list;
          notify();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );
      unsubscribers.push(unsubUsers);
    } catch (e) {
      console.error('[Firebase] Failed to initialize Firestore listeners:', e);
    }

    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // ignore
        }
      });
    };
  },

  // 2. Initialize Seed Data into Firebase if empty
  async seedInitialDataIfEmpty() {
    try {
      // Check settings
      const settingsSnap = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID));
      if (!settingsSnap.exists()) {
        await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), cleanForFirestore(defaultSettings));
      }

      // Check books
      const booksSnap = await getDocs(collection(db, 'books'));
      if (booksSnap.empty) {
        for (const book of defaultBooks) {
          await setDoc(doc(db, 'books', String(book.id)), cleanForFirestore(book));
        }
      }

      // Check banners
      const bannersSnap = await getDocs(collection(db, 'banners'));
      if (bannersSnap.empty) {
        for (const banner of defaultBanners) {
          await setDoc(doc(db, 'banners', String(banner.id)), cleanForFirestore(banner));
        }
      }

      // Check reviews
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      if (reviewsSnap.empty) {
        for (const review of defaultReviews) {
          await setDoc(doc(db, 'reviews', String(review.id)), cleanForFirestore(review));
        }
      }
    } catch (err) {
      console.warn('[Firebase] Data seeding notice (can occur on first run):', err);
    }
  },

  // 3. Save Book
  async saveBook(book: Book): Promise<boolean> {
    const path = `books/${book.id}`;
    try {
      const sanitized = cleanForFirestore(book);
      await setDoc(doc(db, 'books', String(book.id)), sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 4. Delete Book
  async deleteBook(id: number): Promise<boolean> {
    const path = `books/${id}`;
    try {
      await deleteDoc(doc(db, 'books', String(id)));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  },

  // 5. Save Store Settings
  async saveSettings(settings: StoreSettings): Promise<boolean> {
    const path = `settings/${SETTINGS_DOC_ID}`;
    try {
      const sanitized = cleanForFirestore(settings);
      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 6. Save Banner
  async addBanner(banner: Banner): Promise<boolean> {
    const path = `banners/${banner.id}`;
    try {
      const sanitized = cleanForFirestore(banner);
      await setDoc(doc(db, 'banners', String(banner.id)), sanitized);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 7. Delete Banner
  async deleteBanner(id: number): Promise<boolean> {
    const path = `banners/${id}`;
    try {
      await deleteDoc(doc(db, 'banners', String(id)));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  },

  // 8. Place Order & Update Book Stock + Registered User
  async placeOrder(
    order: Order,
    updatedBooks: Book[],
    customerProfile: CustomerProfile
  ): Promise<boolean> {
    const orderPath = `orders/${order.id}`;
    try {
      // 1. Sanitize & save the order to Firestore
      const sanitizedOrder = cleanForFirestore(order);
      await setDoc(doc(db, 'orders', String(order.id)), sanitizedOrder);

      // 2. Update stock for ordered books
      if (Array.isArray(updatedBooks)) {
        for (const book of updatedBooks) {
          if (book && book.id) {
            const sanitizedBook = cleanForFirestore(book);
            await setDoc(doc(db, 'books', String(book.id)), sanitizedBook, { merge: true });
          }
        }
      }

      // 3. Update or save Registered User
      if (customerProfile && customerProfile.phone) {
        const cleanPhone = customerProfile.phone.replace(/[^0-9]/g, '');
        const userDocRef = doc(db, 'users', cleanPhone);
        const existingUserSnap = await getDoc(userDocRef);

        const currentPoints = existingUserSnap.exists()
          ? (existingUserSnap.data().coins || 0)
          : 0;

        const earnedPoints = Math.floor((order.totalAmount || 0) / 100) * 5;
        const newTotalCoins = Math.max(0, currentPoints - (order.coinsUsed || 0) + earnedPoints);

        const timestamp = new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString();

        const userData: RegisteredUser = {
          id: cleanPhone,
          name: customerProfile.name || 'Valued Customer',
          phone: cleanPhone,
          village: customerProfile.village || '',
          po: customerProfile.po || '',
          district: customerProfile.district || '',
          pincode: customerProfile.pincode || '',
          coins: newTotalCoins,
          totalOrdersCount: (existingUserSnap.exists() ? (existingUserSnap.data().totalOrdersCount || 0) : 0) + 1,
          totalSpent: (existingUserSnap.exists() ? (existingUserSnap.data().totalSpent || 0) : 0) + (order.totalAmount || 0),
          lastLoginAt: timestamp,
          registeredAt: existingUserSnap.exists() ? existingUserSnap.data().registeredAt : timestamp,
          scratchCards: customerProfile.scratchCards || (existingUserSnap.exists() ? existingUserSnap.data().scratchCards : []),
        };

        await setDoc(userDocRef, cleanForFirestore(userData), { merge: true });
      }

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, orderPath);
      return false;
    }
  },

  // 9. Update Order Status
  async updateOrder(order: Order): Promise<boolean> {
    const path = `orders/${order.id}`;
    try {
      const sanitized = cleanForFirestore(order);
      await setDoc(doc(db, 'orders', String(order.id)), sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 10. Submit Book Review
  async submitReview(review: BookReview): Promise<boolean> {
    const path = `reviews/${review.id}`;
    try {
      const sanitized = cleanForFirestore(review);
      await setDoc(doc(db, 'reviews', review.id), sanitized);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 11. Delete Review
  async deleteReview(id: string): Promise<boolean> {
    const path = `reviews/${id}`;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  },

  // 12. Save User
  async saveUser(user: Partial<RegisteredUser>): Promise<boolean> {
    const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
    const cleanEmail = user.email ? user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : '';
    const docKey = cleanPhone || cleanEmail || user.googleUid || user.id || `user_${Date.now()}`;
    const path = `users/${docKey}`;
    try {
      const sanitized = cleanForFirestore(user);
      await setDoc(doc(db, 'users', docKey), sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  },

  // 13. Delete User
  async deleteUser(identifier: string): Promise<boolean> {
    const cleanKey = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    const path = `users/${cleanKey}`;
    try {
      await deleteDoc(doc(db, 'users', cleanKey));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  },
};

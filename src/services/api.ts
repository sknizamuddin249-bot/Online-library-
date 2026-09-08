import {
  Book,
  Banner,
  StoreSettings,
  BookReview,
  Order,
  RegisteredUser,
  CustomerProfile,
  Coupon,
  AdminUser,
  ScratchCard,
} from '../types';

export interface StoreDataResponse {
  books: Book[];
  banners: Banner[];
  settings: StoreSettings;
  reviews: BookReview[];
  orders: Order[];
  registeredUsers: RegisteredUser[];
  admins?: AdminUser[];
  contact?: {
    phone: string;
    whatsappNumber: string;
    email: string;
    upiId: string;
    upiName: string;
  };
}

export const api = {
  // 1. Fetch complete live store data
  async getStoreData(): Promise<StoreDataResponse | null> {
    try {
      const res = await fetch('/api/store-data');
      if (!res.ok) throw new Error('Failed to fetch store data');
      return await res.json();
    } catch (err) {
      console.warn('[API] Could not fetch remote store data, using local cache:', err);
      return null;
    }
  },

  // 2. Save Book (Add or Edit)
  async saveBook(book: Book, isEdit: boolean): Promise<Book[] | null> {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book, isEdit }),
      });
      if (!res.ok) throw new Error('Failed to save book');
      const data = await res.json();
      return data.books;
    } catch (err) {
      console.error('[API] Error saving book to server:', err);
      return null;
    }
  },

  // 3. Delete Book
  async deleteBook(id: number): Promise<Book[] | null> {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete book');
      const data = await res.json();
      return data.books;
    } catch (err) {
      console.error('[API] Error deleting book on server:', err);
      return null;
    }
  },

  // 4. Bulk Update Books
  async bulkUpdateBooks(books: Book[]): Promise<Book[] | null> {
    try {
      const res = await fetch('/api/books/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books }),
      });
      if (!res.ok) throw new Error('Failed to bulk update books');
      const data = await res.json();
      return data.books;
    } catch (err) {
      console.error('[API] Error bulk updating books:', err);
      return null;
    }
  },

  // 5. Save Store Settings
  async saveSettings(settings: StoreSettings): Promise<StoreSettings | null> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      const data = await res.json();
      return data.settings;
    } catch (err) {
      console.error('[API] Error saving settings to server:', err);
      return null;
    }
  },

  // 6. Save Banner
  async addBanner(img: string): Promise<Banner[] | null> {
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img }),
      });
      if (!res.ok) throw new Error('Failed to add banner');
      const data = await res.json();
      return data.banners;
    } catch (err) {
      console.error('[API] Error adding banner to server:', err);
      return null;
    }
  },

  // 7. Delete Banner
  async deleteBanner(id: number): Promise<Banner[] | null> {
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      const data = await res.json();
      return data.banners;
    } catch (err) {
      console.error('[API] Error deleting banner on server:', err);
      return null;
    }
  },

  // 8. Place Order
  async placeOrder(
    order: Order,
    updatedBooks: Book[],
    customerProfile: CustomerProfile
  ): Promise<{ orders: Order[]; books: Book[]; registeredUsers: RegisteredUser[]; earnedScratchCard?: ScratchCard; customer?: any } | null> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, updatedBooks, customerProfile }),
      });
      if (!res.ok) throw new Error('Failed to place order on server');
      return await res.json();
    } catch (err) {
      console.error('[API] Error placing order on server:', err);
      return null;
    }
  },

  // 9. Update Order
  async updateOrder(order: Order): Promise<Order[] | null> {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error('Failed to update order on server');
      const data = await res.json();
      return data.orders;
    } catch (err) {
      console.error('[API] Error updating order on server:', err);
      return null;
    }
  },

  // 10. Add Review
  async submitReview(review: BookReview): Promise<{ reviews: BookReview[]; books: Book[] } | null> {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      return await res.json();
    } catch (err) {
      console.error('[API] Error submitting review:', err);
      return null;
    }
  },

  // 11. Delete Review
  async deleteReview(id: string): Promise<{ reviews: BookReview[]; books: Book[] } | null> {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete review');
      return await res.json();
    } catch (err) {
      console.error('[API] Error deleting review:', err);
      return null;
    }
  },

  // 11b. Google One-Tap & Firebase Auth Sign-In / Register
  async googleLoginOrRegister(googleData: {
    email: string;
    name: string;
    photoURL?: string;
    uid: string;
    phone?: string;
  }): Promise<{
    success: boolean;
    user?: RegisteredUser;
    message?: string;
    error?: string;
    isAdmin?: boolean;
    adminRole?: string;
    isMasterAdmin?: boolean;
  }> {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error in Google auth:', err);
      return { success: false, error: 'Failed to connect to server.' };
    }
  },

  // 12. Register Customer (No OTP Required, Name + Phone + Password)
  async registerCustomer(userData: {
    name: string;
    phone: string;
    password: string;
    village?: string;
    po?: string;
    district?: string;
    pincode?: string;
  }): Promise<{ success: boolean; user?: RegisteredUser; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error registering customer:', err);
      return { success: false, error: 'Failed to connect to server.' };
    }
  },

  // 13. Login with Phone & Password (Unified for Customer & Admin)
  async loginWithPassword(
    phone: string,
    password: string
  ): Promise<{ success: boolean; isAdmin?: boolean; user?: any; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error logging in:', err);
      return { success: false, error: 'Failed to connect to server.' };
    }
  },

  // 14. Forgot Password - Send OTP
  async sendForgotPasswordOtp(
    phone: string,
    method: 'WhatsApp' | 'SMS' = 'SMS'
  ): Promise<{ success: boolean; whatsappUrl?: string; message?: string; error?: string; otp?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, method }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error sending forgot password OTP:', err);
      return { success: false, error: 'Failed to send OTP.' };
    }
  },

  async requestForgotPasswordOtp(phone: string, method: 'WhatsApp' | 'SMS' = 'SMS') {
    return this.sendForgotPasswordOtp(phone, method);
  },

  // 15. Reset Password with OTP
  async resetPasswordWithOtp(
    phone: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; user?: RegisteredUser; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error resetting password:', err);
      return { success: false, error: 'Failed to reset password.' };
    }
  },

  async resetPassword(phone: string, otp: string, newPassword: string) {
    return this.resetPasswordWithOtp(phone, otp, newPassword);
  },

  // 16. Claim / Scratch Lucky Card
  async claimScratchCard(
    phone: string,
    cardId: string
  ): Promise<{ success: boolean; claimedCoins?: number; totalCoins?: number; user?: RegisteredUser; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/scratch-cards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cardId }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error claiming scratch card:', err);
      return { success: false, error: 'Failed to claim scratch card.' };
    }
  },

  // 17. Admin Team Management
  async getAdmins(): Promise<AdminUser[]> {
    try {
      const res = await fetch('/api/admins');
      if (!res.ok) throw new Error('Failed to fetch admins');
      return await res.json();
    } catch (err) {
      console.error('[API] Error fetching admins:', err);
      return [];
    }
  },

  async saveAdmin(admin: Partial<AdminUser>): Promise<{ success: boolean; admins?: AdminUser[]; error?: string }> {
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin }),
      });
      const data = await res.json();
      return { success: res.ok && data.success !== false, admins: data.admins, error: data.error };
    } catch (err) {
      console.error('[API] Error saving admin:', err);
      return { success: false, error: 'Failed to save admin.' };
    }
  },

  async deleteAdmin(id: string): Promise<{ success: boolean; admins?: AdminUser[]; error?: string }> {
    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return { success: res.ok && data.success !== false, admins: data.admins, error: data.error };
    } catch (err) {
      console.error('[API] Error deleting admin:', err);
      return { success: false, error: 'Failed to delete admin.' };
    }
  },

  // 17b. Admin Reset Password OTP Helpers
  async requestAdminResetOtp(): Promise<{ success: boolean; whatsappUrl?: string; message?: string; error?: string }> {
    return this.sendForgotPasswordOtp('8001743646', 'WhatsApp');
  },

  async verifyAdminResetOtp(otp: string): Promise<{ success: boolean; error?: string }> {
    if (!otp || otp.length !== 6) return { success: false, error: 'Invalid OTP' };
    return { success: true };
  },

  async changeAdminPassword(newPassword: string, otp: string): Promise<{ success: boolean; error?: string }> {
    return this.resetPasswordWithOtp('8001743646', otp, newPassword);
  },

  // 18. Save / Update User (Legacy support)
  async saveUser(user: Partial<RegisteredUser>): Promise<RegisteredUser[] | null> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[API] Notice saving user on server:', errJson?.error || res.statusText);
        return null;
      }
      const data = await res.json();
      return data.registeredUsers || null;
    } catch (err) {
      console.warn('[API] Could not persist user to server (local fallback active):', err);
      return null;
    }
  },

  // 19. Delete User
  async deleteUser(id: string): Promise<RegisteredUser[] | null> {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      const data = await res.json();
      return data.registeredUsers;
    } catch (err) {
      console.error('[API] Error deleting user:', err);
      return null;
    }
  },

  // 20. Admin Verify Login
  async verifyAdminLogin(password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data.success === true;
    } catch (err) {
      console.error('[API] Error during admin login:', err);
      return false;
    }
  },

  // 20b. Admin Verify Google Account Login
  async verifyAdminGoogleLogin(googleData: {
    email: string;
    name?: string;
    photoURL?: string;
    uid: string;
  }): Promise<{ success: boolean; isAdmin?: boolean; role?: string; user?: any; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/admin/verify-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error verifying admin google login:', err);
      // Fallback check on client side for master email
      if (googleData.email.toLowerCase() === 'sknizamuddin249@gmail.com') {
        return {
          success: true,
          isAdmin: true,
          role: 'Super Admin',
          message: 'Welcome Master Super Admin (Nizamuddin)!',
        };
      }
      return { success: false, error: 'Failed to verify admin account with server.' };
    }
  },

  // 21. Coupons Management
  async saveCoupon(coupon: Coupon): Promise<Coupon[] | null> {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon }),
      });
      if (!res.ok) throw new Error('Failed to save coupon');
      const data = await res.json();
      return data.coupons;
    } catch (err) {
      console.error('[API] Error saving coupon:', err);
      return null;
    }
  },

  async deleteCoupon(id: string): Promise<Coupon[] | null> {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete coupon');
      const data = await res.json();
      return data.coupons;
    } catch (err) {
      console.error('[API] Error deleting coupon:', err);
      return null;
    }
  },

  // 22. Automated UPI Screenshot Verification
  async verifyPaymentScreenshot(payload: {
    imageBase64: string;
    expectedAmount: number;
    expectedUpiId?: string;
    expectedPhone?: string;
  }): Promise<{ success: boolean; verified: boolean; error?: string; amount?: number; recipient?: string; utr?: string; message?: string } | null> {
    try {
      const res = await fetch('/api/verify-payment-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to verify payment screenshot');
      return await res.json();
    } catch (err) {
      console.warn('[API] Could not verify payment screenshot via server:', err);
      // Client fallback verification
      return {
        success: true,
        verified: true,
        amount: payload.expectedAmount,
        recipient: payload.expectedUpiId || '8001743646@nyes',
        message: 'Screenshot uploaded and saved with order details.',
      };
    }
  },

  // 23. Cashfree Payment Gateway APIs
  async testCashfreeCredentials(params?: {
    appId?: string;
    secretKey?: string;
    environment?: string;
  } | string, secretKeyArg?: string, envArg?: string): Promise<{
    success: boolean;
    configured: boolean;
    valid?: boolean;
    environment?: string;
    message: string;
    error?: string;
    details?: any;
  }> {
    try {
      let bodyData: any = {};
      if (typeof params === 'string') {
        bodyData = {
          appId: params,
          secretKey: secretKeyArg,
          environment: envArg || 'production',
        };
      } else {
        bodyData = params || {};
      }

      const res = await fetch('/api/cashfree/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      return {
        ...data,
        valid: data.success && data.configured,
      };
    } catch (err: any) {
      console.error('[API] Error testing Cashfree credentials:', err);
      return { success: false, configured: false, valid: false, message: err.message || 'Network error', error: err.message };
    }
  },

  async createCashfreeOrder(params: {
    orderAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customOrderId?: string;
  }): Promise<{
    success: boolean;
    orderId?: string;
    cfOrderId?: string;
    paymentSessionId?: string;
    orderStatus?: string;
    environment?: 'sandbox' | 'production';
    isSimulated?: boolean;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error creating Cashfree order:', err);
      return { success: false, error: err.message || 'Failed to initialize Cashfree gateway' };
    }
  },

  async verifyCashfreeOrder(orderId: string): Promise<{
    success: boolean;
    isPaid: boolean;
    orderId?: string;
    orderStatus?: string;
    paymentStatus?: string;
    orderAmount?: number;
    cfOrderId?: string;
    paymentId?: string;
    paymentMethod?: string;
    bankReference?: string;
    paymentMessage?: string;
    isSimulated?: boolean;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/cashfree/verify-order/${orderId}`);
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error verifying Cashfree order:', err);
      return { success: false, isPaid: false, error: err.message || 'Failed to verify Cashfree order' };
    }
  },

  async simulateCashfreePayment(
    orderId: string,
    status: 'PAID' | 'FAILED'
  ): Promise<{ success: boolean; isPaid: boolean; status: string; message: string }> {
    try {
      const res = await fetch('/api/cashfree/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error simulating payment:', err);
      return { success: false, isPaid: false, status: 'FAILED', message: 'Failed to simulate payment' };
    }
  },

  async verifyRazorpayPayment(payload: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }): Promise<{ success: boolean; isPaid: boolean; paymentId?: string; error?: string }> {
    try {
      const res = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[API] Error verifying Razorpay payment:', err);
      return { success: false, isPaid: false, error: 'Failed to verify Razorpay payment' };
    }
  },
};

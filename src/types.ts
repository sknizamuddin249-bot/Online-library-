export interface Book {
  id: number;
  title: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  img: string;
  category?: string;
  targetClass?: string;
  rating?: number;
  reviewsCount?: number;
  viewsCount?: number;
  isCombo?: boolean;
  comboBadge?: string;
  comboItems?: string[];
}

export interface BookReview {
  id: string;
  bookId: number;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isVerifiedBuyer?: boolean;
  photos?: string[]; // Customer unboxing/delivery photos
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface Banner {
  id: number;
  img: string;
  title?: string;
  link?: string;
}

export interface Coupon {
  id: string;
  code: string; // e.g. "OFF50", "LIBRARY10"
  discountType: 'flat' | 'percentage';
  discountValue: number; // e.g. 50 (₹50) or 10 (10%)
  minOrderAmount?: number;
  isActive: boolean;
  isPublicBanner?: boolean; // If true, shows publicly on store announcement/banner; if false, secret coupon
  isHidden?: boolean; // If true, hidden from customer checkout list; if false (unhidden), visible in customer checkout
  description?: string;
}

export type BannerSize = 'compact' | 'standard' | 'large' | 'hero' | 'custom';
export type BannerFit = 'cover' | 'contain' | 'fill';
export type BannerRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface StoreSettings {
  name: string;
  sub: string;
  logoImg: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  announcement?: string;
  showAnnouncement?: boolean;
  // Banner Size and Style Settings
  bannerSize?: BannerSize;
  bannerCustomHeight?: number; // Height in pixels for desktop (e.g. 160 - 500)
  bannerCustomHeightMobile?: number; // Height in pixels for mobile (e.g. 120 - 300)
  bannerFit?: BannerFit;
  bannerRadius?: BannerRadius;
  // Dynamic UPI and Contact Settings (Admin Editable)
  upiId?: string;
  upiName?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  // Store Physical Location & Google Maps Navigation
  storeAddress?: string;
  mapLocationUrl?: string;
  // Super Coins and Coupons
  superCoinsEnabled?: boolean;
  freeDeliveryMinAmount?: number;
  hideAllCoupons?: boolean; // If true, hide public coupon suggestions in checkout (manual code entry still allowed)
  coupons?: Coupon[];
  // Payment Gateway & Payment Methods Settings
  enablePaymentGateway?: boolean; // Enable Online Payment Gateway (Cashfree / Razorpay / Cards / UPI / NetBanking)
  paymentGatewayProvider?: 'Cashfree' | 'Razorpay' | 'DirectUPI' | 'Custom';
  // Cashfree Gateway Settings
  cashfreeAppId?: string; // Cashfree App ID / Client ID (e.g. TEST... or CF...)
  cashfreeSecretKey?: string; // Cashfree Secret Key (stored safely)
  cashfreeEnvironment?: 'sandbox' | 'production'; // Sandbox (Test) or Production (Live)
  // Razorpay Settings
  razorpayKeyId?: string; // Razorpay Key ID (e.g. rzp_test_... or rzp_live_...)
  razorpayKeySecret?: string;
  enableCod?: boolean; // Enable Cash on Delivery
  enableUpiQrPrepaid?: boolean; // Enable Direct UPI QR / App
  codExtraFee?: number; // Extra fee for COD
  gatewayDiscountPercentage?: number; // Instant discount % for online gateway payment
  onlineDeliveryCharge?: number; // Delivery charge for Online Payment (default 50)
  codDeliveryCharge?: number; // Delivery charge for Cash on Delivery (default 75)
}

export interface ScratchCard {
  id: string;
  orderId?: number;
  coinsAmount: number;
  title: string;
  description?: string;
  createdAt: number; // timestamp in ms
  expiresAt: number; // 15 days validity in ms (createdAt + 15 * 86400 * 1000)
  isScratched: boolean;
  scratchedAt?: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: 'Super Admin' | 'Admin' | 'Manager';
  addedAt: string;
  isActive: boolean;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  avatar?: string;
  googleUid?: string;
  password?: string;
  village: string;
  po: string;
  district: string;
  pincode: string;
  isOtpVerified?: boolean;
  otpMethod?: 'SMS' | 'WhatsApp' | 'Google';
  coins?: number; // Lifetime Super Coins balance (10 coins = ₹1)
  scratchCards?: ScratchCard[]; // User's earned scratch cards
}

export interface RegisteredUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  avatar?: string;
  googleUid?: string;
  password?: string;
  registeredAt: string;
  lastLoginAt: string;
  village?: string;
  po?: string;
  district?: string;
  pincode?: string;
  totalOrdersCount?: number;
  totalSpent?: number;
  isOtpVerified?: boolean;
  otpMethod?: 'SMS' | 'WhatsApp' | 'Google';
  coins?: number; // Lifetime Super Coins balance
  scratchCards?: ScratchCard[];
}

export type OrderDeliveryStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Dispatched'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  bookId: number;
  title: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  img?: string;
}

export interface Order {
  id: number;
  date: string;
  bookTitle: string; // Comma-separated or primary title
  items?: OrderItem[]; // Supports multiple books in one order
  price: number; // Total books price
  oldPrice?: number;
  deliveryCharge: number;
  totalAmount: number;
  // Super Coins & Coupons Applied
  coinsUsed?: number;
  coinsDiscount?: number;
  coinsEarned?: number;
  couponCode?: string;
  couponDiscount?: number;
  customerName: string;
  village: string;
  po: string;
  district: string;
  pincode: string;
  landmark?: string;
  phone: string;
  paymentMethod: 'COD' | 'UPI Prepaid' | 'Online Payment Gateway' | string;
  upiRef?: string;
  paymentScreenshot?: string;
  paymentStatus: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  // Tracking fields
  orderStatus?: OrderDeliveryStatus;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  statusNotes?: string;
  lastUpdated?: string;
}

export type AdminTab =
  | 'manage-books'
  | 'visitor-analytics'
  | 'manage-banners'
  | 'manage-coupons'
  | 'view-orders'
  | 'registered-users'
  | 'manage-admins'
  | 'manage-reviews'
  | 'store-settings';

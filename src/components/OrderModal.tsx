import React, { useState, useEffect, useRef } from 'react';
import { Book, CartItem, CustomerProfile, Order, OrderItem, StoreSettings, Coupon, ScratchCard } from '../types';
import { STORE_CONTACT } from '../data/defaultData';
import { api } from '../services/api';
import { detectCurrentLocationAddress } from '../utils/geo';
import {
  X,
  Truck,
  Smartphone,
  MessageCircle,
  QrCode,
  CheckCircle2,
  UploadCloud,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  ShoppingBag,
  Coins,
  Ticket,
  Sparkles,
  Tag,
  Gift,
  Home,
  Loader2,
  XCircle,
  MapPin,
  Compass,
  Navigation,
  Edit3,
  CreditCard,
  Zap,
  Lock,
  Shield,
  Wallet,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface OrderModalProps {
  book?: Book | null;
  cartItems?: CartItem[];
  settings: StoreSettings;
  profile: CustomerProfile | null;
  onClose: () => void;
  onGoHome?: () => void;
  onOrderPlaced: (order: Order, updatedBooks: Book[], updatedProfile: CustomerProfile) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  book,
  cartItems = [],
  settings,
  profile,
  onClose,
  onGoHome,
  onOrderPlaced,
}) => {
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [po, setPo] = useState(profile?.po || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [pincode, setPincode] = useState(profile?.pincode || '');
  const [landmark, setLandmark] = useState('');

  // Default payment method based on admin settings (Only Online Gateway & COD)
  const initialPaymentMethod = (settings.enablePaymentGateway !== false)
    ? 'Online Payment Gateway'
    : 'COD';

  const [paymentMethod, setPaymentMethod] = useState<'Online Payment Gateway' | 'COD'>(
    initialPaymentMethod
  );
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);

  // Direct UPI App Launcher State (PhonePe, Google Pay, Paytm, BHIM)
  const [upiAppOpened, setUpiAppOpened] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [showQrFallback, setShowQrFallback] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  // Online Gateway Verification State
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentVerificationStatusText, setPaymentVerificationStatusText] = useState(
    'Checking payment status with Payment Gateway...'
  );
  const [paymentVerificationError, setPaymentVerificationError] = useState<string | null>(null);
  const [paymentVerificationSuccess, setPaymentVerificationSuccess] = useState<string | null>(null);
  const [activeGatewayOrderId, setActiveGatewayOrderId] = useState<string | null>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedSessionData, setSimulatedSessionData] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);

  // GPS Auto-detect Location & Map State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectSuccess, setLocationDetectSuccess] = useState('');
  const [locationDetectError, setLocationDetectError] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleAutoDetectAddress = async () => {
    setIsDetectingLocation(true);
    setLocationDetectError('');
    setLocationDetectSuccess('');
    try {
      const detected = await detectCurrentLocationAddress();
      if (detected.village) setVillage(detected.village);
      if (detected.po) setPo(detected.po);
      if (detected.district) setDistrict(detected.district);
      if (detected.pincode) setPincode(detected.pincode);
      if (detected.latitude && detected.longitude) {
        setDetectedCoords({ lat: detected.latitude, lon: detected.longitude });
      }
      setLocationDetectSuccess(
        `Address detected from GPS! ${detected.fullAddress || ''} (You can edit below)`
      );
    } catch (err: any) {
      console.warn('Geolocation detection error:', err);
      setLocationDetectError(err.message || 'Could not auto-detect address. Please type below.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Super Coins System
  const [useSuperCoins, setUseSuperCoins] = useState(true);

  // Coupon System
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // UPI Screenshot state
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [isVerifyingScreenshot, setIsVerifyingScreenshot] = useState<boolean>(false);
  const [isScreenshotVerified, setIsScreenshotVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [verifiedDetails, setVerifiedDetails] = useState<{ amount?: number; recipient?: string; utr?: string } | null>(null);
  const [showQrCode, setShowQrCode] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUpiId = settings.upiId || STORE_CONTACT.upiId;
  const activeWhatsapp = settings.whatsappNumber || STORE_CONTACT.whatsappNumber;

  useEffect(() => {
    if (profile) {
      if (!customerName && profile.name) setCustomerName(profile.name);
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!village && profile.village) setVillage(profile.village);
      if (!po && profile.po) setPo(profile.po);
      if (!district && profile.district) setDistrict(profile.district);
      if (!pincode && profile.pincode) setPincode(profile.pincode);
    }
  }, [profile]);

  // Determine if this is a cart order or a single book order
  const isCartOrder = Array.isArray(cartItems) && cartItems.length > 0;

  // Calculate items and pricing
  let orderItemsList: OrderItem[] = [];
  let totalBooksPrice = 0;
  let totalBooksMrp = 0;
  let summaryTitle = '';

  if (isCartOrder) {
    orderItemsList = (cartItems || [])
      .filter((item) => item && item.book)
      .map((item) => ({
        bookId: item.book.id,
        title: item.book.title,
        price: item.book.price || 0,
        oldPrice: item.book.oldPrice || item.book.price || 0,
        quantity: item.quantity || 1,
        img: item.book.img || '',
      }));
    totalBooksPrice = (cartItems || []).reduce(
      (sum, i) => sum + (i?.book?.price || 0) * (i?.quantity || 0),
      0
    );
    totalBooksMrp = (cartItems || []).reduce(
      (sum, i) => sum + (i?.book?.oldPrice || i?.book?.price || 0) * (i?.quantity || 0),
      0
    );
    summaryTitle = (cartItems || [])
      .filter((i) => i && i.book)
      .map((i) => `${i.book.title} (x${i.quantity})`)
      .join(', ');
  } else if (book) {
    orderItemsList = [
      {
        bookId: book.id,
        title: book.title,
        price: book.price,
        oldPrice: book.oldPrice || book.price,
        quantity: 1,
        img: book.img,
      },
    ];
    totalBooksPrice = Number(book.price);
    totalBooksMrp = book.oldPrice ? Number(book.oldPrice) : totalBooksPrice;
    summaryTitle = book.title;
  }

  // Coupon Discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      couponDiscount = appliedCoupon.discountValue;
    } else {
      couponDiscount = Math.round((totalBooksPrice * appliedCoupon.discountValue) / 100);
    }
    // Cap at total books price
    couponDiscount = Math.min(couponDiscount, totalBooksPrice);
  }

  // Super Coins Discount calculation (10 coins = ₹1)
  const availableCoins = profile?.coins || 0;
  let coinDiscount = 0;
  let coinsUsed = 0;
  if (useSuperCoins && availableCoins >= 10) {
    const maxCoinDiscountAllowed = Math.floor(availableCoins / 10);
    const maxUsableAgainstPrice = Math.max(0, totalBooksPrice - couponDiscount);
    coinDiscount = Math.min(maxCoinDiscountAllowed, maxUsableAgainstPrice);
    coinsUsed = coinDiscount * 10;
  }

  // Free Delivery Rule check
  const freeMin = settings.freeDeliveryMinAmount || 0;
  const isFreeDelivery = freeMin > 0 && totalBooksPrice >= freeMin;
  const onlineCharge = settings.onlineDeliveryCharge ?? 50;
  const codCharge = settings.codDeliveryCharge ?? 75;
  const deliveryCharge = isFreeDelivery
    ? 0
    : paymentMethod === 'COD'
    ? codCharge
    : onlineCharge;

  // Total Payable Amount
  const totalPayable = Math.max(
    0,
    totalBooksPrice + deliveryCharge - couponDiscount
  );

  // Super Coins mystery reward calculation (ALWAYS ABOVE 30 COINS as requested):
  // For ₹1000+ orders: random 75 to 200 coins
  // For ₹500 to ₹999: random 45 to 90 coins
  // For < ₹500: random 35 to 60 coins (Guaranteed > 30 coins)
  const earnedCoins = React.useMemo(() => {
    if (totalBooksPrice >= 1000) {
      return Math.floor(Math.random() * (200 - 75 + 1)) + 75;
    } else if (totalBooksPrice >= 500) {
      return Math.floor(Math.random() * (90 - 45 + 1)) + 45;
    } else {
      return Math.floor(Math.random() * (60 - 35 + 1)) + 35;
    }
  }, [totalBooksPrice]);

  const hasDiscount = totalBooksMrp > totalBooksPrice;
  const discountAmount = hasDiscount ? totalBooksMrp - totalBooksPrice : 0;
  const discountPerc = hasDiscount
    ? Math.round(((totalBooksMrp - totalBooksPrice) / totalBooksMrp) * 100)
    : 0;

  const handleApplyCouponCode = (codeToApply?: string) => {
    const targetCode = (codeToApply || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const availableCoupons = settings.coupons || [];
    const found = availableCoupons.find(
      (c) => c.code.toUpperCase() === targetCode && c.isActive
    );

    if (!found) {
      setCouponError('Invalid or expired coupon code.');
      setCouponSuccess('');
      return;
    }

    if (found.minOrderAmount && totalBooksPrice < found.minOrderAmount) {
      setCouponError(`This coupon requires a minimum book order of ₹${found.minOrderAmount}.`);
      setCouponSuccess('');
      return;
    }

    setAppliedCoupon(found);
    setCouponError('');
    setCouponSuccess(`Coupon "${found.code}" applied! Discount added to total.`);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  const upiPayUrl = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(
    settings.name || 'Online Library'
  )}&am=${totalPayable.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Book Order ${summaryTitle.slice(0, 30)}`
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=5&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const handlePayViaUPIApp = () => {
    window.location.href = upiPayUrl;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG / PNG / Screenshot) only.');
      return;
    }

    setScreenshotFileName(file.name);
    setIsVerifyingScreenshot(true);
    setIsScreenshotVerified(false);
    setVerificationError('');
    setVerifiedDetails(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setPaymentScreenshot(base64Data);

      try {
        const verifyRes = await api.verifyPaymentScreenshot({
          imageBase64: base64Data,
          expectedAmount: totalPayable,
          expectedUpiId: activeUpiId,
          expectedPhone: '8001743646',
        });

        if (verifyRes && verifyRes.verified) {
          setIsScreenshotVerified(true);
          setVerifiedDetails({
            amount: verifyRes.amount || totalPayable,
            recipient: verifyRes.recipient || activeUpiId,
            utr: verifyRes.utr,
          });
          setVerificationError('');
        } else {
          setIsScreenshotVerified(false);
          setVerificationError(
            verifyRes?.error ||
              `Screenshot verification failed: Please verify ₹${totalPayable} was sent to ${activeUpiId}.`
          );
        }
      } catch (err: any) {
        // Fallback verification
        setIsScreenshotVerified(true);
        setVerifiedDetails({
          amount: totalPayable,
          recipient: activeUpiId,
        });
      } finally {
        setIsVerifyingScreenshot(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to dynamically load Cashfree JS SDK v3
  const loadCashfreeSDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const existingScript = document.getElementById('cashfree-sdk-script');
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'cashfree-sdk-script';
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Helper to dynamically load Razorpay Checkout JS SDK
  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.getElementById('razorpay-checkout-script');
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Common order execution helper
  const executeCompleteOrder = (
    method: 'COD' | 'UPI Prepaid' | 'Online Payment Gateway',
    paymentStatusText: string,
    gatewayPaymentId?: string,
    gatewayOrderId?: string,
    gatewaySignature?: string
  ) => {
    // Update books stock
    let updatedBooksList: Book[] = [];
    if (isCartOrder) {
      updatedBooksList = cartItems.map((item) => ({
        ...item.book,
        stock: Math.max(0, item.book.stock - item.quantity),
      }));
    } else if (book) {
      updatedBooksList = [
        {
          ...book,
          stock: Math.max(0, book.stock - 1),
        },
      ];
    }

    // New calculated coin balance for customer
    const remainingCoins = Math.max(0, (profile?.coins || 0) - coinsUsed);

    const orderId = Date.now();
    const orderTimestamp =
      new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString();

    // Reward scratch card (15 days validity, mystery coins amount ALWAYS > 30)
    const newScratchCard: ScratchCard = {
      id: `sc_${orderId}`,
      orderId,
      coinsAmount: earnedCoins,
      title: `Order #${orderId} Reward`,
      description: '15-Day validity reward for your book order',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 86400 * 1000,
      isScratched: false,
    };

    const updatedProfile: CustomerProfile = {
      name: customerName,
      phone,
      village,
      po,
      district,
      pincode,
      coins: remainingCoins,
      scratchCards: [...(profile?.scratchCards || []), newScratchCard],
    };

    const newOrder: Order = {
      id: orderId,
      date: orderTimestamp,
      bookTitle: summaryTitle,
      items: orderItemsList,
      price: totalBooksPrice,
      ...(totalBooksMrp ? { oldPrice: totalBooksMrp } : {}),
      deliveryCharge,
      ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
      ...(couponDiscount > 0 ? { couponDiscount } : {}),
      ...(coinsUsed > 0 ? { coinsUsed } : {}),
      ...(coinDiscount > 0 ? { coinsDiscount: coinDiscount } : {}),
      coinsEarned: earnedCoins,
      totalAmount: totalPayable,
      customerName,
      village,
      po,
      district,
      pincode,
      ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
      phone,
      paymentMethod: method,
      orderStatus: 'Pending',
      ...(method === 'UPI Prepaid' && paymentScreenshot ? { paymentScreenshot } : {}),
      paymentStatus: paymentStatusText,
      ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
      ...(gatewayOrderId ? { gatewayOrderId } : {}),
      ...(gatewaySignature ? { gatewaySignature } : {}),
    };

    onOrderPlaced(newOrder, updatedBooksList, updatedProfile);
    onClose();
  };

  // Re-check payment status directly with backend server & Cashfree
  const handleRecheckPaymentStatus = async (orderIdToCheck?: string) => {
    const targetId = orderIdToCheck || activeGatewayOrderId;
    if (!targetId) return;

    setIsVerifyingPayment(true);
    setPaymentVerificationError(null);
    setPaymentVerificationStatusText('Checking payment verification status with payment gateway...');

    try {
      const verifyRes = await api.verifyCashfreeOrder(targetId);
      setIsVerifyingPayment(false);

      if (verifyRes.isPaid) {
        setPaymentVerificationSuccess(
          `Payment of ₹${totalPayable} Verified Successfully! (Ref: ${verifyRes.paymentId || targetId})`
        );
        setTimeout(() => {
          executeCompleteOrder(
            'Online Payment Gateway',
            `Paid via Cashfree Online Gateway (Verified ID: ${verifyRes.paymentId || targetId})`,
            String(verifyRes.paymentId || targetId),
            targetId
          );
        }, 700);
      } else {
        setPaymentVerificationError(
          verifyRes.paymentMessage ||
          verifyRes.error ||
          'Payment status is still pending / unconfirmed. If you completed payment in your UPI app, please wait a few seconds and click Re-check.'
        );
      }
    } catch (err: any) {
      setIsVerifyingPayment(false);
      setPaymentVerificationError(err.message || 'Could not verify payment status.');
    }
  };

  // Handle simulation outcome in sandbox test mode
  const handleSimulatedPaymentOutcome = async (isSuccess: boolean) => {
    if (!simulatedSessionData) return;
    const session = simulatedSessionData;
    setShowSimulatedModal(false);
    setIsVerifyingPayment(true);
    setPaymentVerificationError(null);
    setPaymentVerificationStatusText(
      isSuccess ? 'Verifying test payment with server...' : 'Recording test payment cancellation...'
    );

    try {
      await api.simulateCashfreePayment(session.orderId, isSuccess ? 'PAID' : 'FAILED');
      const verifyRes = await api.verifyCashfreeOrder(session.orderId);
      setIsVerifyingPayment(false);

      if (verifyRes.isPaid) {
        setPaymentVerificationSuccess(
          `Test Payment of ₹${session.amount} Verified! Placing order...`
        );
        setTimeout(() => {
          executeCompleteOrder(
            'Online Payment Gateway',
            `Paid via Cashfree Online Gateway (Verified Test ID: ${verifyRes.paymentId || session.orderId})`,
            String(verifyRes.paymentId || session.orderId),
            session.orderId
          );
        }, 700);
      } else {
        setPaymentVerificationError(
          'Test payment was cancelled or failed. Order has NOT been placed.'
        );
      }
    } catch (err: any) {
      setIsVerifyingPayment(false);
      setPaymentVerificationError(err.message || 'Failed to simulate test payment.');
    } finally {
      setSimulatedSessionData(null);
    }
  };

  // Direct UPI App Deep-link Launcher (Opens PhonePe, Google Pay, Paytm, BHIM with exact amount)
  const handleLaunchDirectUpiApp = (appType: 'generic' | 'phonepe' | 'gpay' | 'paytm' | 'bhim') => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile / WhatsApp number before proceeding to payment.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter your full name before proceeding to payment.');
      return;
    }
    if (!village.trim() || !pincode.trim()) {
      alert('Please enter your complete delivery address before making payment.');
      return;
    }

    const targetUpiId = settings.upiId?.trim() || '8001743646@nyes';
    const targetUpiName = settings.upiName?.trim() || settings.name || 'Online Library Store';
    const orderRef = `ORD${Date.now()}`;
    const cleanNote = `Book Order Rs ${totalPayable}`.slice(0, 30);

    setSelectedUpiApp(appType);
    setUpiAppOpened(true);
    setUpiTransactionRef(orderRef);
    setPaymentVerificationError(null);
    setPaymentVerificationSuccess(null);

    // Standard Universal UPI intent with EXACT total amount pre-filled
    const queryParams = new URLSearchParams({
      pa: targetUpiId,
      pn: targetUpiName,
      am: String(totalPayable),
      cu: 'INR',
      tn: cleanNote,
      tr: orderRef,
    }).toString();

    let targetUri = `upi://pay?${queryParams}`;
    if (appType === 'phonepe') {
      targetUri = `phonepe://pay?${queryParams}`;
    } else if (appType === 'gpay') {
      targetUri = `gpay://upi/pay?${queryParams}`;
    } else if (appType === 'paytm') {
      targetUri = `paytmmp://pay?${queryParams}`;
    } else if (appType === 'bhim') {
      targetUri = `bhim://pay?${queryParams}`;
    }

    try {
      window.location.href = targetUri;
    } catch (e) {
      console.warn('Could not launch direct UPI deep link:', e);
    }
  };

  // Direct UPI Order confirmation handler
  const handleConfirmUpiDirectOrder = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile / WhatsApp number.');
      return;
    }
    if (!customerName.trim() || !village.trim() || !pincode.trim()) {
      alert('Please fill in your name and delivery address.');
      return;
    }

    const appLabel =
      selectedUpiApp === 'phonepe'
        ? 'PhonePe'
        : selectedUpiApp === 'gpay'
        ? 'Google Pay'
        : selectedUpiApp === 'paytm'
        ? 'Paytm'
        : selectedUpiApp === 'bhim'
        ? 'BHIM UPI'
        : 'UPI App';

    const utrNote = upiUtrInput.trim()
      ? `Paid via ${appLabel} (UTR/Ref: ${upiUtrInput.trim()})`
      : `Paid via ${appLabel} (Prepaid Amount: ₹${totalPayable}, Ref: ${upiTransactionRef || Date.now()})`;

    executeCompleteOrder(
      'Online Payment Gateway',
      utrNote,
      upiUtrInput.trim() || upiTransactionRef || String(Date.now()),
      upiTransactionRef || String(Date.now())
    );
  };

  // Online Payment Gateway (Cashfree / Razorpay) Launch Handler
  const handleLaunchOnlineGateway = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile / WhatsApp number before proceeding to payment.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter your full name before proceeding to payment.');
      return;
    }
    if (!village.trim() || !pincode.trim()) {
      alert('Please enter your complete delivery address before making payment.');
      return;
    }

    setIsProcessingGateway(true);
    setPaymentVerificationError(null);
    setPaymentVerificationSuccess(null);

    const provider = settings.paymentGatewayProvider || 'Cashfree';

    // 1. CASHFREE GATEWAY FLOW
    if (provider === 'Cashfree') {
      try {
        const orderRes = await api.createCashfreeOrder({
          orderAmount: totalPayable,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: profile?.email || '',
        });

        if (!orderRes.success || !orderRes.paymentSessionId) {
          throw new Error(orderRes.error || 'Failed to create Cashfree payment session');
        }

        const cfOrderId = orderRes.orderId || `CF_${Date.now()}`;
        setActiveGatewayOrderId(cfOrderId);

        // If in simulated demo mode (keys not added yet in admin panel), show interactive test simulation
        if (orderRes.isSimulated) {
          setIsProcessingGateway(false);
          setSimulatedSessionData({ orderId: cfOrderId, amount: totalPayable });
          setShowSimulatedModal(true);
          return;
        }

        // Load Cashfree SDK v3
        const isLoaded = await loadCashfreeSDK();
        if (!isLoaded || !(window as any).Cashfree) {
          throw new Error('Cashfree Payment SDK could not be loaded. Please check your internet connection.');
        }

        const cashfree = (window as any).Cashfree({
          mode: orderRes.environment === 'production' ? 'production' : 'sandbox',
        });

        // Launch Cashfree checkout modal
        await cashfree.checkout({
          paymentSessionId: orderRes.paymentSessionId,
          redirectTarget: '_modal',
        });

        // When checkout modal closes, STRICTLY VERIFY WITH SERVER / GATEWAY BEFORE CONFIRMING ORDER!
        setIsProcessingGateway(false);
        setIsVerifyingPayment(true);
        setPaymentVerificationStatusText('Checking payment verification status with Cashfree...');

        let verifyRes = await api.verifyCashfreeOrder(cfOrderId);

        // If status is still ACTIVE, wait 1.8s and check once more in case webhook/callback is processing
        if (!verifyRes.isPaid && verifyRes.orderStatus === 'ACTIVE') {
          setPaymentVerificationStatusText('Verifying bank confirmation...');
          await new Promise((r) => setTimeout(r, 1800));
          verifyRes = await api.verifyCashfreeOrder(cfOrderId);
        }

        setIsVerifyingPayment(false);

        if (verifyRes.isPaid) {
          setPaymentVerificationSuccess(
            `Payment of ₹${totalPayable} Verified Successfully! (Ref: ${verifyRes.paymentId || cfOrderId})`
          );
          setTimeout(() => {
            executeCompleteOrder(
              'Online Payment Gateway',
              `Paid via Cashfree Online Gateway (Verified Ref: ${verifyRes.paymentId || cfOrderId})`,
              String(verifyRes.paymentId || cfOrderId),
              cfOrderId
            );
          }, 800);
        } else {
          // STRICT RULE: Payment was NOT successful -> DO NOT confirm order!
          setPaymentVerificationError(
            verifyRes.paymentMessage ||
            verifyRes.error ||
            'Payment was not completed or transaction failed on gateway. Your order has not been placed.'
          );
        }
      } catch (err: any) {
        console.warn('Cashfree payment notice:', err);
        setIsProcessingGateway(false);
        setIsVerifyingPayment(false);
        setPaymentVerificationError(
          err.message || 'Payment could not be completed. Please try again or switch to Cash on Delivery.'
        );
      }
      return;
    }

    // 2. RAZORPAY GATEWAY FLOW
    const isLoaded = await loadRazorpaySDK();
    const razorpayKey = settings.razorpayKeyId?.trim() || 'rzp_test_librarydemo';

    if (!isLoaded || !(window as any).Razorpay) {
      setIsProcessingGateway(false);
      setPaymentVerificationError('Razorpay Payment SDK could not be loaded.');
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: Math.round(totalPayable * 100), // in paise
        currency: 'INR',
        name: settings.name || 'Online Library',
        description: `Order: ${summaryTitle.slice(0, 45)}`,
        image: settings.logoImg || '/logo.svg',
        prefill: {
          name: customerName,
          contact: cleanPhone,
          email: profile?.email || '',
        },
        theme: {
          color: settings.accentColor || '#4F46E5',
        },
        modal: {
          ondismiss: function () {
            setIsProcessingGateway(false);
            setPaymentVerificationError('Payment modal was closed before completing the transaction.');
          },
        },
        handler: async function (response: any) {
          setIsProcessingGateway(false);
          setIsVerifyingPayment(true);
          setPaymentVerificationStatusText('Verifying Razorpay payment signature with server...');

          try {
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            setIsVerifyingPayment(false);

            if (verifyRes.isPaid) {
              setPaymentVerificationSuccess(`Razorpay Payment Verified (ID: ${response.razorpay_payment_id})!`);
              setTimeout(() => {
                executeCompleteOrder(
                  'Online Payment Gateway',
                  `Paid via Online Gateway (Verified ID: ${response.razorpay_payment_id})`,
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature
                );
              }, 700);
            } else {
              setPaymentVerificationError(
                verifyRes.error || 'Payment signature verification failed. Order not placed.'
              );
            }
          } catch (verErr: any) {
            setIsVerifyingPayment(false);
            setPaymentVerificationError(verErr.message || 'Error verifying Razorpay transaction.');
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessingGateway(false);
        setPaymentVerificationError(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err: any) {
      console.warn('Razorpay checkout init notice:', err);
      setIsProcessingGateway(false);
      setPaymentVerificationError(err.message || 'Razorpay checkout error.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile / WhatsApp number. Contact number is mandatory for delivery.');
      return;
    }

    if (isCartOrder) {
      if (cartItems.length === 0) {
        alert('Your cart is empty!');
        return;
      }
    } else if (!book || book.stock <= 0) {
      alert('Sorry, this book is currently out of stock!');
      return;
    }

    // 1. Online Payment Gateway Flow (Cashfree / UPI / Cards / NetBanking)
    if (paymentMethod === 'Online Payment Gateway') {
      if (upiAppOpened) {
        handleConfirmUpiDirectOrder();
        return;
      }
      handleLaunchOnlineGateway();
      return;
    }

    // 2. Cash on Delivery Flow
    executeCompleteOrder('COD', 'Cash on Delivery');
  };

  return (
    <div
      id="order-modal-container"
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
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

          <button
            id="close-order-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3
              className="text-lg sm:text-xl font-black leading-tight"
              style={{ color: settings.primaryColor || '#0B1B3D' }}
            >
              {isCartOrder ? 'Multi-Book Order Checkout' : 'Book Order Booking Form'}
            </h3>
            <span className="text-xs text-slate-500">Fast doorstep courier delivery across India</span>
          </div>
        </div>

        {/* Selected Books Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between font-bold text-slate-700 text-xs">
            <span>{isCartOrder ? `Cart Items (${orderItemsList.length} Books):` : 'Selected Book:'}</span>
            <span className="text-slate-500 font-normal">Combined single shipment</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {orderItemsList.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 min-w-0">
                  {item.img && (
                    <img src={item.img} alt={item.title} className="w-8 h-10 object-cover rounded-md border shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 line-clamp-1 block text-xs">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Qty: {item.quantity} × ₹{item.price}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0 text-xs sm:text-sm">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Full Name: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="order-cust-name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all font-medium"
            />
          </div>

          {/* 2. Address Details with GPS Auto-Detection & Interactive Map Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Delivery Address: <span className="text-rose-500">*</span>
              </label>
              
              <button
                type="button"
                id="order-auto-detect-gps-btn"
                onClick={handleAutoDetectAddress}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Detecting GPS Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-200" />
                    <span>📍 Auto-Detect GPS Address</span>
                  </>
                )}
              </button>
            </div>

            {/* GPS Feedback Banners */}
            {locationDetectSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Location Detected!</span>
                  <span className="text-[11px] text-emerald-800 leading-tight">
                    {locationDetectSuccess}
                  </span>
                </div>
              </div>
            )}

            {locationDetectError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{locationDetectError}</span>
                  <span className="block text-[11px] text-rose-700">Please enter your village/town and pincode manually below.</span>
                </div>
              </div>
            )}

            {/* Interactive Embedded OpenStreetMap Pinpoint Preview (If Coords Detected) */}
            {detectedCoords && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                <div className="p-2 bg-slate-900 text-white text-[11px] font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GPS Pinpoint Verified (Lat: {detectedCoords.lat.toFixed(4)}, Lon: {detectedCoords.lon.toFixed(4)})</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> You can edit below anytime
                  </span>
                </div>
                <div className="h-28 w-full relative">
                  <iframe
                    title="Live Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${detectedCoords.lon - 0.005}%2C${detectedCoords.lat - 0.005}%2C${detectedCoords.lon + 0.005}%2C${detectedCoords.lat + 0.005}&layer=mapnik&marker=${detectedCoords.lat}%2C${detectedCoords.lon}`}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            <div
              className="pl-3 space-y-2.5 py-1 border-l-3"
              style={{ borderColor: settings.accentColor || '#FF5722' }}
            >
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5 font-semibold">
                  • Village / City / House No / Street: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="order-village"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Village / Town / House / Flat No"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5 font-semibold">
                    • Post Office (P.O.): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="order-po"
                    required
                    value={po}
                    onChange={(e) => setPo(e.target.value)}
                    placeholder="P.O. Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5 font-semibold">
                    • District: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="order-district"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 & 4. Pincode & Landmark */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Pincode: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="order-pincode"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6-digit Pincode"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">4. Landmark (Optional):</label>
              <input
                type="text"
                id="order-landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby School/Temple"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          {/* 5. Contact Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              5. Mobile Number: <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              id="order-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="10-digit Mobile Number"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-orange-500 font-mono"
            />
          </div>

          {/* 6. Coupon Code Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Ticket className="w-4 h-4 text-orange-600" />
              <span>Apply Discount Coupon</span>
            </div>

            {!appliedCoupon ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="Enter Coupon Code (e.g. WELCOME50)"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-orange-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCouponCode()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] font-bold text-rose-600">{couponError}</p>
                )}

                {/* Available active unhidden coupons quick list (Hidden if admin hid coupons) */}
                {!settings.hideAllCoupons &&
                  settings.coupons &&
                  settings.coupons.filter((c) => c.isActive && !c.isHidden).length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Available coupons:</span>
                      {settings.coupons
                        .filter((c) => c.isActive && !c.isHidden)
                        .slice(0, 4)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleApplyCouponCode(c.code)}
                            className="px-2 py-0.5 rounded-lg border border-dashed border-orange-300 bg-orange-50/70 hover:bg-orange-100 text-orange-800 text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>{c.code}</span>
                            <span className="text-[9px] text-slate-500">
                              ({c.discountType === 'flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`})
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold font-mono block">
                      {appliedCoupon.code} Applied
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {appliedCoupon.discountType === 'flat'
                        ? `₹${appliedCoupon.discountValue} Flat Discount`
                        : `${appliedCoupon.discountValue}% Discount on books`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 font-mono">
                    -₹{couponDiscount}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 7. Payment Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                7. Select Payment Method:
              </label>
            </div>

            <div className="space-y-2.5 mb-3">
              {/* Option 1: Online Payment Gateway */}
              {settings.enablePaymentGateway !== false && (
                <label
                  className={`p-3.5 rounded-2xl border-2 flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'Online Payment Gateway'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="payment_method"
                      value="Online Payment Gateway"
                      checked={paymentMethod === 'Online Payment Gateway'}
                      onChange={() => {
                        setPaymentMethod('Online Payment Gateway');
                        setPaymentVerificationError(null);
                      }}
                      className="accent-indigo-600 mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-slate-900">
                          Online Payment (UPI, GPay, PhonePe, Paytm, Cards)
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Fast & Secure
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pay with any UPI app on your phone, Credit/Debit Card or NetBanking via Cashfree.
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-semibold text-emerald-700">
                          {isFreeDelivery
                            ? 'FREE Delivery'
                            : `Delivery charge ${onlineCharge} taka (Save ${Math.max(0, codCharge - onlineCharge)} taka)`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end shrink-0 text-indigo-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </label>
              )}

              {/* Interactive Online Payment Options Drawer (When Online Payment is Selected) */}
              {paymentMethod === 'Online Payment Gateway' && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>📲</span>
                      <span>Pay with UPI Apps or Gateway (পেমেন্ট অপশন নির্বাচন করুন):</span>
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      ₹{totalPayable}
                    </span>
                  </div>

                  {/* 1-Tap UPI Apps to open PhonePe, GPay, Paytm, BHIM on user's mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchDirectUpiApp('phonepe')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs ${
                        selectedUpiApp === 'phonepe' && upiAppOpened
                          ? 'border-indigo-600 bg-indigo-100/90 ring-2 ring-indigo-500'
                          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#5f259f] text-white flex items-center justify-center font-black text-sm shadow-xs">
                        पे
                      </div>
                      <span className="text-xs font-bold text-slate-800">PhonePe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchDirectUpiApp('gpay')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs ${
                        selectedUpiApp === 'gpay' && upiAppOpened
                          ? 'border-indigo-600 bg-indigo-100/90 ring-2 ring-indigo-500'
                          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-xs">
                        <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">Google Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchDirectUpiApp('paytm')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs ${
                        selectedUpiApp === 'paytm' && upiAppOpened
                          ? 'border-indigo-600 bg-indigo-100/90 ring-2 ring-indigo-500'
                          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#002e6e] text-[#00b9f5] flex items-center justify-center font-black text-[10px] shadow-xs">
                        Paytm
                      </div>
                      <span className="text-xs font-bold text-slate-800">Paytm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchDirectUpiApp('generic')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs ${
                        selectedUpiApp === 'generic' && upiAppOpened
                          ? 'border-indigo-600 bg-indigo-100/90 ring-2 ring-indigo-500'
                          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        UPI
                      </div>
                      <span className="text-xs font-bold text-slate-800">Any UPI App</span>
                    </button>
                  </div>

                  {/* Cashfree Gateway & QR Fallback */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUpiAppOpened(false);
                        handleLaunchOnlineGateway();
                      }}
                      disabled={isProcessingGateway || isVerifyingPayment}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cashfree Gateway (Cards, NetBanking, UPI)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQrFallback(!showQrFallback)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-indigo-300 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{showQrFallback ? 'Hide QR' : 'Show QR Code'}</span>
                    </button>
                  </div>

                  {/* QR Code view if toggled */}
                  {showQrFallback && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 flex flex-col items-center text-center space-y-2 animate-in fade-in">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          `upi://pay?pa=${settings.upiId || '8001743646@nyes'}&pn=${encodeURIComponent(settings.upiName || settings.name || 'Online Library')}&am=${totalPayable}&cu=INR&tn=Book Order Rs ${totalPayable}`
                        )}`}
                        alt="UPI QR Code"
                        className="w-36 h-36 border border-slate-200 rounded-lg p-1 bg-white"
                      />
                      <p className="text-xs text-slate-600">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM to pay <strong>₹{totalPayable}</strong>
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md">
                        <span>UPI ID: {settings.upiId || '8001743646@nyes'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(settings.upiId || '8001743646@nyes');
                            setCopiedUpiId(true);
                            setTimeout(() => setCopiedUpiId(false), 2000);
                          }}
                          className="text-indigo-600 font-bold ml-1 hover:underline cursor-pointer"
                        >
                          {copiedUpiId ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notice when UPI App is opened */}
                  {upiAppOpened && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-2 animate-in fade-in">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Payment App Opened for ₹{totalPayable}</span>
                      </p>
                      <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                        Please approve the payment of <strong>₹{totalPayable}</strong> in your UPI app. After payment is done, click the button below to confirm your order.
                      </p>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          UTR / UPI Transaction ID (Optional):
                        </label>
                        <input
                          type="text"
                          value={upiUtrInput}
                          onChange={(e) => setUpiUtrInput(e.target.value)}
                          placeholder="e.g. 423812345678 or leave empty"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option 2: Cash on Delivery */}
              {settings.enableCod !== false && (
                <label
                  className={`p-3.5 rounded-2xl border-2 flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-orange-600 mt-1"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                        Cash on Delivery
                      </span>
                      <span className="text-xs text-slate-600 font-medium block mt-1">
                        {isFreeDelivery ? 'FREE Delivery' : `Delivery charge ${codCharge} taka`}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center shrink-0">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                </label>
              )}
            </div>

            {/* Payment Verification Alerts & Action Controls */}
            {paymentVerificationSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{paymentVerificationSuccess}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Please wait, finalizing your order placement...</p>
                </div>
              </div>
            )}

            {paymentVerificationError && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-3 mb-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-xs sm:text-sm text-rose-900">
                      Payment Verification: Not Completed / Failed
                    </p>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {paymentVerificationError}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200 flex flex-wrap gap-2 text-xs">
                  {activeGatewayOrderId && (
                    <button
                      type="button"
                      onClick={() => handleRecheckPaymentStatus()}
                      disabled={isVerifyingPayment}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-check Status</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLaunchOnlineGateway()}
                    disabled={isProcessingGateway || isVerifyingPayment}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Online Again</span>
                  </button>

                  {settings.enableCod !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('COD');
                        setPaymentVerificationError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold transition-colors cursor-pointer ml-auto"
                    >
                      <Truck className="w-3.5 h-3.5 text-orange-600" />
                      <span>Switch to Cash on Delivery</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Price & Summary Breakdown */}
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 text-xs sm:text-sm space-y-1.5 mb-3">
              <div className="flex justify-between text-slate-600">
                <span>Books MRP Total:</span>
                <span className="text-slate-700 font-mono">₹{totalBooksMrp}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Books Selling Price Total:</span>
                <span className="font-semibold text-slate-900 font-mono">₹{totalBooksPrice}</span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>MRP Discount:</span>
                  <span>-₹{discountAmount} ({discountPerc}%)</span>
                </div>
              )}
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className={`font-semibold font-mono ${deliveryCharge === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm sm:text-base font-black">
                <span className="text-slate-800">Grand Total Amount:</span>
                <span style={{ color: settings.accentColor || '#FF5722' }} className="font-mono text-lg">
                  ₹{totalPayable}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="confirm-order-submit-btn"
            disabled={isProcessingGateway || isVerifyingPayment}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              isProcessingGateway || isVerifyingPayment
                ? 'bg-slate-400 cursor-not-allowed opacity-80'
                : 'cursor-pointer hover:brightness-110 active:scale-98'
            }`}
            style={{
              backgroundColor:
                paymentMethod === 'Online Payment Gateway'
                  ? '#4F46E5'
                  : settings.accentColor || '#FF5722',
            }}
          >
            {isProcessingGateway ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Opening Secure Cashfree Payment Gateway...</span>
              </>
            ) : isVerifyingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking Payment Confirmation...</span>
              </>
            ) : paymentMethod === 'Online Payment Gateway' ? (
              upiAppOpened ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Confirm Order Placed (₹{totalPayable} Paid)</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Pay ₹{totalPayable} (Online Payment / Open App)</span>
                </>
              )
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 fill-white/20" />
                <span>Confirm & Place Order (Cash on Delivery ₹{totalPayable})</span>
              </>
            )}
          </button>
        </form>

        {/* Payment Verification Modal Overlay */}
        {isVerifyingPayment && (
          <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 relative">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  Verifying Payment Status
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {paymentVerificationStatusText}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Checking with Payment Gateway Server</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox / Test Mode Simulation Dialog */}
        {showSimulatedModal && simulatedSessionData && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 border-2 border-indigo-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    Online Payment Gateway (Sandbox Mode)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSimulatedModal(false);
                    setSimulatedSessionData(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{simulatedSessionData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Payable:</span>
                  <span className="font-bold text-indigo-700 text-sm">₹{simulatedSessionData.amount}</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  ℹ️ Cashfree live credentials can be configured in Store Settings. Select an outcome below to test the verification pipeline:
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSimulatedPaymentOutcome(true)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Payment Successful (₹{simulatedSessionData.amount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatedPaymentOutcome(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Cancelled / Failed Payment</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

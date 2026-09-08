import React, { useState, useRef, useEffect } from 'react';
import {
  Book,
  Banner,
  Order,
  StoreSettings,
  AdminTab,
  OrderDeliveryStatus,
  RegisteredUser,
  BookReview,
  Coupon,
  BannerSize,
  BannerFit,
  BannerRadius,
  AdminUser,
} from '../types';
import { STORE_CONTACT } from '../data/defaultData';
import { generateOrderTrackingUrl } from '../utils/tracking';
import { api } from '../services/api';
import { VisitorAnalyticsTab } from './VisitorAnalyticsTab';
import {
  BookPlus,
  Image as ImageIcon,
  ShoppingBag,
  Sliders,
  LogOut,
  Trash2,
  Edit,
  Plus,
  RotateCcw,
  Palette,
  Send,
  Copy,
  Check,
  Link as LinkIcon,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Calculator,
  Sparkles,
  Users,
  Phone,
  MessageCircle,
  Crop,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Maximize2,
  FileSpreadsheet,
  Lock,
  KeyRound,
  Smartphone,
  ShieldAlert,
  Star,
  Ticket,
  Coins,
  Gift,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  MapPin,
  Navigation,
  BookMarked,
  Camera,
  Upload,
  X,
  Mail,
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  Power,
  Globe,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  books: Book[];
  banners: Banner[];
  orders: Order[];
  registeredUsers?: RegisteredUser[];
  reviews?: BookReview[];
  settings: StoreSettings;
  onSaveBook: (book: Book, isEdit: boolean) => void;
  onDeleteBook: (id: number) => void;
  onAddBanner: (imgData: string) => void;
  onDeleteBanner: (id: number) => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onLogoutAdmin: () => void;
  onUpdateOrder?: (order: Order) => void;
  onBulkUpdateBooks?: (books: Book[]) => void;
  onDeleteUser?: (id: string) => void;
  onDeleteReview?: (id: string) => void;
  onAddReview?: (review: BookReview) => void;
  onSaveCoupon?: (coupon: Coupon) => void;
  onDeleteCoupon?: (id: string) => void;
  onUpdateUserCoins?: (userId: string, newCoins: number) => void;
  onSwitchToStore?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  books = [],
  banners = [],
  orders = [],
  registeredUsers = [],
  reviews = [],
  settings,
  onSaveBook,
  onDeleteBook,
  onAddBanner,
  onDeleteBanner,
  onSaveSettings,
  onLogoutAdmin,
  onUpdateOrder,
  onBulkUpdateBooks,
  onDeleteUser,
  onDeleteReview,
  onAddReview,
  onSaveCoupon,
  onDeleteCoupon,
  onUpdateUserCoins,
  onSwitchToStore,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('manage-books');
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);
  const [copiedUserPhone, setCopiedUserPhone] = useState<string | null>(null);

  // Edit Tracking Modal state for specific order
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<Order | null>(null);
  const [modalTrackingUrl, setModalTrackingUrl] = useState('');
  const [modalTrackingNumber, setModalTrackingNumber] = useState('');
  const [modalCourierName, setModalCourierName] = useState('');
  const [modalStatus, setModalStatus] = useState<OrderDeliveryStatus>('Confirmed');

  // Book Form State
  const [editBookId, setEditBookId] = useState<number | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookOldPrice, setBookOldPrice] = useState(''); // MRP
  const [bookDiscountPercent, setBookDiscountPercent] = useState(''); // % Discount
  const [bookPrice, setBookPrice] = useState(''); // Selling Price
  const [bookStock, setBookStock] = useState('10');
  const [bookCategory, setBookCategory] = useState('General');
  const [bookTargetClass, setBookTargetClass] = useState(''); // Class 1-12 or Exam

  // Combo Pack & Bundle Settings
  const [isBookCombo, setIsBookCombo] = useState<boolean>(false);
  const [bookComboBadge, setBookComboBadge] = useState<string>('');
  const [bookComboItems, setBookComboItems] = useState<string[]>([]);
  const [newComboItemInput, setNewComboItemInput] = useState<string>('');

  // Admin Review Photo Lightbox & Review Creator Form
  const [previewReviewPhoto, setPreviewReviewPhoto] = useState<string | null>(null);
  const [showAddReviewForm, setShowAddReviewForm] = useState<boolean>(false);
  const [newReviewBookId, setNewReviewBookId] = useState<number | ''>('');
  const [newReviewCustomerName, setNewReviewCustomerName] = useState<string>('');
  const [newReviewCustomerPhone, setNewReviewCustomerPhone] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [newReviewPhotos, setNewReviewPhotos] = useState<string[]>([]);
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null);

  // Book Image & Interactive Resizer / Scaler / Crop State
  const [rawUploadedImage, setRawUploadedImage] = useState<string>('');
  const [bookImgPreview, setBookImgPreview] = useState<string>('');
  const [imgScale, setImgScale] = useState<number>(100); // 30% to 300%
  const [imgOffsetX, setImgOffsetX] = useState<number>(0); // -100 to 100
  const [imgOffsetY, setImgOffsetY] = useState<number>(0); // -100 to 100
  const [imgRotation, setImgRotation] = useState<number>(0); // 0, 90, 180, 270
  const [imgFitMode, setImgFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [showImageAdjuster, setShowImageAdjuster] = useState<boolean>(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const bookFileInputRef = useRef<HTMLInputElement>(null);

  // Banner Form State & Resizing Tools
  const [bannerImgPreview, setBannerImgPreview] = useState<string>('');
  const [rawUploadedBanner, setRawUploadedBanner] = useState<string>('');
  const [bannerScale, setBannerScale] = useState<number>(100);
  const [bannerOffsetX, setBannerOffsetX] = useState<number>(0);
  const [bannerOffsetY, setBannerOffsetY] = useState<number>(0);
  const [bannerFitMode, setBannerFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [showBannerAdjuster, setShowBannerAdjuster] = useState<boolean>(false);
  const [bannerTitle, setBannerTitle] = useState<string>('');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Store Banner Presentation Settings
  const [bannerSize, setBannerSize] = useState<BannerSize>(settings.bannerSize || 'standard');
  const [bannerCustomHeight, setBannerCustomHeight] = useState<number>(settings.bannerCustomHeight || 280);
  const [bannerCustomHeightMobile, setBannerCustomHeightMobile] = useState<number>(settings.bannerCustomHeightMobile || 180);
  const [bannerFit, setBannerFit] = useState<BannerFit>(settings.bannerFit || 'cover');
  const [bannerRadius, setBannerRadius] = useState<BannerRadius>(settings.bannerRadius || '2xl');
  const [bannerSavedNotification, setBannerSavedNotification] = useState<boolean>(false);

  // Settings State
  const [storeName, setStoreName] = useState(settings.name);
  const [storeSub, setStoreSub] = useState(settings.sub);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0B1B3D');
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#FF5722');
  const [bgColor, setBgColor] = useState(settings.bgColor || '#F5F7FA');
  const [announcementText, setAnnouncementText] = useState(settings.announcement || '');
  const [showAnnouncement, setShowAnnouncement] = useState(settings.showAnnouncement || false);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoImg || '/logo.svg');
  const [logoUrlInput, setLogoUrlInput] = useState<string>('');
  const [logoSavedFlash, setLogoSavedFlash] = useState<boolean>(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Contact & UPI Settings
  const [upiId, setUpiId] = useState(settings.upiId || STORE_CONTACT.upiId);
  const [phone, setPhone] = useState(settings.phone || STORE_CONTACT.phone);
  const [whatsappNumber, setWhatsappNumber] = useState(
    settings.whatsappNumber || STORE_CONTACT.whatsappNumber
  );
  const [email, setEmail] = useState(settings.email || STORE_CONTACT.email);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || STORE_CONTACT.facebookUrl);
  const [instagramUrl, setInstagramUrl] = useState(
    settings.instagramUrl || STORE_CONTACT.instagramUrl
  );

  // Payment Gateway Settings State
  const [enablePaymentGateway, setEnablePaymentGateway] = useState(settings.enablePaymentGateway ?? true);
  const [paymentGatewayProvider, setPaymentGatewayProvider] = useState<'Cashfree' | 'Razorpay' | 'DirectUPI' | 'Custom'>(
    settings.paymentGatewayProvider || 'Cashfree'
  );
  const [cashfreeAppId, setCashfreeAppId] = useState(settings.cashfreeAppId || '');
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState(settings.cashfreeSecretKey || '');
  const [cashfreeEnvironment, setCashfreeEnvironment] = useState<'sandbox' | 'production'>(
    settings.cashfreeEnvironment || 'production'
  );
  const [showCashfreeSecret, setShowCashfreeSecret] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState(settings.razorpayKeyId || '');
  const [enableCod, setEnableCod] = useState(settings.enableCod ?? true);
  const [enableUpiQrPrepaid, setEnableUpiQrPrepaid] = useState(settings.enableUpiQrPrepaid ?? true);
  const [codExtraFee, setCodExtraFee] = useState<number>(settings.codExtraFee ?? 25);
  const [gatewayDiscountPercentage, setGatewayDiscountPercentage] = useState<number>(
    settings.gatewayDiscountPercentage ?? 5
  );
  const [onlineDeliveryCharge, setOnlineDeliveryCharge] = useState<number>(
    settings.onlineDeliveryCharge ?? 50
  );
  const [codDeliveryCharge, setCodDeliveryCharge] = useState<number>(
    settings.codDeliveryCharge ?? 75
  );
  const [isTestingCashfree, setIsTestingCashfree] = useState(false);
  const [cashfreeTestResult, setCashfreeTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestCashfreeConnection = async () => {
    if (!cashfreeAppId.trim() || !cashfreeSecretKey.trim()) {
      setCashfreeTestResult({
        success: false,
        message: 'Please enter both Cashfree App ID and Secret Key first.',
      });
      return;
    }
    setIsTestingCashfree(true);
    setCashfreeTestResult(null);
    try {
      const res = await api.testCashfreeCredentials(
        cashfreeAppId.trim(),
        cashfreeSecretKey.trim(),
        cashfreeEnvironment
      );
      if (res.valid) {
        setCashfreeTestResult({
          success: true,
          message: res.message || 'Cashfree API Keys are VALID and Active! Connection Successful.',
        });
      } else {
        setCashfreeTestResult({
          success: false,
          message: res.error || 'Cashfree verification failed. Please check App ID and Secret Key.',
        });
      }
    } catch (err: any) {
      setCashfreeTestResult({
        success: false,
        message: err.message || 'Failed to connect to Cashfree verification server.',
      });
    } finally {
      setIsTestingCashfree(false);
    }
  };

  // Admin Password Change with OTP
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordOtpStep, setPasswordOtpStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [passwordGeneratedOtp, setPasswordGeneratedOtp] = useState('');
  const [passwordEnteredOtp, setPasswordEnteredOtp] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const adminPhoneTarget = settings.phone || STORE_CONTACT.phone || '8001743646';

  // Coupon Form & List State
  const [coupons, setCoupons] = useState<Coupon[]>(settings.coupons || []);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'flat' | 'percentage'>('flat');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState('0');
  const [couponIsPublic, setCouponIsPublic] = useState(true);
  const [couponIsHidden, setCouponIsHidden] = useState(false);
  const [couponDesc, setCouponDesc] = useState('');
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // User Super Coins Modal State
  const [editingCoinsUser, setEditingCoinsUser] = useState<RegisteredUser | null>(null);
  const [customCoinsValue, setCustomCoinsValue] = useState<string>('50');

  // Admin Management State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [createAdminPassword, setCreateAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Super Admin' | 'Admin' | 'Manager'>('Admin');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);

  const loadAdminTeam = async () => {
    try {
      const list = await api.getAdmins();
      if (Array.isArray(list)) {
        setAdmins(list);
      }
    } catch (err) {
      console.error('Failed to load admin team', err);
    }
  };

  useEffect(() => {
    loadAdminTeam();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    const cleanEmail = newAdminEmail.trim().toLowerCase();
    const cleanPhone = newAdminPhone.replace(/[^0-9]/g, '');

    if (!cleanEmail && !cleanPhone) {
      setAdminActionError('Please enter the administrator\'s Gmail / Google email address.');
      return;
    }
    if (cleanEmail && !cleanEmail.includes('@')) {
      setAdminActionError('Please enter a valid Gmail / email address.');
      return;
    }
    if (!newAdminName.trim()) {
      setAdminActionError('Please enter the admin name.');
      return;
    }

    try {
      const res = await api.saveAdmin({
        name: newAdminName.trim(),
        email: cleanEmail,
        phone: cleanPhone || '',
        password: createAdminPassword.trim() || 'sknizamuddin1732008',
        role: newAdminRole,
        isActive: true,
      });
      if (res.success) {
        setAdminActionSuccess(
          `Admin ${newAdminName} created successfully! They can log in directly using Google with ${cleanEmail || cleanPhone}.`
        );
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        setCreateAdminPassword('');
        setShowAddAdminForm(false);
        loadAdminTeam();
      } else {
        setAdminActionError(res.error || 'Failed to create admin.');
      }
    } catch {
      setAdminActionError('Failed to save admin.');
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail?: string, adminPhone?: string) => {
    if (
      adminEmail?.toLowerCase() === 'sknizamuddin249@gmail.com' ||
      adminPhone === '8001743646' ||
      adminId === 'admin_master'
    ) {
      alert('Master Administrator account (sknizamuddin249@gmail.com / 8001743646) cannot be removed.');
      return;
    }
    const identifier = adminEmail || (adminPhone ? `+91 ${adminPhone}` : 'this administrator');
    if (!confirm(`Are you sure you want to remove administrator permissions for (${identifier})?`)) {
      return;
    }
    try {
      const res = await api.deleteAdmin(adminId);
      if (res.success) {
        setAdminActionSuccess('Admin access revoked successfully.');
        loadAdminTeam();
      } else {
        setAdminActionError(res.error || 'Failed to remove admin.');
      }
    } catch {
      setAdminActionError('Failed to delete admin.');
    }
  };

  useEffect(() => {
    if (settings.coupons) {
      setCoupons(settings.coupons);
    }
  }, [settings.coupons]);

  useEffect(() => {
    if (settings.bannerSize) setBannerSize(settings.bannerSize);
    if (settings.bannerCustomHeight) setBannerCustomHeight(settings.bannerCustomHeight);
    if (settings.bannerCustomHeightMobile) setBannerCustomHeightMobile(settings.bannerCustomHeightMobile);
    if (settings.bannerFit) setBannerFit(settings.bannerFit);
    if (settings.bannerRadius) setBannerRadius(settings.bannerRadius);
  }, [
    settings.bannerSize,
    settings.bannerCustomHeight,
    settings.bannerCustomHeightMobile,
    settings.bannerFit,
    settings.bannerRadius,
  ]);

  // Orders Search, Users Search, Reviews Search & Coupon Search
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');

  // Apply Real-time Canvas Rendering for Resized / Scaled Book Image
  const applyImageCanvasTransform = () => {
    const src = rawUploadedImage || bookImgPreview;
    if (!src) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Standard High Definition Book Aspect Ratio: 3:4 (width 600 x height 800)
      const targetWidth = 600;
      const targetHeight = 800;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill canvas background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      // Move to center for rotation and offset
      ctx.translate(
        targetWidth / 2 + (imgOffsetX * targetWidth) / 100,
        targetHeight / 2 + (imgOffsetY * targetHeight) / 100
      );
      ctx.rotate((imgRotation * Math.PI) / 180);

      const scaleMultiplier = imgScale / 100;
      let drawWidth = targetWidth * scaleMultiplier;
      let drawHeight = targetHeight * scaleMultiplier;

      if (imgFitMode === 'contain') {
        const aspect = img.width / img.height;
        if (aspect > targetWidth / targetHeight) {
          drawWidth = targetWidth * scaleMultiplier;
          drawHeight = (targetWidth / aspect) * scaleMultiplier;
        } else {
          drawHeight = targetHeight * scaleMultiplier;
          drawWidth = (targetHeight * aspect) * scaleMultiplier;
        }
      } else if (imgFitMode === 'cover') {
        const aspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        if (aspect > targetAspect) {
          drawHeight = targetHeight * scaleMultiplier;
          drawWidth = targetHeight * aspect * scaleMultiplier;
        } else {
          drawWidth = targetWidth * scaleMultiplier;
          drawHeight = (targetWidth / aspect) * scaleMultiplier;
        }
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const renderedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setBookImgPreview(renderedDataUrl);
    };
    img.src = src;
  };

  // Trigger auto re-render whenever scale/offset/rotation changes
  useEffect(() => {
    if (rawUploadedImage && showImageAdjuster) {
      applyImageCanvasTransform();
    }
  }, [imgScale, imgOffsetX, imgOffsetY, imgRotation, imgFitMode, rawUploadedImage]);

  // Drag to Pan Handlers for Live Preview Box
  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCanvas(true);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    setImgOffsetX((prev) => Math.max(-80, Math.min(80, prev + dx * 0.4)));
    setImgOffsetY((prev) => Math.max(-80, Math.min(80, prev + dy * 0.4)));
  };

  const handlePreviewMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // Handle MRP change with auto percentage/price calculations
  const handleMrpChange = (mrpVal: string) => {
    setBookOldPrice(mrpVal);
    const mrp = parseFloat(mrpVal);
    const perc = parseFloat(bookDiscountPercent);
    if (!isNaN(mrp) && mrp > 0) {
      if (!isNaN(perc) && perc > 0) {
        const calculatedPrice = Math.round(mrp - (mrp * perc) / 100);
        setBookPrice(String(calculatedPrice));
      } else if (bookPrice) {
        const sp = parseFloat(bookPrice);
        if (!isNaN(sp) && mrp > sp) {
          const calculatedPerc = Math.round(((mrp - sp) / mrp) * 100);
          setBookDiscountPercent(String(calculatedPerc));
        }
      }
    }
  };

  // Handle Percentage change with auto selling price calculation
  const handlePercentChange = (percVal: string) => {
    setBookDiscountPercent(percVal);
    const perc = parseFloat(percVal);
    const mrp = parseFloat(bookOldPrice);
    if (!isNaN(mrp) && mrp > 0) {
      if (!isNaN(perc) && perc >= 0) {
        const calculatedPrice = Math.max(0, Math.round(mrp - (mrp * perc) / 100));
        setBookPrice(String(calculatedPrice));
      } else {
        setBookPrice(String(mrp));
      }
    }
  };

  // Quick percent button click
  const handleQuickPercentSelect = (perc: number) => {
    setBookDiscountPercent(String(perc));
    const mrp = parseFloat(bookOldPrice);
    if (!isNaN(mrp) && mrp > 0) {
      const calculatedPrice = Math.max(0, Math.round(mrp - (mrp * perc) / 100));
      setBookPrice(String(calculatedPrice));
    }
  };

  // Handle Selling price change with auto percentage calculation
  const handleSellingPriceChange = (spVal: string) => {
    setBookPrice(spVal);
    const sp = parseFloat(spVal);
    const mrp = parseFloat(bookOldPrice);
    if (!isNaN(mrp) && mrp > 0 && !isNaN(sp)) {
      if (mrp >= sp) {
        const calculatedPerc = Math.round(((mrp - sp) / mrp) * 100);
        setBookDiscountPercent(String(calculatedPerc));
      } else {
        setBookDiscountPercent('0');
      }
    }
  };

  // Apply Real-time Canvas Rendering for Resized / Scaled Banner Image
  const applyBannerCanvasTransform = () => {
    const src = rawUploadedBanner || bannerImgPreview;
    if (!src) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Standard Ultra-Wide Banner Aspect Ratio: 1200 x 500
      const targetWidth = 1200;
      const targetHeight = 500;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill canvas background with clean matching color
      ctx.fillStyle = '#0B1B3D';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      // Move to center for pan and zoom
      ctx.translate(
        targetWidth / 2 + (bannerOffsetX * targetWidth) / 100,
        targetHeight / 2 + (bannerOffsetY * targetHeight) / 100
      );

      const scaleMultiplier = bannerScale / 100;
      let drawWidth = targetWidth * scaleMultiplier;
      let drawHeight = targetHeight * scaleMultiplier;

      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;

      if (bannerFitMode === 'contain') {
        if (imgAspect > canvasAspect) {
          drawWidth = targetWidth * scaleMultiplier;
          drawHeight = (targetWidth / imgAspect) * scaleMultiplier;
        } else {
          drawHeight = targetHeight * scaleMultiplier;
          drawWidth = (targetHeight * imgAspect) * scaleMultiplier;
        }
      } else if (bannerFitMode === 'cover') {
        if (imgAspect > canvasAspect) {
          drawHeight = targetHeight * scaleMultiplier;
          drawWidth = targetHeight * imgAspect * scaleMultiplier;
        } else {
          drawWidth = targetWidth * scaleMultiplier;
          drawHeight = (targetWidth / imgAspect) * scaleMultiplier;
        }
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const transformedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setBannerImgPreview(transformedDataUrl);
    };
    img.src = src;
  };

  // Trigger auto re-render for banner resizer
  useEffect(() => {
    if (rawUploadedBanner && showBannerAdjuster) {
      applyBannerCanvasTransform();
    }
  }, [bannerScale, bannerOffsetX, bannerOffsetY, bannerFitMode, rawUploadedBanner]);

  // Handle Book Image file upload
  const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setRawUploadedImage(dataUrl);
        setBookImgPreview(dataUrl);
        setShowImageAdjuster(true);
        // Reset crop/zoom sliders
        setImgScale(100);
        setImgOffsetX(0);
        setImgOffsetY(0);
        setImgRotation(0);
        setImgFitMode('cover');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Banner Image file upload
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setRawUploadedBanner(dataUrl);
        setBannerImgPreview(dataUrl);
        setShowBannerAdjuster(true);
        setBannerScale(100);
        setBannerOffsetX(0);
        setBannerOffsetY(0);
        setBannerFitMode('cover');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo file upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset Book Form
  const resetBookForm = () => {
    setEditBookId(null);
    setBookTitle('');
    setBookDesc('');
    setBookPrice('');
    setBookOldPrice('');
    setBookDiscountPercent('');
    setBookStock('10');
    setBookCategory('General');
    setBookTargetClass('');
    setIsBookCombo(false);
    setBookComboBadge('');
    setBookComboItems([]);
    setNewComboItemInput('');
    setBookImgPreview('');
    setRawUploadedImage('');
    setShowImageAdjuster(false);
    setImgScale(100);
    setImgOffsetX(0);
    setImgOffsetY(0);
    setImgRotation(0);
    if (bookFileInputRef.current) bookFileInputRef.current.value = '';
  };

  // Edit Book Trigger
  const handleStartEditBook = (b: Book) => {
    setEditBookId(b.id);
    setBookTitle(b.title);
    setBookDesc(b.description || '');
    setBookPrice(String(b.price));
    setBookOldPrice(b.oldPrice ? String(b.oldPrice) : '');
    if (b.oldPrice && b.oldPrice > b.price) {
      const perc = Math.round(((b.oldPrice - b.price) / b.oldPrice) * 100);
      setBookDiscountPercent(String(perc));
    } else {
      setBookDiscountPercent('');
    }
    setBookStock(String(b.stock));
    setBookCategory(b.category || 'General');
    setBookTargetClass(b.targetClass || '');
    setIsBookCombo(!!b.isCombo);
    setBookComboBadge(b.comboBadge || '');
    setBookComboItems(Array.isArray(b.comboItems) ? b.comboItems : []);
    setNewComboItemInput('');
    setBookImgPreview(b.img);
    setRawUploadedImage(b.img);
    setShowImageAdjuster(true);
    setImgScale(100);
    setImgOffsetX(0);
    setImgOffsetY(0);
    setImgRotation(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Combo Pack Item Add/Remove Helper
  const handleAddComboItem = () => {
    if (!newComboItemInput.trim()) return;
    setBookComboItems([...bookComboItems, newComboItemInput.trim()]);
    setNewComboItemInput('');
  };

  const handleRemoveComboItem = (index: number) => {
    setBookComboItems(bookComboItems.filter((_, idx) => idx !== index));
  };

  // Admin New Review Photo Upload Helper
  const handleAdminReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - newReviewPhotos.length;
    if (remainingSlots <= 0) {
      alert('You can attach up to 4 photos per review.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setNewReviewPhotos((prev) => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (reviewPhotoInputRef.current) reviewPhotoInputRef.current.value = '';
  };

  const handleRemoveAdminReviewPhoto = (index: number) => {
    setNewReviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Admin Post Verified Review Submit
  const handleAdminReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewBookId) {
      alert('Please select a book for this review.');
      return;
    }
    if (!newReviewCustomerName.trim() || !newReviewComment.trim()) {
      alert('Please enter the customer name and comment.');
      return;
    }

    const createdReview: BookReview = {
      id: `rev_adm_${Date.now()}`,
      bookId: Number(newReviewBookId),
      customerName: newReviewCustomerName.trim(),
      customerPhone: newReviewCustomerPhone.trim() || undefined,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isVerifiedBuyer: true,
      photos: newReviewPhotos.length > 0 ? newReviewPhotos : undefined,
    };

    if (onAddReview) {
      onAddReview(createdReview);
      setShowAddReviewForm(false);
      setNewReviewBookId('');
      setNewReviewCustomerName('');
      setNewReviewCustomerPhone('');
      setNewReviewRating(5);
      setNewReviewComment('');
      setNewReviewPhotos([]);
      alert('Verified customer photo review added successfully!');
    } else {
      alert('Review handler not available.');
    }
  };

  // Save Book Handler
  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookImgPreview) {
      alert('Please upload a book cover image!');
      return;
    }

    const priceNum = parseFloat(bookPrice) || 0;
    const oldPriceNum = bookOldPrice ? parseFloat(bookOldPrice) : null;
    const stockNum = parseInt(bookStock) || 0;

    const bookData: Book = {
      id: editBookId ? editBookId : Date.now(),
      title: bookTitle,
      description: bookDesc,
      price: priceNum,
      oldPrice: oldPriceNum,
      stock: stockNum,
      category: bookCategory,
      targetClass: bookTargetClass.trim() || undefined,
      isCombo: isBookCombo,
      comboBadge: isBookCombo ? (bookComboBadge.trim() || 'COMBO PACK • SPECIAL OFFER') : undefined,
      comboItems: isBookCombo && bookComboItems.length > 0 ? bookComboItems : undefined,
      img: bookImgPreview,
    };

    onSaveBook(bookData, !!editBookId);
    resetBookForm();
    alert(editBookId ? 'Book updated successfully!' : 'New book added to library!');
  };

  // Save Global Banner Display & Sizing Settings
  const handleSaveBannerDisplaySettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: StoreSettings = {
      ...settings,
      bannerSize,
      bannerCustomHeight: Number(bannerCustomHeight) || 280,
      bannerCustomHeightMobile: Number(bannerCustomHeightMobile) || 180,
      bannerFit,
      bannerRadius,
    };
    onSaveSettings(updated);
    setBannerSavedNotification(true);
    setTimeout(() => setBannerSavedNotification(false), 3000);
  };

  // Add Banner Handler
  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImgPreview) {
      alert('Please upload a banner image!');
      return;
    }
    onAddBanner(bannerImgPreview);
    setBannerImgPreview('');
    setRawUploadedBanner('');
    setShowBannerAdjuster(false);
    setBannerTitle('');
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    alert('Banner added and published to store slider successfully!');
  };

  // Save Settings Handler
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreSettings = {
      ...settings,
      name: storeName,
      sub: storeSub,
      logoImg: logoPreview,
      primaryColor,
      accentColor,
      bgColor,
      announcement: announcementText.trim(),
      showAnnouncement,
      bannerSize,
      bannerCustomHeight: Number(bannerCustomHeight) || 280,
      bannerCustomHeightMobile: Number(bannerCustomHeightMobile) || 180,
      bannerFit,
      bannerRadius,
      upiId: upiId.trim(),
      phone: phone.trim(),
      whatsappNumber: whatsappNumber.trim(),
      email: email.trim(),
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      enablePaymentGateway,
      paymentGatewayProvider,
      cashfreeAppId: cashfreeAppId.trim(),
      cashfreeSecretKey: cashfreeSecretKey.trim(),
      cashfreeEnvironment,
      razorpayKeyId: razorpayKeyId.trim(),
      enableCod,
      enableUpiQrPrepaid,
      codExtraFee: Number(codExtraFee) || 0,
      gatewayDiscountPercentage: Number(gatewayDiscountPercentage) || 0,
      onlineDeliveryCharge: Number(onlineDeliveryCharge) || 0,
      codDeliveryCharge: Number(codDeliveryCharge) || 0,
    };
    onSaveSettings(updated);
    alert('Store Settings, Cashfree Gateway, UPI & Social Links updated successfully!');
  };

  // 1-Click Send Tracking Link on WhatsApp to Customer
  const handleSendQuickTrackingLink = (ord: Order) => {
    const trackLink = generateOrderTrackingUrl(ord);

    let msg = `📦 *ORDER TRACKING LINK - ${settings.name || 'Online Book Store'}*%0A%0A`;
    msg += `Hello *${ord.customerName}*, here is your tracking link for your order *"${ord.bookTitle}"*:%0A%0A`;
    msg += `🔗 *Live Order Tracking Link:*%0A${trackLink}%0A%0A`;
    if (ord.trackingUrl) {
      msg += `🚚 *Courier Tracking Link:*%0A${ord.trackingUrl}%0A%0A`;
    }
    if (ord.trackingNumber) {
      msg += `📋 *Tracking / AWB Number:* ${ord.trackingNumber}%0A%0A`;
    }
    msg += `💡 Click the link above to view your real-time order status and shipment details.%0A%0A`;
    msg += `Thank you! - ${settings.name || 'Online Book Store'}`;

    const cleanPhone = ord.phone.replace(/[^0-9]/g, '');
    const wpUrl = `https://wa.me/91${cleanPhone}?text=${msg}`;
    window.open(wpUrl, '_blank');
  };

  // Copy Tracking Link
  const handleCopyTrackingLink = (ord: Order) => {
    const link = generateOrderTrackingUrl(ord);
    navigator.clipboard.writeText(link);
    setCopiedOrderId(ord.id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Copy User Phone
  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedUserPhone(phoneNumber);
    setTimeout(() => setCopiedUserPhone(null), 2000);
  };

  // Quick WhatsApp Message to Registered User
  const handleOpenUserWhatsApp = (user: RegisteredUser) => {
    const cleanPhone = user.phone.replace(/[^0-9]/g, '');
    const msg = `Hello *${user.name}*, welcome to *${settings.name || 'Online Book Store'}*! 📚 How can we assist you with our latest book collections today?`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Export Registered Users as CSV
  const handleExportUsersCSV = () => {
    if (registeredUsers.length === 0) {
      alert('No registered users to export yet.');
      return;
    }

    let csv = 'ID,Name,Phone,Registered At,Last Login,Village,District,Pincode,Total Orders\n';
    registeredUsers.forEach((u) => {
      csv += `"${u.id}","${u.name}","${u.phone}","${u.registeredAt}","${u.lastLoginAt}","${
        u.village || ''
      }","${u.district || ''}","${u.pincode || ''}","${u.totalOrdersCount || 0}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registered_customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Change Status
  const handleStatusChange = (ord: Order, newStatus: OrderDeliveryStatus) => {
    const updated: Order = {
      ...ord,
      orderStatus: newStatus,
      lastUpdated: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString(),
    };
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  // Open Tracking Link Edit Modal for specific Order
  const handleOpenTrackingModal = (ord: Order) => {
    setEditingTrackingOrder(ord);
    setModalTrackingUrl(ord.trackingUrl || '');
    setModalTrackingNumber(ord.trackingNumber || '');
    setModalCourierName(ord.courierName || 'India Post / Speed Post');
    setModalStatus(ord.orderStatus || 'Dispatched');
  };

  // Save Tracking Link to Order
  const handleSaveTrackingLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingOrder) return;

    const updated: Order = {
      ...editingTrackingOrder,
      orderStatus: modalStatus,
      courierName: modalCourierName,
      trackingNumber: modalTrackingNumber,
      trackingUrl: modalTrackingUrl.trim(),
      lastUpdated: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString(),
    };

    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }

    alert('Tracking link & courier details updated for this order!');
    setEditingTrackingOrder(null);
  };

  // Admin Password OTP Handlers (Dispatches to Admin Phone without showing OTP on screen)
  const handleSendAdminPasswordOtp = async () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPasswordGeneratedOtp(randomOtp);
    setPasswordEnteredOtp('');
    setPasswordOtpStep('verify');
    setPasswordError('');
    setPasswordSuccess(`A secret 6-digit OTP code has been dispatched to your mobile +91 ${adminPhoneTarget}. Please check your phone.`);

    // Trigger backend OTP store
    api.requestAdminResetOtp().catch(() => {});

    // Open direct WhatsApp message to admin device
    const msg = encodeURIComponent(`🔐 *Online Library Admin Security*\nYour 6-Digit Password Reset OTP is: *${randomOtp}*.\nValid for 5 minutes. Enter this code on the website to reset your password.`);
    const waUrl = `https://wa.me/91${adminPhoneTarget}?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const handleVerifyAdminPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordEnteredOtp.trim();
    if (!entered || entered.length !== 6) {
      setPasswordError('Please enter the full 6-digit OTP code received on your phone.');
      return;
    }

    if (entered === passwordGeneratedOtp) {
      setPasswordOtpStep('new_password');
      setPasswordError('');
      setPasswordSuccess('OTP verified successfully! Please enter your new admin password.');
      return;
    }

    const serverRes = await api.verifyAdminResetOtp(entered);
    if (serverRes.success) {
      setPasswordOtpStep('new_password');
      setPasswordError('');
      setPasswordSuccess('OTP verified successfully! Please enter your new admin password.');
    } else {
      setPasswordError(serverRes.error || 'Invalid OTP code. Please check SMS/WhatsApp on your phone and try again.');
    }
  };

  const handleSaveUpdatedAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordError('Passwords do not match. Please re-type.');
      return;
    }

    await api.changeAdminPassword(newAdminPassword.trim(), passwordEnteredOtp);
    localStorage.setItem('adminPassword', newAdminPassword.trim());
    try {
      const ch = new BroadcastChannel('store_realtime_sync');
      ch.postMessage({ type: 'UPDATE_ADMIN_PASSWORD', data: newAdminPassword.trim() });
      ch.close();
    } catch {}

    alert('Admin security password updated successfully!');
    setShowChangePasswordModal(false);
    setPasswordOtpStep('request');
    setPasswordEnteredOtp('');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
  };

  // Coupon Management Handlers
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const val = parseFloat(couponValue);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid discount amount or percentage.');
      return;
    }

    const minOrd = parseFloat(couponMinOrder) || 0;

    const newCoupon: Coupon = {
      id: editingCouponId || `cpn_${Date.now()}`,
      code: couponCode.trim().toUpperCase(),
      discountType: couponType,
      discountValue: val,
      minOrderAmount: minOrd,
      isActive: true,
      isPublicBanner: couponIsPublic,
      isHidden: couponIsHidden,
      description:
        couponDesc.trim() ||
        (couponType === 'flat' ? `Flat ₹${val} OFF` : `${val}% OFF on order`),
    };

    if (onSaveCoupon) {
      onSaveCoupon(newCoupon);
    } else {
      api.saveCoupon(newCoupon);
    }

    setCoupons((prev) => {
      const filtered = prev.filter((c) => c.id !== newCoupon.id);
      return [newCoupon, ...filtered];
    });

    setCouponCode('');
    setCouponValue('');
    setCouponMinOrder('0');
    setCouponDesc('');
    setCouponIsHidden(false);
    setEditingCouponId(null);
    alert(`Coupon code "${newCoupon.code}" saved successfully! (${couponIsHidden ? 'Hidden/Secret' : 'Unhidden/Visible'})`);
  };

  const handleEditCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCouponCode(c.code);
    setCouponType(c.discountType);
    setCouponValue(String(c.discountValue));
    setCouponMinOrder(String(c.minOrderAmount || 0));
    setCouponIsPublic(c.isPublicBanner ?? true);
    setCouponIsHidden(c.isHidden ?? false);
    setCouponDesc(c.description || '');
  };

  const handleDeleteCouponItem = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      if (onDeleteCoupon) {
        onDeleteCoupon(id);
      } else {
        api.deleteCoupon(id);
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleToggleCouponActive = (c: Coupon) => {
    const updated: Coupon = { ...c, isActive: !c.isActive };
    if (onSaveCoupon) {
      onSaveCoupon(updated);
    } else {
      api.saveCoupon(updated);
    }
    setCoupons((prev) => prev.map((item) => (item.id === c.id ? updated : item)));
  };

  const handleToggleCouponHidden = (c: Coupon) => {
    const updated: Coupon = { ...c, isHidden: !c.isHidden };
    if (onSaveCoupon) {
      onSaveCoupon(updated);
    } else {
      api.saveCoupon(updated);
    }
    setCoupons((prev) => prev.map((item) => (item.id === c.id ? updated : item)));
  };

  const handleToggleGlobalHideCoupons = () => {
    const nextVal = !settings.hideAllCoupons;
    const updatedSettings: StoreSettings = {
      ...settings,
      hideAllCoupons: nextVal,
    };
    onSaveSettings(updatedSettings);
  };

  // Super Coins Handler for Registered Customer
  const handleSaveUserCoins = () => {
    if (!editingCoinsUser) return;
    const coinsNum = parseInt(customCoinsValue, 10);
    if (isNaN(coinsNum) || coinsNum < 0) {
      alert('Please enter a valid number of coins.');
      return;
    }

    if (onUpdateUserCoins) {
      onUpdateUserCoins(editingCoinsUser.id, coinsNum);
    } else {
      api.saveUser({ id: editingCoinsUser.id, phone: editingCoinsUser.phone, coins: coinsNum });
    }

    alert(`Updated ${editingCoinsUser.name}'s Super Coins to 🪙 ${coinsNum} Coins (₹${(coinsNum / 10).toFixed(1)})`);
    setEditingCoinsUser(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.bookTitle.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  const filteredUsers = registeredUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.village && u.village.toLowerCase().includes(q)) ||
      (u.district && u.district.toLowerCase().includes(q))
    );
  });

  const filteredReviews = reviews.filter((r) => {
    if (!reviewSearch.trim()) return true;
    const q = reviewSearch.toLowerCase();
    const targetBook = books.find((b) => b.id === r.bookId);
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      (r.customerPhone && r.customerPhone.includes(q)) ||
      (targetBook && targetBook.title.toLowerCase().includes(q))
    );
  });

  const parsedMrp = parseFloat(bookOldPrice);
  const parsedPrice = parseFloat(bookPrice);
  const parsedPerc = parseFloat(bookDiscountPercent);
  const calculatedSavings =
    !isNaN(parsedMrp) && !isNaN(parsedPrice) && parsedMrp > parsedPrice
      ? parsedMrp - parsedPrice
      : 0;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2
            className="text-xl sm:text-2xl font-black flex items-center gap-2"
            style={{ color: settings.primaryColor || '#0B1B3D' }}
          >
            <Sliders className="w-6 h-6 text-orange-600" />
            <span>Store Management Panel</span>
          </h2>
          <span className="text-xs text-slate-500">
            Book catalog management, visitor directory, tracking links & 2FA admin security
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onSwitchToStore && (
            <button
              type="button"
              onClick={onSwitchToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
              title="Switch to Customer Store View (Seamlessly browse store without re-entering password)"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>🛒 Switch to Store View</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowChangePasswordModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors border border-slate-300 cursor-pointer whitespace-nowrap"
            title="Change Admin Password (OTP to 8001743646)"
          >
            <KeyRound className="w-3.5 h-3.5 text-orange-600" />
            <span>Change PIN</span>
          </button>

          <button
            id="admin-logout-btn"
            onClick={onLogoutAdmin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs sm:text-sm transition-colors border border-rose-200 cursor-pointer whitespace-nowrap"
            title="Fully Sign Out & Clear Admin Session"
          >
            <LogOut className="w-4 h-4" />
            <span>Full Logout</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('manage-books')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'manage-books'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookPlus className="w-4 h-4" />
          <span>Manage Books ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('visitor-analytics')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'visitor-analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span>Visitor Analytics & Views</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('manage-admins');
            loadAdminTeam();
          }}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'manage-admins'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>🛡️ Manage Admins ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registered-users')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'registered-users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>👤 Registered Users ({registeredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manage-coupons')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'manage-coupons'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-4 h-4 text-purple-500" />
          <span>🎟️ Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('view-orders')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'view-orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manage-reviews')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'manage-reviews'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Reviews ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manage-banners')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'manage-banners'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('store-settings')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'store-settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Store Settings</span>
        </button>
      </div>

      {/* TAB 1: MANAGE BOOKS WITH ADVANCED PHOTO FRAMER & DRAG POSITION TOOL */}
      {activeTab === 'manage-books' && (
        <div id="tab-manage-books" className="space-y-6">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-600" />
              <span>{editBookId ? 'Edit Book Details & Photo Size' : 'Add New Book to Library'}</span>
            </h3>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Book Title: *
                </label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter complete book name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                />
              </div>

              {/* Price & MRP Calculator */}
              <div className="bg-white p-4 rounded-2xl border border-orange-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Calculator className="w-4 h-4 text-orange-600" />
                  <span>Price, MRP & Discount Percentage Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Book MRP / Original Price (₹):
                    </label>
                    <input
                      type="number"
                      value={bookOldPrice}
                      onChange={(e) => handleMrpChange(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-hidden focus:border-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Original Printed MRP</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-orange-600" />
                      <span>2. Discount %:</span>
                    </label>
                    <input
                      type="number"
                      value={bookDiscountPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 rounded-lg border-2 border-orange-400 bg-orange-50/40 text-sm font-bold text-orange-950 focus:outline-hidden focus:border-orange-600"
                    />
                    <span className="text-[10px] text-orange-700 block mt-0.5 font-medium">
                      Selling price auto-calculates from %
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1">
                      3. Final Selling Price (₹): *
                    </label>
                    <input
                      type="number"
                      required
                      value={bookPrice}
                      onChange={(e) => handleSellingPriceChange(e.target.value)}
                      placeholder="e.g. 400"
                      className="w-full px-3 py-2 rounded-lg border-2 border-emerald-400 bg-emerald-50/40 text-sm font-black text-emerald-950 focus:outline-hidden focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                      Final Price Customer Pays
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Quick %:</span>
                  {[10, 15, 20, 25, 30, 35, 40, 50].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleQuickPercentSelect(p)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        parseFloat(bookDiscountPercent) === p
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                  {bookDiscountPercent && (
                    <button
                      type="button"
                      onClick={() => handlePercentChange('')}
                      className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      Clear %
                    </button>
                  )}
                </div>

                {parsedMrp > 0 && parsedPrice > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center flex-wrap gap-2">
                    <span className="text-slate-600">
                      MRP: <strong>₹{parsedMrp}</strong> {parsedPerc > 0 && `• Discount: `}
                      {parsedPerc > 0 && (
                        <strong className="text-orange-600">{parsedPerc}% OFF</strong>
                      )}
                      {calculatedSavings > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          {' '}
                          (Save ₹{calculatedSavings})
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">
                      Customer Pays: ₹{parsedPrice}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity: *
                  </label>
                  <input
                    type="number"
                    required
                    value={bookStock}
                    onChange={(e) => setBookStock(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    💡 If stock is &lt; 10, customer will see "🔥 Only X left in stock!". If ≥ 10, it displays "In Stock".
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category:
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    placeholder="e.g. Novel, Islamic Books, Combo Sets..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                  />
                  <datalist id="category-suggestions">
                    {Array.from(new Set(books.map((b) => b.category).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                    <option value="Novel" />
                    <option value="Islamic Books" />
                    <option value="Literature & Poetry" />
                    <option value="Combo Sets" />
                    <option value="Academic & Career" />
                    <option value="Children & Teens" />
                    <option value="Science & Tech" />
                    <option value="General" />
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Novel', 'Islamic Books', 'Literature & Poetry', 'Combo Sets', 'Academic & Career', 'Children & Teens'].map((quickCat) => (
                      <button
                        key={quickCat}
                        type="button"
                        onClick={() => setBookCategory(quickCat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition-colors ${
                          bookCategory === quickCat
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        + {quickCat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1. Target Class & Competitive Exam Categorization (Feature #1) */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-blue-600" />
                    <span>Target Class & Exam Category (Class 1-12 & Govt Exams):</span>
                  </label>
                  {bookTargetClass && (
                    <button
                      type="button"
                      onClick={() => setBookTargetClass('')}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Clear Class
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  list="target-class-suggestions"
                  value={bookTargetClass}
                  onChange={(e) => setBookTargetClass(e.target.value)}
                  placeholder="e.g. Class 9-10 (Madhyamik), WBP & Police Exam, Primary TET..."
                  className="w-full px-3.5 py-2 rounded-xl border border-blue-300 bg-white text-sm focus:outline-hidden focus:border-blue-600 font-medium"
                />
                <datalist id="target-class-suggestions">
                  <option value="Class 1-5 (Primary)" />
                  <option value="Class 6-8 (Upper Primary)" />
                  <option value="Class 9-10 (Madhyamik)" />
                  <option value="Class 11-12 (Higher Secondary / HS)" />
                  <option value="WBP & Police Exam" />
                  <option value="Primary TET Exam" />
                  <option value="WBCS & PSC Exams" />
                  <option value="Railway & SSC Exams" />
                  <option value="GNM & ANM Nursing" />
                  <option value="Competitive Exam" />
                  <option value="Islamic & Madrasah" />
                </datalist>

                {/* Quick Presets for Bengali Medium & WB Competitive Exams */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Quick Select Class / Exam:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Class 1-5 (Primary)',
                      'Class 6-8 (Upper Primary)',
                      'Class 9-10 (Madhyamik)',
                      'Class 11-12 (Higher Secondary / HS)',
                      'WBP & Police Exam',
                      'Primary TET Exam',
                      'WBCS & PSC Exams',
                      'Railway & SSC Exams',
                      'GNM & ANM Nursing',
                    ].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setBookTargetClass(cls)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all ${
                          bookTargetClass === cls
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/60'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Combo Pack & Study Bundles Builder (Feature #2) */}
              <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="combo-pack-toggle"
                      checked={isBookCombo}
                      onChange={(e) => {
                        setIsBookCombo(e.target.checked);
                        if (e.target.checked && !bookComboBadge) {
                          setBookComboBadge('COMBO SET • SPECIAL DISCOUNT');
                        }
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="combo-pack-toggle" className="text-xs sm:text-sm font-black text-amber-950 cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Mark as Combo Pack / Study Bundle (Multiple Books in 1 Set)</span>
                    </label>
                  </div>
                  {isBookCombo && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                      Combo Enabled
                    </span>
                  )}
                </div>

                {isBookCombo && (
                  <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Combo Pack Tag / Ribbon Badge:
                      </label>
                      <input
                        type="text"
                        value={bookComboBadge}
                        onChange={(e) => setBookComboBadge(e.target.value)}
                        placeholder="e.g. MADHYAMIK ALL-IN-ONE BUNDLE (SAVE 35%)"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm font-bold text-amber-950 focus:outline-hidden focus:border-amber-600"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          'MADHYAMIK ALL-IN-ONE BUNDLE (SAVE 35%)',
                          'WBP POLICE COMPLETE SET (4 BOOKS)',
                          'PRIMARY TET MASTER COMBO',
                          'CLASS 11-12 SCIENCE KIT',
                        ].map((presetBadge) => (
                          <button
                            key={presetBadge}
                            type="button"
                            onClick={() => setBookComboBadge(presetBadge)}
                            className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer font-medium"
                          >
                            + {presetBadge}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Books Included in this Combo Set ({bookComboItems.length}):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComboItemInput}
                          onChange={(e) => setNewComboItemInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComboItem();
                            }
                          }}
                          placeholder="Type book name (e.g. Mathematics Guide + Solved Papers) and press Add"
                          className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm focus:outline-hidden focus:border-amber-600"
                        />
                        <button
                          type="button"
                          onClick={handleAddComboItem}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Book</span>
                        </button>
                      </div>

                      {/* Combo Items List */}
                      {bookComboItems.length > 0 ? (
                        <div className="space-y-1.5 pt-2">
                          {bookComboItems.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 text-xs text-amber-950 font-semibold shadow-2xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                                  {itemIdx + 1}
                                </span>
                                <span>{item}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveComboItem(itemIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                title="Remove item"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 block mt-1">
                          💡 Add list of individual books included in this combo (customers love seeing complete itemized contents).
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ADVANCED PHOTO RESIZER, DRAG & FIT TOOL */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs sm:text-sm uppercase tracking-wider">
                    <Crop className="w-4 h-4 text-indigo-600" />
                    <span>Book Photo Size, Zoom & Drag Position Tool</span>
                  </div>
                  {bookImgPreview && (
                    <button
                      type="button"
                      onClick={() => setShowImageAdjuster(!showImageAdjuster)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      {showImageAdjuster ? 'Hide Resizer Controls' : 'Open Photo Size Controls (Resize & Crop)'}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload Book Cover Image: *
                  </label>
                  <input
                    type="file"
                    ref={bookFileInputRef}
                    accept="image/*"
                    onChange={handleBookFileChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                  />
                </div>

                {/* Interactive Tool Suite */}
                {(bookImgPreview || rawUploadedImage) && (
                  <div className="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Controls Column */}
                      <div className="md:col-span-7 space-y-3.5">
                        {/* 1. Zoom Slider + Quick Buttons */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                            <span className="flex items-center gap-1 text-indigo-950">
                              <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Photo Scale / Zoom (Resize / Crop):</span>
                            </span>
                            <span className="text-indigo-700 font-mono font-black">{imgScale}%</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setImgScale((s) => Math.max(30, s - 10))}
                              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="range"
                              min="30"
                              max="260"
                              value={imgScale}
                              onChange={(e) => setImgScale(Number(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-indigo-200 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setImgScale((s) => Math.min(260, s + 10))}
                              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Zoom presets */}
                          <div className="flex items-center gap-1.5 pt-1.5">
                            <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                            {[60, 80, 100, 120, 150, 180].map((scaleVal) => (
                              <button
                                key={scaleVal}
                                type="button"
                                onClick={() => setImgScale(scaleVal)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                  imgScale === scaleVal
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {scaleVal}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Position X & Y Sliders */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                              <span>Left / Right:</span>
                              <span className="text-slate-500 font-mono">{imgOffsetX}px</span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              value={imgOffsetX}
                              onChange={(e) => setImgOffsetX(Number(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                              <span>Up / Down:</span>
                              <span className="text-slate-500 font-mono">{imgOffsetY}px</span>
                            </div>
                            <input
                              type="range"
                              min="-60"
                              max="60"
                              value={imgOffsetY}
                              onChange={(e) => setImgOffsetY(Number(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* 3. Fit Mode & Rotation */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-xs font-bold text-slate-700">Fit Mode:</span>
                          {(['cover', 'contain', 'fill'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setImgFitMode(mode)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize border cursor-pointer transition-colors ${
                                imgFitMode === mode
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {mode === 'cover' ? 'Full Cover' : mode === 'contain' ? 'Fit Inside' : 'Stretch'}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setImgRotation((r) => (r + 90) % 360)}
                            className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Rotate 90 degrees"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Rotate ({imgRotation}°)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setImgScale(100);
                              setImgOffsetX(0);
                              setImgOffsetY(0);
                              setImgRotation(0);
                              setImgFitMode('cover');
                            }}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Live Realistic Preview Box (With Drag Support) */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center select-none">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Move className="w-3 h-3 text-indigo-400" />
                          <span>Live Frame (Drag to Reposition)</span>
                        </span>

                        <div
                          onMouseDown={handlePreviewMouseDown}
                          onMouseMove={handlePreviewMouseMove}
                          onMouseUp={handlePreviewMouseUp}
                          onMouseLeave={handlePreviewMouseUp}
                          className="w-36 h-48 sm:w-44 sm:h-56 bg-slate-800 rounded-xl overflow-hidden border-2 border-indigo-400/70 shadow-2xl relative flex items-center justify-center cursor-move group"
                          title="Click and drag to reposition image"
                        >
                          <img
                            src={bookImgPreview}
                            alt="Preview"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                              Drag to move
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-emerald-400 font-bold mt-2">
                          ✓ High resolution 3:4 aspect ratio ready
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Book Description / Synopsis:
                </label>
                <textarea
                  rows={2}
                  value={bookDesc}
                  onChange={(e) => setBookDesc(e.target.value)}
                  placeholder="Enter brief description of this book"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: settings.accentColor || '#FF5722' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>{editBookId ? 'Update Book' : 'Add Book to Catalog'}</span>
                </button>

                {editBookId && (
                  <button
                    type="button"
                    onClick={resetBookForm}
                    className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Cancel Edit</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Book Catalog Table */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Existing Books ({books.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr
                    className="text-white"
                    style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
                  >
                    <th className="p-3">Cover</th>
                    <th className="p-3">Title & Category</th>
                    <th className="p-3">MRP & Discount</th>
                    <th className="p-3">Selling Price</th>
                    <th className="p-3">Stock Count</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {books.map((b) => {
                    const hasDiscount = b.oldPrice && b.oldPrice > b.price;
                    const discountPerc = hasDiscount
                      ? Math.round(((b.oldPrice! - b.price) / b.oldPrice!) * 100)
                      : 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <img
                            src={b.img}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-xs"
                          />
                        </td>
                        <td className="p-3 font-semibold text-slate-900 max-w-[200px]">
                          <span className="block truncate">{b.title}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {b.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3">
                          {hasDiscount ? (
                            <div>
                              <span className="line-through text-slate-400 text-xs block">
                                ₹{b.oldPrice}
                              </span>
                              <span className="text-orange-600 font-bold text-xs block">
                                {discountPerc}% OFF
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">No discount</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-emerald-800 text-sm">₹{b.price}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                              b.stock > 0
                                ? b.stock < 10
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.stock > 0 ? `${b.stock} copies (Admin)` : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleStartEditBook(b)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Edit details / resize photo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteBook(b.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VISITOR INTEREST & BOOK VIEWS ANALYTICS */}
      {activeTab === 'visitor-analytics' && (
        <VisitorAnalyticsTab
          books={books}
          settings={settings}
          onEditBook={(b) => {
            handleStartEditBook(b);
            setActiveTab('manage-books');
          }}
        />
      )}

      {/* TAB 2: REGISTERED CUSTOMERS / VISITOR DIRECTORY */}
      {activeTab === 'registered-users' && (
        <div id="tab-registered-users" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Registered Website Visitors & Customer Directory ({registeredUsers.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                All users who logged in or entered their phone number across all devices & sessions
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by customer name, phone, district..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs w-64 focus:outline-hidden focus:border-slate-800"
              />
              <button
                type="button"
                onClick={handleExportUsersCSV}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                title="Export contacts as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
              <span className="text-xs text-emerald-800 font-bold block">Total Registered Customers</span>
              <span className="text-2xl font-black text-emerald-950 font-mono">
                {registeredUsers.length}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5">
              <span className="text-xs text-blue-800 font-bold block">Customers with Orders</span>
              <span className="text-2xl font-black text-blue-950 font-mono">
                {registeredUsers.filter((u) => (u.totalOrdersCount || 0) > 0).length}
              </span>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5">
              <span className="text-xs text-orange-800 font-bold block">Active Phone Records</span>
              <span className="text-2xl font-black text-orange-950 font-mono">
                {registeredUsers.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="text-white"
                  style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
                >
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile / WhatsApp</th>
                  <th className="p-3 text-center">🪙 Super Coins</th>
                  <th className="p-3">First Registered</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Saved Address</th>
                  <th className="p-3 text-center">Orders Count</th>
                  <th className="p-3 text-right">Quick Contact Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                      No registered visitors found. When new customers visit the site and log in with name & phone, they will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>+91 {user.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(user.phone)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy number"
                          >
                            {copiedUserPhone === user.phone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-900 font-mono font-bold text-xs">
                          <span>🪙 {user.coins || 0}</span>
                          <span className="text-[10px] text-amber-700 font-sans">
                            (₹{((user.coins || 0) / 10).toFixed(1)})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoinsUser(user);
                              setCustomCoinsValue(String(user.coins || 0));
                            }}
                            className="ml-1 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                            title="Edit Super Coins for this user"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{user.registeredAt}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{user.lastLoginAt}</td>
                      <td className="p-3 text-slate-600 max-w-[180px] truncate">
                        {user.village ? `${user.village}, ${user.district || ''} - ${user.pincode || ''}` : 'Not provided yet'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            (user.totalOrdersCount || 0) > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {user.totalOrdersCount || 0} Orders
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenUserWhatsApp(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:brightness-105 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                          title="Chat with customer on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <a
                          href={`tel:+91${user.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                          title="Call customer directly"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        {onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => onDeleteUser(user.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remove user log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MANAGE COUPONS & DISCOUNTS */}
      {activeTab === 'manage-coupons' && (
        <div id="tab-manage-coupons" className="space-y-6">
          {/* Global Checkout Coupon Visibility Controller */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-purple-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {settings.hideAllCoupons ? (
                  <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <Eye className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <span className="text-sm font-black text-slate-900">
                  Checkout Coupon Visibility
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings.hideAllCoupons ? (
                  <strong className="text-amber-800">
                    Coupons are currently hidden at checkout. Customers can still type coupon codes manually.
                  </strong>
                ) : (
                  <strong className="text-emerald-800">
                    Coupons are visible at checkout. Customers can view and apply available discount codes.
                  </strong>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalHideCoupons}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 ${
                settings.hideAllCoupons
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {settings.hideAllCoupons ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Unhide All Coupons (Make Visible to All)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide All Coupons (Hide from Storefront)</span>
                </>
              )}
            </button>
          </div>

          {/* Add / Edit Coupon Form */}
          <div className="bg-purple-50/50 p-4 sm:p-5 rounded-2xl border border-purple-200">
            <h3 className="text-base font-bold text-purple-950 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                <span>{editingCouponId ? 'Edit Coupon Code' : 'Create New Discount Coupon'}</span>
              </div>
              {editingCouponId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCouponId(null);
                    setCouponCode('');
                    setCouponValue('');
                    setCouponMinOrder('0');
                    setCouponDesc('');
                    setCouponIsHidden(false);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coupon Code: *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. WELCOME50, SPECIAL100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono font-black uppercase bg-white focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type: *
                  </label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as 'flat' | 'percentage')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white focus:outline-hidden focus:border-purple-600"
                  >
                    <option value="flat">Flat Discount (₹ Cash OFF)</option>
                    <option value="percentage">Percentage Discount (% OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {couponType === 'flat' ? 'Discount Amount (₹): *' : 'Discount Percentage (%): *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={couponType === 'percentage' ? 90 : 5000}
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    placeholder={couponType === 'flat' ? 'e.g. 50' : 'e.g. 15'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Value (₹):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    placeholder="0 for any order"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white focus:outline-hidden focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description (shown to customer):
                  </label>
                  <input
                    type="text"
                    value={couponDesc}
                    onChange={(e) => setCouponDesc(e.target.value)}
                    placeholder="e.g. Special Offer: ₹50 Instant Discount on all Books"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={couponIsHidden}
                      onChange={(e) => setCouponIsHidden(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>🔒 Hide from Checkout List (Secret Coupon Only)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={couponIsPublic}
                      onChange={(e) => setCouponIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>📢 Show on Top Announcement Banner</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{editingCouponId ? 'Update Coupon' : 'Save & Activate Coupon'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Coupons List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                <span>Active Store Coupons ({coupons.length})</span>
              </h3>
              <input
                type="text"
                placeholder="Search coupons..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs w-56 focus:outline-hidden focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {coupons
                .filter((c) =>
                  couponSearch ? c.code.toLowerCase().includes(couponSearch.toLowerCase()) : true
                )
                .map((coupon) => {
                  const isGloballyHidden = settings.hideAllCoupons;
                  const isCouponHidden = coupon.isHidden || isGloballyHidden;
                  return (
                    <div
                      key={coupon.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        coupon.isActive
                          ? 'bg-white border-purple-200 shadow-xs'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-900 px-2.5 py-1 rounded-xl font-mono font-black text-sm border border-purple-300">
                          <Ticket className="w-3.5 h-3.5 text-purple-600" />
                          <span>{coupon.code}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponHidden(coupon)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                              coupon.isHidden
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                                : 'bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300'
                            }`}
                            title="Click to toggle Hide / Unhide in checkout"
                          >
                            {coupon.isHidden ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hidden</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Visible</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(coupon)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                              coupon.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {coupon.isActive ? '● Active' : '○ Inactive'}
                          </button>
                        </div>
                      </div>

                      <div className="text-lg font-black text-slate-900 mb-1">
                        {coupon.discountType === 'flat'
                          ? `₹${coupon.discountValue} FLAT OFF`
                          : `${coupon.discountValue}% OFF`}
                      </div>

                      <p className="text-xs text-slate-600 mb-2">
                        {coupon.description || 'Valid on all library books.'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Min Order: {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'None'}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponHidden(coupon)}
                            className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title={coupon.isHidden ? 'Unhide for customers' : 'Hide from customers'}
                          >
                            {coupon.isHidden ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                            className="p-1 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded cursor-pointer"
                            title="Edit coupon"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCouponItem(coupon.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {coupons.length === 0 && (
                <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs italic">
                  No coupons created yet. Create your first coupon above (e.g. WELCOME50 for ₹50 discount).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS & TRACKING LINK SENDER */}
      {activeTab === 'view-orders' && (
        <div id="tab-view-orders" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Orders & Tracking Links ({orders.length})
              </h3>
              <span className="text-xs text-slate-500">
                Add courier tracking links and send 1-click WhatsApp tracking link to customers
              </span>
            </div>
            <input
              type="text"
              placeholder="Search by customer, book or phone..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs w-64 focus:outline-hidden focus:border-slate-800"
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="text-white"
                  style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
                >
                  <th className="p-2.5">Date & ID</th>
                  <th className="p-2.5">Customer & Phone</th>
                  <th className="p-2.5">Book Title</th>
                  <th className="p-2.5">Amount</th>
                  <th className="p-2.5">Address</th>
                  <th className="p-2.5">Payment</th>
                  <th className="p-2.5 text-center">Receipt Check</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Courier Link & WhatsApp Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                      No customer orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-2.5 whitespace-nowrap text-slate-500">
                        <span className="font-bold text-slate-900 block font-mono">#{ord.id}</span>
                        <span className="text-[10px] text-slate-400">{ord.date}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                        <span className="font-mono text-slate-600 text-[11px]">{ord.phone}</span>
                      </td>
                      <td className="p-2.5 text-slate-800 font-semibold max-w-[130px] truncate">
                        {ord.bookTitle}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900">₹{ord.totalAmount}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-[170px]">
                        {ord.village}, PO: {ord.po}, Dist: {ord.district}, PIN: {ord.pincode}
                        {ord.landmark ? ` (Near: ${ord.landmark})` : ''}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] inline-block ${
                            ord.paymentMethod === 'UPI Prepaid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {ord.paymentScreenshot ? (
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(ord.paymentScreenshot!)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
                            title="Click to inspect and verify payment slip"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verify Slip</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {ord.paymentMethod === 'COD' ? 'COD (No slip)' : 'None'}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <select
                          value={ord.orderStatus || 'Confirmed'}
                          onChange={(e) =>
                            handleStatusChange(ord, e.target.value as OrderDeliveryStatus)
                          }
                          className="px-2 py-1 bg-white border border-slate-300 rounded-md text-[10px] font-bold focus:outline-hidden focus:border-slate-800 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {ord.trackingUrl && (
                          <span className="text-[9px] text-blue-600 block mt-0.5 font-semibold">
                            ✓ Link Added
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenTrackingModal(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                          title="Add or update courier tracking link for this order"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>{ord.trackingUrl ? 'Edit Link' : '+ Add Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendQuickTrackingLink(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:brightness-105 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                          title="Send tracking link to customer on WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyTrackingLink(ord)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                          title="Copy tracking link"
                        >
                          {copiedOrderId === ord.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedOrderId === ord.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal to Add / Edit Courier Tracking Link */}
          {editingTrackingOrder && (
            <div
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
              onClick={() => setEditingTrackingOrder(null)}
            >
              <div
                className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-base">
                      Courier Tracking Link for #{editingTrackingOrder.id}
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingTrackingOrder(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveTrackingLink} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Courier Tracking URL / Link:
                    </label>
                    <input
                      type="url"
                      value={modalTrackingUrl}
                      onChange={(e) => setModalTrackingUrl(e.target.value)}
                      placeholder="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Customer can click this link on their tracking screen to track their parcel.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tracking / AWB Number:
                      </label>
                      <input
                        type="text"
                        value={modalTrackingNumber}
                        onChange={(e) => setModalTrackingNumber(e.target.value)}
                        placeholder="e.g. EW123456789IN"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Courier Partner Name:
                      </label>
                      <input
                        type="text"
                        value={modalCourierName}
                        onChange={(e) => setModalCourierName(e.target.value)}
                        placeholder="e.g. India Post / DTDC"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Status:
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as OrderDeliveryStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-bold focus:outline-hidden focus:border-slate-800"
                    >
                      <option value="Confirmed">Confirmed & Packed</option>
                      <option value="Dispatched">Dispatched / Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Save Courier Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTrackingOrder(null)}
                      className="py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Screenshot Modal Viewer */}
          {previewScreenshot && (
            <div
              className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
              onClick={() => setPreviewScreenshot(null)}
            >
              <div
                className="bg-white rounded-2xl p-4 max-w-md w-full max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">UPI Payment Screenshot Inspection</h4>
                  </div>
                  <button
                    onClick={() => setPreviewScreenshot(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-center bg-slate-950 rounded-xl overflow-hidden p-2 border border-slate-800">
                  <img
                    src={previewScreenshot}
                    alt="Payment Screenshot"
                    className="max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Store UPI Receiver:</span>
                    <span className="font-mono">{settings.upiId || STORE_CONTACT.upiId}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Check if the screenshot clearly displays the transferred amount and matches the store's UPI ID.
                  </p>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <a
                    href={previewScreenshot}
                    download="payment_screenshot.jpg"
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Download Slip Image
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewScreenshot(null)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-slate-800"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE BANNERS & BANNER SIZING CONTROLS */}
      {activeTab === 'manage-banners' && (
        <div id="tab-manage-banners" className="space-y-6">
          {/* 1. Global Banner Sizing & Display Studio */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3
                  className="text-base sm:text-lg font-bold flex items-center gap-2"
                  style={{ color: settings.primaryColor || '#0B1B3D' }}
                >
                  <Sliders className="w-5 h-5 text-orange-600" />
                  <span>Banner Size & Display Settings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Control the height, proportions, image fitting, and corner curvature of your store's banner slider.
                </p>
              </div>

              {bannerSavedNotification && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Banner Settings Saved!</span>
                </div>
              )}
            </div>

            {/* Banner Size Selection Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Choose Banner Height / Size:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  {
                    id: 'compact',
                    label: 'Compact',
                    heightLabel: '180px',
                    desc: 'Small & Sleek',
                    icon: '📱',
                  },
                  {
                    id: 'standard',
                    label: 'Standard',
                    heightLabel: '280px',
                    desc: 'Balanced Default',
                    icon: '🖼️',
                  },
                  {
                    id: 'large',
                    label: 'Large',
                    heightLabel: '380px',
                    desc: 'Prominent Showcase',
                    icon: '🌟',
                  },
                  {
                    id: 'hero',
                    label: 'Hero',
                    heightLabel: '460px',
                    desc: 'Full Hero Billboard',
                    icon: '🚀',
                  },
                  {
                    id: 'custom',
                    label: 'Custom',
                    heightLabel: `${bannerCustomHeight}px`,
                    desc: 'Manual Pixel Sliders',
                    icon: '⚙️',
                  },
                ].map((preset) => {
                  const isSelected = bannerSize === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBannerSize(preset.id as BannerSize)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-50/80 border-orange-500 shadow-sm ring-1 ring-orange-400'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{preset.icon}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {preset.heightLabel}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-bold text-slate-900">{preset.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {preset.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Height Sliders (Desktop & Mobile) */}
            {bannerSize === 'custom' && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5">
                      <span>Desktop / Laptop Height:</span>
                      <span className="text-orange-700 font-mono font-bold text-sm">
                        {bannerCustomHeight}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="120"
                        max="600"
                        step="10"
                        value={bannerCustomHeight}
                        onChange={(e) => setBannerCustomHeight(Number(e.target.value))}
                        className="flex-1 accent-orange-600 cursor-pointer h-2 bg-orange-200 rounded-lg"
                      />
                      <input
                        type="number"
                        min="120"
                        max="600"
                        value={bannerCustomHeight}
                        onChange={(e) => setBannerCustomHeight(Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-orange-300 rounded-lg text-xs font-mono font-bold bg-white text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5">
                      <span>Mobile Device Height:</span>
                      <span className="text-orange-700 font-mono font-bold text-sm">
                        {bannerCustomHeightMobile}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="100"
                        max="380"
                        step="10"
                        value={bannerCustomHeightMobile}
                        onChange={(e) => setBannerCustomHeightMobile(Number(e.target.value))}
                        className="flex-1 accent-orange-600 cursor-pointer h-2 bg-orange-200 rounded-lg"
                      />
                      <input
                        type="number"
                        min="100"
                        max="380"
                        value={bannerCustomHeightMobile}
                        onChange={(e) => setBannerCustomHeightMobile(Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-orange-300 rounded-lg text-xs font-mono font-bold bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Banner Fit & Corner Curvature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Fit Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Photo Fitting Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cover', label: 'Cover', desc: 'Fill Frame (Crop)' },
                    { id: 'contain', label: 'Contain', desc: 'Full Photo (Fit)' },
                    { id: 'fill', label: 'Stretch', desc: 'Exact Fill' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBannerFit(mode.id as BannerFit)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        bannerFit === mode.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{mode.label}</div>
                      <div className="text-[10px] opacity-75">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Curvature */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Corner Curvature (Border Radius):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'none', label: 'Sharp', radius: '0px' },
                    { id: 'md', label: 'Rounded', radius: '8px' },
                    { id: '2xl', label: 'Card 2XL', radius: '16px' },
                    { id: 'full', label: 'Pill / 3XL', radius: '24px' },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => setBannerRadius(rad.id as BannerRadius)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        bannerRadius === rad.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{rad.label}</div>
                      <div className="text-[10px] opacity-75">{rad.radius}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Store Banner Slider Preview */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-orange-600" />
                  <span>Live Store Banner Preview (Customer View):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {bannerSize.toUpperCase()} • Fit: {bannerFit.toUpperCase()} • Radius:{' '}
                  {bannerRadius.toUpperCase()}
                </span>
              </div>

              <div
                className={`w-full overflow-hidden bg-slate-950 border border-slate-300 shadow-inner flex items-center justify-center transition-all relative ${
                  bannerRadius === 'none'
                    ? 'rounded-none'
                    : bannerRadius === 'md'
                    ? 'rounded-lg'
                    : bannerRadius === '2xl'
                    ? 'rounded-2xl'
                    : 'rounded-3xl'
                }`}
                style={{
                  height:
                    bannerSize === 'compact'
                      ? '160px'
                      : bannerSize === 'standard'
                      ? '220px'
                      : bannerSize === 'large'
                      ? '280px'
                      : bannerSize === 'hero'
                      ? '340px'
                      : `${Math.min(340, bannerCustomHeight)}px`,
                }}
              >
                {banners.length > 0 ? (
                  <img
                    src={banners[0].img}
                    alt="Live Banner Preview"
                    className="w-full h-full"
                    style={{
                      objectFit:
                        bannerFit === 'contain'
                          ? 'contain'
                          : bannerFit === 'fill'
                          ? 'fill'
                          : 'cover',
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs">No banners uploaded yet</span>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                  Live Sizing Preview
                </div>
              </div>
            </div>

            {/* Save Display Settings Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveBannerDisplaySettings()}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:brightness-110"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Banner Display Settings</span>
              </button>
            </div>
          </div>

          {/* 2. Add / Upload New Banner with Interactive Photo Resizer / Scaler Tool */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Add New Slider Banner Photo</span>
            </h3>

            <form onSubmit={handleBannerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Banner Photo (Direct File Upload): *
                </label>
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                />
              </div>

              {/* Interactive Banner Photo Resizer / Zoom Tool */}
              {(bannerImgPreview || rawUploadedBanner) && (
                <div className="bg-orange-50/70 p-4 sm:p-5 rounded-2xl border border-orange-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Crop className="w-4 h-4 text-orange-600" />
                      <span>Interactive Banner Photo Resizer & Scaler Tool:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBannerScale(100);
                        setBannerOffsetX(0);
                        setBannerOffsetY(0);
                        setBannerFitMode('cover');
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Reset Adjustments
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Controls */}
                    <div className="md:col-span-7 space-y-3.5">
                      {/* Zoom Slider */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                          <span className="flex items-center gap-1 text-orange-950">
                            <ZoomIn className="w-3.5 h-3.5 text-orange-600" />
                            <span>Photo Scale / Zoom (Resize / Crop):</span>
                          </span>
                          <span className="text-orange-700 font-mono font-black">{bannerScale}%</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBannerScale((s) => Math.max(30, s - 10))}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="range"
                            min="30"
                            max="260"
                            value={bannerScale}
                            onChange={(e) => setBannerScale(Number(e.target.value))}
                            className="flex-1 accent-orange-600 cursor-pointer h-2 bg-orange-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setBannerScale((s) => Math.min(260, s + 10))}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                          {[60, 80, 100, 120, 150, 180].map((scaleVal) => (
                            <button
                              key={scaleVal}
                              type="button"
                              onClick={() => setBannerScale(scaleVal)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                bannerScale === scaleVal
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {scaleVal}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Position X & Y */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                            <span>Left / Right Shift:</span>
                            <span className="text-slate-500 font-mono">{bannerOffsetX}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            value={bannerOffsetX}
                            onChange={(e) => setBannerOffsetX(Number(e.target.value))}
                            className="w-full accent-orange-600 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                            <span>Up / Down Shift:</span>
                            <span className="text-slate-500 font-mono">{bannerOffsetY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            value={bannerOffsetY}
                            onChange={(e) => setBannerOffsetY(Number(e.target.value))}
                            className="w-full accent-orange-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Fit Mode */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-xs font-bold text-slate-700">Fit Mode:</span>
                        {(['cover', 'contain', 'fill'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setBannerFitMode(mode)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize border cursor-pointer transition-colors ${
                              bannerFitMode === mode
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {mode === 'cover' ? 'Full Cover' : mode === 'contain' ? 'Fit Inside' : 'Stretch'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="md:col-span-5 flex flex-col items-center">
                      <div className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden border-2 border-orange-300 relative shadow-md flex items-center justify-center">
                        <img
                          src={bannerImgPreview}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                          Aspect 12:5
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 text-center mt-1">
                        High definition canvas output ready for store slider
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition-all cursor-pointer hover:brightness-110"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              >
                <Plus className="w-4 h-4" />
                <span>Upload & Publish Banner to Store</span>
              </button>
            </form>
          </div>

          {/* 3. Active Store Banners */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>Active Store Slider Banners ({banners.length})</span>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                Click Remove to delete any banner from the slider
              </span>
            </h3>

            {banners.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No active banners in your store slider.</p>
                <span className="text-[11px] text-slate-400">
                  Upload a photo above to display it on the homepage carousel.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((ban, index) => (
                  <div
                    key={ban.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 relative group overflow-hidden shadow-xs"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 h-36">
                      <img
                        src={ban.img}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Slide #{index + 1}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono">ID: {ban.id}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBanner(ban.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS, UPI, SOCIAL & 2FA ADMIN SECURITY */}
      {activeTab === 'store-settings' && (
        <div id="tab-store-settings">
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 max-w-2xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-600" />
                <span>Store Customization, UPI ID & Security Settings</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage your store details, branding, UPI ID, and password verification.
              </p>
            </div>

            {/* Admin Password Change Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Admin Security PIN & Password</h4>
                    <span className="text-xs text-slate-400">
                      Protected with 2-Factor OTP to <strong>+91 {adminPhoneTarget}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              {/* 1. Basic Store Branding */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Store Title, Subtitle & Top Announcement Bar
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Main Title: *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Subtitle / Tagline:
                  </label>
                  <input
                    type="text"
                    value={storeSub}
                    onChange={(e) => setStoreSub(e.target.value)}
                    placeholder="e.g., BOOK STORE"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Top Offer / Announcement Notice:
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => {
                      setAnnouncementText(e.target.value);
                      if (e.target.value) setShowAnnouncement(true);
                    }}
                    placeholder="e.g., Free delivery on all book orders today!"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="show-announcement-toggle"
                    checked={showAnnouncement}
                    onChange={(e) => setShowAnnouncement(e.target.checked)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="show-announcement-toggle"
                    className="text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Enable Top Announcement Bar on Website
                  </label>
                </div>
              </div>

              {/* 2. Payment Gateway & Payment Methods Configuration */}
              <div className="space-y-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/50 p-5 rounded-2xl border-2 border-indigo-200/90 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm uppercase tracking-wider">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>Payment Gateway & Checkout Methods (পেমেন্ট গেটওয়ে সেটিংস)</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full border border-indigo-200 w-fit">
                    Razorpay • Direct UPI • COD
                  </span>
                </div>

                {/* Gateway 1: Online Payment Gateway (Cashfree / Razorpay / Cards / NetBanking / All UPI Apps / Wallets) */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${enablePaymentGateway ? 'bg-white border-indigo-400 shadow-sm' : 'bg-slate-100/80 border-slate-200 opacity-80'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        💳
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                            Online Payment Gateway (Cashfree / Instant Gateway)
                          </h5>
                          {enablePaymentGateway && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
                              ACTIVE (চালু আছে)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Cashfree / Cards, NetBanking, Paytm, Google Pay, PhonePe, Cred &amp; Wallets
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={enablePaymentGateway}
                        onChange={(e) => setEnablePaymentGateway(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {enablePaymentGateway && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                      {/* Provider Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          পেমেন্ট গেটওয়ে প্রোভাইডার নির্বাচন করুন (Select Gateway Provider):
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPaymentGatewayProvider('Cashfree')}
                            className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                              paymentGatewayProvider === 'Cashfree'
                                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">⚡</span>
                              <div>
                                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                                  Cashfree Payments
                                </span>
                                <span className="text-[10px] text-indigo-700 font-semibold">
                                  UPI, Cards & NetBanking (Recommended)
                                </span>
                              </div>
                            </div>
                            {paymentGatewayProvider === 'Cashfree' && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentGatewayProvider('Razorpay')}
                            className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                              paymentGatewayProvider === 'Razorpay'
                                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">💳</span>
                              <div>
                                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                                  Razorpay Gateway
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Standard Razorpay Checkout
                                </span>
                              </div>
                            </div>
                            {paymentGatewayProvider === 'Razorpay' && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Cashfree Configuration Fields */}
                      {paymentGatewayProvider === 'Cashfree' && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-indigo-600" />
                              Cashfree Credentials &amp; Mode (ক্যাশফ্রি সেটিংস)
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-bold text-slate-700">Environment:</label>
                              <select
                                value={cashfreeEnvironment}
                                onChange={(e) => setCashfreeEnvironment(e.target.value as any)}
                                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 font-bold bg-white focus:outline-hidden"
                              >
                                <option value="production">🟢 Production (Live Mode)</option>
                                <option value="sandbox">🟡 Sandbox (Test Mode)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Cashfree App ID / Client ID: *
                              </label>
                              <input
                                type="text"
                                value={cashfreeAppId}
                                onChange={(e) => setCashfreeAppId(e.target.value)}
                                placeholder={
                                  cashfreeEnvironment === 'production'
                                    ? 'e.g. CF_LIVE_xxxxxxxx or 102938...'
                                    : 'e.g. TEST1029384756...'
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                              />
                              <span className="text-[11px] text-slate-500 block mt-1">
                                Cashfree Merchant Dashboard &gt; Developers &gt; API Keys থেকে App ID কপি করুন।
                              </span>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Cashfree Secret Key (Client Secret): *
                              </label>
                              <div className="relative">
                                <input
                                  type={showCashfreeSecret ? 'text' : 'password'}
                                  value={cashfreeSecretKey}
                                  onChange={(e) => setCashfreeSecretKey(e.target.value)}
                                  placeholder="e.g. cfsk_ma_live_... or test secret"
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCashfreeSecret(!showCashfreeSecret)}
                                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                  {showCashfreeSecret ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-1">
                                গোপন Secret Key সম্পূর্ণ নিরাপদে সার্ভারে সংরক্ষিত থাকবে।
                              </span>
                            </div>
                          </div>

                          {/* Cashfree Connection Testing Action Bar */}
                          <div className="p-3.5 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>API Key Connection Tester (কী সচল আছে কিনা টেস্ট করুন)</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Test App ID &amp; Secret Key against Cashfree {cashfreeEnvironment === 'production' ? 'Live Production' : 'Sandbox Test'} server.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleTestCashfreeConnection}
                              disabled={isTestingCashfree}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                            >
                              {isTestingCashfree ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Testing Connection...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Test &amp; Verify Keys</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Test Result Message */}
                          {cashfreeTestResult && (
                            <div
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                                cashfreeTestResult.success
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-rose-50 border-rose-300 text-rose-900'
                              }`}
                            >
                              {cashfreeTestResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <p className="font-bold">
                                  {cashfreeTestResult.success
                                    ? 'Cashfree API Verification Successful!'
                                    : 'Cashfree API Verification Failed'}
                                </p>
                                <p className="text-[11px] mt-0.5 leading-relaxed">
                                  {cashfreeTestResult.message}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Step-by-step Help Guide for Cashfree */}
                          <div className="p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                            <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                              <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Cashfree App ID &amp; Secret Key পাওয়ার সহজ নিয়ম:</span>
                            </p>
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-indigo-900/90 leading-relaxed">
                              <li>
                                <strong>Cashfree Dashboard</strong>-এ লগইন করুন:{' '}
                                <a
                                  href="https://merchant.cashfree.com"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 underline font-bold"
                                >
                                  merchant.cashfree.com
                                </a>
                              </li>
                              <li>
                                বামদিকের মেনু থেকে <strong>Payment Gateway &gt; Developers &gt; API Keys</strong>-এ ক্লিক করুন।
                              </li>
                              <li>
                                সেখান থেকে <strong>App ID</strong> এবং <strong>Secret Key</strong> কপি করে উপরের ঘরে পেস্ট করে নিচে "Save All Settings" বাটনে ক্লিক করুন।
                              </li>
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Razorpay Configuration Fields */}
                      {paymentGatewayProvider === 'Razorpay' && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Razorpay Key ID (লাইভ বা টেস্ট কী আইডি):
                            </label>
                            <input
                              type="text"
                              value={razorpayKeyId}
                              onChange={(e) => setRazorpayKeyId(e.target.value)}
                              placeholder="e.g. rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                              className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 font-mono text-xs sm:text-sm bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Enter your Key ID from{' '}
                              <a
                                href="https://dashboard.razorpay.com/#/access/api_keys"
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 underline font-bold"
                              >
                                Razorpay Dashboard &gt; Settings &gt; API Keys
                              </a>
                              .
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Instant Discount on Online Payment */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Instant Discount on Online Payments (% ছাড়):
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={gatewayDiscountPercentage}
                            onChange={(e) => setGatewayDiscountPercentage(Number(e.target.value))}
                            placeholder="e.g. 5"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:border-indigo-600"
                          />
                          <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">% OFF</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          কাস্টমাররা অনলাইন গেটওয়ে দিয়ে পে করলে অতিরিক্ত {gatewayDiscountPercentage}% ছাড় পাবেন।
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gateway 2: Direct UPI QR Code & Instant UPI Apps (Google Pay, PhonePe, Paytm) */}
                <div className={`p-4 rounded-xl border-2 transition-all ${enableUpiQrPrepaid ? 'bg-white border-emerald-400 shadow-sm' : 'bg-slate-100/80 border-slate-200 opacity-80'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        📱
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">
                            Direct UPI QR Code &amp; UPI App Transfer (সরাসরি ইউপিআই)
                          </h5>
                          {enableUpiQrPrepaid && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
                              ACTIVE (চালু আছে)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Scan Dynamic QR Code or tap to pay via PhonePe / GPay / Paytm with screenshot verification
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={enableUpiQrPrepaid}
                        onChange={(e) => setEnableUpiQrPrepaid(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {enableUpiQrPrepaid && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Store Primary UPI ID: *
                        </label>
                        <input
                          type="text"
                          required={enableUpiQrPrepaid}
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. 8001743646@nyes or bookstore@oksbi"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 bg-white text-sm font-mono font-bold focus:outline-hidden focus:border-emerald-700"
                        />
                        <span className="text-[11px] text-emerald-800 block mt-1">
                          💡 Whatever UPI ID you set here will be automatically embedded in dynamic QR codes and customer payment links.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gateway 3: Cash on Delivery (COD) */}
                <div className={`p-4 rounded-xl border-2 transition-all ${enableCod ? 'bg-white border-amber-400 shadow-sm' : 'bg-slate-100/80 border-slate-200 opacity-80'}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        🚚
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">
                            Cash on Delivery (ক্যাশ অন ডেলিভারি - COD)
                          </h5>
                          {enableCod && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-300">
                              ACTIVE (চালু আছে)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Customers pay cash to the courier delivery agent upon receiving their parcel
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={enableCod}
                        onChange={(e) => setEnableCod(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                {/* Delivery Charges Configuration (Online Payment vs COD) */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <h5 className="font-bold text-slate-900 text-sm">
                      Delivery Charges (ডেলিভারি চার্জ নির্ধারণ করুন)
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-1">
                        Online Payment / UPI Delivery Charge (₹):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={onlineDeliveryCharge}
                          onChange={(e) => setOnlineDeliveryCharge(Number(e.target.value))}
                          placeholder="50"
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-indigo-300 text-xs sm:text-sm font-bold bg-indigo-50/40 focus:outline-hidden focus:border-indigo-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        অনলাইন পেমেন্ট করলে কাস্টমারকে এই চার্জ দিতে হবে (Default: ₹50)।
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Cash on Delivery (COD) Delivery Charge (₹):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={codDeliveryCharge}
                          onChange={(e) => setCodDeliveryCharge(Number(e.target.value))}
                          placeholder="75"
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-amber-300 text-xs sm:text-sm font-bold bg-amber-50/40 focus:outline-hidden focus:border-amber-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        ক্যাশ অন ডেলিভারিতে কাস্টমারকে এই চার্জ দিতে হবে (Default: ₹75)।
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Contact & Social Links */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contact Numbers & Social Links
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Number (with country code): *
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. 918001743646"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Store Phone Number: *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 8001743646"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Support Email:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officialonlinelibrary@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Facebook URL / Profile Link:
                    </label>
                    <input
                      type="text"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Instagram URL / Handle:
                    </label>
                    <input
                      type="text"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/onlinelibrary17"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Theme Colors */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Theme Colors:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Header / Primary</span>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Accent / Button</span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Background</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Company Logo Studio & Live Preview */}
              <div className="bg-white p-5 rounded-2xl border-2 border-orange-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-orange-600" />
                      <span>Company Logo Management (কোম্পানির লোগো সেট / পরিবর্তন)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload your official company or bookstore logo. It will be instantly updated in the Store Header, Quick Login Modal, Reader Passport, and Invoice receipts.
                    </p>
                  </div>
                  {logoSavedFlash && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Logo Updated!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Direct File / Gallery Upload */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Upload Logo from Device (মোবাইল গ্যালারি / কম্পিউটার থেকে সরাসরি ছবি দিন):
                      </label>
                      <div
                        onClick={() => logoFileInputRef.current?.click()}
                        className="p-5 border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50/80 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center group shadow-xs"
                      >
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-full bg-orange-100 group-hover:bg-orange-200 text-orange-600 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-orange-700">
                          গ্যালারি বা ফাইল থেকে লোগো ছবি সিলেক্ট করুন
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">
                          Tap here to browse from Mobile Gallery / Storage (PNG, JPG, SVG, WebP)
                        </span>
                      </div>
                    </div>

                    {/* Current Logo Action Bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={logoPreview || '/logo.svg'}
                          alt="Current Logo"
                          className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-200 p-1"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">বর্তমান স্টোর লোগো</span>
                          <span className="text-[11px] text-slate-500">Live on Header & Receipts</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          ছবি পরিবর্তন করুন
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('/logo.svg');
                            setLogoUrlInput('');
                            if (logoFileInputRef.current) logoFileInputRef.current.value = '';
                            setLogoSavedFlash(true);
                            setTimeout(() => setLogoSavedFlash(false), 2500);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets / Default Logos */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Or Pick a Bookstore Preset Badge:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          {
                            name: 'Classic Library',
                            url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=80',
                            icon: '📚',
                          },
                          {
                            name: 'Modern Reader',
                            url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&auto=format&fit=crop&q=80',
                            icon: '📖',
                          },
                          {
                            name: 'Golden Crest',
                            url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',
                            icon: '🎓',
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setLogoPreview(preset.url);
                              setLogoSavedFlash(true);
                              setTimeout(() => setLogoSavedFlash(false), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
                          >
                            <span>{preset.icon}</span>
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Multi-Placement Live Preview with 1-Photo Synced Upload */}
                  <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                        Live Preview (উভয় স্থানে লাইভ প্রিভিউ):
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>১টি ফটো = ২ জায়গায় সেট</span>
                      </span>
                    </div>

                    {/* Preview 1: Header / Navbar (Clickable for direct 1-photo upload) */}
                    <div
                      onClick={() => logoFileInputRef.current?.click()}
                      title="Click to upload/change photo for both Header & Login Modal"
                      className="p-3 rounded-xl text-white flex items-center justify-between shadow-xs cursor-pointer hover:ring-2 hover:ring-orange-400 hover:scale-[1.01] transition-all relative group"
                      style={{ backgroundColor: primaryColor || '#0B1B3D' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0 border border-white/80 group-hover:scale-105 transition-transform shadow-xs">
                          <img
                            src={logoPreview || '/logo.svg'}
                            alt="Header Logo"
                            className="w-full h-full object-contain rounded-full bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.svg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black truncate block">{storeName || 'Online Library'}</span>
                          <span className="text-[10px] text-slate-300 block">১. হেডার ও মেনু লোগো</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-colors">
                        <Camera className="w-3 h-3" />
                        <span>ছবি দিন</span>
                      </div>
                    </div>

                    {/* Preview 2: Quick Login Modal / Passport (Clickable for direct 1-photo upload) */}
                    <div
                      onClick={() => logoFileInputRef.current?.click()}
                      title="Click to upload/change photo for both Header & Login Modal"
                      className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between border border-slate-800 shadow-xs cursor-pointer hover:ring-2 hover:ring-amber-400 hover:scale-[1.01] transition-all relative group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shrink-0 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                            <img
                              src={logoPreview || '/logo.svg'}
                              alt="Passport Logo"
                              className="w-full h-full object-contain p-1 rounded-[8px] bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.svg';
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black truncate text-white">{storeName || 'Online Library'}</p>
                          <p className="text-[10px] text-amber-300">২. লগইন ও কাস্টমার পাসপোর্ট লোগো</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>আপলোড</span>
                      </div>
                    </div>

                    <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                      <p className="text-[11px] text-amber-900 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>একটি ছবি সিলেক্ট করলেই Header ও Login Modal উভয়েই একই সাথে সেট হয়ে যাবে।</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:brightness-110"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save All Store Settings & Links</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: MANAGE REVIEWS & FEEDBACK */}
      {activeTab === 'manage-reviews' && (
        <div id="tab-manage-reviews" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3
                className="text-base sm:text-lg font-bold flex items-center gap-2"
                style={{ color: settings.primaryColor || '#0B1B3D' }}
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Customer Reviews & Unboxing Photos ({reviews.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                View customer ratings, delivery photos, or publish verified WhatsApp reviews
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddReviewForm ? 'Close Form' : 'Add Verified Photo Review'}</span>
              </button>
              <input
                type="text"
                placeholder="Search reviews by name, book..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          {/* Admin Add Verified Review & Photos Form */}
          {showAddReviewForm && (
            <form
              onSubmit={handleAdminReviewSubmit}
              className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Post Verified Customer Review & Delivery Photo (WhatsApp / Unboxing)</span>
                </h4>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Admin Verified Badge
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Book: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newReviewBookId}
                    onChange={(e) => setNewReviewBookId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="">-- Choose Book --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (₹{b.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewCustomerName}
                    onChange={(e) => setNewReviewCustomerName(e.target.value)}
                    placeholder="e.g. Anik Ghosh (Kolkata)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Phone (Optional):
                  </label>
                  <input
                    type="text"
                    value={newReviewCustomerPhone}
                    onChange={(e) => setNewReviewCustomerPhone(e.target.value)}
                    placeholder="e.g. 9832000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Star Rating:
                  </label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-amber-600 focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars (Good)</option>
                    <option value={3}>⭐⭐⭐ 3 Stars (Average)</option>
                    <option value={2}>⭐⭐ 2 Stars (Fair)</option>
                    <option value={1}>⭐ 1 Star (Poor)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review / Testimonial Comment: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="e.g. Original book received in 2 days via speed post. Excellent packaging and low price!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Upload Customer Unboxing / Parcel Photos */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Customer Parcel / Unboxing Photos (Optional):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Up to 4 photos</span>
                </div>

                <input
                  type="file"
                  ref={reviewPhotoInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleAdminReviewPhotoUpload}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs cursor-pointer"
                />

                {newReviewPhotos.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {newReviewPhotos.map((p, pIdx) => (
                      <div key={pIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                        <img src={p} alt="Review attachment preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminReviewPhoto(pIdx)}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
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
                  onClick={() => setShowAddReviewForm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  Publish Verified Review
                </button>
              </div>
            </form>
          )}

          {filteredReviews.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {reviewSearch ? 'No reviews match your search query.' : 'No customer reviews yet.'}
              </p>
              <span className="text-[11px] text-slate-400">
                Reviews submitted by customers on book detail pages or published by admin will show up here.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredReviews.map((rev) => {
                const book = books.find((b) => b.id === rev.bookId);
                return (
                  <div
                    key={rev.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Book Title & Delete */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] text-orange-600 font-bold block truncate">
                            📖 {book ? book.title : `Book #${rev.bookId}`}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {rev.customerName}
                            </span>
                            {rev.customerPhone && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({rev.customerPhone})
                              </span>
                            )}
                            {rev.isVerifiedBuyer && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>

                        {onDeleteReview && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this review?')) {
                                onDeleteReview(rev.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Rating Stars & Date */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.date}</span>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100 italic">
                        "{rev.comment}"
                      </p>

                      {/* Review Photos attached */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Camera className="w-3 h-3 text-orange-600" />
                            <span>Customer Photos ({rev.photos.length}):</span>
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {rev.photos.map((pUrl, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setPreviewReviewPhoto(pUrl)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shadow-2xs hover:scale-105 transition-transform cursor-pointer relative group"
                              >
                                <img src={pUrl} alt="Review attachment" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MANAGE ADMINS (Add / Remove Admins with Gmail credentials) */}
      {activeTab === 'manage-admins' && (
        <div id="tab-manage-admins" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Admin Team Management</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage administrators authorized to access the management control center. Team members can sign in directly using Google with their authorized Gmail address.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddAdminForm(!showAddAdminForm);
                setAdminActionError('');
                setAdminActionSuccess('');
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddAdminForm ? 'Close Form' : 'Add Admin via Gmail'}</span>
            </button>
          </div>

          {/* Master Admin Notice Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                👑
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Master Super Administrator (Owner)</h4>
                <p className="text-xs text-slate-600">
                  Main Gmail: <strong className="font-mono text-slate-900">sknizamuddin249@gmail.com</strong> (Permanent Full Access)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Protected Master Account
            </span>
          </div>

          {adminActionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminActionSuccess}</span>
            </div>
          )}

          {adminActionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{adminActionError}</span>
            </div>
          )}

          {/* Add Admin Form */}
          {showAddAdminForm && (
            <form onSubmit={handleAddAdmin} className="bg-white p-5 rounded-2xl border-2 border-orange-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-600" />
                <span>Grant Admin Access to a New Gmail Account</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Gmail / Google Account: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. colleague@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-slate-800"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    They can log in directly using Google Sign-In with this email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Full Name: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="e.g. Subrata Roy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (Optional):
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="10-digit phone (optional)"
                      className="w-full pl-11 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Permissions:
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:border-slate-800 font-semibold"
                  >
                    <option value="Admin">Admin (Full Store Management)</option>
                    <option value="Super Admin">Super Admin (All Access & Team Management)</option>
                    <option value="Manager">Manager (Orders, Catalog & Inventory)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAdminForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Authorize Administrator</span>
                </button>
              </div>
            </form>
          )}

          {/* Admin List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Authorized Store Administrators ({admins.length})
              </h4>
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search admins by name, email, or phone..."
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-hidden focus:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {admins
                .filter((a) => {
                  if (!adminSearch) return true;
                  const q = adminSearch.toLowerCase();
                  return (
                    a.name.toLowerCase().includes(q) ||
                    (a.email && a.email.toLowerCase().includes(q)) ||
                    (a.phone && a.phone.includes(q))
                  );
                })
                .map((adm) => {
                  const isMaster =
                    adm.email?.toLowerCase() === 'sknizamuddin249@gmail.com' ||
                    adm.phone === '8001743646' ||
                    adm.id === 'admin_master';

                  return (
                    <div
                      key={adm.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isMaster
                          ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                              isMaster
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isMaster ? '👑' : adm.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm text-slate-900">{adm.name}</h5>
                              {isMaster && (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                  Master Owner
                                </span>
                              )}
                            </div>
                            {adm.email ? (
                              <div className="flex items-center gap-1 text-xs text-slate-600 font-mono mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{adm.email}</span>
                              </div>
                            ) : null}
                            {adm.phone ? (
                              <span className="text-[11px] text-slate-400 font-mono block">
                                Mobile: +91 {adm.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            adm.role === 'Super Admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : adm.role === 'Admin'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {adm.role}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Added: {adm.addedAt || 'Permanent'}</span>
                        {isMaster ? (
                          <span className="text-[11px] font-bold text-amber-700">Protected Account</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteAdmin(adm.id, adm.email, adm.phone)}
                            className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* OTP Password Change Modal (8001743646) */}
      {showChangePasswordModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Change Admin Password</h4>
                <span className="text-xs text-slate-500">2FA Security: +91 {adminPhoneTarget}</span>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordOtpStep === 'request' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600">
                  To ensure only the authorized owner can change the admin PIN, a 6-digit OTP code will be sent to registered phone: <strong>+91 {adminPhoneTarget}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleSendAdminPasswordOtp}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send OTP to {adminPhoneTarget}</span>
                </button>
              </div>
            )}

            {passwordOtpStep === 'verify' && (
              <form onSubmit={handleVerifyAdminPasswordOtp} className="space-y-3 pt-1">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>OTP Dispatched to Phone: +91 {adminPhoneTarget}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Check your phone SMS or WhatsApp to view the secret 6-digit code. The code is kept private to your device for 100% security.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = encodeURIComponent(`🔐 *Admin Security OTP*\nYour 6-Digit Password Reset OTP is: *${passwordGeneratedOtp}*.\nValid for 5 minutes.`);
                      window.open(`https://wa.me/91${adminPhoneTarget}?text=${msg}`, '_blank');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer pt-0.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open WhatsApp on phone (+91 {adminPhoneTarget})</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Verification OTP from Phone:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={passwordEnteredOtp}
                    onChange={(e) => setPasswordEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 842910"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-orange-400 text-center font-mono text-xl font-black tracking-widest focus:outline-hidden bg-orange-50/30"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                  >
                    Verify OTP Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSendAdminPasswordOtp}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {passwordOtpStep === 'new_password' && (
              <form onSubmit={handleSaveUpdatedAdminPassword} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter New Security Password:
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Admin Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Customer Super Coins Modal */}
      {editingCoinsUser && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setEditingCoinsUser(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditingCoinsUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Edit Customer Super Coins</h4>
                <span className="text-xs text-slate-500">{editingCoinsUser.name} (+91 {editingCoinsUser.phone})</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
              <span className="font-bold block">Conversion Rate:</span>
              <p className="text-slate-600">10 Super Coins = ₹1 Discount on orders</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Super Coins Balance:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={customCoinsValue}
                  onChange={(e) => setCustomCoinsValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-400 font-mono text-lg font-black text-slate-900 bg-amber-50/30 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  = ₹{((parseInt(customCoinsValue, 10) || 0) / 10).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveUserCoins}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Coins Balance</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingCoinsUser(null)}
                className="py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Customer Photo Lightbox Viewer */}
      {previewReviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewReviewPhoto(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-4 max-w-xl w-full max-h-[90vh] overflow-hidden relative shadow-2xl space-y-3 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-4 h-4 text-orange-400" />
                <h4 className="font-bold text-sm">Customer Unboxing & Review Photo</h4>
              </div>
              <button
                onClick={() => setPreviewReviewPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center bg-black rounded-2xl overflow-hidden p-2 max-h-[65vh]">
              <img
                src={previewReviewPhoto}
                alt="Review Photo High Res"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <a
                href={previewReviewPhoto}
                download="customer_review_photo.jpg"
                className="text-orange-400 font-bold hover:underline"
              >
                Download Photo
              </a>
              <button
                type="button"
                onClick={() => setPreviewReviewPhoto(null)}
                className="px-4 py-1.5 bg-white text-slate-900 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CustomerProfile, Order, StoreSettings } from '../types';
import { STORE_CONTACT } from '../data/defaultData';
import { decodeOrderFromTrackKey } from '../utils/tracking';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
  Home,
  User,
  ShoppingBag,
  ArrowRight,
  LogIn,
} from 'lucide-react';

interface TrackOrderModalProps {
  orders?: Order[];
  profile?: CustomerProfile | null;
  customerProfile?: CustomerProfile | null;
  settings: StoreSettings;
  isOpen?: boolean;
  initialOrderId?: string;
  onClose: () => void;
  onGoHome?: () => void;
  onOpenQuickLogin?: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  orders = [],
  profile,
  customerProfile,
  settings,
  isOpen = true,
  initialOrderId,
  onClose,
  onGoHome,
  onOpenQuickLogin,
}) => {
  const activeProfile = profile || customerProfile || null;
  const userPhone = activeProfile?.phone ? String(activeProfile.phone).replace(/[^0-9]/g, '') : '';

  // Get orders belonging to this logged in customer
  const userOrders = userPhone
    ? orders.filter(
        (o) =>
          o.phone &&
          String(o.phone).replace(/[^0-9]/g, '') === userPhone
      )
    : [];

  const [searchKey, setSearchKey] = useState(initialOrderId || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string | number>(
    initialOrderId || (userOrders.length > 0 ? userOrders[0].id : '')
  );
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(!userPhone || userOrders.length === 0);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(false);

  const activeWhatsapp = settings.whatsappNumber || STORE_CONTACT.whatsappNumber;

  useEffect(() => {
    if (initialOrderId) {
      setSearchKey(initialOrderId);
      findOrder(initialOrderId);
      return;
    }

    if (userPhone && userOrders.length > 0) {
      const targetId = selectedOrderId || userOrders[0].id;
      const found = userOrders.find((o) => String(o.id) === String(targetId)) || userOrders[0];
      setMatchedOrder(found);
      setHasSearched(true);
    } else if (searchKey) {
      findOrder(searchKey);
    }
  }, [initialOrderId, selectedOrderId, orders, userPhone, isOpen]);

  if (isOpen === false) return null;

  const findOrder = (key: string) => {
    const clean = key.trim().replace('#track=', '').replace('#', '');
    if (!clean) {
      if (userPhone && userOrders.length > 0) {
        setMatchedOrder(userOrders[0]);
      } else {
        setMatchedOrder(null);
      }
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // 1. Try decoding as Base64 payload or finding in local orders list
    const decoded = decodeOrderFromTrackKey(clean, orders);
    if (decoded) {
      const localMatch = orders.find((o) => String(o.id) === String(decoded.id));
      setMatchedOrder(localMatch || decoded);
      setSelectedOrderId(decoded.id);
      return;
    }

    // 2. Otherwise match by ID or phone in local orders
    const found = orders.find(
      (o) =>
        String(o.id).toLowerCase().includes(clean.toLowerCase()) ||
        o.phone.toLowerCase().includes(clean.toLowerCase())
    );
    setMatchedOrder(found || null);
    if (found) {
      setSelectedOrderId(found.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findOrder(searchKey);
  };

  const handleSelectUserOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setMatchedOrder(order);
    setSearchKey(String(order.id));
    setHasSearched(true);
  };

  const handleCopyTrackingNumber = (trackingNo: string) => {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(true);
    setTimeout(() => setCopiedTrackingNo(false), 2000);
  };

  const statusSteps = [
    { key: 'Pending', label: 'Order Placed', desc: 'Order received & under review' },
    { key: 'Confirmed', label: 'Order Confirmed', desc: 'Packing & processing in progress' },
    { key: 'Dispatched', label: 'Dispatched / Shipped', desc: 'Handed over to courier partner' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier agent out for delivery' },
    { key: 'Delivered', label: 'Delivered', desc: 'Package successfully delivered' },
  ];

  const currentStatus = matchedOrder?.orderStatus || 'Confirmed';

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Dispatched':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      case 'Cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStepIdx = getStepIndex(currentStatus);

  return (
    <div
      id="track-order-modal-container"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Actions: Home & Close Button */}
        <div className="flex items-center justify-between">
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
            id="close-track-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3
              className="text-lg sm:text-xl font-black leading-tight"
              style={{ color: settings.primaryColor || '#0B1B3D' }}
            >
              Live Order Tracking
            </h3>
            <span className="text-xs text-slate-500">
              {userPhone
                ? `Logged in: +91 ${userPhone} (Auto Order Tracking)`
                : 'Track your package and real-time delivery status'}
            </span>
          </div>
        </div>

        {/* If Logged In User has multiple orders: Quick Tabs/Pills */}
        {userPhone && userOrders.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Your Orders ({userOrders.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowManualSearch(!showManualSearch)}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold underline cursor-pointer"
              >
                {showManualSearch ? 'Hide Search Box' : 'Search Other ID'}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {userOrders.map((ord, idx) => {
                const isSelected = matchedOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelectUserOrder(ord)}
                    className={`flex-shrink-0 p-2.5 rounded-2xl border text-left transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/80 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-900">Order #{ord.id}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.orderStatus === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.orderStatus || 'Pending'}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate max-w-[150px] mt-0.5">
                      {ord.bookTitle || 'Book Order'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* If Not Logged In, show Login Prompt Banner */}
        {!userPhone && onOpenQuickLogin && (
          <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-orange-950 block">Registered Customer?</span>
              <span className="text-[11px] text-orange-800">
                Login to auto-track all your orders without typing IDs!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenQuickLogin();
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          </div>
        )}

        {/* Manual Search Form (Shown if not logged in or toggled by user) */}
        {(showManualSearch || !userPhone || userOrders.length === 0) && (
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Enter Order ID or Mobile Number"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs cursor-pointer transition-all hover:brightness-110"
              style={{ backgroundColor: settings.primaryColor || '#0B1B3D' }}
            >
              Track
            </button>
          </form>
        )}

        {/* Empty State for logged in customer with 0 orders */}
        {userPhone && userOrders.length === 0 && !matchedOrder && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                No orders placed yet with +91 {userPhone}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Any orders you book in the library will automatically appear here for live tracking.
              </p>
            </div>
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Shop & Browse Books</span>
              </button>
            )}
          </div>
        )}

        {/* Tracking Content */}
        {matchedOrder ? (
          <div className="space-y-4 pt-1">
            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                currentStatus === 'Delivered'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : currentStatus === 'Cancelled'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Delivery Status:
                </span>
                <h4 className="text-base font-black flex items-center gap-1.5 mt-0.5">
                  {currentStatus === 'Delivered' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {currentStatus === 'Dispatched' && <Truck className="w-5 h-5 text-amber-600" />}
                  {currentStatus === 'Pending' && <Clock className="w-5 h-5 text-amber-600" />}
                  <span>{currentStatus}</span>
                </h4>
                {matchedOrder.lastUpdated && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Last updated: {matchedOrder.lastUpdated}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Order ID:</span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  #{matchedOrder.id}
                </span>
              </div>
            </div>

            {/* Courier Tracking Link Card (Conditional on Admin Providing Link) */}
            {matchedOrder.trackingUrl ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Courier Tracking Link Available</span>
                  </div>
                  {matchedOrder.courierName && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      {matchedOrder.courierName}
                    </span>
                  )}
                </div>

                {matchedOrder.trackingNumber && (
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs">
                    <span className="text-slate-500">Tracking / AWB No:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{matchedOrder.trackingNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTrackingNumber(matchedOrder.trackingNumber!)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy AWB Number"
                      >
                        {copiedTrackingNo ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <a
                  href={matchedOrder.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open Live Courier Tracking Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : null}

            {/* Step-by-Step Progress Timeline */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-4">
              <h5 className="text-xs font-bold text-slate-800">Order Progress Timeline</h5>
              <div className="relative pl-6 space-y-4">
                {/* Vertical Line */}
                <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-slate-200" />

                {statusSteps.map((s, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={s.key} className="relative flex items-start gap-3">
                      {/* Step Circle */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <span
                          className={`text-xs font-bold block ${
                            isCurrent
                              ? 'text-orange-600'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span>Items in this Order</span>
                </div>
                <span>Total: ₹{matchedOrder.totalAmount}</span>
              </div>

              <div className="space-y-1.5">
                {Array.isArray(matchedOrder.items) && matchedOrder.items.length > 0 ? (
                  matchedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-700">
                      <span className="truncate max-w-[240px]">
                        {item.title} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                      </span>
                      <span className="font-mono font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="truncate max-w-[240px]">{matchedOrder.bookTitle}</span>
                    <span className="font-mono font-semibold">₹{matchedOrder.price}</span>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-slate-200/90 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  <span>Delivery Address:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {matchedOrder.customerName}, {matchedOrder.village}, {matchedOrder.po},{' '}
                  {matchedOrder.district} - {matchedOrder.pincode}
                  {matchedOrder.landmark ? ` (Landmark: ${matchedOrder.landmark})` : ''}
                </p>
              </div>
            </div>

            {/* Need Help / WhatsApp Assistance */}
            <div className="text-center pt-1">
              <a
                href={`https://wa.me/${activeWhatsapp}?text=${encodeURIComponent(
                  `Hello ${settings.name}, I would like to inquire about my Order #${matchedOrder.id} for "${matchedOrder.bookTitle}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Need delivery help? Chat with store on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-2 border border-slate-200">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No order found</h4>
            <p className="text-xs text-slate-500">
              Please double check the Order ID or phone number and try again.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

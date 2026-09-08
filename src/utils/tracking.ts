import { Order } from '../types';

/**
 * Encodes an order into a secure, self-contained URL hash payload.
 * When the customer opens this link on any browser or phone, they immediately
 * see their exact order details without requiring any database sync.
 */
export function generateOrderTrackingUrl(order: Order): string {
  try {
    const payload = {
      id: order.id,
      date: order.date,
      bookTitle: order.bookTitle,
      price: order.price,
      oldPrice: order.oldPrice,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      village: order.village,
      po: order.po,
      district: order.district,
      pincode: order.pincode,
      landmark: order.landmark,
      phone: order.phone,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus || 'Confirmed',
    };

    const jsonStr = JSON.stringify(payload);
    // Base64 encode for clean URL
    const encoded = btoa(encodeURIComponent(jsonStr));
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#track=${encoded}`;
  } catch {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#track=${order.id}`;
  }
}

/**
 * Decodes order from a tracking key or hash, supporting both Base64 payloads and local order IDs.
 */
export function decodeOrderFromTrackKey(key: string, storedOrders: Order[] = []): Order | null {
  if (!key) return null;
  const cleanKey = key.replace('#track=', '').replace('#', '').trim();

  // 1. Try decoding Base64 JSON payload
  try {
    const jsonStr = decodeURIComponent(atob(cleanKey));
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.id || parsed.bookTitle)) {
      return parsed as Order;
    }
  } catch {
    // not base64 or failed to decode
  }

  // 2. Fallback: match by ID or phone in local orders list
  const found = storedOrders.find(
    (o) => String(o.id) === cleanKey || o.phone === cleanKey
  );

  return found || null;
}

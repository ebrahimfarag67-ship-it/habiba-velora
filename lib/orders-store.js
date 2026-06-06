import { get, put } from '@vercel/blob';

export const ORDERS_PATH = 'orders.json';

export function isOrderStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

export async function readOrders() {
  if (!isOrderStoreConfigured()) return [];
  const result = await get(ORDERS_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await streamToText(result.stream);
  const orders = JSON.parse(text || '[]');
  return Array.isArray(orders) ? orders : [];
}

export async function writeOrders(orders) {
  await put(ORDERS_PATH, JSON.stringify(Array.isArray(orders) ? orders : []), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}

export function cleanOrder(order) {
  return {
    ...order,
    id: String(order?.id || '').trim(),
    invoiceId: String(order?.invoiceId || '').trim(),
    phone: String(order?.phone || '').trim(),
    payment: String(order?.payment || '').trim(),
    paymentStatus: String(order?.paymentStatus || '').trim(),
    paymentReference: String(order?.paymentReference || '').trim(),
    paymentPhone: String(order?.paymentPhone || '').trim(),
    paymentSenderPhone: String(order?.paymentSenderPhone || '').trim(),
    paymentTransactionId: String(order?.paymentTransactionId || '').trim(),
    paymentConfirmedAt: String(order?.paymentConfirmedAt || '').trim(),
    paymentGateway: String(order?.paymentGateway || '').trim(),
    paymentGatewayReference: String(order?.paymentGatewayReference || '').trim(),
    paymentGatewayTransactionId: String(order?.paymentGatewayTransactionId || '').trim(),
    paymentGatewayMessage: String(order?.paymentGatewayMessage || '').trim(),
    deliveryToken: String(order?.deliveryToken || '').trim(),
    updatedAt: order?.updatedAt || new Date().toISOString(),
  };
}

export function statusLabel(status) {
  return {
    pending: 'قيد التجهيز',
    processing: 'جارٍ التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
  }[status] || 'قيد التجهيز';
}

export async function updateOrderStatus(orderId, status, note = '') {
  const orders = await readOrders();
  const orderIndex = orders.findIndex((order) => String(order.id) === String(orderId));
  if (orderIndex === -1) return null;

  const updatedAt = new Date().toISOString();
  const order = cleanOrder(orders[orderIndex]);
  order.status = status;
  order.updatedAt = updatedAt;
  order.tracking = Array.isArray(order.tracking) ? order.tracking : [];
  order.tracking.unshift({
    status,
    label: statusLabel(status),
    at: updatedAt,
    note,
  });
  orders[orderIndex] = order;
  await writeOrders(orders.map(cleanOrder));
  return order;
}

export async function updateOrderPaymentStatus(orderId, paymentStatus, note = '') {
  const orders = await readOrders();
  const orderIndex = orders.findIndex((order) => String(order.id) === String(orderId));
  if (orderIndex === -1) return null;

  const updatedAt = new Date().toISOString();
  const order = cleanOrder(orders[orderIndex]);
  order.paymentStatus = paymentStatus;
  order.paymentConfirmedAt = paymentStatus === 'confirmed' ? updatedAt : order.paymentConfirmedAt || '';
  order.updatedAt = updatedAt;
  order.tracking = Array.isArray(order.tracking) ? order.tracking : [];
  order.tracking.unshift({
    status: 'payment',
    label: paymentStatus === 'confirmed' ? 'تم تأكيد الدفع' : 'تم تحديث حالة الدفع',
    at: updatedAt,
    note,
  });
  orders[orderIndex] = order;
  await writeOrders(orders.map(cleanOrder));
  return order;
}

export async function upsertOrder(incomingOrder) {
  const orders = await readOrders();
  const order = cleanOrder(incomingOrder);
  const orderIndex = orders.findIndex((item) => String(item.id) === String(order.id));

  if (orderIndex === -1) {
    orders.unshift(order);
  } else {
    orders[orderIndex] = cleanOrder({
      ...orders[orderIndex],
      ...order,
      updatedAt: new Date().toISOString(),
    });
  }

  await writeOrders(orders.map(cleanOrder));
  return order;
}

export async function updateOrderPaymentFromGateway({ orderId, gatewayReference, transactionId, status, message = '' }) {
  const orders = await readOrders();
  const needles = [orderId, gatewayReference, transactionId].map((value) => String(value || '')).filter(Boolean);
  const orderIndex = orders.findIndex((order) => {
    return [order.id, order.paymentReference, order.paymentGatewayReference]
      .map((value) => String(value || ''))
      .filter(Boolean)
      .some((value) => needles.includes(value));
  });
  if (orderIndex === -1) return null;

  const updatedAt = new Date().toISOString();
  const order = cleanOrder(orders[orderIndex]);
  order.paymentStatus = status;
  order.paymentGatewayTransactionId = String(transactionId || order.paymentGatewayTransactionId || '');
  order.paymentGatewayMessage = String(message || order.paymentGatewayMessage || '');
  order.paymentConfirmedAt = status === 'confirmed' ? updatedAt : order.paymentConfirmedAt || '';
  order.updatedAt = updatedAt;
  order.tracking = Array.isArray(order.tracking) ? order.tracking : [];
  order.tracking.unshift({
    status: 'payment',
    label: status === 'confirmed' ? 'تم تأكيد الدفع من Paymob' : 'فشل أو رفض الدفع من Paymob',
    at: updatedAt,
    note: message,
  });
  orders[orderIndex] = order;
  await writeOrders(orders.map(cleanOrder));
  return order;
}

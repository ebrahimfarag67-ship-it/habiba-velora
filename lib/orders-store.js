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

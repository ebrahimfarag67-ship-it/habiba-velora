import crypto from 'node:crypto';
import { get, put } from '@vercel/blob';
import { reserveProductsForOrder, restoreProductsForOrder } from './products-store';

export const ORDERS_PATH = 'orders.json';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const FIRESTORE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || '(default)';
const FIRESTORE_COLLECTION = process.env.FIREBASE_ORDERS_COLLECTION || 'orders';

let firestoreToken = null;

export function isFirestoreConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function isBlobOrderStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isOrderStoreConfigured() {
  return isFirestoreConfigured() || isBlobOrderStoreConfigured();
}

function firestoreBaseUrl() {
  const projectId = encodeURIComponent(process.env.FIREBASE_PROJECT_ID);
  const databaseId = encodeURIComponent(FIRESTORE_DATABASE_ID);
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
}

function firestoreResourceName(documentPath = '') {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  return `projects/${projectId}/databases/${FIRESTORE_DATABASE_ID}/documents/${documentPath}`;
}

function normalizePrivateKey(value) {
  return String(value || '').replace(/\\n/g, '\n');
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getFirestoreToken() {
  const now = Math.floor(Date.now() / 1000);
  if (firestoreToken && firestoreToken.expiresAt - 60 > now) {
    return firestoreToken.accessToken;
  }

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    scope: FIRESTORE_SCOPE,
    aud: FIRESTORE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer
    .sign(normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY), 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(FIRESTORE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const payloadResponse = await response.json().catch(() => ({}));
  if (!response.ok || !payloadResponse.access_token) {
    throw new Error(payloadResponse.error_description || payloadResponse.error || 'Firestore auth failed.');
  }

  firestoreToken = {
    accessToken: payloadResponse.access_token,
    expiresAt: now + Number(payloadResponse.expires_in || 3600),
  };
  return firestoreToken.accessToken;
}

async function firestoreFetch(path, options = {}) {
  const accessToken = await getFirestoreToken();
  const response = await fetch(`${firestoreBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Firestore request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

function toFirestoreValue(value) {
  if (value === undefined) {
    return { nullValue: null };
  }
  if (value === null) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { nullValue: null };
    }
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, entryValue]) => entryValue !== undefined)
            .map(([key, entryValue]) => [key, toFirestoreValue(entryValue)]),
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value = {}) {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return String(value.timestampValue);
  if ('stringValue' in value) return String(value.stringValue);
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, entryValue]) => [key, fromFirestoreValue(entryValue)]),
    );
  }
  return null;
}

function toFirestoreFields(order) {
  return Object.fromEntries(
    Object.entries(cleanOrder(order))
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

function fromFirestoreDocument(document) {
  return cleanOrder(Object.fromEntries(
    Object.entries(document?.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  ));
}

function firestoreDocumentId(orderId) {
  const normalized = String(orderId || '').trim();
  if (!normalized) {
    return '';
  }
  return encodeURIComponent(normalized.replaceAll('/', '_'));
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

async function readBlobOrders() {
  if (!isBlobOrderStoreConfigured()) return [];
  const result = await get(ORDERS_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await streamToText(result.stream);
  const orders = JSON.parse(text || '[]');
  return Array.isArray(orders) ? orders : [];
}

async function writeBlobOrders(orders) {
  await put(ORDERS_PATH, JSON.stringify(Array.isArray(orders) ? orders : []), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}

async function readFirestoreOrders() {
  const orders = [];
  let pageToken = '';

  do {
    const query = new URLSearchParams({
      pageSize: '300',
      orderBy: 'createdAt desc',
    });
    if (pageToken) {
      query.set('pageToken', pageToken);
    }

    const payload = await firestoreFetch(`/${FIRESTORE_COLLECTION}?${query.toString()}`, { method: 'GET' });
    orders.push(...(payload.documents || []).map(fromFirestoreDocument));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return orders;
}

async function setFirestoreOrder(order) {
  const cleaned = cleanOrder(order);
  if (!cleaned.id) {
    throw new Error('Order id is required.');
  }
  await firestoreFetch(`/${FIRESTORE_COLLECTION}/${firestoreDocumentId(cleaned.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: toFirestoreFields(cleaned) }),
  });
  return cleaned;
}

async function batchWriteFirestore(writes) {
  const chunks = [];
  for (let index = 0; index < writes.length; index += 450) {
    chunks.push(writes.slice(index, index + 450));
  }

  for (const chunk of chunks) {
    await firestoreFetch(':batchWrite', {
      method: 'POST',
      body: JSON.stringify({ writes: chunk }),
    });
  }
}

async function writeFirestoreOrders(orders) {
  const cleanedOrders = (Array.isArray(orders) ? orders : []).map(cleanOrder).filter((order) => order.id);
  const writes = cleanedOrders.map((order) => ({
    update: {
      name: firestoreResourceName(`${FIRESTORE_COLLECTION}/${firestoreDocumentId(order.id)}`),
      fields: toFirestoreFields(order),
    },
  }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

async function deleteFirestoreOrders() {
  const orders = await readFirestoreOrders();
  const writes = orders
    .filter((order) => order.id)
    .map((order) => ({
      delete: firestoreResourceName(`${FIRESTORE_COLLECTION}/${firestoreDocumentId(order.id)}`),
    }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

export async function readOrders() {
  if (isFirestoreConfigured()) {
    return readFirestoreOrders();
  }
  return readBlobOrders();
}

export async function writeOrders(orders) {
  if (isFirestoreConfigured()) {
    await deleteFirestoreOrders();
    await writeFirestoreOrders(orders);
    return;
  }
  await writeBlobOrders(Array.isArray(orders) ? orders : []);
}

export async function clearOrders() {
  if (isFirestoreConfigured()) {
    await deleteFirestoreOrders();
    return [];
  }
  await writeBlobOrders([]);
  return [];
}

export async function migrateBlobOrdersToFirestore() {
  if (!isFirestoreConfigured()) {
    throw new Error('Firestore is not configured.');
  }
  if (!isBlobOrderStoreConfigured()) {
    return {
      found: 0,
      migrated: 0,
      skipped: 0,
    };
  }

  const blobOrders = (await readBlobOrders()).map(cleanOrder).filter((order) => order.id);
  const firestoreOrders = await readFirestoreOrders();
  const existingIds = new Set(firestoreOrders.map((order) => String(order.id || '')));
  const ordersToMigrate = blobOrders.filter((order) => !existingIds.has(String(order.id)));

  if (ordersToMigrate.length) {
    await writeFirestoreOrders(ordersToMigrate);
  }

  return {
    found: blobOrders.length,
    migrated: ordersToMigrate.length,
    skipped: blobOrders.length - ordersToMigrate.length,
  };
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
    return_requested: 'مرتجع',
    cancelled: 'ملغي',
  }[status] || 'قيد التجهيز';
}

export async function findOrder(query) {
  const rawQuery = String(query || '').trim();
  const normalizedQuery = rawQuery.toLowerCase();
  if (!rawQuery) {
    return null;
  }

  if (isFirestoreConfigured()) {
    const byId = await firestoreFetch(`/${FIRESTORE_COLLECTION}/${firestoreDocumentId(rawQuery)}`, { method: 'GET' })
      .then(fromFirestoreDocument)
      .catch(() => null);
    if (byId?.id) {
      return byId;
    }
  }

  const orders = await readOrders();
  return orders.find((item) => [item.id, item.invoiceId, item.phone]
    .map((value) => String(value || '').toLowerCase())
    .includes(normalizedQuery)) || null;
}

export async function updateOrderStatus(orderId, status, note = '') {
  const order = await findOrder(orderId);
  if (!order) return null;

  const updatedAt = new Date().toISOString();
  const updatedOrder = cleanOrder(order);
  const shouldRestoreInventory = status === 'cancelled' || status === 'return_requested';
  const wasRestored = updatedOrder.inventoryState === 'restored';

  if (shouldRestoreInventory && !wasRestored) {
    await restoreProductsForOrder(updatedOrder.items || []);
    updatedOrder.inventoryState = 'restored';
  } else if (!shouldRestoreInventory && wasRestored) {
    await reserveProductsForOrder(updatedOrder.items || []);
    updatedOrder.inventoryState = 'reserved';
  }

  updatedOrder.status = status;
  updatedOrder.updatedAt = updatedAt;
  updatedOrder.tracking = Array.isArray(updatedOrder.tracking) ? updatedOrder.tracking : [];
  updatedOrder.tracking.unshift({
    status,
    label: statusLabel(status),
    at: updatedAt,
    note,
  });
  await upsertOrder(updatedOrder);
  return updatedOrder;
}

export async function updateOrderPaymentStatus(orderId, paymentStatus, note = '') {
  const order = await findOrder(orderId);
  if (!order) return null;

  const updatedAt = new Date().toISOString();
  const updatedOrder = cleanOrder(order);
  updatedOrder.paymentStatus = paymentStatus;
  updatedOrder.paymentConfirmedAt = paymentStatus === 'confirmed' ? updatedAt : updatedOrder.paymentConfirmedAt || '';
  updatedOrder.updatedAt = updatedAt;
  updatedOrder.tracking = Array.isArray(updatedOrder.tracking) ? updatedOrder.tracking : [];
  updatedOrder.tracking.unshift({
    status: 'payment',
    label: paymentStatus === 'confirmed' ? 'تم تأكيد الدفع' : 'تم تحديث حالة الدفع',
    at: updatedAt,
    note,
  });
  await upsertOrder(updatedOrder);
  return updatedOrder;
}

export async function upsertOrder(incomingOrder) {
  const order = cleanOrder(incomingOrder);
  if (!order.id) {
    throw new Error('Order id is required.');
  }

  if (isFirestoreConfigured()) {
    return setFirestoreOrder(order);
  }

  const orders = await readBlobOrders();
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

  await writeBlobOrders(orders.map(cleanOrder));
  return order;
}

export async function updateOrderPaymentFromGateway({ orderId, gatewayReference, transactionId, status, message = '' }) {
  const needles = [orderId, gatewayReference, transactionId].map((value) => String(value || '')).filter(Boolean);
  const orders = await readOrders();
  const order = orders.find((item) => {
    return [item.id, item.paymentReference, item.paymentGatewayReference]
      .map((value) => String(value || ''))
      .filter(Boolean)
      .some((value) => needles.includes(value));
  });
  if (!order) return null;

  const updatedAt = new Date().toISOString();
  const updatedOrder = cleanOrder(order);
  updatedOrder.paymentStatus = status;
  updatedOrder.paymentGatewayTransactionId = String(transactionId || updatedOrder.paymentGatewayTransactionId || '');
  updatedOrder.paymentGatewayMessage = String(message || updatedOrder.paymentGatewayMessage || '');
  updatedOrder.paymentConfirmedAt = status === 'confirmed' ? updatedAt : updatedOrder.paymentConfirmedAt || '';
  updatedOrder.updatedAt = updatedAt;
  updatedOrder.tracking = Array.isArray(updatedOrder.tracking) ? updatedOrder.tracking : [];
  updatedOrder.tracking.unshift({
    status: 'payment',
    label: status === 'confirmed' ? 'تم تأكيد الدفع من Paymob' : 'فشل أو رفض الدفع من Paymob',
    at: updatedAt,
    note: message,
  });
  await upsertOrder(updatedOrder);
  return updatedOrder;
}

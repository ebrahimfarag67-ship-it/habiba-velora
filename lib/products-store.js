import crypto from 'node:crypto';
import { get, put } from '@vercel/blob';

export const PRODUCTS_PATH = 'products.json';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const FIRESTORE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || '(default)';
const FIRESTORE_PRODUCTS_COLLECTION = process.env.FIREBASE_PRODUCTS_COLLECTION || 'products';

let firestoreToken = null;

export function isFirestoreProductStoreConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function isProductStoreConfigured() {
  return isFirestoreProductStoreConfigured() || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobProductStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function firestoreBaseUrl() {
  const projectId = encodeURIComponent(process.env.FIREBASE_PROJECT_ID);
  const databaseId = encodeURIComponent(FIRESTORE_DATABASE_ID);
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
}

function firestoreResourceName(documentPath = '') {
  return `projects/${process.env.FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${documentPath}`;
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

  const response = await fetch(FIRESTORE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedToken}.${signature}`,
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
  if (value === undefined || value === null) {
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

function productDocumentId(productId) {
  const normalized = String(productId || '').trim();
  return normalized ? encodeURIComponent(normalized.replaceAll('/', '_')) : '';
}

function cleanProduct(product, index = 0) {
  return {
    ...product,
    id: String(product?.id || '').trim(),
    stock: Math.max(0, Math.floor(Number(product?.stock || 0))),
    sortIndex: Number.isFinite(Number(product?.sortIndex)) ? Number(product.sortIndex) : index,
    updatedAt: product?.updatedAt || new Date().toISOString(),
  };
}

function toFirestoreFields(product, index = 0) {
  return Object.fromEntries(
    Object.entries(cleanProduct(product, index))
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

function fromFirestoreDocument(document) {
  return Object.fromEntries(
    Object.entries(document?.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

async function readFirestoreProducts() {
  const products = [];
  let pageToken = '';

  do {
    const query = new URLSearchParams({ pageSize: '300' });
    if (pageToken) {
      query.set('pageToken', pageToken);
    }

    const payload = await firestoreFetch(`/${FIRESTORE_PRODUCTS_COLLECTION}?${query.toString()}`, { method: 'GET' });
    products.push(...(payload.documents || []).map(fromFirestoreDocument));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return products
    .map(cleanProduct)
    .sort((first, second) => Number(first.sortIndex || 0) - Number(second.sortIndex || 0));
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

async function deleteFirestoreProducts() {
  const products = await readFirestoreProducts();
  const writes = products
    .filter((product) => product.id)
    .map((product) => ({
      delete: firestoreResourceName(`${FIRESTORE_PRODUCTS_COLLECTION}/${productDocumentId(product.id)}`),
    }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

async function writeFirestoreProducts(products) {
  const cleanedProducts = (Array.isArray(products) ? products : []).map(cleanProduct).filter((product) => product.id);
  const writes = cleanedProducts.map((product, index) => ({
    update: {
      name: firestoreResourceName(`${FIRESTORE_PRODUCTS_COLLECTION}/${productDocumentId(product.id)}`),
      fields: toFirestoreFields(product, index),
    },
  }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

async function beginFirestoreTransaction() {
  const payload = await firestoreFetch(':beginTransaction', {
    method: 'POST',
    body: JSON.stringify({ options: { readWrite: {} } }),
  });
  return payload.transaction;
}

async function rollbackFirestoreTransaction(transaction) {
  if (!transaction) return;
  await firestoreFetch(':rollback', {
    method: 'POST',
    body: JSON.stringify({ transaction }),
  }).catch(() => {});
}

async function commitFirestoreTransaction(transaction, writes) {
  return firestoreFetch(':commit', {
    method: 'POST',
    body: JSON.stringify({ transaction, writes }),
  });
}

async function getFirestoreProduct(productId, transaction = '') {
  const query = transaction ? `?transaction=${encodeURIComponent(transaction)}` : '';
  const document = await firestoreFetch(`/${FIRESTORE_PRODUCTS_COLLECTION}/${productDocumentId(productId)}${query}`, {
    method: 'GET',
  });
  return cleanProduct(fromFirestoreDocument(document));
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

  output += decoder.decode();
  return output;
}

async function readBlobProducts() {
  if (!isBlobProductStoreConfigured()) {
    return [];
  }

  try {
    const result = await get(PRODUCTS_PATH, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return [];
    }

    const text = await streamToText(result.stream);
    const products = JSON.parse(text || '[]');
    return Array.isArray(products) ? products : [];
  } catch (error) {
    return [];
  }
}

async function writeBlobProducts(products) {
  await put(PRODUCTS_PATH, JSON.stringify(Array.isArray(products) ? products : []), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}

export async function readProducts() {
  if (isFirestoreProductStoreConfigured()) {
    return readFirestoreProducts();
  }

  return readBlobProducts();
}

export async function writeProducts(products) {
  if (isFirestoreProductStoreConfigured()) {
    await deleteFirestoreProducts();
    await writeFirestoreProducts(products);
    return;
  }

  await writeBlobProducts(products);
}

export async function migrateBlobProductsToFirestore() {
  if (!isFirestoreProductStoreConfigured()) {
    throw new Error('Firestore is not configured.');
  }
  if (!isBlobProductStoreConfigured()) {
    return {
      found: 0,
      migrated: 0,
      skipped: 0,
    };
  }

  const blobProducts = (await readBlobProducts()).map(cleanProduct).filter((product) => product.id);
  const firestoreProducts = await readFirestoreProducts();
  const existingIds = new Set(firestoreProducts.map((product) => String(product.id || '')));
  const productsToMigrate = blobProducts.filter((product) => !existingIds.has(String(product.id)));

  if (productsToMigrate.length) {
    await writeFirestoreProducts(productsToMigrate);
  }

  return {
    found: blobProducts.length,
    migrated: productsToMigrate.length,
    skipped: blobProducts.length - productsToMigrate.length,
  };
}

function cleanOrderItems(items) {
  const itemMap = new Map();

  (Array.isArray(items) ? items : [])
    .map((item) => ({
      productId: String(item?.productId || '').trim(),
      qty: Math.max(0, Math.floor(Number(item?.qty || 0))),
    }))
    .filter((item) => item.productId && item.qty > 0)
    .forEach((item) => {
      itemMap.set(item.productId, (itemMap.get(item.productId) || 0) + item.qty);
    });

  return Array.from(itemMap, ([productId, qty]) => ({ productId, qty }));
}

export async function reserveProductsForOrder(items) {
  const orderItems = cleanOrderItems(items);
  if (!orderItems.length) {
    return [];
  }

  if (isFirestoreProductStoreConfigured()) {
    const transaction = await beginFirestoreTransaction();
    try {
      const products = [];
      const shortages = [];

      for (const item of orderItems) {
        const product = await getFirestoreProduct(item.productId, transaction).catch(() => null);
        const stock = Math.max(0, Math.floor(Number(product?.stock || 0)));

        if (!product?.id || stock < item.qty) {
          shortages.push({
            productId: item.productId,
            requested: item.qty,
            available: product?.id ? stock : 0,
          });
          continue;
        }

        products.push({
          ...product,
          stock: stock - item.qty,
          updatedAt: new Date().toISOString(),
        });
      }

      if (shortages.length) {
        const error = new Error('Some products are out of stock.');
        error.statusCode = 409;
        error.shortages = shortages;
        throw error;
      }

      await commitFirestoreTransaction(transaction, products.map((product) => ({
        update: {
          name: firestoreResourceName(`${FIRESTORE_PRODUCTS_COLLECTION}/${productDocumentId(product.id)}`),
          fields: toFirestoreFields(product, product.sortIndex || 0),
        },
        currentDocument: { exists: true },
      })));

      return products;
    } catch (error) {
      await rollbackFirestoreTransaction(transaction);
      throw error;
    }
  }

  const products = await readProducts();
  const nextProducts = products.map((product) => ({ ...product }));
  const shortages = [];

  for (const item of orderItems) {
    const product = nextProducts.find((entry) => String(entry.id) === String(item.productId));
    const stock = Math.max(0, Math.floor(Number(product?.stock || 0)));

    if (!product || stock < item.qty) {
      shortages.push({
        productId: item.productId,
        requested: item.qty,
        available: product ? stock : 0,
      });
      continue;
    }

    product.stock = stock - item.qty;
  }

  if (shortages.length) {
    const error = new Error('Some products are out of stock.');
    error.statusCode = 409;
    error.shortages = shortages;
    throw error;
  }

  await writeProducts(nextProducts);
  return nextProducts;
}

export async function restoreProductsForOrder(items) {
  const orderItems = cleanOrderItems(items);
  if (!orderItems.length) {
    return [];
  }

  if (isFirestoreProductStoreConfigured()) {
    const transaction = await beginFirestoreTransaction();
    try {
      const products = [];

      for (const item of orderItems) {
        const product = await getFirestoreProduct(item.productId, transaction).catch(() => null);
        if (product?.id) {
          products.push({
            ...product,
            stock: Math.max(0, Math.floor(Number(product.stock || 0))) + item.qty,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (products.length) {
        await commitFirestoreTransaction(transaction, products.map((product) => ({
          update: {
            name: firestoreResourceName(`${FIRESTORE_PRODUCTS_COLLECTION}/${productDocumentId(product.id)}`),
            fields: toFirestoreFields(product, product.sortIndex || 0),
          },
          currentDocument: { exists: true },
        })));
      } else {
        await rollbackFirestoreTransaction(transaction);
      }

      return products;
    } catch (error) {
      await rollbackFirestoreTransaction(transaction);
      throw error;
    }
  }

  const products = await readProducts();
  const nextProducts = products.map((product) => ({ ...product }));

  for (const item of orderItems) {
    const product = nextProducts.find((entry) => String(entry.id) === String(item.productId));
    if (product) {
      product.stock = Math.max(0, Math.floor(Number(product.stock || 0))) + item.qty;
    }
  }

  await writeProducts(nextProducts);
  return nextProducts;
}

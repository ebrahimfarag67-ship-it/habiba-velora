import crypto from 'node:crypto';
import { list, put } from '@vercel/blob';

const REVIEWS_FILE = 'reviews.json';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const FIRESTORE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || '(default)';
const FIRESTORE_COLLECTION = process.env.FIREBASE_REVIEWS_COLLECTION || 'reviews';

let firestoreToken = null;

function isFirestoreConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
}

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isReviewStoreConfigured() {
  return isFirestoreConfigured() || isBlobConfigured();
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
  if (value === undefined || value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { nullValue: null };
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
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
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, entryValue]) => [key, fromFirestoreValue(entryValue)]),
    );
  }
  return null;
}

function reviewDocumentId(reviewId) {
  const normalized = String(reviewId || '').trim();
  return normalized ? encodeURIComponent(normalized.replaceAll('/', '_')) : '';
}

function cleanReview(review) {
  return {
    id: cleanText(review?.id),
    productId: cleanText(review?.productId),
    rating: toRating(review?.rating),
    name: cleanText(review?.name),
    comment: cleanText(review?.comment),
    createdAt: String(review?.createdAt || new Date().toISOString()),
  };
}

function toFirestoreFields(review) {
  return Object.fromEntries(
    Object.entries(cleanReview(review))
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

function fromFirestoreDocument(document) {
  return cleanReview(Object.fromEntries(
    Object.entries(document?.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  ));
}

async function readBlobReviews() {
  if (!isBlobConfigured()) {
    return [];
  }

  const blobs = await list({ prefix: REVIEWS_FILE, limit: 1 });
  const file = blobs.blobs.find((blob) => blob.pathname === REVIEWS_FILE);
  if (!file) {
    return [];
  }

  const response = await fetch(file.url, { cache: 'no-store' });
  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload.reviews) ? payload.reviews.map(cleanReview).filter((review) => review.id) : [];
}

async function writeBlobReviews(reviews) {
  await put(REVIEWS_FILE, JSON.stringify({ reviews }, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
  });
}

async function readFirestoreReviews() {
  const reviews = [];
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
    reviews.push(...(payload.documents || []).map(fromFirestoreDocument));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return reviews.filter((review) => review.id);
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

async function deleteFirestoreReviews() {
  const reviews = await readFirestoreReviews();
  const writes = reviews.map((review) => ({
    delete: firestoreResourceName(`${FIRESTORE_COLLECTION}/${reviewDocumentId(review.id)}`),
  }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

async function writeFirestoreReviews(reviews) {
  const cleanedReviews = (Array.isArray(reviews) ? reviews : []).map(cleanReview).filter((review) => review.id);
  await deleteFirestoreReviews();
  const writes = cleanedReviews.map((review) => ({
    update: {
      name: firestoreResourceName(`${FIRESTORE_COLLECTION}/${reviewDocumentId(review.id)}`),
      fields: toFirestoreFields(review),
    },
  }));
  if (writes.length) {
    await batchWriteFirestore(writes);
  }
}

async function readReviews() {
  if (isFirestoreConfigured()) {
    const firestoreReviews = await readFirestoreReviews();
    if (firestoreReviews.length || !isBlobConfigured()) {
      return firestoreReviews;
    }
  }
  return readBlobReviews();
}

async function writeReviews(reviews) {
  if (isFirestoreConfigured()) {
    await writeFirestoreReviews(reviews);
    return;
  }
  await writeBlobReviews(reviews);
}

function cleanText(value, fallback = '') {
  return String(value ?? fallback).replace(/\s+/g, ' ').trim().slice(0, 240);
}

function textQuality(value, options = {}) {
  const text = cleanText(value);
  const letters = text.match(/[\p{L}]/gu) || [];
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];
  const uniqueLetters = new Set(letters.map((letter) => letter.toLowerCase()));
  const minimumLength = options.minimumLength ?? 2;
  const minimumLetters = options.minimumLetters ?? 2;
  const minimumWords = options.minimumWords ?? 1;

  if (
    text.length < minimumLength ||
    letters.length < minimumLetters ||
    words.length < minimumWords ||
    uniqueLetters.size < Math.min(3, minimumLetters)
  ) {
    return false;
  }

  return !/(.)\1{3,}/u.test(text) && !/https?:|www\.|@\w|[٠-٩0-9]{7,}/iu.test(text);
}

function toRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) {
    return 0;
  }
  return Math.max(1, Math.min(5, Math.round(rating)));
}

function summarizeReviews(reviews) {
  return reviews.reduce((summary, review) => {
    const productId = cleanText(review.productId);
    const rating = toRating(review.rating);
    if (!productId || !rating) {
      return summary;
    }

    const current = summary[productId] || { count: 0, total: 0, rating: 0 };
    current.count += 1;
    current.total += rating;
    current.rating = Number((current.total / current.count).toFixed(1));
    summary[productId] = current;
    return summary;
  }, {});
}

export default async function handler(request, response) {
  if (!isReviewStoreConfigured()) {
    if (request.method !== 'GET') {
      response.status(503).json({ error: 'تخزين التعليقات غير متاح حاليًا.' });
      return;
    }

    response.status(200).json({ reviews: [], summary: {}, configured: false });
    return;
  }

  if (request.method === 'GET') {
    const reviews = await readReviews();
    response.status(200).json({ reviews, summary: summarizeReviews(reviews), configured: true });
    return;
  }

  if (request.method === 'POST') {
    const productId = cleanText(request.body?.productId);
    const rating = toRating(request.body?.rating);
    const name = cleanText(request.body?.name);
    const comment = cleanText(request.body?.comment);

    if (!productId || !rating || !name || !comment) {
      response.status(400).json({ error: 'بيانات التقييم غير مكتملة.' });
      return;
    }

    if (!textQuality(name, { minimumLength: 2, minimumLetters: 2, minimumWords: 1 })) {
      response.status(400).json({ error: 'راجع الاسم المكتوب.' });
      return;
    }

    if (!textQuality(comment, { minimumLength: 10, minimumLetters: 7, minimumWords: 2 })) {
      response.status(400).json({ error: 'راجع التعليق المكتوب.' });
      return;
    }

    const reviews = await readReviews();
    const normalizedComment = comment.toLowerCase();
    const repeated = reviews.some((review) => (
      cleanText(review.productId) === productId &&
      cleanText(review.comment).toLowerCase() === normalizedComment
    ));
    if (repeated) {
      response.status(409).json({ error: 'تم إرسال نفس التعليق قبل كده.' });
      return;
    }

    const nextReview = {
      id: `REV-${Date.now()}`,
      productId,
      rating,
      name,
      comment,
      createdAt: new Date().toISOString(),
    };
    const nextReviews = [nextReview, ...reviews].slice(0, 500);
    await writeReviews(nextReviews);
    response.status(201).json({
      ok: true,
      review: nextReview,
      summary: summarizeReviews(nextReviews),
      configured: true,
    });
    return;
  }

  response.setHeader('Allow', 'GET, POST');
  response.status(405).json({ error: 'Method not allowed' });
}

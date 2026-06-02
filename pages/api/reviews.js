import { del, list, put } from '@vercel/blob';

const REVIEWS_FILE = 'reviews.json';

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readReviews() {
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
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

async function writeReviews(reviews) {
  const previous = await list({ prefix: REVIEWS_FILE, limit: 10 });
  await Promise.all(previous.blobs.map((blob) => del(blob.url).catch(() => null)));
  await put(REVIEWS_FILE, JSON.stringify({ reviews }, null, 2), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
  });
}

function cleanText(value, fallback = '') {
  return String(value ?? fallback).trim().slice(0, 240);
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
  if (!isBlobConfigured()) {
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
    if (!productId || !rating) {
      response.status(400).json({ error: 'بيانات التقييم غير مكتملة' });
      return;
    }

    const reviews = await readReviews();
    const nextReview = {
      id: `REV-${Date.now()}`,
      productId,
      rating,
      name: cleanText(request.body?.name, 'عميل'),
      comment: cleanText(request.body?.comment),
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

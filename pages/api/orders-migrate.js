import {
  isBlobOrderStoreConfigured,
  isFirestoreConfigured,
  migrateBlobOrdersToFirestore,
} from '../../lib/orders-store';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  if (!ADMIN_PASSWORD || request.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    response.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  if (!isFirestoreConfigured()) {
    response.status(503).json({
      ok: false,
      configured: false,
      message: 'Firestore is not configured.',
    });
    return;
  }

  try {
    const result = await migrateBlobOrdersToFirestore();
    response.status(200).json({
      ok: true,
      configured: true,
      blobConfigured: isBlobOrderStoreConfigured(),
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : 'Order migration failed.',
    });
  }
}

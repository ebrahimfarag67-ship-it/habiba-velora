import { put } from '@vercel/blob';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '172005';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'webp';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    response.status(503).json({ message: 'Image storage is not configured.' });
    return;
  }

  if (request.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    response.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const dataUrl = String(request.body?.image || '');
  const match = dataUrl.match(/^data:(image\/(?:webp|png|jpeg));base64,(.+)$/);
  if (!match) {
    response.status(400).json({ message: 'Invalid image data.' });
    return;
  }

  const mimeType = match[1];
  const imageBuffer = Buffer.from(match[2], 'base64');
  if (imageBuffer.length > 3 * 1024 * 1024) {
    response.status(413).json({ message: 'Image is too large after compression.' });
    return;
  }

  const extension = extensionFromMime(mimeType);
  const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const blob = await put(fileName, imageBuffer, {
    access: 'private',
    contentType: mimeType,
  });

  response.status(200).json({ url: `/api/product-image?path=${encodeURIComponent(blob.pathname)}` });
}

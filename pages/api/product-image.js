import { get } from '@vercel/blob';

export default async function handler(request, response) {
  const pathname = String(request.query.path || '');
  if (!pathname || !pathname.startsWith('products/')) {
    response.status(400).send('Invalid image path.');
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    response.status(503).send('Image storage is not configured.');
    return;
  }

  const blob = await get(pathname, { access: 'private', useCache: true });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    response.status(404).send('Image not found.');
    return;
  }

  response.setHeader('Content-Type', blob.contentType || 'image/webp');
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  response.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
  response.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=31536000, immutable');
  if (blob.size) {
    response.setHeader('Content-Length', String(blob.size));
  }

  const reader = blob.stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    response.write(Buffer.from(value));
  }
  response.end();
}

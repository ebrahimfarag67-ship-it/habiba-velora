import { isProductStoreConfigured, readProducts, writeProducts } from '../../lib/products-store';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '172005';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(request, response) {
  if (!isProductStoreConfigured()) {
    response.status(503).json({
      products: [],
      configured: false,
      message: 'Product storage is not configured.',
    });
    return;
  }

  try {
    if (request.method === 'GET') {
      const products = await readProducts();
      response.status(200).json({ products, configured: true });
      return;
    }

    if (request.method === 'PUT') {
      if (request.headers['x-admin-password'] !== ADMIN_PASSWORD) {
        response.status(401).json({ message: 'Unauthorized.' });
        return;
      }

      const products = Array.isArray(request.body?.products) ? request.body.products : [];
      await writeProducts(products);
      response.status(200).json({ ok: true, configured: true });
      return;
    }

    response.setHeader('Allow', 'GET, PUT');
    response.status(405).json({ message: 'Method not allowed.' });
  } catch (error) {
    response.status(500).json({
      products: [],
      configured: true,
      message: error instanceof Error ? error.message : 'Product storage error.',
    });
  }
}

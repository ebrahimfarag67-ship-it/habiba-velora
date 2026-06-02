import { cleanOrder, isOrderStoreConfigured, readOrders, writeOrders } from '../../lib/orders-store';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '172005';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(request, response) {
  if (!isOrderStoreConfigured()) {
    response.status(503).json({ orders: [], configured: false });
    return;
  }

  try {
    if (request.method === 'GET') {
      const orders = await readOrders();
      const query = String(request.query?.q || '').trim().toLowerCase();
      if (query) {
        const order = orders.find((item) => [item.id, item.invoiceId, item.phone]
          .map((value) => String(value || '').toLowerCase())
          .includes(query));
        response.status(200).json({ order: order || null, configured: true });
        return;
      }
      response.status(200).json({ orders, configured: true });
      return;
    }

    if (request.method === 'DELETE') {
      if (request.headers['x-admin-password'] !== ADMIN_PASSWORD) {
        response.status(401).json({ message: 'Unauthorized.' });
        return;
      }
      await writeOrders([]);
      response.status(200).json({ ok: true, orders: [], configured: true });
      return;
    }

    if (request.method !== 'PUT') {
      response.setHeader('Allow', 'GET, PUT, DELETE');
      response.status(405).json({ message: 'Method not allowed.' });
      return;
    }

    if (request.headers['x-admin-password'] !== ADMIN_PASSWORD) {
      response.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const incomingOrders = Array.isArray(request.body?.orders) ? request.body.orders.map(cleanOrder) : [];
    await writeOrders(incomingOrders);
    response.status(200).json({ ok: true, configured: true });
  } catch (error) {
    response.status(500).json({
      orders: [],
      configured: true,
      message: error instanceof Error ? error.message : 'Order storage error.',
    });
  }
}

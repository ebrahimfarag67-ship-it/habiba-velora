import { cleanOrder, clearOrders, findOrder, isOrderStoreConfigured, readOrders, upsertOrder, writeOrders } from '../../lib/orders-store';
import { adminAuthMessage, isAdminRequest } from '../../lib/admin-auth';
import { reserveProductsForOrder, restoreProductsForOrder } from '../../lib/products-store';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const query = String(request.query?.q || '').trim().toLowerCase();
      if (query) {
        if (!isOrderStoreConfigured()) {
          response.status(200).json({ order: null, configured: false });
          return;
        }

        const order = await findOrder(query);
        response.status(200).json({ order: order || null, configured: true });
        return;
      }

      if (!isAdminRequest(request)) {
        response.status(401).json({ message: adminAuthMessage() });
        return;
      }

      if (!isOrderStoreConfigured()) {
        response.status(200).json({ orders: [], configured: false });
        return;
      }

      const orders = await readOrders();
      response.status(200).json({ orders, configured: true });
      return;
    }

    if (request.method === 'POST') {
      if (!isOrderStoreConfigured()) {
        response.status(503).json({ message: 'Order storage is not configured.', configured: false });
        return;
      }

      const order = cleanOrder(request.body?.order || {});
      if (!order.id || !order.customer || !order.phone || !Array.isArray(order.items) || !Number(order.total)) {
        response.status(400).json({ message: 'Invalid order data.' });
        return;
      }
      const existingOrder = await findOrder(order.id);
      if (existingOrder) {
        response.status(409).json({ message: 'Order already exists.' });
        return;
      }
      let inventoryReserved = false;
      try {
        await reserveProductsForOrder(order.items);
        inventoryReserved = true;
        order.inventoryState = 'reserved';
        const savedOrder = await upsertOrder(order);
        response.status(201).json({ ok: true, order: savedOrder, configured: true });
      } catch (error) {
        if (inventoryReserved) {
          await restoreProductsForOrder(order.items).catch(() => {});
        }
        const statusCode = error?.statusCode || 500;
        response.status(statusCode).json({
          message: error instanceof Error ? error.message : 'Order save failed.',
          shortages: error?.shortages || [],
        });
      }
      return;
    }

    if (request.method === 'PATCH') {
      if (!isAdminRequest(request)) {
        response.status(401).json({ message: adminAuthMessage() });
        return;
      }

      if (!isOrderStoreConfigured()) {
        response.status(503).json({ message: 'Order storage is not configured.', configured: false });
        return;
      }

      const order = cleanOrder(request.body?.order || {});
      if (!order.id) {
        response.status(400).json({ message: 'Order id is required.' });
        return;
      }
      const currentOrder = await findOrder(order.id);
      if (currentOrder) {
        const wasReserved = currentOrder.inventoryState !== 'restored';
        const willBeRestored = order.status === 'cancelled' || order.status === 'return_requested' || order.inventoryState === 'restored';
        const wasRestored = currentOrder.inventoryState === 'restored';
        const willBeReserved = order.status !== 'cancelled' && order.status !== 'return_requested' && order.inventoryState !== 'restored';

        if (wasReserved && willBeRestored) {
          await restoreProductsForOrder(currentOrder.items || order.items);
          order.inventoryState = 'restored';
        } else if (wasRestored && willBeReserved) {
          await reserveProductsForOrder(order.items || currentOrder.items);
          order.inventoryState = 'reserved';
        }
      }
      const savedOrder = await upsertOrder(order);
      response.status(200).json({ ok: true, order: savedOrder, configured: true });
      return;
    }

    if (request.method === 'DELETE') {
      if (!isAdminRequest(request)) {
        response.status(401).json({ message: adminAuthMessage() });
        return;
      }

      if (!isOrderStoreConfigured()) {
        response.status(200).json({ ok: true, orders: [], configured: false });
        return;
      }

      const before = Math.max(0, Number(request.query?.before || 0));
      if (before) {
        const orders = await readOrders();
        const remainingOrders = orders.filter((order) => {
          const timestamp = Date.parse(order?.createdAt || order?.updatedAt || '');
          return Number.isFinite(timestamp) && timestamp > before;
        });
        await writeOrders(remainingOrders);
        response.status(200).json({ ok: true, orders: remainingOrders, configured: true });
        return;
      }

      await clearOrders();
      response.status(200).json({ ok: true, orders: [], configured: true });
      return;
    }

    if (request.method !== 'PUT') {
      response.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE');
      response.status(405).json({ message: 'Method not allowed.' });
      return;
    }

    if (!isAdminRequest(request)) {
      response.status(401).json({ message: adminAuthMessage() });
      return;
    }

    if (!isOrderStoreConfigured()) {
      response.status(503).json({ message: 'Order storage is not configured.', configured: false });
      return;
    }

    const incomingOrders = Array.isArray(request.body?.orders) ? request.body.orders.map(cleanOrder) : [];
    await writeOrders(incomingOrders);
    response.status(200).json({ ok: true, configured: true });
  } catch (error) {
    response.status(error?.statusCode || 500).json({
      orders: [],
      configured: true,
      message: error instanceof Error ? error.message : 'Order storage error.',
      shortages: error?.shortages || [],
    });
  }
}

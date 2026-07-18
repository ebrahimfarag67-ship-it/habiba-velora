import { isOrderStoreConfigured, upsertOrder } from '../../lib/orders-store';
import { createPaymobIntention, paymobConfigured } from '../../lib/paymob';
import { reserveProductsForOrder, restoreProductsForOrder } from '../../lib/products-store';
import { publicBaseUrl } from '../../lib/telegram';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function cleanClientOrder(order) {
  return {
    ...order,
    payment: 'فودافون كاش',
    paymentStatus: 'pending_gateway',
    paymentGateway: 'paymob',
    paymentSenderPhone: '',
    paymentTransactionId: '',
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  if (process.env.ENABLE_ONLINE_PAYMENTS !== 'true') {
    response.status(503).json({ message: 'Online payments are temporarily disabled.' });
    return;
  }

  if (!isOrderStoreConfigured()) {
    response.status(503).json({ message: 'Order storage is not configured.' });
    return;
  }

  if (!paymobConfigured()) {
    response.status(503).json({
      message: 'Paymob is not configured. Add PAYMOB_SECRET_KEY or PAYMOB_API_KEY, plus PAYMOB_PUBLIC_KEY, PAYMOB_HMAC_SECRET, and PAYMOB_PAYMENT_METHODS.',
    });
    return;
  }

  try {
    const order = cleanClientOrder(request.body?.order || {});
    if (!order.id || !order.customer || !order.phone || !Number(order.total)) {
      response.status(400).json({ message: 'Invalid order data.' });
      return;
    }

    const baseUrl = publicBaseUrl(request);
    const { intention, checkoutUrl } = await createPaymobIntention(order, { baseUrl });
    let inventoryReserved = false;
    try {
      await reserveProductsForOrder(order.items);
      inventoryReserved = true;
      const savedOrder = await upsertOrder({
        ...order,
        inventoryState: 'reserved',
        paymentReference: order.paymentReference || order.id,
        paymentGatewayReference: String(intention.id || intention.intention_order_id || intention.order || ''),
      });

      response.status(200).json({
        ok: true,
        order: savedOrder,
        checkoutUrl,
      });
    } catch (error) {
      if (inventoryReserved) {
        await restoreProductsForOrder(order.items).catch(() => {});
      }
      throw error;
    }
  } catch (error) {
    response.status(error?.statusCode || 500).json({
      message: error instanceof Error ? error.message : 'Payment intention error.',
      shortages: error?.shortages || [],
    });
  }
}

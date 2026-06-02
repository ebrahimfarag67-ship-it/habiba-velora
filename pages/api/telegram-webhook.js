import { answerCallbackQuery, sendTelegramMessage } from '../../lib/telegram';
import { statusLabel, updateOrderStatus } from '../../lib/orders-store';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const callback = request.body?.callback_query;
  const data = String(callback?.data || '');
  const [kind, orderId, status] = data.split('|');

  if (kind !== 'status' || !orderId || !status) {
    response.status(200).json({ ok: true });
    return;
  }

  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    await answerCallbackQuery(callback.id, 'حالة غير متاحة');
    response.status(200).json({ ok: false });
    return;
  }

  const order = await updateOrderStatus(orderId, status, 'تم تحديث الحالة من بوت تليجرام');
  if (!order) {
    await answerCallbackQuery(callback.id, 'لم يتم العثور على الطلب');
    response.status(200).json({ ok: false });
    return;
  }

  await answerCallbackQuery(callback.id, `تم تحديث الطلب: ${statusLabel(status)}`);
  await sendTelegramMessage(`تم تحديث حالة الطلب ${order.id}\nالحالة: ${statusLabel(status)}\nالعميل: ${order.customer || '-'}`);
  response.status(200).json({ ok: true });
}

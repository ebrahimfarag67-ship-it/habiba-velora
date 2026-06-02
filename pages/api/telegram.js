import { publicBaseUrl, sendTelegramMessage, telegramConfigured } from '../../lib/telegram';

const labels = {
  title: 'طلب جديد من HabibaVelora',
  orderId: 'رقم الطلب',
  invoiceId: 'رقم الفاتورة',
  customer: 'العميل',
  phone: 'الهاتف',
  address: 'العنوان',
  payment: 'الدفع',
  total: 'الإجمالي',
  items: 'المنتجات',
  currency: 'ج.م',
};

function statusKeyboard(order, baseUrl) {
  const invoiceUrl = `${baseUrl}/invoice?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  const scanUrl = `${baseUrl}/api/delivery-scan?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  return {
    inline_keyboard: [
      [
        { text: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062c\u0647\u064a\u0632', callback_data: `status|${order.id}|processing` },
        { text: '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646', callback_data: `status|${order.id}|shipped` },
      ],
      [
        { text: '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645', callback_data: `status|${order.id}|delivered` },
        { text: '\u0645\u0644\u063a\u064a', callback_data: `status|${order.id}|cancelled` },
      ],
      [
        { text: '\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629', url: invoiceUrl },
        { text: '\u0635\u0641\u062d\u0629 \u0642\u0631\u0627\u0631 \u0627\u0644\u0645\u0646\u062f\u0648\u0628', url: scanUrl },
      ],
    ],
  };}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  if (!telegramConfigured()) {
    response.status(200).json({ ok: false, configured: false });
    return;
  }

  const order = request.body?.order || {};
  const baseUrl = publicBaseUrl(request);
  const items = Array.isArray(order.items)
    ? order.items
        .map((item) => {
          const options = [item.option, item.color, item.size].filter(Boolean).join(' / ');
          return `- ${item.name || '-'} × ${item.qty || 1} (${item.price || 0} ${labels.currency})${options ? ` - ${options}` : ''}`;
        })
        .join('\n')
    : '';
  const text = [
    labels.title,
    `${labels.orderId}: ${order.id || '-'}`,
    `${labels.invoiceId}: ${order.invoiceId || '-'}`,
    `${labels.customer}: ${order.customer || '-'}`,
    `${labels.phone}: ${order.phone || '-'}`,
    `${labels.address}: ${order.fullAddress || '-'}`,
    `${labels.payment}: ${order.payment || '-'}`,
    `${labels.total}: ${order.total || 0} ${labels.currency}`,
    items ? `${labels.items}:\n${items}` : '',
  ].filter(Boolean).join('\n');

  const result = await sendTelegramMessage(text, statusKeyboard(order, baseUrl));
  response.status(200).json(result);
}

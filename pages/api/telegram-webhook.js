import { answerCallbackQuery, sendTelegramMessage } from '../../lib/telegram';
import { statusLabel, updateOrderPaymentStatus, updateOrderStatus } from '../../lib/orders-store';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function englishDigits(value) {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit));
}

function code(value) {
  return `<code>${escapeHtml(englishDigits(value || '-'))}</code>`;
}

function money(value) {
  return `${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')} ج.م`;
}

function eventMessage({ icon, title, rows }) {
  return [
    `${icon} <b>HabibaVelora Operations</b>`,
    code(title),
    '━━━━━━━━━━━━━━━━━━━━',
    ...rows.filter(Boolean),
  ].join('\n');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const callback = request.body?.callback_query;
  const data = String(callback?.data || '');
  const [kind, orderId, status] = data.split('|');

  if (!orderId || !status || !['status', 'payment'].includes(kind)) {
    response.status(200).json({ ok: true });
    return;
  }

  if (kind === 'payment') {
    if (status !== 'confirmed') {
      await answerCallbackQuery(callback.id, 'حالة دفع غير متاحة');
      response.status(200).json({ ok: false });
      return;
    }

    const order = await updateOrderPaymentStatus(orderId, 'confirmed', 'تم تأكيد الدفع من بوت تليجرام');
    if (!order) {
      await answerCallbackQuery(callback.id, 'لم يتم العثور على الطلب');
      response.status(200).json({ ok: false });
      return;
    }

    await answerCallbackQuery(callback.id, `تم تأكيد الدفع للطلب ${order.id}`);
    await sendTelegramMessage(eventMessage({
      icon: '🟢',
      title: 'تم تأكيد الدفع يدويًا',
      rows: [
        `▫️ <b>الطلب</b>\n${code(order.id)}`,
        `▫️ <b>العميل</b>\n${escapeHtml(englishDigits(order.customer || '-'))}`,
        `▫️ <b>الإجمالي</b>\n${code(money(order.total))}`,
        `▫️ <b>كود الربط</b>\n${code(order.paymentReference || '-')}`,
        '✅ <i>يمكن الآن بدء تجهيز الطلب.</i>',
      ],
    }), null, { parse_mode: 'HTML' });
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
  await sendTelegramMessage(eventMessage({
    icon: '📦',
      title: 'تحديث حالة الطلب',
      rows: [
      `▫️ <b>الطلب</b>\n${code(order.id)}`,
      `▫️ <b>الحالة الجديدة</b>\n<b>${escapeHtml(statusLabel(status))}</b>`,
      `▫️ <b>العميل</b>\n${escapeHtml(englishDigits(order.customer || '-'))}`,
      `▫️ <b>الهاتف</b>\n${code(order.phone || '-')}`,
    ],
  }), null, { parse_mode: 'HTML' });
  response.status(200).json({ ok: true });
}

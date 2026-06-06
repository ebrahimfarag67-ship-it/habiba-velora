import { publicBaseUrl, sendTelegramMessage, telegramConfigured } from '../../lib/telegram';

const labels = {
  currency: 'ج.م',
};

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
  return `${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')} ${labels.currency}`;
}

function paymentStatusMeta(status) {
  return {
    pending_review: { icon: '🟠', label: 'بانتظار مراجعة التحويل', action: 'راجع التحويل يدويًا قبل التجهيز' },
    pending_gateway: { icon: '🟡', label: 'بانتظار تأكيد Paymob', action: 'لا تبدأ التجهيز قبل وصول تأكيد Paymob' },
    cash_on_delivery: { icon: '⚪', label: 'الدفع عند الاستلام', action: 'التحصيل مع المندوب عند التسليم' },
    not_required: { icon: '⚪', label: 'لا يحتاج تأكيد دفع', action: 'راجع طريقة الدفع عند الحاجة' },
    confirmed: { icon: '🟢', label: 'تم تأكيد الدفع', action: 'جاهز للتجهيز والشحن' },
    failed: { icon: '🔴', label: 'فشل أو رفض الدفع', action: 'لا تجهز الطلب قبل محاولة دفع ناجحة' },
  }[status] || { icon: '⚪', label: status || 'غير محدد', action: 'راجع الطلب قبل التنفيذ' };
}

function statusKeyboard(order, baseUrl) {
  const invoiceUrl = `${baseUrl}/invoice?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  const scanUrl = `${baseUrl}/api/delivery-scan?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  const keyboard = [];
  if (order.paymentStatus === 'pending_review') {
    keyboard.push([
      { text: '✅ تأكيد الدفع يدويًا', callback_data: `payment|${order.id}|confirmed` },
    ]);
  }
  keyboard.push(
      [
        { text: '⚙️ جاري التجهيز', callback_data: `status|${order.id}|processing` },
        { text: '🚚 تم الشحن', callback_data: `status|${order.id}|shipped` },
      ],
      [
        { text: '✅ تم التسليم', callback_data: `status|${order.id}|delivered` },
        { text: '❌ إلغاء الطلب', callback_data: `status|${order.id}|cancelled` },
      ],
      [
        { text: '🧾 الفاتورة', url: invoiceUrl },
        { text: '📲 صفحة المندوب', url: scanUrl },
      ],
  );
  return { inline_keyboard: keyboard };
}

function field(label, value) {
  return `▫️ <b>${escapeHtml(label)}</b>\n${escapeHtml(englishDigits(value || '-'))}`;
}

function codeField(label, value) {
  return `▫️ <b>${escapeHtml(label)}</b>\n${code(value)}`;
}

function section(title, rows) {
  const body = rows.filter(Boolean).join('\n');
  return body ? `<b>${escapeHtml(title)}</b>\n${body}` : '';
}

function productRows(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return items.map((item, index) => {
    const options = [item.option, item.color, item.size].filter(Boolean).join(' / ');
    const lineTotal = Math.max(0, Number(item.qty || 1) * Number(item.price || 0));
    return [
      `▫️ <b>${englishDigits(index + 1)}. ${escapeHtml(item.name || 'منتج')}</b>`,
      `   ${code(`${item.qty || 1} x ${money(item.price)}`)}  →  <b>${escapeHtml(money(lineTotal))}</b>`,
      options ? `   <i>${escapeHtml(englishDigits(options))}</i>` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

function statusLine(paymentMeta) {
  return [
    `${paymentMeta.icon} <b>${escapeHtml(paymentMeta.label)}</b>`,
    `🧭 <i>${escapeHtml(paymentMeta.action)}</i>`,
  ].join('\n');
}

function orderTimestamp() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

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
  const paymentMeta = paymentStatusMeta(order.paymentStatus);
  const products = productRows(order.items);
  const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) : 0;
  const text = [
    '💎 <b>HabibaVelora Operations</b>',
    `${code(`NEW ORDER • ${order.id || '-'}`)}`,
    '━━━━━━━━━━━━━━━━━━━━',
    statusLine(paymentMeta),
    '',
    section('🧾 ORDER SUMMARY', [
      codeField('رقم الطلب', order.id),
      codeField('رقم الفاتورة', order.invoiceId),
      codeField('عدد القطع', itemsCount ? `${itemsCount}` : '-'),
      codeField('الإجمالي', money(order.total)),
    ]),
    '',
    section('👤 CUSTOMER', [
      field('الاسم', order.customer),
      codeField('الهاتف', order.phone),
      field('العنوان', order.fullAddress),
    ]),
    '',
    section('💳 PAYMENT', [
      field('الطريقة', order.payment),
      field('الحالة', `${paymentMeta.icon} ${paymentMeta.label}`),
      order.paymentReference ? codeField('كود الربط', order.paymentReference) : '',
      order.paymentGateway ? field('البوابة', order.paymentGateway) : '',
      order.paymentGatewayReference ? codeField('مرجع Paymob', order.paymentGatewayReference) : '',
      order.paymentGatewayTransactionId ? codeField('عملية Paymob', order.paymentGatewayTransactionId) : '',
      order.paymentGatewayMessage ? field('رسالة Paymob', order.paymentGatewayMessage) : '',
      order.paymentPhone ? codeField('رقم التحويل', order.paymentPhone) : '',
      order.paymentSenderPhone ? codeField('محفظة العميل', order.paymentSenderPhone) : '',
      order.paymentTransactionId ? codeField('رقم العملية', order.paymentTransactionId) : '',
    ]),
    '',
    products ? `<b>📦 PRODUCTS</b>\n${products}` : '',
    '',
    `🕒 ${code(orderTimestamp())}`,
  ].filter(Boolean).join('\n');

  const result = await sendTelegramMessage(text, statusKeyboard(order, baseUrl), { parse_mode: 'HTML' });
  response.status(200).json(result);
}

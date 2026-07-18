import { findOrder, upsertOrder } from '../../lib/orders-store';
import { createTelegramForumTopic, publicBaseUrl, sendTelegramMessage, telegramConfigured } from '../../lib/telegram';

const CURRENCY = 'ج.م';

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
  return `${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')} ${CURRENCY}`;
}

function field(label, value) {
  return `• <b>${escapeHtml(label)}:</b> ${escapeHtml(englishDigits(value || '-'))}`;
}

function codeField(label, value) {
  return `• <b>${escapeHtml(label)}:</b> ${code(value)}`;
}

function section(title, rows) {
  const body = rows.filter(Boolean).join('\n');
  return body ? `<b>${escapeHtml(title)}</b>\n${body}` : '';
}

function statusMeta(status) {
  return {
    pending_review: { label: 'بانتظار مراجعة التحويل', action: 'راجع التحويل قبل التجهيز.' },
    pending_gateway: { label: 'بانتظار تأكيد Paymob', action: 'لا تبدأ التجهيز قبل تأكيد الدفع.' },
    cash_on_delivery: { label: 'الدفع عند الاستلام', action: 'التحصيل عند التسليم.' },
    not_required: { label: 'لا يحتاج تأكيد دفع', action: 'راجع الطلب عند الحاجة.' },
    confirmed: { label: 'تم تأكيد الدفع', action: 'جاهز للتجهيز والشحن.' },
    failed: { label: 'فشل أو رفض الدفع', action: 'لا تجهز الطلب قبل حل الدفع.' },
  }[status] || { label: status || 'غير محدد', action: 'راجع الطلب قبل التنفيذ.' };
}

function statusKeyboard(order, baseUrl) {
  const invoiceUrl = `${baseUrl}/invoice?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  const scanUrl = `${baseUrl}/api/delivery-scan?o=${encodeURIComponent(order.id || '')}&t=${encodeURIComponent(order.deliveryToken || '')}`;
  const keyboard = [];

  if (order.paymentStatus === 'pending_review') {
    keyboard.push([
      { text: 'تأكيد الدفع يدويًا', callback_data: `payment|${order.id}|confirmed` },
    ]);
  }

  keyboard.push(
    [
      { text: 'جاري التجهيز', callback_data: `status|${order.id}|processing` },
      { text: 'تم الشحن', callback_data: `status|${order.id}|shipped` },
    ],
    [
      { text: 'تم التسليم', callback_data: `status|${order.id}|delivered` },
      { text: 'مرتجع', callback_data: `status|${order.id}|return_requested` },
    ],
    [
      { text: 'إلغاء الطلب', callback_data: `status|${order.id}|cancelled` },
    ],
    [
      { text: 'الفاتورة', url: invoiceUrl },
      { text: 'صفحة المندوب', url: scanUrl },
    ],
  );

  return { inline_keyboard: keyboard };
}

function productRows(items) {
  if (!Array.isArray(items) || !items.length) return 'لا توجد منتجات مسجلة.';
  return items.map((item, index) => {
    const options = [item.option, item.color, item.size].filter(Boolean).join(' / ');
    const lineTotal = Math.max(0, Number(item.qty || 1) * Number(item.price || 0));
    return [
      `${index + 1}. <b>${escapeHtml(item.name || 'منتج')}</b>`,
      `   الكمية: ${code(item.qty || 1)} | السعر: ${code(money(item.price))} | الإجمالي: <b>${escapeHtml(money(lineTotal))}</b>`,
      options ? `   <i>${escapeHtml(englishDigits(options))}</i>` : '',
    ].filter(Boolean).join('\n');
  }).join('\n');
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

function topicName(order) {
  const customer = String(order.customer || 'عميل').trim();
  const total = Math.max(0, Math.round(Number(order.total) || 0));
  return `طلب ${order.id || '-'} | ${customer} | ${total} ج`.slice(0, 128);
}

function topicError(result) {
  return result?.data?.description || result?.data?.error_code || result?.status || '';
}

async function ensureOrderTopic(order) {
  const storedOrder = order.id ? await findOrder(order.id).catch(() => null) : null;
  const existingThreadId = Number(storedOrder?.telegramThreadId || order.telegramThreadId || 0);
  if (existingThreadId) {
    return { storedOrder, messageThreadId: existingThreadId, mode: 'topic' };
  }

  const topic = await createTelegramForumTopic(topicName(order)).catch((error) => ({
    ok: false,
    data: { description: error instanceof Error ? error.message : 'topic creation failed' },
  }));
  const messageThreadId = Number(topic?.messageThreadId || 0);

  if (storedOrder && messageThreadId) {
    const updatedOrder = await upsertOrder({
      ...storedOrder,
      telegramThreadId: String(messageThreadId),
      telegramThreadStatus: 'open',
      telegramTopicName: topicName(order),
      telegramTopicMode: 'topic',
      telegramTopicError: '',
    }).catch(() => storedOrder);
    return { storedOrder: updatedOrder, messageThreadId, mode: 'topic' };
  }

  if (storedOrder) {
    const updatedOrder = await upsertOrder({
      ...storedOrder,
      telegramThreadStatus: 'open',
      telegramTopicMode: 'main_chat_reply',
      telegramTopicError: topicError(topic) || 'لم يتم إنشاء Topic منفصل.',
    }).catch(() => storedOrder);
    return { storedOrder: updatedOrder, messageThreadId: null, mode: 'reply', topic };
  }

  return { storedOrder, messageThreadId: messageThreadId || null, mode: messageThreadId ? 'topic' : 'reply', topic };
}

function orderMessage(order, meta, itemsCount) {
  return [
    '<b>طلب جديد من Habiba Velora</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    section('بيانات الطلب', [
      codeField('رقم الطلب', order.id),
      codeField('رقم الفاتورة', order.invoiceId),
      codeField('عدد القطع', itemsCount ? `${itemsCount}` : '-'),
      codeField('الإجمالي', money(order.total)),
    ]),
    '',
    section('العميل والشحن', [
      field('الاسم', order.customer),
      codeField('الهاتف', order.phone),
      field('العنوان', order.fullAddress),
    ]),
    '',
    section('الدفع', [
      field('الطريقة', order.payment),
      field('الحالة', meta.label),
      field('المطلوب', meta.action),
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
    section('المنتجات', [productRows(order.items)]),
    '',
    `وقت التسجيل: ${code(orderTimestamp())}`,
  ].filter(Boolean).join('\n');
}

async function storeTelegramMessage(order, result, { messageThreadId, mode, topic }) {
  const messageId = result?.data?.result?.message_id || null;
  if (!order?.id) return;
  const storedOrder = await findOrder(order.id).catch(() => null);
  if (!storedOrder?.id) return;

  await upsertOrder({
    ...storedOrder,
    telegramMessageId: messageId ? String(messageId) : String(storedOrder.telegramMessageId || ''),
    telegramThreadId: messageThreadId ? String(messageThreadId) : String(storedOrder.telegramThreadId || ''),
    telegramThreadStatus: 'open',
    telegramTopicName: messageThreadId ? topicName(order) : String(storedOrder.telegramTopicName || ''),
    telegramTopicMode: mode || (messageThreadId ? 'topic' : 'main_chat_reply'),
    telegramTopicError: messageThreadId ? '' : (topicError(topic) || storedOrder.telegramTopicError || ''),
  }).catch(() => {});
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
  const topicState = await ensureOrderTopic(order);
  const paymentMeta = statusMeta(order.paymentStatus);
  const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) : 0;
  const result = await sendTelegramMessage(orderMessage(order, paymentMeta, itemsCount), statusKeyboard(order, baseUrl), {
    parse_mode: 'HTML',
    ...(topicState.messageThreadId ? { message_thread_id: topicState.messageThreadId } : {}),
  });

  await storeTelegramMessage(order, result, topicState);

  response.status(200).json({
    ...result,
    messageThreadId: topicState.messageThreadId,
    mode: topicState.mode,
    topicError: topicError(topicState.topic),
  });
}

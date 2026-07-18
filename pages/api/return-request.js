import { findOrder, updateOrderStatus, upsertOrder } from '../../lib/orders-store';
import { createTelegramForumTopic, reopenTelegramForumTopic, sendTelegramMessage } from '../../lib/telegram';

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

function compactId(value) {
  return englishDigits(value).replace(/\s+/g, '').toLowerCase();
}

function phoneTail(value) {
  return englishDigits(value).replace(/\D/g, '').slice(-10);
}

function code(value) {
  return `<code>${escapeHtml(englishDigits(value || '-'))}</code>`;
}

function row(label, value, coded = false) {
  return `• <b>${escapeHtml(label)}:</b> ${coded ? code(value) : escapeHtml(englishDigits(value || '-'))}`;
}

function topicName(order) {
  const customer = String(order.customer || 'عميل').trim();
  return `مرتجع ${order.id || '-'} | ${customer}`.slice(0, 128);
}

function topicError(result) {
  return result?.data?.description || result?.data?.error_code || result?.status || '';
}

function requestMessage({ order, request }) {
  return [
    '<b>طلب مرتجع جديد</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    row('رقم الطلب', order.id, true),
    order.invoiceId ? row('رقم الفاتورة', order.invoiceId, true) : '',
    row('العميل', order.customer || request.customer || '-'),
    row('الهاتف', order.phone || request.phone || '-', true),
    row('نوع المرتجع', request.returnType || 'مرتجع كامل'),
    row('السبب', request.reason || 'غير محدد'),
    request.notes ? row('ملاحظات العميل', request.notes) : '',
    request.address ? row('عنوان الاستلام', [request.governorate, request.area, request.address].filter(Boolean).join(' - ')) : '',
    '<i>تم فتح متابعة المرتجع وربطها بهذا الطلب.</i>',
  ].filter(Boolean).join('\n');
}

function replyOptions(order, messageThreadId) {
  if (messageThreadId) {
    return { message_thread_id: messageThreadId };
  }

  const messageId = Number(order.telegramMessageId || 0);
  if (messageId) {
    return {
      reply_parameters: {
        message_id: messageId,
        allow_sending_without_reply: true,
      },
    };
  }

  return {};
}

async function ensureReturnThread(order) {
  const existingThreadId = Number(order.telegramThreadId || 0);
  if (existingThreadId) {
    await reopenTelegramForumTopic(existingThreadId).catch(() => {});
    const updatedOrder = await upsertOrder({
      ...order,
      telegramThreadStatus: 'open',
      telegramTopicMode: 'topic',
    }).catch(() => order);
    return { order: updatedOrder, messageThreadId: existingThreadId, mode: 'topic' };
  }

  const topic = await createTelegramForumTopic(topicName(order)).catch((error) => ({
    ok: false,
    data: { description: error instanceof Error ? error.message : 'topic creation failed' },
  }));
  const messageThreadId = Number(topic?.messageThreadId || 0) || null;
  if (messageThreadId) {
    const updatedOrder = await upsertOrder({
      ...order,
      telegramThreadId: String(messageThreadId),
      telegramThreadStatus: 'open',
      telegramTopicName: topicName(order),
      telegramTopicMode: 'topic',
      telegramTopicError: '',
    }).catch(() => order);
    return { order: updatedOrder, messageThreadId, mode: 'topic' };
  }

  const updatedOrder = await upsertOrder({
    ...order,
    telegramThreadStatus: 'open',
    telegramTopicMode: 'main_chat_reply',
    telegramTopicError: topicError(topic) || order.telegramTopicError || 'لم يتم إنشاء Topic منفصل.',
  }).catch(() => order);
  return { order: updatedOrder, messageThreadId: null, mode: 'reply', topic };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const returnRequest = request.body?.returnRequest || {};
  const orderQuery = String(returnRequest.orderId || '').trim();
  const submittedPhoneTail = phoneTail(returnRequest.phone);

  if (!orderQuery || !submittedPhoneTail) {
    response.status(400).json({ message: 'رقم الطلب ورقم الهاتف مطلوبان.' });
    return;
  }

  const order = await findOrder(orderQuery);
  if (!order?.id) {
    response.status(404).json({ message: 'لم يتم العثور على الطلب.' });
    return;
  }

  const orderMatches = [order.id, order.invoiceId].some((value) => compactId(value) === compactId(orderQuery));
  if (!orderMatches) {
    response.status(404).json({ message: 'رقم الطلب غير مطابق.' });
    return;
  }

  if (!phoneTail(order.phone) || phoneTail(order.phone) !== submittedPhoneTail) {
    response.status(403).json({ message: 'رقم الهاتف غير مطابق للطلب.' });
    return;
  }

  const requestId = String(returnRequest.id || `RET-${Date.now()}`).replace(/\D/g, '').trim() || `${Date.now()}`;
  const note = [
    `طلب مرتجع ${requestId}`,
    returnRequest.returnType ? `النوع: ${returnRequest.returnType}` : '',
    returnRequest.reason ? `السبب: ${returnRequest.reason}` : '',
    returnRequest.notes ? `ملاحظات: ${returnRequest.notes}` : '',
  ].filter(Boolean).join(' | ');

  const updatedOrder = await updateOrderStatus(order.id, 'return_requested', note);
  if (!updatedOrder?.id) {
    response.status(500).json({ message: 'تعذر تحديث حالة الطلب.' });
    return;
  }

  const threadState = await ensureReturnThread(updatedOrder);
  const telegramResult = await sendTelegramMessage(
    requestMessage({ order: threadState.order, request: { ...returnRequest, id: requestId } }),
    null,
    {
      parse_mode: 'HTML',
      ...replyOptions(threadState.order, threadState.messageThreadId),
    },
  );

  response.status(200).json({
    ok: true,
    returnRequestId: requestId,
    order: threadState.order,
    messageThreadId: threadState.messageThreadId,
    mode: threadState.mode,
    topicError: topicError(threadState.topic),
    telegram: {
      ok: Boolean(telegramResult?.ok),
      configured: telegramResult?.configured !== false,
    },
  });
}

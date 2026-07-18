import { answerCallbackQuery, closeTelegramForumTopic, reopenTelegramForumTopic, sendTelegramMessage } from '../../lib/telegram';
import { statusLabel, updateOrderPaymentStatus, updateOrderStatus, upsertOrder } from '../../lib/orders-store';

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

function row(label, value, coded = false) {
  return `• <b>${escapeHtml(label)}:</b> ${coded ? code(value) : escapeHtml(englishDigits(value || '-'))}`;
}

function eventMessage({ title, rows }) {
  return [
    `<b>${escapeHtml(title)}</b>`,
    '━━━━━━━━━━━━━━━━━━━━',
    ...rows.filter(Boolean),
  ].join('\n');
}

function threadId(callback, order) {
  return Number(callback?.message?.message_thread_id || order?.telegramThreadId || 0) || null;
}

function replyMessageId(callback, order) {
  return Number(order?.telegramMessageId || callback?.message?.message_id || 0) || null;
}

function messageOptions(callback, order) {
  const messageThreadId = threadId(callback, order);
  if (messageThreadId) {
    return { message_thread_id: messageThreadId };
  }

  const messageId = replyMessageId(callback, order);
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

async function syncThreadState(order, callback, status) {
  if (!order?.id) return order;

  const messageThreadId = threadId(callback, order);
  const messageId = replyMessageId(callback, order);
  const nextOrder = {
    ...order,
    telegramThreadId: messageThreadId ? String(messageThreadId) : String(order.telegramThreadId || ''),
    telegramMessageId: messageId ? String(messageId) : String(order.telegramMessageId || ''),
    telegramThreadStatus: status === 'delivered' ? 'closed' : 'open',
    telegramTopicMode: messageThreadId ? 'topic' : (order.telegramTopicMode || 'main_chat_reply'),
  };

  if (status === 'return_requested' && messageThreadId) {
    await reopenTelegramForumTopic(messageThreadId).catch(() => {});
  }

  await upsertOrder(nextOrder).catch(() => {});
  return nextOrder;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const message = request.body?.message;
  const messageText = String(message?.text || '').trim();
  if (message?.chat?.id && messageText.toLowerCase().startsWith('/chatid')) {
    const chat = message.chat;
    await sendTelegramMessage([
      '<b>Telegram Chat Setup</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `• <b>Chat ID:</b> <code>${escapeHtml(chat.id)}</code>`,
      `• <b>Type:</b> ${escapeHtml(chat.type || '-')}`,
      `• <b>Title:</b> ${escapeHtml(chat.title || chat.first_name || '-')}`,
      `• <b>Topics:</b> ${chat.is_forum ? 'مفعلة' : 'غير مفعلة أو غير ظاهرة في الرسالة'}`,
      '',
      chat.type === 'supergroup'
        ? 'لو Topics غير مفعلة، افتح إعدادات الجروب وفعل Topics ثم خلي البوت أدمن بصلاحية Manage Topics.'
        : 'لازم يكون الجروب Supergroup عشان كل طلب يتفتح في Topic مستقل.',
    ].join('\n'), null, {
      chat_id: chat.id,
      parse_mode: 'HTML',
      reply_parameters: {
        message_id: message.message_id,
        allow_sending_without_reply: true,
      },
    });
    response.status(200).json({ ok: true, chatId: chat.id });
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

    const orderForThread = await syncThreadState(order, callback, order.status || 'pending');
    await answerCallbackQuery(callback.id, `تم تأكيد الدفع للطلب ${order.id}`);
    await sendTelegramMessage(eventMessage({
      title: 'تم تأكيد الدفع يدويًا',
      rows: [
        row('رقم الطلب', orderForThread.id, true),
        row('العميل', orderForThread.customer),
        row('الإجمالي', money(orderForThread.total), true),
        row('كود الربط', orderForThread.paymentReference || '-', true),
        '<i>يمكن بدء تجهيز الطلب الآن.</i>',
      ],
    }), null, {
      parse_mode: 'HTML',
      ...messageOptions(callback, orderForThread),
    });
    response.status(200).json({ ok: true });
    return;
  }

  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'return_requested', 'cancelled'];
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

  const orderForThread = await syncThreadState(order, callback, status);
  await answerCallbackQuery(callback.id, `تم تحديث الطلب: ${statusLabel(status)}`);
  await sendTelegramMessage(eventMessage({
    title: 'تحديث حالة الطلب',
    rows: [
      status === 'return_requested' ? '<b>تم فتح متابعة المرتجع لهذا الطلب.</b>' : '',
      status === 'delivered' ? '<b>تم إنهاء متابعة الطلب وسيتم إغلاق الـ Topic إن كان متاحًا.</b>' : '',
      row('رقم الطلب', orderForThread.id, true),
      row('الحالة الجديدة', statusLabel(status)),
      row('العميل', orderForThread.customer),
      row('الهاتف', orderForThread.phone, true),
    ],
  }), null, {
    parse_mode: 'HTML',
    ...messageOptions(callback, orderForThread),
  });

  const messageThreadId = threadId(callback, orderForThread);
  if (status === 'delivered' && messageThreadId) {
    await closeTelegramForumTopic(messageThreadId).catch(() => {});
    await upsertOrder({ ...orderForThread, telegramThreadStatus: 'closed' }).catch(() => {});
  }

  response.status(200).json({ ok: true });
}

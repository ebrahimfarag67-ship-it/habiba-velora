const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export function telegramConfigured() {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

export function publicBaseUrl(request) {
  const host = request?.headers?.host || process.env.VERCEL_URL || 'habibvelora.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return process.env.PUBLIC_SITE_URL || `${protocol}://${host}`;
}

export async function telegramApi(method, payload = {}) {
  if (!BOT_TOKEN) return { ok: false, configured: false };
  const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await telegramResponse.json().catch(() => ({}));
  return {
    ok: telegramResponse.ok && data.ok !== false,
    configured: true,
    data,
    status: telegramResponse.status,
  };
}

export async function sendTelegramMessage(text, replyMarkup = null, options = {}) {
  if (!telegramConfigured()) {
    return { ok: false, configured: false };
  }

  const payload = {
    chat_id: CHAT_ID,
    text,
    disable_web_page_preview: true,
    ...options,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  return telegramApi('sendMessage', payload);
}

export async function answerCallbackQuery(callbackQueryId, text = '') {
  if (!BOT_TOKEN || !callbackQueryId) return;
  await telegramApi('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: false });
}

export async function createTelegramForumTopic(name) {
  if (!telegramConfigured()) return { ok: false, configured: false };
  const result = await telegramApi('createForumTopic', {
    chat_id: CHAT_ID,
    name: String(name || 'Order').slice(0, 128),
    icon_color: 0xD6B46D,
  });
  return {
    ...result,
    messageThreadId: result.data?.result?.message_thread_id || null,
  };
}

export async function getTelegramChat() {
  if (!telegramConfigured()) return { ok: false, configured: false };
  return telegramApi('getChat', { chat_id: CHAT_ID });
}

export async function closeTelegramForumTopic(messageThreadId) {
  if (!telegramConfigured() || !messageThreadId) return { ok: false, configured: telegramConfigured() };
  return telegramApi('closeForumTopic', {
    chat_id: CHAT_ID,
    message_thread_id: Number(messageThreadId),
  });
}

export async function reopenTelegramForumTopic(messageThreadId) {
  if (!telegramConfigured() || !messageThreadId) return { ok: false, configured: telegramConfigured() };
  return telegramApi('reopenForumTopic', {
    chat_id: CHAT_ID,
    message_thread_id: Number(messageThreadId),
  });
}

export async function setTelegramWebhook(url) {
  if (!BOT_TOKEN) return { ok: false, configured: false };
  const result = await telegramApi('setWebhook', { url });
  return result.data || result;
}

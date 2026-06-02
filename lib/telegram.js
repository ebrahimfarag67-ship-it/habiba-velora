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

export async function sendTelegramMessage(text, replyMarkup = null) {
  if (!telegramConfigured()) {
    return { ok: false, configured: false };
  }

  const payload = { chat_id: CHAT_ID, text };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { ok: telegramResponse.ok, configured: true };
}

export async function answerCallbackQuery(callbackQueryId, text = '') {
  if (!BOT_TOKEN || !callbackQueryId) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

export async function setTelegramWebhook(url) {
  if (!BOT_TOKEN) return { ok: false, configured: false };
  const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return telegramResponse.json();
}

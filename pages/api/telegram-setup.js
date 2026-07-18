import { getTelegramChat, publicBaseUrl, setTelegramWebhook } from '../../lib/telegram';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export default async function handler(request, response) {
  if (!ADMIN_PASSWORD || String(request.query?.password || '') !== ADMIN_PASSWORD) {
    response.status(401).json({ ok: false });
    return;
  }

  const webhookUrl = `${publicBaseUrl(request)}/api/telegram-webhook`;
  const [result, chat] = await Promise.all([
    setTelegramWebhook(webhookUrl),
    getTelegramChat(),
  ]);
  const chatResult = chat?.data?.result || null;
  response.status(200).json({
    webhookUrl,
    result,
    chat: chatResult ? {
      id: chatResult.id,
      type: chatResult.type,
      title: chatResult.title || '',
      isForum: Boolean(chatResult.is_forum),
      permissions: chatResult.permissions || null,
    } : null,
    topicReady: Boolean(chatResult?.is_forum),
    topicNote: chatResult?.is_forum
      ? 'Topics مفعلة في الجروب.'
      : 'لتقسيم كل طلب في شات مستقل لازم الجروب يكون Supergroup وفيه Topics مفعلة والبوت أدمن بصلاحية Manage Topics.',
  });
}

import { publicBaseUrl, setTelegramWebhook } from '../../lib/telegram';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '172005';

export default async function handler(request, response) {
  if (String(request.query?.password || '') !== ADMIN_PASSWORD) {
    response.status(401).json({ ok: false });
    return;
  }

  const webhookUrl = `${publicBaseUrl(request)}/api/telegram-webhook`;
  const result = await setTelegramWebhook(webhookUrl);
  response.status(200).json({ webhookUrl, result });
}

import {
  extractPaymobGatewayReference,
  extractPaymobOrderReference,
  paymobHmacConfigured,
  paymobPaymentStatus,
  verifyPaymobHmac,
} from '../../lib/paymob';
import { updateOrderPaymentFromGateway } from '../../lib/orders-store';
import { publicBaseUrl, sendTelegramMessage } from '../../lib/telegram';

function htmlEscape(value) {
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
  return `<code>${htmlEscape(englishDigits(value || '-'))}</code>`;
}

function callbackPayload(request) {
  return request.method === 'GET' ? request.query : request.body;
}

function paymentMessage(payload) {
  const obj = payload?.obj || payload || {};
  return obj?.data?.message || obj?.message || obj?.txn_response_code || '';
}

async function notifyPayment(order) {
  if (!order) return;
  const confirmed = order.paymentStatus === 'confirmed';
  await sendTelegramMessage([
    confirmed ? '🟢 <b>HabibaVelora Operations</b>' : '🔴 <b>HabibaVelora Operations</b>',
    code(confirmed ? 'PAYMOB PAYMENT CONFIRMED' : 'PAYMOB PAYMENT FAILED'),
    '━━━━━━━━━━━━━━━━━━━━',
    `▫️ <b>الطلب</b>\n${code(order.id)}`,
    `▫️ <b>العميل</b>\n${htmlEscape(englishDigits(order.customer || '-'))}`,
    `▫️ <b>الإجمالي</b>\n${code(`${Math.round(Number(order.total || 0)).toLocaleString('en-US')} ج.م`)}`,
    `▫️ <b>رقم العملية</b>\n${code(order.paymentGatewayTransactionId || '-')}`,
    order.paymentGatewayMessage ? `▫️ <b>رسالة Paymob</b>\n${htmlEscape(englishDigits(order.paymentGatewayMessage))}` : '',
    confirmed ? '✅ <i>يمكن تجهيز الطلب بأمان.</i>' : '⚠️ <i>لا تبدأ التجهيز قبل دفع ناجح.</i>',
  ].filter(Boolean).join('\n'), null, { parse_mode: 'HTML' });
}

function resultHtml({ orderId, status, baseUrl }) {
  const trackingUrl = `${baseUrl}/order-tracking?q=${encodeURIComponent(orderId || '')}`;
  const title = status === 'confirmed' ? 'تم تأكيد الدفع' : 'لم يكتمل الدفع';
  const copy = status === 'confirmed'
    ? 'Paymob أكد وصول المبلغ، والطلب دخل مرحلة التجهيز.'
    : 'الدفع لم يكتمل أو تم رفضه. يمكنك الرجوع للمتجر والمحاولة مرة أخرى.';
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta http-equiv="refresh" content="4;url=${trackingUrl}" />
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff7f1;color:#2d1d18;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    main{width:min(92vw,520px);background:#fff;border:1px solid #efd7c8;border-radius:28px;padding:28px;text-align:center;box-shadow:0 24px 70px rgba(80,45,35,.14)}
    .icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 14px;background:${status === 'confirmed' ? '#dcfce7;color:#15803d' : '#fee2e2;color:#b91c1c'};font-size:30px;font-weight:900}
    h1{margin:0 0 10px;font-size:28px} p{line-height:1.8;color:#6b4a3d} a{display:inline-flex;margin-top:12px;padding:13px 20px;border-radius:999px;background:#2d1d18;color:#fff;text-decoration:none;font-weight:800}
  </style>
</head>
<body>
  <main>
    <div class="icon">${status === 'confirmed' ? '✓' : '!'}</div>
    <h1>${title}</h1>
    <p>${copy}</p>
    <a href="${trackingUrl}">متابعة الطلب</a>
  </main>
</body>
</html>`;
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const payload = callbackPayload(request);
  const hmac = String(request.query?.hmac || payload?.hmac || '');
  if (paymobHmacConfigured() && (!hmac || !verifyPaymobHmac(payload, hmac))) {
    response.status(401).json({ message: 'Invalid Paymob HMAC.' });
    return;
  }

  const orderId = extractPaymobOrderReference(payload);
  const gatewayReference = extractPaymobGatewayReference(payload);
  const status = paymobPaymentStatus(payload);
  const order = await updateOrderPaymentFromGateway({
    orderId,
    gatewayReference,
    transactionId: gatewayReference,
    status,
    message: paymentMessage(payload),
  });

  await notifyPayment(order);

  if (request.method === 'GET') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.status(200).send(resultHtml({
      orderId: order?.id || orderId,
      status,
      baseUrl: publicBaseUrl(request),
    }));
    return;
  }

  response.status(200).json({ ok: true, status, orderFound: Boolean(order) });
}

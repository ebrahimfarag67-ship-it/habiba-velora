import { readOrders, statusLabel, updateOrderStatus } from '../../lib/orders-store';
import { sendTelegramMessage } from '../../lib/telegram';

function pageHtml({ order, token, result = null }) {
  const deliveredUrl = `/api/delivery-scan?o=${encodeURIComponent(order.id)}&t=${encodeURIComponent(token)}&a=delivered`;
  const rejectedUrl = `/api/delivery-scan?o=${encodeURIComponent(order.id)}&t=${encodeURIComponent(token)}&a=rejected`;
  const title = result === 'rejected'
    ? '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0631\u0641\u0636 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645'
    : result === 'delivered'
      ? '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062a\u0633\u0644\u064a\u0645'
      : '\u062a\u0623\u0643\u064a\u062f \u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644';
  const color = result === 'rejected' ? '#9a5420' : '#4d7a3f';
  const copy = result
    ? '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0648\u0625\u0631\u0633\u0627\u0644 \u0625\u0634\u0639\u0627\u0631 \u0644\u0644\u0625\u062f\u0627\u0631\u0629.'
    : '\u0627\u062e\u062a\u0631 \u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644. \u0644\u0627 \u062a\u0638\u0647\u0631 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629.';
  const statusText = statusLabel(order.status);

  return `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${title}</title>
        <style>
          body{font-family:Tahoma,Arial,sans-serif;background:#fff8f3;color:#2f241f;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
          main{width:min(92vw,520px);background:#fff;border:1px solid #efd7c8;border-radius:24px;padding:26px;text-align:center;box-shadow:0 24px 60px rgba(80,45,35,.12)}
          h1{color:${color};margin:0 0 10px;font-size:clamp(1.35rem,5vw,2rem)}
          strong{direction:ltr;display:inline-block}
          .order-code{margin:18px auto 0;padding:12px 16px;border-radius:18px;background:#fff8f3;border:1px solid #efd7c8;width:fit-content;font-weight:800}
          .actions{display:grid;gap:12px;margin-top:22px}
          a{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:999px;text-decoration:none;font-weight:800}
          .done{background:#7fa86d;color:#fff}
          .reject{background:#fff3e8;color:#9a5420;border:1px solid #f0c9aa}
          .muted{color:#7b6a60;line-height:1.8}
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p class="muted">${copy}</p>
          <p class="order-code">\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: <strong>${order.id}</strong></p>
          ${result ? `<p class="muted">\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629: <strong>${statusText}</strong></p>` : `
            <div class="actions">
              <a class="done" href="${deliveredUrl}">\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0639\u0645\u064a\u0644</a>
              <a class="reject" href="${rejectedUrl}">\u0631\u0641\u0636 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628</a>
            </div>
          `}
        </main>
      </body>
    </html>
  `;
}

export default async function handler(request, response) {
  const orderId = String(request.query?.o || '').trim();
  const token = String(request.query?.t || '').trim();
  const action = String(request.query?.a || '').trim();
  const orders = await readOrders();
  const order = orders.find((item) => String(item.id) === orderId);

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (!order || !token || String(order.deliveryToken || '') !== token) {
    response.status(403).send('<h1>\u0631\u0627\u0628\u0637 \u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d</h1>');
    return;
  }

  if (!action) {
    response.status(200).send(pageHtml({ order, token }));
    return;
  }

  if (!['delivered', 'rejected'].includes(action)) {
    response.status(400).send('<h1>\u0627\u062e\u062a\u064a\u0627\u0631 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d</h1>');
    return;
  }

  const nextStatus = action === 'delivered' ? 'delivered' : 'cancelled';
  const note = action === 'delivered'
    ? '\u0623\u0643\u062f \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0639\u0645\u064a\u0644'
    : '\u0633\u062c\u0644 \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0631\u0641\u0636 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628';
  const updated = await updateOrderStatus(orderId, nextStatus, note);
  const headline = action === 'delivered'
    ? '\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0639\u0645\u064a\u0644'
    : '\u0631\u0641\u0636 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628';

  await sendTelegramMessage([
    headline,
    `\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: ${updated.id}`,
    `\u0627\u0644\u0639\u0645\u064a\u0644: ${updated.customer || '-'}`,
    `\u0627\u0644\u0647\u0627\u062a\u0641: ${updated.phone || '-'}`,
    `\u0627\u0644\u062d\u0627\u0644\u0629: ${action === 'delivered' ? '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645' : '\u0631\u0641\u0636 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645'}`,
  ].join('\n'));

  response.status(200).send(pageHtml({ order: updated, token, result: action }));
}

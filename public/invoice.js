(() => {
  const mount = document.getElementById('invoicePrintMount');
  if (!mount) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('o') || '';
  const token = params.get('t') || '';
  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(Number(value) || 0)))} \u062c.\u0645`;
  }

  function deliveryUrl(order) {
    return `${window.location.origin}/api/delivery-scan?o=${encodeURIComponent(order.id)}&t=${encodeURIComponent(token || order.deliveryToken || '')}`;
  }

  function deliveryQr(value) {
    const encoded = encodeURIComponent(value);
    return `<img class="delivery-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}" alt="\u0643\u0648\u062f \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0633\u0644\u064a\u0645" />`;
  }

  function render(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    const scanUrl = deliveryUrl(order);

    mount.innerHTML = `
      <article class="invoice-print-card">
        <img class="invoice-brand-banner" src="/assets/habiba-velora-invoice-banner.png" alt="Habiba Velora" />

        <div class="invoice-print-head">
          <div>
            <p class="eyebrow">HabibaVelora</p>
            <h1>\u0641\u0627\u062a\u0648\u0631\u0629 \u0634\u062d\u0646</h1>
            <p>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: <strong dir="ltr">${escapeHtml(order.id)}</strong></p>
            <p>\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: <strong dir="ltr">${escapeHtml(order.invoiceId)}</strong></p>
          </div>
          <img src="/assets/habibvelora-logo-transparent.png" alt="" />
        </div>

        <div class="invoice-print-grid">
          <div><span>\u0627\u0644\u0639\u0645\u064a\u0644</span><strong>${escapeHtml(order.customer || '-')}</strong></div>
          <div><span>\u0627\u0644\u0647\u0627\u062a\u0641</span><strong>${escapeHtml(order.phone || '-')}</strong></div>
          <div><span>\u0627\u0644\u0639\u0646\u0648\u0627\u0646</span><strong>${escapeHtml(order.fullAddress || order.address || '-')}</strong></div>
          <div><span>\u0627\u0644\u062f\u0641\u0639</span><strong>${escapeHtml(order.payment || '-')}</strong></div>
        </div>

        <div class="order-items">
          ${items.map((item) => `
            <div class="order-item-row">
              <span>${escapeHtml(item.name)} \u00d7 ${escapeHtml(item.qty || 1)}</span>
              <strong>${escapeHtml(formatMoney(item.price))}</strong>
            </div>
          `).join('')}
        </div>

        <div class="invoice-summary">
          <div><span>\u0627\u0644\u0634\u062d\u0646</span><strong>${escapeHtml(formatMoney(order.shipping))}</strong></div>
          <div><span>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</span><strong>${escapeHtml(formatMoney(order.total))}</strong></div>
        </div>

        <div class="tracking-barcode-wrap">
          ${deliveryQr(scanUrl)}
        </div>

        <div class="invoice-actions-row no-print">
          <button type="button" class="primary-btn" data-print>\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629</button>
        </div>
      </article>
    `;
  }

  async function load() {
    mount.innerHTML = '<div class="empty-state compact"><strong>\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629...</strong></div>';
    const response = await fetch(`/api/orders?q=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('invoice lookup failed');
    const payload = await response.json();
    if (!payload.order) {
      mount.innerHTML = '<div class="empty-state compact"><strong>\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628</strong></div>';
      return;
    }
    render(payload.order);
  }

  mount.addEventListener('click', (event) => {
    if (event.target.closest('[data-print]')) window.print();
  });

  load().catch(() => {
    mount.innerHTML = '<div class="empty-state compact"><strong>\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629</strong></div>';
  });
})();

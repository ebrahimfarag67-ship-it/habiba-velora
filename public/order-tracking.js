(() => {
  const form = document.getElementById('trackingForm');
  const input = document.getElementById('trackingLookup');
  const result = document.getElementById('trackingResult');
  const toastRegion = document.getElementById('toastRegion');

  if (!form || !input || !result) return;

  const statusMeta = {
    pending: { label: '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632', step: 0 },
    processing: { label: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062c\u0647\u064a\u0632', step: 1 },
    shipped: { label: '\u0645\u0639 \u0627\u0644\u0645\u0646\u062f\u0648\u0628', step: 2 },
    delivered: { label: '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645', step: 3 },
    cancelled: { label: '\u0631\u0641\u0636 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645', step: 3 },
  };

  const routeSteps = [
    { status: 'pending', title: '\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628', copy: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0637\u0644\u0628\u0643 \u0648\u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629.', icon: '\u2713' },
    { status: 'processing', title: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062c\u0647\u064a\u0632', copy: '\u0646\u0631\u0627\u062c\u0639 \u0627\u0644\u0642\u0637\u0639 \u0648\u0646\u062c\u0647\u0632\u0647\u0627 \u0644\u0644\u0634\u062d\u0646.', icon: '\u25c7' },
    { status: 'shipped', title: '\u0627\u0644\u0637\u0644\u0628 \u0645\u0639 \u0627\u0644\u0645\u0646\u062f\u0648\u0628', copy: '\u0627\u0644\u0634\u062d\u0646\u0629 \u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642 \u0644\u0639\u0646\u0648\u0627\u0646\u0643.', icon: '\u25b6' },
    { status: 'delivered', title: '\u0648\u0635\u0644 \u0644\u0639\u0646\u0648\u0627\u0646\u0643', copy: '\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062c\u0627\u062d.', icon: '\u2302' },
  ];

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');
  const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    }[char]));
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(Number(value) || 0)))} \u062c.\u0645`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : null;
    return !date || Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
  }

  function showToast(title, message) {
    if (!toastRegion) return;
    const toast = document.createElement('div');
    toast.className = 'toast warning visible';
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
    toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function currentStep(order) {
    return statusMeta[order.status]?.step ?? 0;
  }

  function latestDateFor(order, status) {
    const tracking = Array.isArray(order.tracking) ? order.tracking : [];
    const item = tracking.find((entry) => entry.status === status);
    if (item?.at) return formatDate(item.at);
    if (status === 'pending' && order.createdAt) return formatDate(order.createdAt);
    if (status === order.status && order.updatedAt) return formatDate(order.updatedAt);
    return '';
  }

  function renderRoute(order) {
    const step = currentStep(order);
    const rejected = order.status === 'cancelled';
    const progress = rejected ? 100 : Math.min(100, Math.max(0, (step / (routeSteps.length - 1)) * 100));
    const visualSteps = rejected
      ? routeSteps.map((item, index) => index === routeSteps.length - 1 ? { ...item, status: 'cancelled', title: '\u0631\u0641\u0636 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645', copy: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0631\u0641\u0636 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645.', icon: '!' } : item)
      : routeSteps;

    return `
      <section class="luxury-route ${rejected ? 'is-rejected' : ''}" style="--route-progress:${progress}%">
        <div class="route-map" aria-hidden="true">
          <div class="route-line"></div>
          ${visualSteps.map((item, index) => {
            const active = rejected ? index <= routeSteps.length - 1 : index <= step;
            const current = rejected ? index === routeSteps.length - 1 : index === step;
            return `
              <span class="route-pin ${active ? 'active' : ''} ${current ? 'current' : ''}" style="--pin:${index}">
                <b>${escapeHtml(item.icon)}</b>
                <small>${escapeHtml(item.title)}</small>
              </span>
            `;
          }).join('')}
        </div>
        <div class="route-steps">
          ${visualSteps.map((item, index) => {
            const active = rejected ? index <= routeSteps.length - 1 : index <= step;
            const current = rejected ? index === routeSteps.length - 1 : index === step;
            const at = latestDateFor(order, item.status);
            return `
              <article class="route-step ${active ? 'active' : ''} ${current ? 'current' : ''}">
                <span>${escapeHtml(item.icon)}</span>
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.copy)}</p>
                  ${at ? `<small>${escapeHtml(at)}</small>` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  function renderOrder(order) {
    const meta = statusMeta[order.status] || statusMeta.pending;
    const items = Array.isArray(order.items) ? order.items : [];
    const rows = items.map((item) => `
      <div class="order-item-row">
        <span>${escapeHtml(item.name)} \u00d7 ${escapeHtml(item.qty || 1)}</span>
        <strong>${escapeHtml(formatMoney(item.price))}</strong>
      </div>
    `).join('');
    const tracking = Array.isArray(order.tracking) ? order.tracking : [];

    result.innerHTML = `
      <article class="tracking-card luxury-tracking-card">
        <div class="order-top tracking-hero-top">
          <div>
            <span class="status-badge ${escapeHtml(order.status || 'pending')}">${escapeHtml(meta.label)}</span>
            <h2>${escapeHtml(order.id)} <span>\u2022</span> ${escapeHtml(order.customer || '\u0639\u0645\u064a\u0644 HabibaVelora')}</h2>
            <p>${escapeHtml(order.phone || '')} ${order.fullAddress ? `\u2022 ${escapeHtml(order.fullAddress)}` : ''}</p>
          </div>
          <button type="button" class="secondary-btn" data-print>\u0637\u0628\u0627\u0639\u0629 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628</button>
        </div>
        ${renderRoute(order)}
        <div class="tracking-details-grid">
          <section class="tracking-details-card">
            <h3>\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628</h3>
            <div class="order-items">${rows || '<div class="empty-state compact"><strong>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a</strong></div>'}</div>
            <div class="invoice-summary">
              <div><span>\u0627\u0644\u0634\u062d\u0646</span><strong>${escapeHtml(formatMoney(order.shipping))}</strong></div>
              <div><span>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</span><strong>${escapeHtml(formatMoney(order.total))}</strong></div>
            </div>
          </section>
          <section class="tracking-details-card">
            <h3>\u0633\u062c\u0644 \u0627\u0644\u062a\u062d\u062f\u064a\u062b\u0627\u062a</h3>
            <div class="tracking-timeline">
              ${tracking.length ? tracking.map((item) => `
                <div>
                  <strong>${escapeHtml(item.label || statusMeta[item.status]?.label || item.status)}</strong>
                  <span>${escapeHtml(formatDate(item.at))}</span>
                </div>
              `).join('') : '<div><strong>\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628</strong><span>\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u062d\u0627\u0644\u0629</span></div>'}
            </div>
          </section>
        </div>
      </article>
    `;
  }

  async function lookupOrder(value) {
    result.innerHTML = '<div class="empty-state compact"><strong>\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b...</strong></div>';
    const response = await fetch(`/api/orders?q=${encodeURIComponent(value)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('lookup failed');
    const payload = await response.json();
    if (!payload.order) {
      result.innerHTML = '<div class="empty-state compact"><strong>\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628</strong><p>\u062a\u0623\u0643\u062f \u0645\u0646 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 \u0623\u0648 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641.</p></div>';
      return;
    }
    renderOrder(payload.order);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showToast('\u0627\u0643\u062a\u0628 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628', '\u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 \u0623\u0648 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u0647\u0627\u062a\u0641.');
      return;
    }
    lookupOrder(value).catch(() => {
      result.innerHTML = '<div class="empty-state compact"><strong>\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0637\u0644\u0628</strong><p>\u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0628\u0639\u062f \u0644\u062d\u0638\u0627\u062a.</p></div>';
    });
  });

  result.addEventListener('click', (event) => {
    if (event.target.closest('[data-print]')) window.print();
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    lookupOrder(initialQuery).catch(() => null);
  }
})();

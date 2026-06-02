(() => {
  const form = document.getElementById('trackingForm');
  const input = document.getElementById('trackingLookup');
  const result = document.getElementById('trackingResult');
  const toastRegion = document.getElementById('toastRegion');

  if (!form || !input || !result) return;

  const statusMeta = {
    pending: { label: 'قيد التجهيز', step: 0 },
    processing: { label: 'جارٍ التجهيز', step: 1 },
    shipped: { label: 'تم الشحن', step: 2 },
    delivered: { label: 'تم التسليم', step: 3 },
    cancelled: { label: 'ملغي', step: -1 },
  };

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');
  const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });

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
    return `${moneyFormatter.format(Math.max(0, Math.round(Number(value) || 0)))} ج.م`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
  }

  function barcodeSvg(value) {
    const text = String(value || '').toUpperCase();
    let x = 8;
    const bars = [...text].map((char, index) => {
      const code = char.charCodeAt(0) + index;
      const width = (code % 3) + 1;
      const gap = (code % 2) + 1;
      const bar = `<rect x="${x}" y="8" width="${width}" height="52" rx="1"></rect>`;
      x += width + gap;
      return bar;
    }).join('');
    return `<svg class="tracking-barcode" viewBox="0 0 ${Math.max(150, x + 8)} 82" role="img" aria-label="باركود الطلب">
      ${bars}
      <text x="8" y="76">${escapeHtml(text)}</text>
    </svg>`;
  }

  function showToast(title, message) {
    if (!toastRegion) return;
    const toast = document.createElement('div');
    toast.className = 'toast warning visible';
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
    toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function renderOrder(order) {
    const meta = statusMeta[order.status] || statusMeta.pending;
    const progress = statusOrder.map((status) => {
      const active = order.status !== 'cancelled' && statusMeta[status].step <= meta.step;
      return `<span class="progress-step${active ? ' active' : ''}">${escapeHtml(statusMeta[status].label)}</span>`;
    }).join('');
    const items = Array.isArray(order.items) ? order.items : [];
    const rows = items.map((item) => `
      <div class="order-item-row">
        <span>${escapeHtml(item.name)} x ${escapeHtml(item.qty)}</span>
        <strong>${escapeHtml(formatMoney(item.price))}</strong>
      </div>
    `).join('');
    const tracking = Array.isArray(order.tracking) ? order.tracking : [];

    result.innerHTML = `
      <article class="tracking-card">
        <div class="order-top">
          <div>
            <span class="status-badge ${escapeHtml(order.status || 'pending')}">${escapeHtml(meta.label)}</span>
            <h2>${escapeHtml(order.id)} • ${escapeHtml(order.customer)}</h2>
            <p>${escapeHtml(order.phone)} • ${escapeHtml(order.fullAddress || '')}</p>
          </div>
          <button type="button" class="secondary-btn" data-print>طباعة تفاصيل الطلب</button>
        </div>
        <div class="tracking-barcode-wrap">${barcodeSvg(order.id)}</div>
        <div class="order-progress">${progress}</div>
        <div class="order-items">${rows}</div>
        <div class="invoice-summary">
          <div><span>الشحن</span><strong>${escapeHtml(formatMoney(order.shipping))}</strong></div>
          <div><span>الإجمالي</span><strong>${escapeHtml(formatMoney(order.total))}</strong></div>
        </div>
        <div class="tracking-timeline">
          ${tracking.map((item) => `
            <div>
              <strong>${escapeHtml(item.label || statusMeta[item.status]?.label || item.status)}</strong>
              <span>${escapeHtml(formatDate(item.at))}</span>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }

  async function lookupOrder(value) {
    result.innerHTML = '<div class="empty-state compact"><strong>جارٍ البحث...</strong></div>';
    const response = await fetch(`/api/orders?q=${encodeURIComponent(value)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('lookup failed');
    const payload = await response.json();
    if (!payload.order) {
      result.innerHTML = '<div class="empty-state compact"><strong>لم يتم العثور على الطلب</strong><p>تأكد من رقم الطلب أو الفاتورة أو رقم الهاتف.</p></div>';
      return;
    }
    renderOrder(payload.order);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showToast('اكتب رقم الطلب', 'يمكنك البحث برقم الطلب أو الفاتورة أو الهاتف.');
      return;
    }
    lookupOrder(value).catch(() => {
      result.innerHTML = '<div class="empty-state compact"><strong>تعذر تحميل الطلب</strong><p>حاول مرة أخرى بعد لحظات.</p></div>';
    });
  });

  result.addEventListener('click', (event) => {
    if (event.target.closest('[data-print]')) {
      window.print();
    }
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    lookupOrder(initialQuery).catch(() => null);
  }
})();

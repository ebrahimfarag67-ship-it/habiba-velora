(() => {
  const store = window.veloraStore || {};
  const storageKeys = {
    orders: 'velora-store-v4-orders',
    returnRequests: 'velora-store-v4-return-requests',
    ...(store.storageKeys || {}),
  };

  const lookupInput = document.getElementById('returnLookup');
  const lookupButton = document.getElementById('returnLookupButton');
  const form = document.getElementById('returnRequestForm');
  const preview = document.getElementById('returnRequestPreview');
  const resetButton = document.getElementById('returnResetButton');
  const toastRegion = document.getElementById('toastRegion');
  const customerNameInput = document.getElementById('returnCustomerName');
  const customerPhoneInput = document.getElementById('returnCustomerPhone');
  const orderIdInput = document.getElementById('returnOrderId');
  const governorateSelect = document.getElementById('returnGovernorate');
  const areaInput = document.getElementById('returnArea');
  const addressInput = document.getElementById('returnAddress');
  const returnTypeSelect = document.getElementById('returnType');
  const returnReasonSelect = document.getElementById('returnReason');
  const returnNotesInput = document.getElementById('returnNotes');

  if (!form || !preview || !lookupInput || !lookupButton) {
    return;
  }

  const governorates = Array.isArray(store.governorates) && store.governorates.length
    ? store.governorates
    : [];

  const governorateAreas = store.governorateAreas || {};

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');
  const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  let orders = loadOrders();
  let returnRequests = loadReturnRequests();
  let activeOrder = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalize(value) {
    return String(value ?? '').trim().toLowerCase();
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(storageKeys.orders);
      if (!raw) {
        return [];
      }

      const parsed = safeParse(raw, []);
      return Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
    } catch {
      return [];
    }
  }

  function loadReturnRequests() {
    try {
      const raw = localStorage.getItem(storageKeys.returnRequests);
      if (!raw) {
        return [];
      }

      const parsed = safeParse(raw, []);
      return Array.isArray(parsed) ? parsed.map(normalizeRequest) : [];
    } catch {
      return [];
    }
  }

  function saveReturnRequests() {
    try {
      localStorage.setItem(storageKeys.returnRequests, JSON.stringify(returnRequests));
    } catch {
      // ignore
    }
  }

  function normalizeOrder(order) {
    const items = Array.isArray(order?.items)
      ? order.items.map((item) => ({
          productId: String(item.productId || '').trim(),
          name: String(item.name || '').trim(),
          qty: Math.max(1, Number(item.qty) || 1),
          price: Math.max(0, Number(item.price) || 0),
          color: String(item.color || '').trim(),
          size: String(item.size || '').trim(),
        }))
      : [];

    return {
      id: String(order?.id || '').trim(),
      invoiceId: String(order?.invoiceId || '').trim(),
      customer: String(order?.customer || '').trim(),
      phone: String(order?.phone || '').trim(),
      address: String(order?.address || '').trim(),
      governorate: String(order?.governorate || order?.city || '').trim(),
      area: String(order?.area || '').trim(),
      payment: String(order?.payment || '').trim(),
      note: String(order?.note || '').trim(),
      status: String(order?.status || 'pending').trim(),
      total: Number(order?.total) || items.reduce((sum, item) => sum + item.qty * item.price, 0),
      items,
      createdAt: order?.createdAt || new Date().toISOString(),
      updatedAt: order?.updatedAt || order?.createdAt || new Date().toISOString(),
    };
  }

  function normalizeRequest(request) {
    return {
      id: String(request?.id || '').trim(),
      orderId: String(request?.orderId || '').trim(),
      customer: String(request?.customer || '').trim(),
      phone: String(request?.phone || '').trim(),
      governorate: String(request?.governorate || '').trim(),
      area: String(request?.area || '').trim(),
      address: String(request?.address || '').trim(),
      returnType: String(request?.returnType || 'مرتجع كامل').trim(),
      reason: String(request?.reason || '').trim(),
      notes: String(request?.notes || '').trim(),
      status: String(request?.status || 'pending').trim(),
      createdAt: request?.createdAt || new Date().toISOString(),
      orderStatus: String(request?.orderStatus || '').trim(),
      items: Array.isArray(request?.items)
        ? request.items.map((item) => ({
            name: String(item.name || '').trim(),
            qty: Math.max(1, Number(item.qty) || 1),
            price: Math.max(0, Number(item.price) || 0),
          }))
        : [],
      total: Number(request?.total) || 0,
    };
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(Number(value) || 0)))} ج.م`;
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
  }

  function getStatusLabel(status) {
    const labels = {
      pending: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض',
      processed: 'جارٍ التنفيذ',
    };

    return labels[status] || 'قيد المراجعة';
  }

  function getRequestId() {
    const nextNumber = returnRequests.length + 1;
    return `RET-${String(nextNumber).padStart(4, '0')}`;
  }

  function showToast(title, message, type = 'success') {
    if (!toastRegion) {
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
    toastRegion.append(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    window.setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2600);
  }

  function renderGovernorates() {
    if (!governorateSelect) {
      return;
    }

    governorateSelect.innerHTML = [
      '<option value="">اختر المحافظة</option>',
      ...governorates.map((governorate) => `<option value="${escapeHtml(governorate)}">${escapeHtml(governorate)}</option>`),
    ].join('');
  }

  function findOrder(query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return null;
    }

    return orders.find((order) => {
      return [
        order.id,
        order.invoiceId,
        order.customer,
        order.phone,
        order.governorate,
        order.area,
        order.address,
      ].some((field) => normalize(field).includes(normalizedQuery));
    }) || null;
  }

  function fillFormFromOrder(order) {
    activeOrder = order;
    if (orderIdInput) orderIdInput.value = order.id;
    if (customerNameInput) customerNameInput.value = order.customer || '';
    if (customerPhoneInput) customerPhoneInput.value = order.phone || '';
    if (governorateSelect) governorateSelect.value = order.governorate || '';
    if (areaInput) areaInput.value = order.area || '';
    if (addressInput) addressInput.value = order.address || '';
    renderPreview();
    showToast('تم جلب الطلب', `تم تحميل الطلب ${order.id} بنجاح.`);
  }

  function readFormData() {
    const orderId = String(orderIdInput?.value || '').trim();
    const customer = String(customerNameInput?.value || '').trim();
    const phone = String(customerPhoneInput?.value || '').trim();
    const governorate = String(governorateSelect?.value || '').trim();
    const area = String(areaInput?.value || '').trim();
    const address = String(addressInput?.value || '').trim();
    const returnType = String(returnTypeSelect?.value || 'مرتجع كامل').trim();
    const reason = String(returnReasonSelect?.value || '').trim();
    const notes = String(returnNotesInput?.value || '').trim();

    return {
      orderId,
      customer,
      phone,
      governorate,
      area,
      address,
      returnType,
      reason,
      notes,
    };
  }

  function buildPreviewOrder() {
    const data = readFormData();
    const matchedOrder = activeOrder || findOrder(data.orderId) || null;
    const items = matchedOrder?.items || [];
    const total = matchedOrder?.total || items.reduce((sum, item) => sum + item.qty * item.price, 0);

    return {
      ...data,
      customer: data.customer || matchedOrder?.customer || '',
      phone: data.phone || matchedOrder?.phone || '',
      governorate: data.governorate || matchedOrder?.governorate || '',
      area: data.area || matchedOrder?.area || '',
      address: data.address || matchedOrder?.address || '',
      items,
      total,
      orderStatus: matchedOrder?.status || 'pending',
    };
  }

  function renderEmptyState(message) {
    preview.innerHTML = '';
    preview.closest('.return-summary-panel')?.classList.add('is-empty');
    return;
    preview.innerHTML = `
      <div class="empty-state compact">
        <strong>${escapeHtml(message)}</strong>
        <p>ابحث برقم الطلب أو اسم العميل لعرض بيانات الطلب ثم أكمل نموذج المرتجع.</p>
      </div>
    `;
  }

  function renderPreview() {
    let previewData = buildPreviewOrder();
    const latestRequest = returnRequests[0] || null;
    const hasDraftData = Boolean(
      previewData.orderId ||
      previewData.customer ||
      previewData.phone ||
      previewData.governorate ||
      previewData.area ||
      previewData.address ||
      previewData.reason ||
      previewData.notes,
    );

    if (!previewData.orderId && !activeOrder && !latestRequest) {
      renderEmptyState('ابدأ بالبحث عن الطلب أو املأ بيانات العميل مباشرة.');
      return;
    }

    if (!activeOrder && latestRequest && !hasDraftData) {
      previewData = {
        ...previewData,
        ...latestRequest,
        items: latestRequest.items || [],
        total: latestRequest.total || 0,
        orderStatus: latestRequest.orderStatus || 'pending',
      };
    }

    preview.closest('.return-summary-panel')?.classList.remove('is-empty');

    const orderSummary = previewData.items.length
      ? previewData.items.map((item) => `
          <div class="invoice-row return-row">
            <span>${escapeHtml(item.name)}</span>
            <span>${escapeHtml(String(item.qty))}</span>
            <span>${escapeHtml(formatMoney(item.price))}</span>
            <strong>${escapeHtml(formatMoney(item.qty * item.price))}</strong>
          </div>
        `).join('')
      : '<div class="empty-state compact"><strong>لا توجد عناصر محملة</strong><p>ابحث عن الطلب لإظهار عناصره هنا.</p></div>';

    preview.innerHTML = `
      <article class="return-request-card">
        <div class="invoice-top">
          <div class="invoice-brand">
            <p class="invoice-kicker">طلب مرتجع</p>
            <h3>${escapeHtml(previewData.orderId || 'غير محدد')}</h3>
            <p>العميل: <strong>${escapeHtml(previewData.customer || 'غير محدد')}</strong></p>
            <p>الحالة: <strong>${escapeHtml(getStatusLabel(previewData.orderStatus))}</strong></p>
          </div>
          <div class="invoice-status-wrap">
            <span class="invoice-chip">${escapeHtml(previewData.returnType)}</span>
            <span class="invoice-chip muted">${escapeHtml(formatDateTime(new Date()))}</span>
          </div>
        </div>

        <div class="invoice-meta-grid">
          <div class="invoice-meta-card">
            <span>الهاتف</span>
            <strong>${escapeHtml(previewData.phone || 'غير محدد')}</strong>
          </div>
          <div class="invoice-meta-card">
            <span>المحافظة</span>
            <strong>${escapeHtml(previewData.governorate || 'غير محدد')}</strong>
          </div>
          <div class="invoice-meta-card">
            <span>المنطقة / المركز</span>
            <strong>${escapeHtml(previewData.area || 'غير محدد')}</strong>
          </div>
          <div class="invoice-meta-card">
            <span>العنوان</span>
            <strong>${escapeHtml(previewData.address || 'غير محدد')}</strong>
          </div>
        </div>

        <div class="invoice-table return-preview-list">
          <div class="invoice-row head return-row">
            <span>العناصر</span>
            <span>الكمية</span>
            <span>السعر</span>
            <span>الإجمالي</span>
          </div>
          ${orderSummary}
        </div>

        <div class="invoice-after-sales">
          <strong>سبب المرتجع</strong>
          <p>${escapeHtml(previewData.reason || 'لم يتم تحديد السبب بعد.')}</p>
          <strong>ملاحظات</strong>
          <p>${escapeHtml(previewData.notes || 'لا توجد ملاحظات إضافية.')}</p>
        </div>

        <div class="invoice-summary">
          <div class="summary-line">
            <span>إجمالي الطلب المرتبط</span>
            <strong>${escapeHtml(formatMoney(previewData.total))}</strong>
          </div>
          <div class="summary-line">
            <span>عدد العناصر</span>
            <strong>${escapeHtml(String(previewData.items.reduce((sum, item) => sum + item.qty, 0)))}</strong>
          </div>
        </div>

        ${latestRequest ? `
          <div class="return-footnote">
            آخر طلب محفوظ: ${escapeHtml(latestRequest.id)} - ${escapeHtml(latestRequest.customer)} - ${escapeHtml(formatDateTime(latestRequest.createdAt))}
          </div>
        ` : ''}
      </article>
    `;
  }

  function resetForm() {
    activeOrder = null;
    form.reset();
    lookupInput.value = '';
    if (governorateSelect) {
      governorateSelect.value = '';
    }
    if (returnTypeSelect) {
      returnTypeSelect.value = 'مرتجع كامل';
    }
    renderPreview();
  }

  function handleLookup() {
    const query = String(lookupInput.value || '').trim();
    if (!query) {
      renderEmptyState('ابدأ بكتابة رقم الطلب أو اسم العميل لعرض بيانات المرتجع.');
      showToast('البحث فارغ', 'اكتب رقم الطلب أو اسم العميل أولًا', 'warning');
      return;
    }

    const order = findOrder(query);
    if (!order) {
      activeOrder = null;
      renderPreview();
      showToast('لا توجد نتيجة', 'لم نعثر على طلب مطابق.', 'warning');
      return;
    }

    fillFormFromOrder(order);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const data = readFormData();
    if (!data.orderId || !data.customer || !data.phone || !data.governorate || !data.area || !data.address) {
      showToast('بيانات ناقصة', 'أكمل بيانات العميل والمحافظة والمنطقة والعنوان.', 'warning');
      return;
    }

    const matchedOrder = activeOrder || findOrder(data.orderId) || null;
    const request = normalizeRequest({
      id: getRequestId(),
      orderId: data.orderId,
      customer: data.customer,
      phone: data.phone,
      governorate: data.governorate,
      area: data.area,
      address: data.address,
      returnType: data.returnType,
      reason: data.reason || 'غير محدد',
      notes: data.notes,
      status: 'pending',
      orderStatus: matchedOrder?.status || 'pending',
      items: matchedOrder?.items || [],
      total: matchedOrder?.total || 0,
      createdAt: new Date().toISOString(),
    });

    returnRequests.unshift(request);
    returnRequests = returnRequests.slice(0, 30);
    saveReturnRequests();
    renderPreview();
    showToast('تم إرسال الطلب', `تم حفظ ${request.id} بنجاح.`, 'success');
  }

  renderGovernorates();
  renderPreview();

  lookupButton.addEventListener('click', handleLookup);
  lookupInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLookup();
    }
  });

  form.addEventListener('submit', handleSubmit);
  governorateSelect?.addEventListener('change', (event) => {
    renderAreas(event.target.value);
  });
  resetButton?.addEventListener('click', resetForm);

  [customerNameInput, customerPhoneInput, orderIdInput, governorateSelect, areaInput, addressInput, returnTypeSelect, returnReasonSelect, returnNotesInput]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener('input', renderPreview);
      input.addEventListener('change', renderPreview);
    });

  window.addEventListener('storage', () => {
    orders = loadOrders();
    returnRequests = loadReturnRequests();
    renderPreview();
  });
})();

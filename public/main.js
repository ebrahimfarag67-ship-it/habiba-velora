(() => {
  const store = window.veloraStore || {};
  const storageKeys = store.storageKeys || {
    products: 'velora-store-v4-products',
    cart: 'velora-store-v4-cart',
    wishlist: 'velora-store-v4-wishlist',
    orders: 'velora-store-v4-orders',
    notifications: 'velora-store-v4-notifications',
    returnRequests: 'velora-store-v4-return-requests',
    adminAccess: 'velora-admin-access-v5',
    theme: 'velora-store-v4-theme',
  };

  const adminCredentials = store.adminCredentials || {};
  if (!adminCredentials.password) {
    adminCredentials.password = '172005';
  }
  const vodafoneCashNumber = '01024622437';
  const initialProducts = Array.isArray(window.veloraInitialProducts) ? window.veloraInitialProducts : [];
  const defaultProducts = Array.isArray(store.products) && store.products.length ? store.products : initialProducts;
  const categoryStorageKey = 'velora-store-v4-categories';
  const clearMarkerKeys = {
    orders: `${storageKeys.orders}:cleared-at`,
    notifications: `${storageKeys.notifications}:cleared-at`,
  };
  const ADMIN_ACCESS_MAX_AGE_MS = 1000 * 60 * 60 * 8;
  const defaultAdminCategories = ['حلقان', 'سلاسل', 'انسيالات', 'خواتم', 'كفرات', 'أساور'];
  const egyptGovernorates = Array.isArray(store.governorates) && store.governorates.length
    ? store.governorates
    : [];

  const governorateAreas = store.governorateAreas || {};
  const shippingFees = store.shippingFees || {};

  const tonePalette = Array.isArray(store.tonePalette) && store.tonePalette.length
    ? store.tonePalette
    : [
        { from: '#f4d8d9', to: '#d98ea2', glow: 'rgba(255,255,255,0.24)' },
        { from: '#f3dec9', to: '#d3a072', glow: 'rgba(255,255,255,0.22)' },
        { from: '#eadcf0', to: '#b88cc7', glow: 'rgba(255,255,255,0.22)' },
        { from: '#f1d4c8', to: '#c06e83', glow: 'rgba(255,255,255,0.22)' },
      ];

  const elements = {
    brand: document.querySelector('.brand-block'),
    searchButton: document.getElementById('searchButton'),
    wishlistToggle: document.getElementById('wishlistToggle'),
    cartJump: document.getElementById('cartJump'),
    cartCount: document.getElementById('cartCount'),
    cartDrawer: null,
    productSearch: document.getElementById('productSearch'),
    catalogTools: document.querySelector('.catalog-tools'),
    categoryFilters: document.getElementById('categoryFilters'),
    productGrid: document.getElementById('productGrid'),
    clearNotificationsButton: document.getElementById('clearNotificationsButton'),
    cartList: document.getElementById('cartList'),
    cartBadge: document.getElementById('cartBadge'),
    subtotalValue: document.getElementById('subtotalValue'),
    shippingValue: document.getElementById('shippingValue'),
    totalValue: document.getElementById('totalValue'),
    orderSuccessPanel: document.getElementById('orderSuccessPanel'),
    checkoutForm: document.getElementById('checkoutForm'),
    customerName: document.getElementById('customerName'),
    customerPhone: document.getElementById('customerPhone'),
    customerAddress: document.getElementById('customerAddress'),
    customerArea: document.getElementById('customerArea'),
    customerGovernorate: document.getElementById('customerGovernorate'),
    paymentMethod: document.getElementById('paymentMethod'),
    paymentProofPanel: null,
    paymentReferenceInput: null,
    paymentSenderPhone: null,
    paymentTransactionId: null,
    orderNote: document.getElementById('orderNote'),
    clearCartButton: document.getElementById('clearCartButton'),
    dashboard: document.getElementById('dashboard'),
    summaryProducts: document.getElementById('summaryProducts'),
    summaryCart: document.getElementById('summaryCart'),
    summaryOrders: document.getElementById('summaryOrders'),
    summaryNotifications: document.getElementById('summaryNotifications'),
    productForm: document.getElementById('productForm'),
    productId: document.getElementById('productId'),
    productName: document.getElementById('productName'),
    productCategory: document.getElementById('productCategory'),
    newCategoryName: null,
    addCategoryButton: null,
    adminCategoryList: null,
    productBadge: document.getElementById('productBadge'),
    productFeatured: document.getElementById('productFeatured'),
    productNote: document.getElementById('productNote'),
    productColors: document.getElementById('productColors'),
    productModelNames: document.getElementById('productModelNames'),
    productPriceOptions: document.getElementById('productPriceOptions'),
    addPriceOptionButton: document.getElementById('addPriceOptionButton'),
    productPrice: document.getElementById('productPrice'),
    productStock: document.getElementById('productStock'),
    productFrontImage: document.getElementById('productFrontImage'),
    productBackImage: document.getElementById('productBackImage'),
    productSideImage: document.getElementById('productSideImage'),
    productModelImages: document.getElementById('productModelImages'),
    productSubmitButton: document.getElementById('productSubmitButton'),
    productResetButton: document.getElementById('productResetButton'),
    requestedProducts: document.getElementById('requestedProducts'),
    notifications: document.getElementById('notifications'),
    returnRequestsList: document.getElementById('returnRequestsList'),
    orderSearch: document.getElementById('orderSearch'),
    orderStatusFilter: document.getElementById('orderStatusFilter'),
    clearOrdersButton: document.getElementById('clearOrdersButton'),
    ordersList: document.getElementById('ordersList'),
    adminSectionButtons: Array.from(document.querySelectorAll('[data-admin-section]')),
    adminGate: document.getElementById('adminGate'),
    adminPassword: document.getElementById('adminPassword'),
    adminUnlockButton: document.getElementById('adminUnlockButton'),
    adminGateHint: document.getElementById('adminGateHint'),
    toastRegion: document.getElementById('toastRegion'),
  };

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');
  const decimalFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const dayFormatter = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'long',
  });

  const statusMeta = {
    pending: { label: 'قيد التجهيز', step: 0, className: 'pending' },
    processing: { label: 'جارٍ التجهيز', step: 1, className: 'processing' },
    shipped: { label: 'تم الشحن', step: 2, className: 'shipped' },
    delivered: { label: 'تم التسليم', step: 3, className: 'delivered' },
    return_requested: { label: 'مرتجع', step: -1, className: 'return-requested' },
    cancelled: { label: 'ملغي', step: -1, className: 'cancelled' },
  };

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'return_requested', 'cancelled'];

  const returnRequestStatusMeta = {
    pending: { label: 'قيد المراجعة', className: 'pending' },
    approved: { label: 'مقبول', className: 'approved' },
    rejected: { label: 'مرفوض', className: 'cancelled' },
    processed: { label: 'جارٍ التنفيذ', className: 'processing' },
  };

  const state = {
    products: [],
    customCategories: [],
    productsDirty: false,
    cart: [],
    wishlist: [],
    orders: [],
    notifications: [],
    returnRequests: [],
    theme: 'dark',
    filters: {
      query: '',
      category: 'all',
      wishlistOnly: false,
      orderQuery: '',
      orderStatus: 'all',
      adminSection: 'all',
      showcaseOnly: true,
    },
    adminUnlocked: false,
    editingProductId: null,
    ordersCleared: false,
  };

  const dynamicHeroState = {
    activeIndex: 0,
    timer: null,
    signature: '',
  };

  const productCardSwipe = {
    card: null,
    productId: '',
    startX: 0,
    startY: 0,
  };

  function safeParse(json, fallback) {
    try {
      const value = JSON.parse(json);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === '') {
        return cloneValue(fallback);
      }
      return safeParse(raw, cloneValue(fallback));
    } catch {
      return cloneValue(fallback);
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast('تعذر الحفظ', 'الحجم كبير جدًا. قلل عدد الصور أو جرّب ضغطًا أكثر.', 'warning');
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore unavailable storage
    }
  }

  function loadSessionStorage(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null || raw === '') {
        return cloneValue(fallback);
      }
      return safeParse(raw, cloneValue(fallback));
    } catch {
      return cloneValue(fallback);
    }
  }

  function saveSessionStorage(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function removeSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore unavailable storage
    }
  }

  function readClearMarker(type) {
    try {
      return Math.max(0, Number(localStorage.getItem(clearMarkerKeys[type]) || 0));
    } catch {
      return 0;
    }
  }

  function writeClearMarker(type) {
    const value = Date.now();
    try {
      localStorage.setItem(clearMarkerKeys[type], String(value));
    } catch {
      // If storage is unavailable the current in-memory clear still applies.
    }
    return value;
  }

  function clearStoredCollection(type) {
    const key = storageKeys[type];
    saveStorage(key, []);
  }

  function isAfterClearMarker(item, type) {
    const marker = readClearMarker(type);
    if (!marker) {
      return true;
    }

    const timestamp = Date.parse(item?.createdAt || item?.updatedAt || '');
    return Number.isFinite(timestamp) && timestamp > marker;
  }

  function cloneValue(value) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch {
        return JSON.parse(JSON.stringify(value));
      }
    }

    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function animatedButtonContent(label) {
    const safeLabel = escapeHtml(label);

    return `
      <svg class="arr-1" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 5.5 20 12l-6.5 6.5-1.4-1.4 4.1-4.1H4v-2h12.2l-4.1-4.1 1.4-1.4Z" />
      </svg>
      <span class="circle" aria-hidden="true"></span>
      <span class="text">${safeLabel}</span>
      <svg class="arr-2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 5.5 20 12l-6.5 6.5-1.4-1.4 4.1-4.1H4v-2h12.2l-4.1-4.1 1.4-1.4Z" />
      </svg>
    `;
  }

  function setAnimatedFlowButtonLabel(button, label) {
    if (!button) {
      return;
    }

    if (button.classList.contains('animated-flow-button')) {
      button.innerHTML = animatedButtonContent(label);
      return;
    }

    button.textContent = label;
  }

  function enhanceCheckoutButton() {
    const button = elements.checkoutForm?.querySelector('button[type="submit"]');
    if (!button || button.dataset.flowEnhanced === 'true') {
      return;
    }

    const label = button.textContent.trim() || 'إتمام الطلب';
    button.dataset.flowEnhanced = 'true';
    button.classList.add('animated-flow-button', 'flow-checkout');
    setAnimatedFlowButtonLabel(button, label);
  }

  function hasGarbledText(value) {
    const text = String(value ?? '').trim();
    return /\?{2,}/.test(text) || /[\u00d8\u00d9\u00e2\ufffd]{2,}/.test(text);
  }

  function normalizeText(value, fallback = '') {
    const text = String(value ?? '').trim();
    if (!text || hasGarbledText(text)) {
      return fallback;
    }
    return text;
  }

  function canonicalCategory(value, fallback = '') {
    const category = normalizeText(value, fallback);
    const compactCategory = category
      .replace(/[أإآ]/g, 'ا')
      .replace(/\s+/g, '')
      .toLowerCase();

    if (compactCategory === 'اساور') {
      return 'أساور';
    }

    return category;
  }

  function categoryIdentity(value) {
    return normalizeText(value)
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  function normalizeCategoryList(values) {
    const categories = new Map();
    (values || []).forEach((value) => {
      const category = canonicalCategory(value);
      const key = categoryIdentity(category);
      if (key && !categories.has(key)) {
        categories.set(key, category);
      }
    });
    return Array.from(categories.values());
  }

  function loadCustomCategories() {
    return normalizeCategoryList(loadStorage(categoryStorageKey, []));
  }

  function saveCustomCategories() {
    return saveStorage(categoryStorageKey, state.customCategories);
  }

  function getAdminCategoryOptions(extra = '') {
    return normalizeCategoryList([
      ...defaultAdminCategories,
      ...Array.from(elements.productCategory?.options || []).map((option) => option.value || option.textContent),
      ...state.customCategories,
      ...state.products.map((product) => product.category),
      extra,
    ]);
  }

  function renderProductCategoryOptions(selectedCategory = '') {
    if (!elements.productCategory) {
      return;
    }

    const currentValue = normalizeText(selectedCategory || elements.productCategory.value);
    const options = getAdminCategoryOptions(currentValue);
    elements.productCategory.innerHTML = options
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join('');
    elements.productCategory.value = options.includes(currentValue) ? currentValue : (options[0] || '');
  }

  function renderAdminCategoryList() {
    if (!elements.adminCategoryList) {
      return;
    }

    const customCategories = normalizeCategoryList(state.customCategories);
    elements.adminCategoryList.innerHTML = customCategories.length
      ? customCategories.map((category) => `<span>${escapeHtml(category)}</span>`).join('')
      : '<small>الأقسام الجديدة ستظهر هنا بعد إضافتها.</small>';
  }

  function ensureCategoryManager() {
    if (!elements.productCategory || document.getElementById('adminCategoryManager')) {
      return;
    }

    const field = elements.productCategory.closest('label');
    if (!field) {
      return;
    }

    const manager = document.createElement('div');
    manager.id = 'adminCategoryManager';
    manager.className = 'admin-category-manager';
    manager.innerHTML = `
      <div class="field-title">
        <span>إضافة قسم جديد</span>
      </div>
      <div class="admin-category-row">
        <input id="newCategoryName" type="text" placeholder="مثال: أطقم" maxlength="40" />
        <button id="addCategoryButton" type="button" class="secondary-btn mini-btn">إضافة القسم</button>
      </div>
      <div id="adminCategoryList" class="admin-category-list" aria-live="polite"></div>
    `;
    field.insertAdjacentElement('afterend', manager);

    elements.newCategoryName = document.getElementById('newCategoryName');
    elements.addCategoryButton = document.getElementById('addCategoryButton');
    elements.adminCategoryList = document.getElementById('adminCategoryList');
    renderProductCategoryOptions();
    renderAdminCategoryList();
  }

  function addCustomCategory() {
    const category = canonicalCategory(elements.newCategoryName?.value);
    if (!category || categoryIdentity(category).length < 2) {
      showToast('اسم القسم مطلوب', 'اكتب اسم قسم واضح قبل الإضافة.', 'warning');
      return;
    }

    const exists = getAdminCategoryOptions().some((item) => categoryIdentity(item) === categoryIdentity(category));
    if (!exists) {
      state.customCategories = normalizeCategoryList([...state.customCategories, category]);
      saveCustomCategories();
    }

    renderProductCategoryOptions(category);
    renderAdminCategoryList();
    if (elements.newCategoryName) {
      elements.newCategoryName.value = '';
    }
    showToast(exists ? 'القسم موجود بالفعل' : 'تمت إضافة القسم', `${category} جاهز لاستخدامه في المنتجات.`, exists ? 'warning' : 'success');
  }

  function defaultProductCopy(category) {
    const normalizedCategory = canonicalCategory(category);
    const copyByCategory = {
      سلاسل: 'سلسلة أنيقة بتفاصيل ناعمة تضيف لمسة راقية للإطلالة اليومية.',
      انسيالات: 'انسيال خفيف بتصميم أنيق يناسب الاستخدام اليومي والمناسبات.',
      أساور: 'أسورة بتفاصيل ناعمة ولمعة هادئة تناسب التنسيق اليومي.',
      خواتم: 'خاتم بتصميم عملي وأنيق يكمّل الإطلالة بسهولة.',
      حلقان: 'حلق ناعم بتفاصيل رقيقة يضيف لمسة أنثوية هادئة.',
      كفرات: 'كفر عملي بلمسة أنيقة يحافظ على الموبايل ويكمل الستايل.',
    };

    return copyByCategory[normalizedCategory] || 'قطعة أنيقة بتفاصيل ناعمة مناسبة للتنسيق اليومي.';
  }

  function normalizeProductCopy(value, fallback) {
    const text = normalizeText(value);
    if (!text || text === 'تفاصيل أنيقة وواضحة للمنتج.') {
      return fallback;
    }
    return text;
  }

  function buildCategoryPageUrl(category) {
    return `/category?name=${encodeURIComponent(canonicalCategory(category, 'all'))}`;
  }

  function getRouteCategory() {
    if (document.body?.dataset.page !== 'category') {
      return '';
    }

    const params = new URLSearchParams(window.location.search);
    return canonicalCategory(params.get('name') || 'all', 'all');
  }

  function isCategoryPage() {
    return document.body?.dataset.page === 'category';
  }

  function applyRouteFilters() {
    const routeCategory = getRouteCategory();
    if (!routeCategory) {
      return;
    }

    state.filters.category = routeCategory;
    state.filters.showcaseOnly = false;
    state.filters.wishlistOnly = false;
  }

  function renderCategoryPageHeader() {
    if (!isCategoryPage()) {
      return;
    }

    const category = state.filters.category || getRouteCategory() || 'all';
    const title = document.getElementById('categoryPageTitle');
    const copy = document.getElementById('categoryPageCopy');
    const count = productsForCategory(category).length;
    const label = category === 'all' ? 'كل المنتجات' : `قسم ${category}`;

    if (title) {
      title.textContent = label;
    }

    if (copy) {
      copy.textContent = count
        ? `${formatCount(count)} منتج متاح داخل المجموعة. اختاري القطعة وافتحي صفحة المنتج للتفاصيل والطلب.`
        : 'لا توجد منتجات داخل هذا القسم حاليًا، ارجعي للمتجر لاختيار مجموعة أخرى.';
    }
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(toNumber(value))))} \u062c.\u0645`;
  }

  function formatProductCardPrice(product) {
    const options = normalizePriceOptions(product?.priceOptions);
    if (options.length) {
      const prices = options.map((option) => option.price).filter((price) => price > 0);
      if (!prices.length) {
        return formatMoney(product?.price || 0);
      }

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice === maxPrice || options.length === 1) {
        return formatMoney(minPrice);
      }

      return `من ${formatMoney(minPrice)}`;
    }
    return formatMoney(product?.price || 0);
  }

  function buildProductCardOptions(product) {
    const options = normalizePriceOptions(product?.priceOptions);
    if (!options.length) {
      return '<div class="product-card-options placeholder" aria-hidden="true"></div>';
    }

    if (options.length === 1) {
      const option = options[0];
      return `
        <div class="product-card-options single">
          <span>\u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u0627\u062d</span>
          <strong>${escapeHtml(option.label)} - ${escapeHtml(formatMoney(option.price))}</strong>
        </div>
      `;
    }

    return `
      <label class="product-card-options">
        <span>\u0627\u062e\u062a\u0627\u0631\u064a \u0627\u0644\u0646\u0648\u0639</span>
        <select data-action="card-price-option" aria-label="\u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u062a\u062c">
          ${options.map((option, index) => `
            <option value="${index}">${escapeHtml(option.label)} - ${escapeHtml(formatMoney(option.price))}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  function getCardSelectedVariant(product, card) {
    const defaultVariant = getDefaultVariant(product);
    const options = normalizePriceOptions(product?.priceOptions);
    if (!options.length) {
      return defaultVariant;
    }

    const selectedIndex = Math.max(0, toNumber(card?.querySelector('[data-action="card-price-option"]')?.value, 0));
    const selectedOption = options[selectedIndex] || options[0];
    return {
      ...defaultVariant,
      option: selectedOption.label,
      price: selectedOption.price,
    };
  }

  function formatCount(value) {
    return moneyFormatter.format(Math.max(0, Math.floor(toNumber(value))));
  }

  function formatDecimal(value, digits = 1) {
    return new Intl.NumberFormat('ar-EG-u-nu-latn', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(toNumber(value));
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? '-' : dayFormatter.format(date);
  }

  function normalizeList(value) {
    return Array.isArray(value)
      ? value.map((item) => normalizeText(item)).filter(Boolean)
      : [];
  }

  function parseDelimitedList(value) {
    return String(value || '')
      .split(/[\u060c,\n]/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  function parseLocalizedNumber(value) {
    const normalized = String(value || '')
      .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
      .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
      .replace(/[^\d.]/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizeOptionLabel(value) {
    const arabicDigits = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
    return normalizeText(value)
      .replace(/[0-9]/g, (digit) => arabicDigits[Number(digit)] || digit)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizePriceOptions(value) {
    const source = Array.isArray(value)
      ? value
      : String(value || '').split(/\n+/).map((line) => {
          const text = normalizeText(line);
          const match = text.match(/(.+?)[\s:=\-]*([0-9\u0660-\u0669\u06F0-\u06F9]+(?:[.,][0-9\u0660-\u0669\u06F0-\u06F9]+)?)\s*$/);
          return match ? { label: normalizeText(match[1]), price: parseLocalizedNumber(match[2]) } : null;
        });

    return source
      .map((option) => ({
        label: normalizeOptionLabel(option?.label || option?.name || ''),
        price: Math.max(0, parseLocalizedNumber(option?.price)),
      }))
      .filter((option) => option.label && option.price > 0)
      .sort((first, second) => first.price - second.price || first.label.localeCompare(second.label, 'ar'));
  }

  function createPriceOptionRow(option = {}) {
    const row = document.createElement('div');
    row.className = 'price-option-row';
    row.innerHTML = `
      <input type="text" data-price-option-label placeholder="مثال: نحاس أو استانلس" value="${escapeHtml(option.label || '')}" />
      <input type="number" data-price-option-price min="1" placeholder="\u0627\u0644\u0633\u0639\u0631" value="${option.price ? Number(option.price) : ''}" />
      <button type="button" class="secondary-btn danger-btn remove-price-option" data-action="remove-price-option" aria-label="\u062d\u0630\u0641 \u0627\u0644\u0633\u0639\u0631">\u062d\u0630\u0641</button>
    `;
    return row;
  }

  function renderPriceOptionRows(options = []) {
    if (!elements.productPriceOptions) {
      return;
    }

    elements.productPriceOptions.innerHTML = '';
    const normalizedOptions = normalizePriceOptions(options);
    const rows = normalizedOptions.length ? normalizedOptions : [{ label: '', price: '' }];
    rows.forEach((option) => {
      elements.productPriceOptions.appendChild(createPriceOptionRow(option));
    });
  }

  function collectPriceOptions() {
    if (!elements.productPriceOptions) {
      return [];
    }

    const rows = Array.from(elements.productPriceOptions.querySelectorAll('.price-option-row'));
    return normalizePriceOptions(rows.map((row) => ({
      label: row.querySelector('[data-price-option-label]')?.value || '',
      price: row.querySelector('[data-price-option-price]')?.value || '',
    })));
  }

  function addPriceOptionRow(option = {}) {
    if (!elements.productPriceOptions) {
      return;
    }
    elements.productPriceOptions.appendChild(createPriceOptionRow(option));
  }

  function dedupeList(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('file-read-failed'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image-load-failed'));
      image.src = src;
    });
  }

  const imageCompression = {
    targetBytes: 360 * 1024,
    hardLimitBytes: 2600 * 1024,
    maxSizes: [1280, 1080, 920, 820, 720, 620, 520, 420],
    qualities: [0.78, 0.68, 0.58, 0.48, 0.38, 0.3, 0.24, 0.2],
  };

  function isUploadableImageType(type) {
    return ['image/webp', 'image/png', 'image/jpeg'].includes(String(type || '').toLowerCase());
  }

  async function compressImageFile(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
      throw new Error('image-compression-failed');
    }

    if (file.size <= imageCompression.targetBytes && isUploadableImageType(file.type)) {
      return await fileToDataUrl(file);
    }

    const originalUrl = URL.createObjectURL(file);

    try {
      const image = await loadImage(originalUrl);
      let bestBlob = null;

      for (const maxSize of imageCompression.maxSizes) {
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          continue;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        for (const quality of imageCompression.qualities) {
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/webp', quality);
          });

          if (!blob) {
            continue;
          }

          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
          }

          if (blob.size <= imageCompression.targetBytes) {
            return await fileToDataUrl(blob);
          }
        }
      }

      if (bestBlob && bestBlob.size <= imageCompression.hardLimitBytes) {
        return await fileToDataUrl(bestBlob);
      }

      if (file.size <= imageCompression.hardLimitBytes && isUploadableImageType(file.type)) {
        return await fileToDataUrl(file);
      }

      throw new Error('image-compression-failed');
    } catch {
      if (file.size <= 450 * 1024 && isUploadableImageType(file.type)) {
        return await fileToDataUrl(file);
      }
      throw new Error('image-compression-failed');
    } finally {
      URL.revokeObjectURL(originalUrl);
    }
  }

  async function uploadProductImage(imageData) {
    if (!imageData || !String(imageData).startsWith('data:image/')) {
      return imageData || '';
    }

    const response = await fetch('/api/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminCredentials.password,
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'image upload failed');
    }

    const payload = await response.json();
    return normalizeText(payload.url);
  }

  function imageSource(product, index = 0) {
    const gallery = getProductGallery(product);
    return gallery[index] || gallery[0] || '';
  }

  function getProductGallery(product) {
    const images = [];
    if (product?.image) images.push(product.image);
    if (product?.hoverImage) images.push(product.hoverImage);
    if (Array.isArray(product?.gallery)) {
      images.push(...product.gallery);
    }
    if (product?.backImage) images.push(product.backImage);
    if (product?.sideImage) images.push(product.sideImage);
    return dedupeList(images.map((item) => normalizeText(item)).filter(Boolean));
  }

  function detectProductImageOrientation(image) {
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return '';
    }

    const ratio = image.naturalHeight / image.naturalWidth;
    if (ratio >= 1.08) {
      return 'portrait';
    }
    if (ratio <= 0.92) {
      return 'landscape';
    }
    return 'square';
  }

  function setProductCardOrientation(image) {
    const card = image?.closest?.('[data-product-id].product-card');
    if (!card || card.dataset.imageOrientation) {
      return false;
    }

    const orientation = detectProductImageOrientation(image);
    if (!orientation) {
      return false;
    }

    card.dataset.imageOrientation = orientation;
    return true;
  }

  function getProductCardOrientationWeight(card) {
    const orientation = card?.dataset?.imageOrientation || 'unknown';
    if (orientation === 'portrait') return 0;
    if (orientation === 'square') return 1;
    if (orientation === 'landscape') return 2;
    return 3;
  }

  function sortProductGridByOrientation(grid) {
    if (!grid) {
      return;
    }

    const cards = Array.from(grid.children).filter((card) => card.matches?.('[data-product-id].product-card'));
    if (cards.length < 2) {
      return;
    }

    cards.forEach((card, index) => {
      if (!card.dataset.initialSortIndex) {
        card.dataset.initialSortIndex = String(index);
      }

      const image = card.querySelector('[data-product-card-image]');
      if (!card.dataset.imageOrientation && image?.complete) {
        setProductCardOrientation(image);
      }
    });

    const sortedCards = [...cards].sort((first, second) => {
      const orientationDelta = getProductCardOrientationWeight(first) - getProductCardOrientationWeight(second);
      if (orientationDelta !== 0) {
        return orientationDelta;
      }
      return Number(first.dataset.initialSortIndex || 0) - Number(second.dataset.initialSortIndex || 0);
    });

    if (sortedCards.some((card, index) => card !== cards[index])) {
      sortedCards.forEach((card) => grid.appendChild(card));
    }
  }

  function scheduleProductGridOrientationSort(grid) {
    if (!grid || grid.dataset.orientationSortQueued === 'true') {
      return;
    }

    grid.dataset.orientationSortQueued = 'true';
    window.requestAnimationFrame(() => {
      delete grid.dataset.orientationSortQueued;
      sortProductGridByOrientation(grid);
    });
  }

  function isCompactViewport() {
    return window.matchMedia?.('(max-width: 760px)').matches || window.innerWidth <= 760;
  }

  function setProductImageLoading(image) {
    const media = image?.closest?.('.product-media');
    if (!media) {
      return;
    }

    media.classList.remove('loaded');
    media.classList.add('is-loading');
  }

  function markProductImageReady(image) {
    const media = image?.closest?.('.product-media');
    if (!media) {
      return;
    }

    media.classList.remove('is-loading');
    media.classList.add('loaded');
  }

  function syncProductGridOrientations(grid) {
    if (!grid || isCompactViewport()) {
      return;
    }

    grid.querySelectorAll('[data-product-card-image]').forEach((image) => {
      if (image.complete) {
        setProductCardOrientation(image);
      }
    });
    scheduleProductGridOrientationSort(grid);
  }

  function observeProductGridOrientations(grid) {
    if (!grid || grid.dataset.orientationObserverReady === 'true' || isCompactViewport()) {
      return;
    }

    grid.dataset.orientationObserverReady = 'true';
    syncProductGridOrientations(grid);

    if (!window.MutationObserver) {
      return;
    }

    const observer = new MutationObserver(() => syncProductGridOrientations(grid));
    observer.observe(grid, { childList: true });
  }

  function handleProductCardImageLoad(event) {
    const image = event.target?.closest?.('[data-product-card-image]');
    if (!image) {
      return;
    }

    markProductImageReady(image);

    if (isCompactViewport()) {
      return;
    }

    if (!setProductCardOrientation(image)) {
      return;
    }

    scheduleProductGridOrientationSort(image.closest('.product-grid'));
  }

  function handleProductCardImageError(event) {
    const image = event.target?.closest?.('[data-product-card-image]');
    if (!image) {
      return;
    }

    if (image.dataset.fallbackApplied !== 'true') {
      image.dataset.fallbackApplied = 'true';
      image.src = '/assets/habibvelora-logo-transparent.png';
      return;
    }

    markProductImageReady(image);
  }

  function getMobileMenuRoot() {
    return (
      document.querySelector('.clean-mobile-dock') ||
      document.querySelector('[data-mobile-nav="language"]')?.closest('nav') ||
      document.querySelector('#mobileNavLanguageToggle')?.closest('nav') ||
      document.querySelector('.mobile-bottom-nav, .mobile-nav, .bottom-nav')
    );
  }

  function syncMobileMenuActions() {
    const nav = getMobileMenuRoot();
    if (!nav || nav.dataset.storeMobileActionsReady === 'true') {
      return;
    }

    nav.dataset.storeMobileActionsReady = 'true';

    if (nav.classList.contains('clean-mobile-dock') || nav.classList.contains('mobile-bottom-nav')) {
      return;
    }

    if (!nav.querySelector('[data-mobile-nav="search"], .clean-mobile-search-link')) {
      const searchItem = nav.querySelector('a[href="/follow"], a[href="/#follow"]') || document.createElement('a');
      searchItem.href = '/products';
      searchItem.dataset.mobileNav = 'search';
      searchItem.innerHTML = '<span>بحث</span>';
      if (!searchItem.parentElement) {
        nav.insertBefore(searchItem, nav.children[1] || null);
      }
    }

  }

  function buildProductCardGalleryControls(gallery) {
    if (!gallery || gallery.length < 2) {
      return '';
    }

    return `
      <div class="product-card-gallery-controls" aria-label="صور المنتج">
        <button type="button" class="product-card-gallery-button prev" data-action="card-gallery" data-direction="-1" aria-label="الصورة السابقة">‹</button>
        <button type="button" class="product-card-gallery-button next" data-action="card-gallery" data-direction="1" aria-label="الصورة التالية">›</button>
      </div>
      <div class="product-card-gallery-dots" aria-label="اختيار صورة المنتج">
        ${gallery.map((_, index) => `
          <button type="button" class="${index === 0 ? 'active' : ''}" data-action="card-gallery" data-index="${index}" aria-label="صورة ${index + 1}"></button>
        `).join('')}
      </div>
    `;
  }

  function setProductCardGalleryImage(card, product, nextIndex) {
    const gallery = getProductGallery(product);
    if (!card || !product || gallery.length < 2) {
      return;
    }

    const normalizedIndex = ((nextIndex % gallery.length) + gallery.length) % gallery.length;
    const image = card.querySelector('[data-product-card-image]');
    card.dataset.galleryIndex = String(normalizedIndex);

    if (image) {
      delete image.dataset.fallbackApplied;
      delete card.dataset.imageOrientation;
      setProductImageLoading(image);
      image.src = gallery[normalizedIndex];
      image.alt = `${product.name} - صورة ${normalizedIndex + 1}`;
      image.classList.remove('gallery-switching');
      void image.offsetWidth;
      image.classList.add('gallery-switching');
      window.setTimeout(() => {
        image.classList.remove('gallery-switching');
      }, 260);
      window.requestAnimationFrame(() => {
        if (image.complete) {
          markProductImageReady(image);
        }
      });
    }

    card.querySelectorAll('.product-card-gallery-dots button').forEach((dot, index) => {
      dot.classList.toggle('active', index === normalizedIndex);
    });
  }

  function normalizeProductModels(models, gallery = []) {
    return (Array.isArray(models) ? models : [])
      .map((model, index) => {
        const image = normalizeText(model?.image || gallery[index] || '');
        const modelGallery = dedupeList([
          image,
          ...(Array.isArray(model?.gallery) ? model.gallery.map((item) => normalizeText(item)) : []),
        ]);
        return {
          id: normalizeText(model?.id, `model-${index + 1}`),
          name: normalizeText(model?.name, `موديل ${index + 1}`),
          image,
          gallery: modelGallery,
        };
      })
      .filter((model) => model.name || model.image);
  }

  function getTone(index = 0) {
    return tonePalette[index % tonePalette.length] || tonePalette[0];
  }

  function nextProductId(products) {
    const numericIds = products
      .map((product) => Number(String(product.id || '').replace(/\D/g, '')))
      .filter((number) => Number.isFinite(number) && number > 0);
    const nextNumber = numericIds.length ? Math.max(...numericIds) + 1 : 109;
    return `PRD-${String(nextNumber).padStart(3, '0')}`;
  }

  function nextOrderNumber(orders) {
    const numericIds = orders
      .map((order) => Number(String(order.id || '').replace(/\D/g, '')))
      .filter((number) => Number.isFinite(number) && number > 0);
    return numericIds.length ? Math.max(...numericIds) + 1 : 2401;
  }

  function nextNotificationId(items) {
    return `NTF-${String(items.length + 1).padStart(4, '0')}`;
  }

  function availabilityLabel(stock) {
    const value = Math.max(0, toNumber(stock));
    if (value === 0) {
      return '\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646';
    }
    if (value <= 3) {
      return '\u0622\u062e\u0631 \u0642\u0637\u0639';
    }
    return '\u0645\u062a\u0648\u0641\u0631 \u0627\u0644\u0622\u0646';
  }

  function availabilityClass(stock) {
    return Math.max(0, toNumber(stock)) <= 3 ? 'low' : '';
  }

  function isNewProduct(product) {
    const createdAt = product?.createdAt ? new Date(product.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      return Date.now() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 14;
    }
    return String(product?.badge || '').includes('\u062c\u062f\u064a\u062f');
  }

  function smartBadge(product) {
    const stock = toNumber(product?.stock, 0);
    const rawBadge = normalizeText(product?.badge, '');
    const normalizedBadge = rawBadge.replace(/[أإآ]/g, 'ا').toLowerCase();

    if (normalizedBadge.includes('حجز') || normalizedBadge.includes('محجوز') || normalizedBadge.includes('pre')) {
      return stock > 0
        ? { label: availabilityLabel(stock), className: stock <= 3 ? 'urgent' : 'available' }
        : { label: availabilityLabel(stock), className: 'sold' };
    }
    if (stock > 0 && stock <= 3) {
      return { label: '\u0622\u062e\u0631 \u0642\u0637\u0639', className: 'urgent' };
    }
    if (isNewProduct(product)) {
      return { label: '\u0648\u0635\u0644 \u062d\u062f\u064a\u062b\u064b\u0627', className: 'new' };
    }
    if (!stock) {
      return { label: availabilityLabel(stock), className: 'sold' };
    }
    if (rawBadge && !rawBadge.includes('متوفر')) {
      return {
        label: rawBadge,
        className: rawBadge.includes('\u0645\u0645\u064a\u0632') ? 'hot' : '',
      };
    }
    return {
      label: availabilityLabel(stock),
      className: 'available',
    };
  }

  function calculateDiscount(product) {
    const explicitDiscount = toNumber(product.discount, 0);
    if (explicitDiscount > 0) {
      return Math.round(explicitDiscount);
    }

    const compareAt = toNumber(product.compareAtPrice, 0);
    const price = toNumber(product.price, 0);
    if (compareAt <= price || price <= 0) {
      return 0;
    }
    return Math.max(1, Math.round(((compareAt - price) / compareAt) * 100));
  }

  function normalizeProduct(product, index = 0) {
    const source = product || {};
    const gallery = getProductGallery(source);
    const models = normalizeProductModels(source.models, gallery);
    const primaryImage = gallery[0] || source.image || '';
    const hoverImage = gallery[1] || source.hoverImage || primaryImage;
    const colors = normalizeList(source.colors);
    const sizes = normalizeList(source.sizes);
    const priceOptions = normalizePriceOptions(source.priceOptions);
    const optionPrices = priceOptions.map((option) => option.price).filter((priceValue) => priceValue > 0);
    const price = Math.max(0, toNumber(source.price, 0)) || (optionPrices.length ? Math.min(...optionPrices) : 0);
    const compareAtPrice = Math.max(0, toNumber(source.compareAtPrice, price ? Math.round(price * 1.15) : 0));
    const tone = Number.isFinite(Number(source.tone)) ? Number(source.tone) : index;
    const category = canonicalCategory(source.category, 'حلقان');
    const fallbackCopy = defaultProductCopy(category);

    return {
      id: normalizeText(source.id, nextProductId(defaultProducts.concat([source]))),
      name: normalizeText(source.name, 'منتج جديد'),
      category,
      badge: normalizeText(source.badge, 'مميز'),
      featured: Boolean(source.featured || source.homeFeatured),
      note: normalizeProductCopy(source.note, fallbackCopy),
      details: normalizeProductCopy(source.details, normalizeProductCopy(source.note, fallbackCopy)),
      price,
      stock: Math.max(0, Math.floor(toNumber(source.stock, 0))),
      compareAtPrice,
      discount: Number.isFinite(Number(source.discount)) ? Number(source.discount) : calculateDiscount({ price, compareAtPrice }),
      rating: Math.max(0, Math.min(5, toNumber(source.rating, 0))),
      reviewCount: Math.max(0, Math.floor(toNumber(source.reviewCount, 0))),
      image: primaryImage,
      hoverImage,
      sideImage: gallery[2] || source.sideImage || '',
      gallery,
      models,
      priceOptions,
      colors,
      sizes,
      tone,
      monogram: normalizeText(source.monogram, normalizeText(source.name, 'ع').charAt(0) || 'ع'),
      createdAt: source.createdAt || new Date().toISOString(),
    };
  }

  function normalizeCartItem(item) {
    return {
      id: normalizeText(item.id),
      productId: normalizeText(item.productId),
      qty: Math.max(1, Math.floor(toNumber(item.qty, 1))),
      color: normalizeText(item.color),
      size: normalizeText(item.size),
      option: normalizeText(item.option),
      price: Math.max(0, toNumber(item.price, 0)),
    };
  }

  function normalizeNotification(notification) {
    return {
      id: normalizeText(notification.id, nextNotificationId(state.notifications)),
      type: normalizeText(notification.type, 'system'),
      title: normalizeText(notification.title, 'تنبيه'),
      message: normalizeText(notification.message, ''),
      createdAt: notification.createdAt || new Date().toISOString(),
    };
  }

  function normalizeOrder(order) {
    const items = Array.isArray(order?.items)
      ? order.items.map((item) => ({
          productId: normalizeText(item.productId),
          name: normalizeText(item.name),
          qty: Math.max(1, Math.floor(toNumber(item.qty, 1))),
          price: Math.max(0, toNumber(item.price, 0)),
          color: normalizeText(item.color),
          size: normalizeText(item.size),
          option: normalizeText(item.option),
          image: normalizeText(item.image),
        }))
      : [];

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shipping = Math.max(0, toNumber(order?.shipping, subtotal >= 600 ? 0 : 40));
    const total = Math.max(0, toNumber(order?.total, subtotal + shipping));
    const status = Object.prototype.hasOwnProperty.call(statusMeta, order?.status) ? order.status : 'pending';

    return {
      id: normalizeText(order?.id, `VEL-${String(nextOrderNumber(state.orders)).padStart(4, '0')}`),
      invoiceId: normalizeText(order?.invoiceId, String(String(order?.id || '').replace(/\D/g, '') || nextOrderNumber(state.orders)).padStart(8, '0')),
      customer: normalizeText(order?.customer, 'عميل'),
      phone: normalizeText(order?.phone, ''),
      address: normalizeText(order?.address, ''),
      city: normalizeText(order?.city || order?.governorate, ''),
      governorate: normalizeText(order?.governorate || order?.city, ''),
      area: normalizeText(order?.area, ''),
      fullAddress: normalizeText(order?.fullAddress, [normalizeText(order?.governorate || order?.city, ''), normalizeText(order?.area, ''), normalizeText(order?.address, '')].filter(Boolean).join(' • ')),
      payment: normalizeText(order?.payment, 'عند الاستلام'),
      paymentStatus: normalizeText(order?.paymentStatus, ''),
      paymentReference: normalizeText(order?.paymentReference, ''),
      paymentPhone: normalizeText(order?.paymentPhone, ''),
      paymentSenderPhone: normalizeText(order?.paymentSenderPhone, ''),
      paymentTransactionId: normalizeText(order?.paymentTransactionId, ''),
      paymentConfirmedAt: normalizeText(order?.paymentConfirmedAt, ''),
      paymentGateway: normalizeText(order?.paymentGateway, ''),
      paymentGatewayReference: normalizeText(order?.paymentGatewayReference, ''),
      paymentGatewayTransactionId: normalizeText(order?.paymentGatewayTransactionId, ''),
      paymentGatewayMessage: normalizeText(order?.paymentGatewayMessage, ''),
      note: normalizeText(order?.note, ''),
      items,
      subtotal,
      shipping,
      total,
      status,
      createdAt: order?.createdAt || new Date().toISOString(),
      updatedAt: order?.updatedAt || order?.createdAt || new Date().toISOString(),
      tracking: Array.isArray(order?.tracking) ? order.tracking : [],
      inventoryState: order?.inventoryState === 'restored' ? 'restored' : 'reserved',
      deliveryToken: normalizeText(order?.deliveryToken, ''),
    };
  }

  function normalizeReturnRequest(request, index = 0) {
    const items = Array.isArray(request?.items)
      ? request.items.map((item) => ({
          name: normalizeText(item.name),
          qty: Math.max(1, Math.floor(toNumber(item.qty, 1))),
          price: Math.max(0, toNumber(item.price, 0)),
        }))
      : [];

    return {
      id: normalizeText(request?.id, `RET-${String(index + 1).padStart(4, '0')}`),
      orderId: normalizeText(request?.orderId, ''),
      customer: normalizeText(request?.customer, 'عميل'),
      phone: normalizeText(request?.phone, ''),
      governorate: normalizeText(request?.governorate, ''),
      area: normalizeText(request?.area, ''),
      address: normalizeText(request?.address, ''),
      returnType: normalizeText(request?.returnType, 'مرتجع كامل'),
      reason: normalizeText(request?.reason, 'غير محدد'),
      notes: normalizeText(request?.notes, ''),
      status: normalizeText(request?.status, 'pending'),
      orderStatus: normalizeText(request?.orderStatus, 'pending'),
      items,
      total: Math.max(0, toNumber(request?.total, 0)),
      createdAt: request?.createdAt || new Date().toISOString(),
      updatedAt: request?.updatedAt || request?.createdAt || new Date().toISOString(),
    };
  }

  function loadProducts() {
    const stored = loadStorage(storageKeys.products, null);
    if (Array.isArray(stored) && stored.length) {
      return stored.map((product, index) => normalizeProduct(product, index));
    }
    return defaultProducts.map((product, index) => normalizeProduct(product, index));
  }

  function loadCart() {
    const stored = loadStorage(storageKeys.cart, []);
    return Array.isArray(stored) ? stored.map(normalizeCartItem).filter((item) => item.productId) : [];
  }

  function loadWishlist() {
    const stored = loadStorage(storageKeys.wishlist, []);
    return Array.isArray(stored) ? dedupeList(stored.map((item) => normalizeText(item)).filter(Boolean)) : [];
  }

  function loadOrders() {
    const stored = loadStorage(storageKeys.orders, []);
    return Array.isArray(stored)
      ? stored.filter((order) => isAfterClearMarker(order, 'orders')).map(normalizeOrder)
      : [];
  }

  function loadNotifications() {
    const stored = loadStorage(storageKeys.notifications, []);
    return Array.isArray(stored)
      ? stored.filter((notification) => isAfterClearMarker(notification, 'notifications')).map(normalizeNotification)
      : [];
  }

  function loadReturnRequests() {
    const stored = loadStorage(storageKeys.returnRequests, []);
    return Array.isArray(stored) ? stored.map((request, index) => normalizeReturnRequest(request, index)) : [];
  }

  function loadTheme() {
    saveStorage(storageKeys.theme, 'dark');
    return 'dark';
  }

  function loadAdminAccess() {
    removeStorage(storageKeys.adminAccess);
    const session = loadSessionStorage(storageKeys.adminAccess, null);
    const unlockedAt = Number(session?.unlockedAt || 0);
    const password = normalizeText(session?.password, '');

    if (!password || !unlockedAt || Date.now() - unlockedAt > ADMIN_ACCESS_MAX_AGE_MS) {
      removeSessionStorage(storageKeys.adminAccess);
      return false;
    }

    adminCredentials.password = password;
    return true;
  }

  async function saveProducts(options = {}) {
    const saved = saveStorage(storageKeys.products, state.products);
    state.productsDirty = true;
    try {
      await persistProductsToDatabase();
      state.productsDirty = false;
    } catch (error) {
      showToast('تعذر حفظ المنتجات', 'حاول مرة أخرى أو قلّل حجم الصور.', 'error');
      if (options.strict) throw error;
    }
    return saved;
  }

  async function fetchReviewSummary() {
    try {
      const response = await fetch('/api/reviews', { cache: 'no-store' });
      if (!response.ok) {
        return {};
      }
      const payload = await response.json();
      return payload && typeof payload.summary === 'object' ? payload.summary : {};
    } catch (error) {
      console.warn('تعذر تحميل تقييمات المنتجات', error);
      return {};
    }
  }

  function applyProductReviewSummary(summary) {
    state.products = state.products.map((product) => {
      const review = summary[product.id];
      if (!review || !review.count) {
        return { ...product, rating: 0, reviewCount: 0 };
      }
      return {
        ...product,
        rating: Math.max(0, Math.min(5, toNumber(review.rating, 0))),
        reviewCount: Math.max(0, Math.floor(toNumber(review.count, 0))),
      };
    });
  }

  async function fetchProductsFromDatabase() {
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) {
        return { configured: false, products: [] };
      }
      const payload = await response.json();
      return {
        configured: Boolean(payload.configured),
        products: Array.isArray(payload.products) ? payload.products : [],
      };
    } catch (error) {
      return { configured: false, products: [] };
    }
  }

  async function persistProductsToDatabase() {
    const response = await fetch('/api/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminCredentials.password,
      },
      body: JSON.stringify({ products: state.products }),
    });

    if (!response.ok) {
      throw new Error('products save failed');
    }
  }

  async function syncProductsFromDatabase() {
    if (!state.products.length) {
      renderProductSkeletons();
    }
    const result = await fetchProductsFromDatabase();
    if (!result.configured || state.productsDirty) {
      return;
    }

    state.products = result.products.map((product, index) => normalizeProduct(product, index));
    saveStorage(storageKeys.products, state.products);
    renderProductCategoryOptions();
    renderAdminCategoryList();
    syncCartWithInventory();
    applyRouteFilters();
    renderAll();

    fetchReviewSummary().then((summary) => {
      applyProductReviewSummary(summary);
      saveStorage(storageKeys.products, state.products);
      renderProducts();
      renderRequestedProducts();
    });
  }

  function renderProductSkeletons(count = 6) {
    if (!elements.productGrid || elements.productGrid.children.length) {
      return;
    }
    elements.productGrid.className = 'product-grid product-grid-loading';
    elements.productGrid.innerHTML = Array.from({ length: count }).map(() => `
      <article class="product-card product-skeleton" aria-hidden="true">
        <div class="skeleton-media"></div>
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-actions">
          <span></span>
          <span></span>
        </div>
      </article>
    `).join('');
  }

  function saveCart() {
    return saveStorage(storageKeys.cart, state.cart);
  }

  function saveWishlist() {
    return saveStorage(storageKeys.wishlist, state.wishlist);
  }

  async function persistOrdersToDatabase() {
    const response = await fetch('/api/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminCredentials.password,
      },
      body: JSON.stringify({ orders: state.orders }),
    });

    if (!response.ok) {
      throw new Error('orders save failed');
    }
  }

  async function persistSingleOrderToDatabase(order) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.order) {
      throw new Error(payload.message || 'order save failed');
    }
    return normalizeOrder(payload.order);
  }

  async function persistOrderUpdateToDatabase(order) {
    const response = await fetch('/api/orders', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminCredentials.password,
      },
      body: JSON.stringify({ order }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.order) {
      throw new Error(payload.message || 'order update failed');
    }
    return normalizeOrder(payload.order);
  }

  function saveOrders() {
    const saved = saveStorage(storageKeys.orders, state.orders);
    persistOrdersToDatabase().catch(() => {
      showToast('تعذر حفظ الطلبات', 'راجع الاتصال ثم حاول مرة أخرى.', 'error');
    });
    return saved;
  }


  async function deleteOrdersFromDatabase(before = 0) {
    const query = before ? `?before=${encodeURIComponent(String(before))}` : '';
    const response = await fetch(`/api/orders${query}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': adminCredentials.password,
      },
    });

    if (!response.ok) {
      throw new Error('orders delete failed');
    }
  }

  async function clearAllOrders() {
    const hadOrders = state.orders.length > 0;
    state.ordersCleared = true;
    const clearedAt = writeClearMarker('orders');
    state.orders = [];
    clearStoredCollection('orders');
    renderOrders();
    renderSummary();

    if (elements.clearOrdersButton) {
      elements.clearOrdersButton.disabled = true;
    }

    try {
      await deleteOrdersFromDatabase(clearedAt);
      showToast(
        hadOrders ? '\u062a\u0645 \u0645\u0633\u062d \u0627\u0644\u0637\u0644\u0628\u0627\u062a' : '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0641\u0627\u0631\u063a\u0629',
        hadOrders ? '\u062a\u0645 \u062d\u0630\u0641 \u0643\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0646\u0647\u0627\u0626\u064a\u0627.' : '\u062b\u0628\u062a\u0646\u0627 \u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0633\u062d \u0648\u0644\u0646 \u062a\u0638\u0647\u0631 \u0637\u0644\u0628\u0627\u062a \u0642\u062f\u064a\u0645\u0629.',
        'success',
      );
    } catch (error) {
      showToast('\u062a\u0645 \u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0645\u062d\u0644\u064a\u0627', '\u0647\u0646\u062d\u0627\u0648\u0644 \u062d\u0630\u0641 \u0646\u0633\u062e\u0629 \u0627\u0644\u0633\u064a\u0631\u0641\u0631 \u062a\u0627\u0646\u064a \u0639\u0646\u062f \u0641\u062a\u062d \u0627\u0644\u0644\u0648\u062d\u0629.', 'warning');
    } finally {
      if (elements.clearOrdersButton) {
        elements.clearOrdersButton.disabled = false;
      }
    }
  }

  async function fetchOrdersFromDatabase(password = adminCredentials.password) {
    if (!password) {
      return [];
    }

    try {
      const response = await fetch('/api/orders', {
        cache: 'no-store',
        headers: {
          'x-admin-password': password,
        },
      });
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload.orders) ? payload.orders : [];
    } catch {
      return [];
    }
  }

  async function syncOrdersFromDatabase() {
    const remoteOrders = await fetchOrdersFromDatabase();
    if (!remoteOrders.length) return;

    const visibleRemoteOrders = remoteOrders
      .filter((order) => isAfterClearMarker(order, 'orders'))
      .map(normalizeOrder);

    const clearedAt = readClearMarker('orders');
    if (visibleRemoteOrders.length !== remoteOrders.length && adminCredentials.password && clearedAt) {
      deleteOrdersFromDatabase(clearedAt).catch(() => {});
    }

    if (!visibleRemoteOrders.length) {
      state.orders = state.orders.filter((order) => isAfterClearMarker(order, 'orders'));
      saveStorage(storageKeys.orders, state.orders);
      renderOrders();
      renderSummary();
      return;
    }

    const orderMap = new Map(state.orders.map((order) => [order.id, order]));
    visibleRemoteOrders.forEach((order) => orderMap.set(order.id, order));
    state.orders = [...orderMap.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    saveStorage(storageKeys.orders, state.orders);
    renderOrders();
    renderSummary();
  }

  async function notifyTelegramOrder(order) {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: buildTelegramOrderPayload(order) }),
      });
    } catch {
      // Telegram notifications are optional.
    }
  }

  function buildTelegramOrderPayload(order) {
    return {
      id: order.id,
      invoiceId: order.invoiceId,
      customer: order.customer,
      phone: order.phone,
      fullAddress: order.fullAddress,
      payment: order.payment,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      paymentPhone: order.paymentPhone,
      paymentSenderPhone: order.paymentSenderPhone,
      paymentTransactionId: order.paymentTransactionId,
      paymentGateway: order.paymentGateway,
      paymentGatewayReference: order.paymentGatewayReference,
      paymentGatewayTransactionId: order.paymentGatewayTransactionId,
      paymentGatewayMessage: order.paymentGatewayMessage,
      total: order.total,
      deliveryToken: order.deliveryToken,
      items: (order.items || []).map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        color: item.color,
        size: item.size,
        option: item.option,
      })),
    };
  }

  function saveNotifications() {
    return saveStorage(storageKeys.notifications, state.notifications);
  }

  function saveReturnRequests() {
    return saveStorage(storageKeys.returnRequests, state.returnRequests);
  }

  function saveTheme() {
    return saveStorage(storageKeys.theme, state.theme);
  }

  function saveAdminAccess() {
    removeStorage(storageKeys.adminAccess);
    if (!adminCredentials.password) {
      removeSessionStorage(storageKeys.adminAccess);
      return false;
    }

    return saveSessionStorage(storageKeys.adminAccess, {
      password: adminCredentials.password,
      unlockedAt: Date.now(),
    });
  }

  function getProduct(productId) {
    return state.products.find((product) => product.id === productId) || null;
  }

  function getCartLineId(productId, color, size, option = '') {
    return [productId, option || '-', color || '-', size || '-'].join('|');
  }

  function getCartItem(productId, color, size) {
    const lineId = getCartLineId(productId, color, size);
    return state.cart.find((item) => item.id === lineId) || null;
  }

  function getDefaultVariant(product) {
    const priceOptions = normalizePriceOptions(product?.priceOptions);
    return {
      color: product?.colors?.[0] || '',
      size: product?.sizes?.[0] || '',
      option: priceOptions.length === 1 ? priceOptions[0].label : '',
      price: priceOptions.length === 1 ? priceOptions[0].price : 0,
    };
  }

  function getProductVariantLabel(color, size, option = '') {
    const parts = [];
    if (option) parts.push(option);
    if (color) parts.push(color);
    if (size) parts.push(size);
    return parts.join(' - ') || '\u0628\u062f\u0648\u0646 \u062e\u064a\u0627\u0631\u0627\u062a';
  }

  function getOrderSequenceLabel(number) {
    return String(number).padStart(4, '0');
  }

  function randomToken(length = 8) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(length);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  }

  function createOrderIdentity() {
    const orderId = `${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const invoiceId = `${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    return {
      orderId,
      invoiceId,
    };
  }

  function createDeliveryToken() {
    const bytes = new Uint8Array(12);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }

  function createPaymentReference(orderId) {
    const suffix = String(orderId || '').replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase() || randomToken(6);
    return `HV-${suffix}-${randomToken(3)}`;
  }

  function createDraftPaymentReference() {
    const bucket = Math.floor(Date.now() / 60000).toString().slice(-4);
    const random = Math.floor(100 + Math.random() * 900);
    return `HV-${bucket}-${random}`;
  }

  function cashOnDeliveryPayment() {
    return '\u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645';
  }

  function lockPaymentMethodToCash() {
    const select = elements.paymentMethod;
    if (!select) return;

    const cashValue = cashOnDeliveryPayment();
    if (![...select.options].some((option) => option.value === cashValue)) {
      select.insertBefore(new Option(cashValue, cashValue), select.firstChild);
    }

    [...select.options].forEach((option) => {
      if (option.value !== cashValue) {
        option.remove();
      }
    });
    select.value = cashValue;
  }

  function isVodafoneCashPayment(payment) {
    return false;
  }

  function isCardGatewayPayment(payment) {
    return false;
  }

  function isGatewayPayment(payment) {
    return isCardGatewayPayment(payment);
  }

  function paymentStatusLabel(status) {
    return {
      pending_review: 'بانتظار مراجعة التحويل',
      pending_gateway: 'بانتظار تأكيد Paymob',
      cash_on_delivery: 'الدفع عند الاستلام',
      not_required: 'لا يحتاج تأكيد دفع',
      confirmed: 'تم تأكيد الدفع',
      failed: 'فشل أو رفض الدفع',
    }[status] || status || 'غير محدد';
  }

  function ensurePaymentProofFields() {
    if (!elements.checkoutForm || elements.paymentProofPanel) {
      return;
    }

    const panel = document.createElement('div');
    panel.className = 'payment-proof-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="payment-proof-head">
        <span>فودافون كاش مباشر</span>
        <strong dir="ltr">${escapeHtml(vodafoneCashNumber)}</strong>
      </div>
      <p>حوّل إجمالي الطلب على رقم فودافون كاش، واكتب كود الطلب في ملاحظات التحويل إن أمكن. الطلب هيوصل للبوت بانتظار مراجعة التحويل.</p>
      <label class="payment-reference-field">
        كود الدفع الخاص بالطلب
        <input id="paymentReferenceInput" type="text" readonly dir="ltr" />
      </label>
      <div class="inline-fields">
        <label>
          رقم المحفظة اللي حولت منها
          <input id="paymentSenderPhone" type="tel" inputmode="tel" placeholder="مثال: 01000000000" />
        </label>
        <label>
          رقم عملية التحويل
          <input id="paymentTransactionId" type="text" placeholder="من رسالة فودافون كاش" />
        </label>
      </div>
    `;

    const noteLabel = elements.orderNote?.closest('label');
    elements.checkoutForm.insertBefore(panel, noteLabel || elements.checkoutForm.querySelector('button[type="submit"]'));
    elements.paymentProofPanel = panel;
    elements.paymentReferenceInput = document.getElementById('paymentReferenceInput');
    elements.paymentSenderPhone = document.getElementById('paymentSenderPhone');
    elements.paymentTransactionId = document.getElementById('paymentTransactionId');
  }

  function updatePaymentProofFields() {
    lockPaymentMethodToCash();
    ensurePaymentProofFields();
    if (!elements.paymentProofPanel) {
      return;
    }

    const isVodafone = isVodafoneCashPayment(elements.paymentMethod?.value);
    elements.paymentProofPanel.hidden = !isVodafone;
    if (isVodafone && elements.paymentReferenceInput && !elements.paymentReferenceInput.value) {
      elements.paymentReferenceInput.value = createDraftPaymentReference();
    }
    [elements.paymentSenderPhone, elements.paymentTransactionId].filter(Boolean).forEach((input) => {
      input.required = isVodafone;
    });
  }

  function invoiceUrl(order) {
    return `/invoice?o=${encodeURIComponent(order?.id || '')}&t=${encodeURIComponent(order?.deliveryToken || '')}`;
  }

  function orderTrackingUrl(order) {
    return `/order-tracking?q=${encodeURIComponent(order?.id || order?.invoiceId || '')}`;
  }

  function hideOrderSuccess() {
    if (!elements.orderSuccessPanel) {
      return;
    }

    elements.orderSuccessPanel.hidden = true;
    elements.orderSuccessPanel.innerHTML = '';
  }

  function showOrderSuccess(order) {
    if (!elements.orderSuccessPanel || !order) {
      return;
    }

    const gatewayInstructions = isGatewayPayment(order.payment) ? `
      <div class="payment-success-box">
        <span>حالة الدفع الإلكتروني</span>
        <strong>${order.paymentStatus === 'confirmed' ? 'Paymob أكد وصول الدفع' : 'بانتظار تأكيد Paymob'}</strong>
        <div class="payment-success-grid">
          <div>
            <small>بوابة الدفع</small>
            <b>Paymob</b>
          </div>
          <div>
            <small>كود ربط الدفع</small>
            <b dir="ltr">${escapeHtml(order.paymentReference || '-')}</b>
          </div>
        </div>
        <p>لو الدفع اتأكد، البوت ولوحة الطلبات هيتحدثوا تلقائيًا من webhook. متعتمدش على لقطة شاشة أو رقم كتبه العميل.</p>
      </div>
    ` : '';
    const vodafoneInstructions = isVodafoneCashPayment(order.payment) ? `
      <div class="payment-success-box">
        <span>فودافون كاش مباشر</span>
        <strong>حوّل ${escapeHtml(formatMoney(order.total))} على الرقم</strong>
        <div class="payment-success-grid">
          <div>
            <small>رقم فودافون كاش</small>
            <b dir="ltr">${escapeHtml(vodafoneCashNumber)}</b>
          </div>
          <div>
            <small>كود الطلب</small>
            <b dir="ltr">${escapeHtml(order.paymentReference || '-')}</b>
          </div>
        </div>
        <p>اكتب كود الطلب في ملاحظات التحويل. البوت هيعرض الطلب بانتظار تأكيد وصول التحويل يدويًا.</p>
      </div>
    ` : '';

    elements.orderSuccessPanel.hidden = false;
    elements.orderSuccessPanel.innerHTML = `
      <div class="order-success-icon" aria-hidden="true">\u2713</div>
      <p class="eyebrow">\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628</p>
      <h2>\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0637\u0644\u0628\u0643 \u0628\u0646\u062c\u0627\u062d</h2>
      <p class="order-success-copy">\u0627\u062d\u062a\u0641\u0638 \u0628\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u062d\u0627\u0644\u0629 \u0627\u0644\u0634\u062d\u0646 \u0641\u064a \u0623\u064a \u0648\u0642\u062a.</p>
      <div class="order-success-codes">
        <div>
          <span>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628</span>
          <strong dir="ltr">${escapeHtml(order.id)}</strong>
        </div>
        <div>
          <span>\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629</span>
          <strong dir="ltr">${escapeHtml(order.invoiceId)}</strong>
        </div>
      </div>
      <div class="order-success-summary">
        <span>\u0627\u0644\u062d\u0627\u0644\u0629: ${escapeHtml(statusMeta[order.status]?.label || '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632')}</span>
        <span>\u0627\u0644\u062f\u0641\u0639: ${escapeHtml(paymentStatusLabel(order.paymentStatus))}</span>
        <strong>${escapeHtml(formatMoney(order.total))}</strong>
      </div>
      ${gatewayInstructions}
      ${vodafoneInstructions}
      <div class="order-success-steps" aria-label="خطوات متابعة الطلب">
        <span class="active">استلام الطلب</span>
        <span>تجهيز الطلب</span>
        <span>خروج للشحن</span>
        <span>تم التسليم</span>
      </div>
      <div class="order-success-actions">
        <a class="primary-btn animated-flow-button flow-track" href="${escapeHtml(orderTrackingUrl(order))}">${animatedButtonContent('متابعة الطلب')}</a>
        <a class="secondary-btn" href="/#collection">\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0645\u062a\u062c\u0631</a>
      </div>
    `;
    elements.orderSuccessPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function buildProductPageUrl(productId) {
    return `/product?id=${encodeURIComponent(productId)}`;
  }

  function populateAreaSelect(governorate = elements.customerGovernorate?.value || '') {
    if (!elements.customerArea || elements.customerArea.tagName !== 'SELECT') {
      return;
    }

    const currentValue = elements.customerArea.value;
    const areas = governorateAreas[governorate] || [];
    elements.customerArea.innerHTML = [
      '<option value="">اختر المنطقة / المركز</option>',
      ...areas.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`),
    ].join('');
    if (areas.includes(currentValue)) {
      elements.customerArea.value = currentValue;
    }
  }

  function populateGovernorateSelect() {
    if (!elements.customerGovernorate) {
      return;
    }

    const currentValue = elements.customerGovernorate.value;
    elements.customerGovernorate.innerHTML = [
      '<option value="">اختر المحافظة</option>',
      ...egyptGovernorates.map((governorate) => `<option value="${escapeHtml(governorate)}">${escapeHtml(governorate)}</option>`),
    ].join('');
    elements.customerGovernorate.dataset.populated = 'true';
    if (currentValue) {
      elements.customerGovernorate.value = currentValue;
    }
    populateAreaSelect(elements.customerGovernorate.value);
  }

  function animateAddToCart(sourceElement) {
    const cartTarget = elements.cartJump;
    const imageSource = sourceElement?.querySelector?.('img') || sourceElement;
    if (!cartTarget || !imageSource || typeof imageSource.cloneNode !== 'function') {
      return;
    }

    const sourceRect = imageSource.getBoundingClientRect();
    const targetRect = cartTarget.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
      return;
    }

    const flyer = imageSource.cloneNode(true);
    flyer.classList.add('cart-flyer');
    flyer.style.position = 'fixed';
    flyer.style.left = `${sourceRect.left}px`;
    flyer.style.top = `${sourceRect.top}px`;
    flyer.style.width = `${sourceRect.width}px`;
    flyer.style.height = `${sourceRect.height}px`;
    flyer.style.borderRadius = '22px';
    flyer.style.pointerEvents = 'none';
    flyer.style.zIndex = '120';
    flyer.style.transformOrigin = 'center center';
    flyer.style.margin = '0';
    flyer.style.objectFit = 'cover';
    flyer.style.boxShadow = '0 18px 34px rgba(155, 102, 115, 0.24)';

    document.body.appendChild(flyer);

    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    flyer.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 0.92 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12)`, opacity: 0.05 },
      ],
      {
        duration: 720,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    ).onfinish = () => flyer.remove();
  }

  function getOrderStats() {
    return {
      products: state.products.length,
      cart: state.cart.reduce((sum, item) => sum + item.qty, 0),
      orders: state.orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled').length,
      notifications: state.notifications.length,
    };
  }

  function getShipping(subtotal, governorate = elements.customerGovernorate?.value || '') {
    if (subtotal <= 0) {
      return 0;
    }

    const governorateFee = toNumber(shippingFees[governorate], 0);
    if (governorate && governorateFee > 0) {
      return governorateFee;
    }

    return subtotal >= 600 ? 0 : 40;
  }

  function cartLinePrice(item) {
    const product = getProduct(item.productId);
    if (toNumber(item.price, 0) > 0) {
      return toNumber(item.price, 0);
    }
    return product ? product.price : 0;
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.qty * cartLinePrice(item), 0);
  }

  function buildCartItemMarkup(item, product) {
    const variant = getProductVariantLabel(item.color, item.size, item.option);
    const linePrice = cartLinePrice(item);
    return `
      <div class="cart-item-copy">
        <strong>${escapeHtml(product.name)}</strong>
        <p>${escapeHtml(product.category)} • ${escapeHtml(variant)}</p>
        <small>${escapeHtml(formatMoney(linePrice))} للوحدة</small>
      </div>
      <div class="cart-quantity">
        <button type="button" class="qty-btn" data-action="qty-decrease" aria-label="إنقاص">-</button>
        <strong>${escapeHtml(formatCount(item.qty))}</strong>
        <button type="button" class="qty-btn" data-action="qty-increase" aria-label="زيادة">+</button>
      </div>
      <button type="button" class="remove-link" data-action="cart-remove">حذف</button>
    `;
  }

  function createCartItemElement(item, extraClass = '') {
    const product = getProduct(item.productId);
    if (!product) {
      return null;
    }

    const line = document.createElement('article');
    line.className = `cart-item${extraClass ? ` ${extraClass}` : ''}`;
    line.dataset.cartId = item.id;
    line.innerHTML = buildCartItemMarkup(item, product);
    return line;
  }

  function syncCartWithInventory() {
    if (!state.products.length) {
      return;
    }

    const nextCart = [];

    state.cart.forEach((item) => {
      const product = getProduct(item.productId);
      if (!product || product.stock <= 0) {
        return;
      }

      const maxQty = Math.max(1, product.stock);
      const qty = Math.min(item.qty, maxQty);
      if (qty > 0) {
        nextCart.push({ ...item, qty });
      }
    });

    state.cart = nextCart;
    saveCart();
  }

  function showToast(title, message, type = 'success') {
    if (!elements.toastRegion) {
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
    elements.toastRegion.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    window.setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2600);
  }

  function addNotification(type, title, message) {
    const notification = normalizeNotification({
      id: nextNotificationId(state.notifications),
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
    });

    state.notifications.unshift(notification);
    state.notifications = state.notifications.slice(0, 20);
    saveNotifications();
    renderNotifications();
    renderSummary();
    return notification;
  }

  function setTheme(theme) {
    state.theme = 'dark';
    document.body.dataset.theme = state.theme;
    saveTheme();

  }

  function setDashboardVisible(visible) {
    if (!elements.dashboard) {
      return;
    }

    elements.dashboard.hidden = !visible;
    elements.dashboard.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function setAdminSection(section) {
    state.filters.adminSection = section || 'all';

    if (Array.isArray(elements.adminSectionButtons)) {
      elements.adminSectionButtons.forEach((button) => {
        const isActive = (button.dataset.adminSection || 'all') === state.filters.adminSection;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    updateAdminPanelVisibility();
  }

  function updateAdminPanelVisibility() {
    if (!elements.dashboard) {
      return;
    }

    const activeSection = state.filters.adminSection || 'all';
    const panels = elements.dashboard.querySelectorAll('[data-admin-panel]');

    panels.forEach((panel) => {
      const panelSection = panel.dataset.adminPanel || 'all';
      const visible = activeSection === 'all' || panelSection === activeSection;
      panel.hidden = !visible;
      panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  const adminShortcut = {
    clicks: 0,
    timer: null,
  };

  function handleAdminShortcut(event, requiredClicks = 3) {
    if (!elements.brand) {
      return;
    }

    adminShortcut.clicks += 1;
    window.clearTimeout(adminShortcut.timer);
    adminShortcut.timer = window.setTimeout(() => {
      adminShortcut.clicks = 0;
    }, 900);

    if (adminShortcut.clicks < requiredClicks) {
      return;
    }

    adminShortcut.clicks = 0;
    event.preventDefault();
    showToast('فتح لوحة التحكم', 'جارٍ الانتقال إلى لوحة الإدارة.', 'success');
    window.setTimeout(() => {
      window.location.href = '/admin';
    }, 180);
  }

  function handleBrandShortcut(event) {
    handleAdminShortcut(event, 3);
  }

  function openAdminGate() {
    if (!elements.adminGate) {
      return;
    }

    elements.adminGate.hidden = false;
    elements.adminGate.setAttribute('aria-hidden', 'false');
    elements.adminGate.classList.remove('hidden');
    elements.adminGate.style.removeProperty('display');
    if (elements.adminPassword) {
      elements.adminPassword.focus();
    }
  }

  function closeAdminGate() {
    if (!elements.adminGate) {
      return;
    }

    elements.adminGate.hidden = true;
    elements.adminGate.setAttribute('aria-hidden', 'true');
    elements.adminGate.classList.add('hidden');
    elements.adminGate.style.display = 'none';
    if (elements.adminGateHint) {
      elements.adminGateHint.textContent = '';
    }
  }

  async function unlockAdmin() {
    const value = normalizeText(elements.adminPassword?.value);
    if (!value) {
      if (elements.adminGateHint) {
        elements.adminGateHint.textContent = 'اكتب كلمة المرور أولًا.';
      }
      return;
    }

    const previousPassword = adminCredentials.password;
    let verified = false;
    let remoteOrders = [];

    if (elements.adminUnlockButton) {
      elements.adminUnlockButton.disabled = true;
    }
    if (elements.adminGateHint) {
      elements.adminGateHint.textContent = '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0642\u0642...';
    }

    try {
      const response = await fetch('/api/orders', {
        cache: 'no-store',
        headers: {
          'x-admin-password': value,
        },
      });
      verified = response.ok;
      if (verified) {
        const payload = await response.json().catch(() => ({}));
        remoteOrders = Array.isArray(payload.orders) ? payload.orders : [];
      }
    } catch {
      verified = false;
    }

    if (elements.adminUnlockButton) {
      elements.adminUnlockButton.disabled = false;
    }

    if (!verified) {
      adminCredentials.password = previousPassword || '';
      removeSessionStorage(storageKeys.adminAccess);
      if (elements.adminGateHint) {
        elements.adminGateHint.textContent = 'كلمة المرور غير صحيحة.';
      }
      showToast('تعذر الفتح', 'كلمة المرور غير صحيحة.', 'warning');
      return;
    }

    adminCredentials.password = value;
    if (remoteOrders.length) {
      const orderMap = new Map(state.orders.map((order) => [order.id, order]));
      const visibleRemoteOrders = remoteOrders
        .filter((order) => isAfterClearMarker(order, 'orders'))
        .map(normalizeOrder);
      const clearedAt = readClearMarker('orders');
      if (visibleRemoteOrders.length !== remoteOrders.length && clearedAt) {
        deleteOrdersFromDatabase(clearedAt).catch(() => {});
      }
      visibleRemoteOrders.forEach((order) => orderMap.set(order.id, order));
      state.orders = [...orderMap.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveStorage(storageKeys.orders, state.orders);
    }

    state.adminUnlocked = true;
    saveAdminAccess();
    setDashboardVisible(true);
    closeAdminGate();
    showToast('تم فتح اللوحة', 'أصبح التحكم متاحًا الآن.', 'success');
    renderDashboard();
  }

  function toggleWishlistFilter() {
    state.filters.wishlistOnly = !state.filters.wishlistOnly;
    renderProducts();
    renderCategoryButtons();
    updateWishlistToggle();
  }

  function updateWishlistToggle() {
    if (!elements.wishlistToggle) {
      return;
    }

    const count = state.wishlist.length;
    const isActive = state.filters.wishlistOnly;
    const small = elements.wishlistToggle.querySelector('small');
    elements.wishlistToggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    elements.wishlistToggle.classList.toggle('active', isActive);
    if (small) {
      small.textContent = formatCount(count);
    }
  }

  function updateCartCounter() {
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    if (elements.cartCount) {
      elements.cartCount.textContent = formatCount(count);
    }
    if (elements.cartBadge) {
      elements.cartBadge.textContent = `${formatCount(count)} عنصر`;
    }
    if (elements.cartJump) {
      const label = count > 0
        ? `سلة الشراء، بها ${formatCount(count)} عنصر`
        : 'سلة الشراء';
      elements.cartJump.setAttribute('aria-label', label);
      elements.cartJump.setAttribute('title', label);
    }
    document.querySelectorAll('[data-mobile-cart-count]').forEach((badge) => {
      badge.textContent = formatCount(count);
      badge.hidden = false;
    });
    if (elements.wishlistToggle) {
      const small = elements.wishlistToggle.querySelector('small');
      if (small) {
        small.textContent = formatCount(state.wishlist.length);
      }
    }
  }

  function updateSummary() {
    const stats = getOrderStats();
    if (elements.summaryProducts) {
      elements.summaryProducts.textContent = formatCount(stats.products);
    }
    if (elements.summaryCart) {
      elements.summaryCart.textContent = formatCount(stats.cart);
    }
    if (elements.summaryOrders) {
      elements.summaryOrders.textContent = formatCount(stats.orders);
    }
    if (elements.summaryNotifications) {
      elements.summaryNotifications.textContent = formatCount(stats.notifications);
    }
  }

  function updateTotals() {
    const subtotal = cartSubtotal();
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;

    if (elements.subtotalValue) {
      elements.subtotalValue.textContent = formatMoney(subtotal);
    }
    if (elements.shippingValue) {
      elements.shippingValue.textContent = formatMoney(shipping);
    }
    if (elements.totalValue) {
      elements.totalValue.textContent = formatMoney(total);
    }
  }

  function renderCategoryButtons() {
    if (!elements.categoryFilters) {
      return;
    }

    if (state.filters.category !== 'all' && !state.products.some((product) => product.category === state.filters.category)) {
      state.filters.category = 'all';
      state.filters.showcaseOnly = true;
    }

    const buttons = Array.from(elements.categoryFilters.querySelectorAll('[data-category]'));
    buttons.forEach((button) => {
      const category = canonicalCategory(button.dataset.category || 'all', 'all');
      const hasProducts = category === 'all' || state.products.some((product) => product.category === category);
      button.dataset.category = category;
      button.hidden = !hasProducts;

      const isActive = category === state.filters.category;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function getProductFeaturedScore(product) {
    const badge = normalizeText(product?.badge).toLowerCase();
    const rating = toNumber(product?.rating, 0);
    const reviews = toNumber(product?.reviewCount, 0);
    const stock = toNumber(product?.stock, 0);
    const discount = toNumber(product?.discount, 0);
    const badgeScore = badge.includes('مميز')
      ? 40
      : badge.includes('جديد')
        ? 34
        : badge.includes('اختيار')
          ? 26
          : badge.includes('خفيف')
            ? 14
            : 8;

    return badgeScore
      + (rating * 10)
      + Math.min(reviews, 250) * 0.18
      + Math.min(stock, 24) * 0.25
      + (discount * 0.45);
  }

  function sortProducts(products) {
    const list = Array.isArray(products) ? products.slice() : [];
    return list.sort((left, right) => {
      const scoreDiff = getProductFeaturedScore(right) - getProductFeaturedScore(left);
      return scoreDiff || String(left.name || '').localeCompare(String(right.name || ''), 'ar');
    });
  }

  function filterProducts() {
    const query = normalizeText(state.filters.query).toLowerCase();
    const filtered = state.products.filter((product) => {
      const matchesCategory = state.filters.category === 'all' || product.category === state.filters.category;
      const matchesWishlist = !state.filters.wishlistOnly || state.wishlist.includes(product.id);
      const searchable = [
        product.name,
        product.category,
        product.badge,
        product.note,
        product.details,
        product.colors.join(' '),
        product.sizes.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      return matchesCategory && matchesWishlist && matchesQuery;
    });

    return sortProducts(filtered);
  }

  function productsForCategory(category) {
    const normalizedCategory = canonicalCategory(category, 'all');
    if (normalizedCategory === 'all') {
      return sortProducts(state.products);
    }

    return sortProducts(state.products.filter((product) => product.category === normalizedCategory));
  }

  function ensureMobileBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) {
      return;
    }

    if (
      !document.body ||
      ['admin', 'category', 'products', 'product'].includes(document.body.dataset.page)
    ) {
      return;
    }

    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav clean-mobile-dock no-print';
    bottomNav.setAttribute('aria-label', 'التنقل السفلي');
    bottomNav.innerHTML = `
      <a href="/" data-mobile-nav="home">
        <span class="mobile-nav-icon" aria-hidden="true"><span class="mobile-nav-logo-text">HV</span></span>
        <small>الرئيسية</small>
      </a>
      <a href="/#collection" data-mobile-nav="categories">
        <span class="mobile-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z"/></svg></span>
        <small>الأقسام</small>
      </a>
      <a href="/order-tracking" data-mobile-nav="tracking">
        <span class="mobile-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h4l2-4 4 8 2-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <small>تتبع</small>
      </a>
      <a href="/cart" data-mobile-nav="cart">
        <b class="mobile-cart-count" data-mobile-cart-count>0</b>
        <small>السلة</small>
      </a>
      <a href="/after-sales" data-mobile-nav="returns">
        <span class="mobile-nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 7 5 11l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 11h9.5a4.5 4.5 0 1 1 0 9H12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <small>المرتجع</small>
      </a>
    `;
    document.body.appendChild(bottomNav);
  }

  function updateMobileBottomNavState() {
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    document.body?.classList.toggle('show-mobile-categories', pathname === '/' && hash === '#categories');

    if (!bottomNav) {
      return;
    }


    bottomNav.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      let active = false;

      if (href === '/' && pathname === '/' && hash !== '#collection') {
        active = true;
      } else if (href === '/#collection' && ((pathname === '/' && hash === '#collection') || pathname === '/category')) {
        active = true;
      } else if (href === '/products' && pathname === '/products') {
        active = true;
      } else if (href === '/order-tracking' && pathname === '/order-tracking') {
        active = true;
      } else if (href === '/cart' && pathname === '/cart') {
        active = true;
      } else if (href === '/after-sales' && pathname === '/after-sales') {
        active = true;
      }

      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function renderProducts() {
    if (!elements.productGrid) {
      return;
    }

    applyRouteFilters();
    renderCategoryPageHeader();
    const visibleProducts = filterProducts();
    renderCategoryPageHeader();
    elements.productGrid.className = 'product-grid';
    elements.productGrid.innerHTML = '';

    if (!visibleProducts.length) {
      elements.productGrid.innerHTML = `
        <div class="empty-state">
          <strong>لا توجد منتجات مطابقة</strong>
          <p>جرّب كلمة بحث أخرى أو غيّر القسم الحالي.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleProducts.forEach((product, index) => {
      fragment.appendChild(buildProductCard(product, index));
    });
    elements.productGrid.appendChild(fragment);
    elements.productGrid.querySelectorAll('[data-product-card-image]').forEach((image) => {
      if (image.complete) {
        markProductImageReady(image);
      }
    });
  }

  function buildProductCard(product, index) {
    const card = document.createElement('article');
    const tone = getTone(product.tone ?? index);
    const wishlistActive = state.wishlist.includes(product.id);
    const badge = smartBadge(product);
    const discount = calculateDiscount(product);
    const priceOptions = normalizePriceOptions(product.priceOptions);
    const price = formatProductCardPrice(product);
    const oldPrice = !priceOptions.length && product.compareAtPrice > product.price ? formatMoney(product.compareAtPrice) : '';
    const gallery = getProductGallery(product);
    const primaryImage = gallery[0] || product.image;
    const rating = product.rating > 0 ? `${formatDecimal(product.rating, 1)}/5` : '';
    const pageUrl = buildProductPageUrl(product.id);
    const imagePriority = document.body?.dataset.page === 'category' ? index < 12 : index < 8;
    const imageLoading = imagePriority ? 'eager' : 'lazy';
    const fetchPriority = imagePriority ? 'high' : 'auto';

    card.className = `product-card${wishlistActive ? ' wishlisted' : ''}`;
    card.style.setProperty('--card-index', index);
    card.style.setProperty('--tone-from', tone.from);
    card.style.setProperty('--tone-to', tone.to);
    card.style.setProperty('--tone-glow', tone.glow);
    card.dataset.productId = product.id;
    card.dataset.galleryIndex = '0';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `فتح صفحة ${product.name}`);
    card.innerHTML = `
      <div class="product-media is-loading">
        <button type="button" class="wishlist-toggle${wishlistActive ? ' active' : ''}" data-action="toggle-wishlist" aria-label="${wishlistActive ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}" aria-pressed="${wishlistActive ? 'true' : 'false'}">
          <span aria-hidden="true">${wishlistActive ? '♥' : '♡'}</span>
        </button>
        <span class="product-badge ${escapeHtml(badge.className)}">${escapeHtml(badge.label)}</span>
        <a class="product-image-preview-trigger" href="${escapeHtml(pageUrl)}" data-action="view-details" aria-label="فتح صفحة ${escapeHtml(product.name)}"></a>
        <img class="product-image primary" data-product-card-image src="${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" loading="${imageLoading}" decoding="async" fetchpriority="${fetchPriority}" />
        ${buildProductCardGalleryControls(gallery)}
      </div>
      <div class="product-meta">
        <div class="product-meta-top">
          <div>
            <p class="product-category">${escapeHtml(product.category)}</p>
            <h3>${escapeHtml(product.name)}</h3>
          </div>
        </div>
        <p class="product-note">${escapeHtml(product.note)}</p>
        ${rating ? `
          <div class="product-rating">
            <span class="product-stars">&#1578;&#1602;&#1610;&#1610;&#1605; &#1575;&#1604;&#1593;&#1605;&#1604;&#1575;&#1569;</span>
            <strong>${escapeHtml(rating)}</strong>
            <small>${formatCount(product.reviewCount)} مراجعة</small>
          </div>
        ` : ''}
        <div class="price-stack">
          <strong class="product-price">${escapeHtml(price)}</strong>
          ${oldPrice ? `<del class="product-old-price">${escapeHtml(oldPrice)}</del>` : ''}
          ${!priceOptions.length && discount ? `<span class="discount-pill">خصم ${escapeHtml(formatCount(discount))}%</span>` : ''}
        </div>
        ${buildProductCardOptions(product)}
        <div class="product-actions">
          <button type="button" class="primary-btn" data-action="add-to-cart">إضافة سريعة</button>
          <a class="secondary-btn" href="${escapeHtml(pageUrl)}" data-action="view-details">صفحة المنتج</a>
        </div>
      </div>
    `;
    return card;
  }

  function renderCart() {
    if (!elements.cartList) {
      return;
    }

    syncCartWithInventory();
    updateTotals();
    enhanceCheckoutButton();

    if (!state.cart.length) {
      elements.cartList.innerHTML = `
        <div class="empty-state compact">
          <strong>السلة فارغة الآن</strong>
          <p>أضف منتجات من الكتالوج ثم أكمل الطلب من هنا.</p>
        </div>
      `;
      updateCartCounter();
      return;
    }

    const fragment = document.createDocumentFragment();
    state.cart.forEach((item) => {
      const line = createCartItemElement(item);
      if (!line) {
        return;
      }
      fragment.appendChild(line);
    });

    elements.cartList.innerHTML = '';
    elements.cartList.appendChild(fragment);
    updateCartCounter();
  }

  function ensureCartDrawer() {
    if (elements.cartDrawer) {
      return elements.cartDrawer;
    }

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer-shell';
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <button type="button" class="cart-drawer-backdrop" data-action="close-cart-drawer" aria-label="إغلاق السلة"></button>
      <aside class="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle">
        <div class="cart-drawer-head">
          <div>
            <p class="eyebrow">السلة</p>
            <h2 id="cartDrawerTitle">مراجعة سريعة</h2>
          </div>
          <button type="button" class="icon-btn cart-drawer-close" data-action="close-cart-drawer" aria-label="إغلاق السلة">×</button>
        </div>
        <div class="cart-drawer-meta">
          <span data-cart-drawer-count>0 عنصر</span>
          <small>راجعي الطلب بسرعة قبل الدفع</small>
        </div>
        <div class="cart-drawer-list" data-cart-drawer-list></div>
        <div class="cart-drawer-footer">
          <div class="summary-line total">
            <span>الإجمالي الفرعي</span>
            <strong data-cart-drawer-total>0 ج.م</strong>
          </div>
          <div class="cart-drawer-actions">
            <a class="primary-btn full" href="/cart">متابعة الدفع</a>
            <button type="button" class="secondary-btn full" data-action="close-cart-drawer">متابعة التسوق</button>
          </div>
        </div>
      </aside>
    `;
    drawer.addEventListener('click', handleCartDrawerClick);
    document.body.appendChild(drawer);
    elements.cartDrawer = drawer;
    return drawer;
  }

  function renderCartDrawer() {
    if (!elements.cartDrawer) {
      return;
    }

    syncCartWithInventory();
    const drawer = elements.cartDrawer;
    const list = drawer.querySelector('[data-cart-drawer-list]');
    const countLabel = drawer.querySelector('[data-cart-drawer-count]');
    const totalLabel = drawer.querySelector('[data-cart-drawer-total]');
    const checkoutLink = drawer.querySelector('.cart-drawer-actions .primary-btn');
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cartSubtotal();

    if (countLabel) {
      countLabel.textContent = `${formatCount(count)} ${count === 1 ? 'عنصر' : 'عناصر'}`;
    }
    if (totalLabel) {
      totalLabel.textContent = formatMoney(subtotal);
    }

    if (!list) {
      return;
    }

    const fragment = document.createDocumentFragment();
    state.cart.forEach((item) => {
      const line = createCartItemElement(item, 'drawer-cart-item');
      if (line) {
        fragment.appendChild(line);
      }
    });

    if (!fragment.childNodes.length) {
      list.innerHTML = `
        <div class="empty-state compact">
          <strong>السلة فارغة</strong>
          <p>اختاري منتج، والدرج هيفتح لك مراجعة سريعة هنا.</p>
        </div>
      `;
      checkoutLink?.setAttribute('aria-disabled', 'true');
      checkoutLink?.classList.add('disabled');
      return;
    }

    list.innerHTML = '';
    list.appendChild(fragment);
    checkoutLink?.removeAttribute('aria-disabled');
    checkoutLink?.classList.remove('disabled');
  }

  function openCartDrawer() {
    if (document.body?.dataset.page === 'cart') {
      return;
    }

    const drawer = ensureCartDrawer();
    renderCartDrawer();
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-drawer-open');
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      drawer.querySelector('.cart-drawer-close')?.focus({ preventScroll: true });
    });
  }

  function closeCartDrawer() {
    const drawer = elements.cartDrawer;
    if (!drawer) {
      return;
    }

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-drawer-open');
    window.setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
      }
    }, 220);
  }

  function handleCartDrawerClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action === 'close-cart-drawer') {
      closeCartDrawer();
      return;
    }

    const cartRow = button.closest('[data-cart-id]');
    const cartId = cartRow?.dataset?.cartId;
    if (!cartId) {
      return;
    }

    if (action === 'qty-increase') {
      changeCartQty(cartId, 1);
      return;
    }

    if (action === 'qty-decrease') {
      changeCartQty(cartId, -1);
      return;
    }

    if (action === 'cart-remove') {
      removeCartItem(cartId);
    }
  }

  function renderNotifications() {
    if (!elements.notifications) {
      return;
    }

    if (!state.notifications.length) {
      elements.notifications.innerHTML = `
        <div class="empty-state compact">
          <strong>لا توجد تنبيهات بعد</strong>
          <p>عند وصول طلب أو تعديل منتج ستظهر التنبيهات هنا.</p>
        </div>
      `;
      return;
    }

    elements.notifications.innerHTML = state.notifications
      .slice(0, 10)
      .map((item) => `
        <article class="notification-item compact ${escapeHtml(item.type)}">
          <div class="notification-top">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.message)}</p>
            </div>
            <small>${escapeHtml(formatDateTime(item.createdAt))}</small>
          </div>
          <span class="notification-kind">${escapeHtml(item.type)}</span>
        </article>
      `)
      .join('');
  }

  function ensureClearNotificationsButton() {
    if (!elements.notifications || elements.clearNotificationsButton) {
      return;
    }

    const panel = elements.notifications.closest('.admin-panel');
    const header = panel?.querySelector('.panel-header');
    if (!header) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'clearNotificationsButton';
    button.type = 'button';
    button.className = 'secondary-btn danger-btn small';
    button.textContent = 'مسح التنبيهات';
    button.addEventListener('click', clearNotifications);
    header.appendChild(button);
    elements.clearNotificationsButton = button;
  }

  function clearNotifications() {
    writeClearMarker('notifications');
    state.notifications = [];
    clearStoredCollection('notifications');
    renderNotifications();
    renderSummary();
    showToast('تم مسح التنبيهات', 'تم تفريغ قائمة التنبيهات بنجاح.', 'success');
  }

  function renderRequestedProducts() {
    if (!elements.requestedProducts) {
      return;
    }

    if (!state.products.length) {
      elements.requestedProducts.innerHTML = `
        <div class="empty-state compact">
          <strong>لا توجد منتجات حتى الآن</strong>
          <p>أضف أول منتج من النموذج الموجود في اللوحة.</p>
        </div>
      `;
      return;
    }

    elements.requestedProducts.innerHTML = state.products
      .map((product) => {
        const gallery = getProductGallery(product);
        const preview = gallery[0] || product.image || '';
        const discount = calculateDiscount(product);
        const status = availabilityLabel(product.stock);
        return `
          <article class="requested-card" data-product-id="${escapeHtml(product.id)}">
            <div class="requested-head">
              <img class="requested-thumb" src="${escapeHtml(preview)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" />
              <div>
                <span>${escapeHtml(product.badge)}</span>
                <strong>${escapeHtml(product.name)}</strong>
                <small>${escapeHtml(product.category)} • ${escapeHtml(product.note)}</small>
                ${product.featured ? '<small class="featured-admin-mark">مميز في الرئيسية</small>' : ''}
              </div>
              <strong>${escapeHtml(formatProductCardPrice(product))}</strong>
            </div>
            <div class="requested-metrics">
              <span><b>${escapeHtml(formatCount(product.stock))}</b> المخزون</span>
              <span><b>${escapeHtml(status)}</b></span>
              <span><b>${escapeHtml(formatCount(gallery.length))}</b> صور</span>
              ${discount ? `<span><b>${escapeHtml(formatCount(discount))}%</b> خصم</span>` : ''}
            </div>
            <div class="order-actions">
              <button type="button" class="action-btn" data-action="edit-product">تعديل</button>
              <button type="button" class="action-btn" data-action="delete-product">حذف</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function orderActiveStep(status) {
    return statusMeta[status]?.step ?? -1;
  }

  function renderOrders() {
    if (!elements.ordersList) {
      return;
    }

    const query = normalizeText(state.filters.orderQuery).toLowerCase();
    const statusFilter = state.filters.orderStatus;
    const filteredOrders = state.orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const searchable = [
        order.id,
        order.customer,
        order.phone,
        order.city,
        order.governorate,
        order.area,
        order.payment,
        order.address,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      return matchesStatus && matchesQuery;
    });

    if (!filteredOrders.length) {
      elements.ordersList.innerHTML = `
        <div class="empty-state compact">
          <strong>لا توجد طلبات مطابقة</strong>
          <p>جرّب رقم طلب آخر أو غيّر فلتر الحالة.</p>
        </div>
      `;
      return;
    }

    elements.ordersList.innerHTML = filteredOrders.map((order) => {
      const meta = statusMeta[order.status] || statusMeta.pending;
      const progress = statusOrder.slice(0, 4).map((status) => {
        const stepIndex = statusMeta[status].step;
        const active = order.status === 'cancelled' ? false : stepIndex <= orderActiveStep(order.status);
        return `<span class="progress-step${active ? ' active' : ''}">${escapeHtml(statusMeta[status].label)}</span>`;
      }).join('');

      const items = order.items.map((item) => {
        const variant = getProductVariantLabel(item.color, item.size, item.option);
        return `
          <div class="order-item-row">
            <span>${escapeHtml(item.name)}${variant !== 'بدون خيارات' ? ` • ${escapeHtml(variant)}` : ''}</span>
            <strong>${escapeHtml(formatCount(item.qty))} x ${escapeHtml(formatMoney(item.price))}</strong>
          </div>
        `;
      }).join('');

      const actionButtons = statusOrder.map((status) => `
        <button
          type="button"
          class="action-btn${order.status === status ? ' active' : ''}"
          data-action="set-order-status"
          data-status="${escapeHtml(status)}"
        >
          ${escapeHtml(statusMeta[status].label)}
        </button>
      `).join('');
      const trackingUrl = `/order-tracking?q=${encodeURIComponent(order.id)}`;
      const printUrl = invoiceUrl(order);
      const paymentReview = order.paymentStatus ? `
        <div class="order-note payment-review-note">
          <strong>بيانات الدفع</strong>
          <p>الحالة: ${escapeHtml(paymentStatusLabel(order.paymentStatus))}</p>
          ${order.paymentReference ? `<p>كود الدفع: <b dir="ltr">${escapeHtml(order.paymentReference)}</b></p>` : ''}
          ${order.paymentGateway ? `<p>بوابة الدفع: <b>${escapeHtml(order.paymentGateway)}</b></p>` : ''}
          ${order.paymentGatewayReference ? `<p>مرجع Paymob: <b dir="ltr">${escapeHtml(order.paymentGatewayReference)}</b></p>` : ''}
          ${order.paymentGatewayTransactionId ? `<p>رقم عملية Paymob: <b dir="ltr">${escapeHtml(order.paymentGatewayTransactionId)}</b></p>` : ''}
          ${order.paymentGatewayMessage ? `<p>رسالة Paymob: ${escapeHtml(order.paymentGatewayMessage)}</p>` : ''}
          ${order.paymentPhone ? `<p>رقم التحويل إليه: <b dir="ltr">${escapeHtml(order.paymentPhone)}</b></p>` : ''}
          ${order.paymentSenderPhone ? `<p>رقم العميل المحول منه: <b dir="ltr">${escapeHtml(order.paymentSenderPhone)}</b></p>` : ''}
          ${order.paymentTransactionId ? `<p>رقم العملية/آخر 4 أرقام: <b dir="ltr">${escapeHtml(order.paymentTransactionId)}</b></p>` : ''}
        </div>
      ` : '';

      return `
        <article class="order-card" data-order-id="${escapeHtml(order.id)}">
          <div class="order-top">
            <div>
              <span class="status-badge ${escapeHtml(meta.className)}">${escapeHtml(meta.label)}</span>
              <h4>${escapeHtml(order.id)} • ${escapeHtml(order.customer)}</h4>
              <p>${escapeHtml(order.phone)} • ${escapeHtml(order.governorate || order.city || '')}</p>
            </div>
            <div class="order-meta">
              <span>${escapeHtml(order.payment)}</span>
              <span>${escapeHtml(formatDateTime(order.createdAt))}</span>
              <span>${escapeHtml(order.fullAddress || [order.governorate || order.city, order.area, order.address].filter(Boolean).join(' • ') || 'لا يوجد عنوان تفصيلي')}</span>
            </div>
          </div>

          <div class="order-items">${items}</div>

          ${order.note ? `
            <div class="order-note">
              <strong>ملاحظات العميل</strong>
              <p>${escapeHtml(order.note)}</p>
            </div>
          ` : ''}
          ${paymentReview}

          <div class="order-progress">${progress}</div>

          <div class="order-footer">
            <strong class="order-total">${escapeHtml(formatMoney(order.total))}</strong>
            <div class="order-actions">
              <a class="action-btn" href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener">تتبع العميل</a>
              <a class="action-btn" href="${escapeHtml(printUrl)}" target="_blank" rel="noopener">\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629</a>
              ${actionButtons}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderReturnRequests() {
    if (!elements.returnRequestsList) {
      return;
    }

    if (!state.returnRequests.length) {
      elements.returnRequestsList.innerHTML = `
        <div class="empty-state compact">
          <strong>لا توجد طلبات مرتجع بعد</strong>
          <p>أي طلب يضاف من صفحة المرتجع سيظهر هنا مباشرة.</p>
        </div>
      `;
      return;
    }

    elements.returnRequestsList.innerHTML = state.returnRequests.map((request) => {
      const meta = returnRequestStatusMeta[request.status] || returnRequestStatusMeta.pending;
      const items = Array.isArray(request.items) && request.items.length
        ? request.items.map((item) => `
            <div class="order-item-row">
              <span>${escapeHtml(item.name)}</span>
              <strong>${escapeHtml(formatCount(item.qty))} x ${escapeHtml(formatMoney(item.price))}</strong>
            </div>
          `).join('')
        : `<div class="order-item-row"><span>لا توجد عناصر مرتبطة</span><strong>${escapeHtml(formatMoney(request.total || 0))}</strong></div>`;

      const actionButtons = Object.entries(returnRequestStatusMeta).map(([status, metaItem]) => `
        <button
          type="button"
          class="action-btn${request.status === status ? ' active' : ''}"
          data-action="set-return-status"
          data-status="${escapeHtml(status)}"
        >
          ${escapeHtml(metaItem.label)}
        </button>
      `).join('');

      return `
        <article class="order-card return-request-card-admin" data-return-request-id="${escapeHtml(request.id)}">
          <div class="order-top">
            <div>
              <span class="status-badge ${escapeHtml(meta.className)}">${escapeHtml(meta.label)}</span>
              <h4>${escapeHtml(request.id)} • ${escapeHtml(request.customer)}</h4>
              <p>${escapeHtml(request.orderId)} • ${escapeHtml(request.phone || '')}</p>
            </div>
            <div class="order-meta">
              <span>${escapeHtml(request.returnType)}</span>
              <span>${escapeHtml(request.governorate || '')}</span>
              <span>${escapeHtml(request.area || '')}</span>
              <span>${escapeHtml(formatDateTime(request.createdAt))}</span>
            </div>
          </div>

          <div class="order-items">${items}</div>

          <div class="order-note">
            <strong>سبب المرتجع</strong>
            <p>${escapeHtml(request.reason || 'غير محدد')}</p>
            <strong>ملاحظات</strong>
            <p>${escapeHtml(request.notes || 'لا توجد ملاحظات إضافية.')}</p>
          </div>

          <div class="order-footer">
            <strong class="order-total">${escapeHtml(formatMoney(request.total || 0))}</strong>
            <div class="order-actions">${actionButtons}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderSummary() {
    updateSummary();
    updateCartCounter();
    renderCartDrawer();
  }

  function addToCart(product, qty = 1, variant = {}, options = {}) {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      showToast('المخزون غير متاح', 'هذا المنتج نفد حالياً.', 'warning');
      return;
    }

    const priceOptions = normalizePriceOptions(product.priceOptions);
    if (priceOptions.length > 1 && !normalizeText(variant.option)) {
      showToast('اختار النوع أولًا', 'افتح صفحة المنتج واختار نحاس أو استانلس قبل الإضافة للسلة.', 'warning');
      if (options.openProductPage !== false) {
        window.location.href = buildProductPageUrl(product.id);
      }
      return;
    }

    const selectedColor = normalizeText(variant.color || product.colors[0] || '');
    const selectedSize = normalizeText(variant.size || product.sizes[0] || '');
    const selectedOption = normalizeText(variant.option || '');
    const selectedPrice = Math.max(0, toNumber(variant.price, 0));
    const lineId = getCartLineId(product.id, selectedColor, selectedSize, selectedOption);
    const existing = state.cart.find((item) => item.id === lineId);
    const nextQty = Math.min(product.stock, (existing?.qty || 0) + qty);

    if (existing) {
      existing.qty = nextQty;
    } else {
      state.cart.push({
        id: lineId,
        productId: product.id,
        qty: nextQty,
        color: selectedColor,
        size: selectedSize,
        option: selectedOption,
        price: selectedPrice,
      });
    }

    saveCart();
    renderCart();
    renderSummary();
    hideOrderSuccess();
    animateAddToCart(options.sourceElement);
    showToast('تمت الإضافة', `${product.name} الآن داخل السلة.`, 'success');
  }

  function toggleWishlist(productId) {
    const product = getProduct(productId);
    if (!product) {
      return;
    }

    const index = state.wishlist.indexOf(productId);
    const wasInWishlist = index !== -1;
    if (wasInWishlist) {
      state.wishlist.splice(index, 1);
    } else {
      state.wishlist.unshift(productId);
    }

    state.wishlist = dedupeList(state.wishlist);
    saveWishlist();
    updateWishlistToggle();
    renderProducts();
    renderSummary();

    showToast(
      wasInWishlist ? 'تمت الإزالة من المفضلة' : 'أضيف إلى المفضلة',
      product.name,
      'success',
    );
  }

  function changeCartQty(cartId, delta) {
    const item = state.cart.find((entry) => entry.id === cartId);
    if (!item) {
      return;
    }

    const product = getProduct(item.productId);
    if (!product) {
      state.cart = state.cart.filter((entry) => entry.id !== cartId);
      saveCart();
      renderCart();
      return;
    }

    const nextQty = Math.min(product.stock, item.qty + delta);
    if (nextQty <= 0) {
      state.cart = state.cart.filter((entry) => entry.id !== cartId);
    } else {
      item.qty = nextQty;
    }

    saveCart();
    renderCart();
    renderSummary();
  }

  function removeCartItem(cartId) {
    state.cart = state.cart.filter((entry) => entry.id !== cartId);
    saveCart();
    renderCart();
    renderSummary();
  }

  function clearCart() {
    if (!state.cart.length) {
      showToast('السلة فارغة', 'لا توجد عناصر لإفراغها.', 'warning');
      return;
    }

    state.cart = [];
    saveCart();
    renderCart();
    renderSummary();
    showToast('تم تفريغ السلة', 'أصبحت السلة فارغة الآن.', 'success');
  }

  function selectCategory(category) {
    state.filters.category = canonicalCategory(category, 'all');
    state.filters.showcaseOnly = false;
    renderCategoryButtons();
    renderProducts();
  }

  function openCategoryProducts(category) {
    selectCategory(category || 'all');
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateMobileBottomNavState();
  }

  function renderAll() {
    setTheme(state.theme);
    setDashboardVisible(state.adminUnlocked);
    updateAdminPanelVisibility();
    updateWishlistToggle();
    renderCategoryButtons();
    renderProducts();
    renderCart();
    renderNotifications();
    renderSummary();
    if (state.adminUnlocked) {
      renderDashboard();
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();

    if (!state.cart.length) {
      showToast('السلة فارغة', 'أضف منتجات أولًا قبل إكمال الطلب.', 'warning');
      return;
    }

    const customer = normalizeText(elements.customerName?.value);
    const phone = normalizeText(elements.customerPhone?.value);
    const address = normalizeText(elements.customerAddress?.value);
    const governorate = normalizeText(elements.customerGovernorate?.value);
    const area = normalizeText(elements.customerArea?.value);
    lockPaymentMethodToCash();
    const payment = cashOnDeliveryPayment();
    const gatewayPayment = isGatewayPayment(payment);
    const vodafonePayment = isVodafoneCashPayment(payment);
    const enteredPaymentReference = normalizeText(elements.paymentReferenceInput?.value);
    const paymentSenderPhone = normalizeText(elements.paymentSenderPhone?.value);
    const paymentTransactionId = normalizeText(elements.paymentTransactionId?.value);
    const note = normalizeText(elements.orderNote?.value);

    if (!customer || !phone || !address || !governorate || !area) {
      showToast('بيانات ناقصة', 'أكمل الاسم والهاتف والمحافظة والمنطقة والعنوان.', 'warning');
      return;
    }

    if (vodafonePayment && (!paymentSenderPhone || !paymentTransactionId)) {
      showToast('بيانات الدفع ناقصة', 'اكتب رقم المحفظة اللي حولت منها ورقم عملية التحويل.', 'warning');
      return;
    }

    const { orderId, invoiceId } = createOrderIdentity();
    const paymentReference = (gatewayPayment || vodafonePayment)
      ? (enteredPaymentReference || createPaymentReference(orderId))
      : '';
    const items = state.cart.map((item) => {
      const product = getProduct(item.productId);
      const price = cartLinePrice(item);
      return {
        productId: item.productId,
        name: product?.name || 'منتج محذوف',
        qty: item.qty,
        price,
        color: item.color,
        size: item.size,
        option: item.option,
        image: product ? imageSource(product) : '',
      };
    }).filter((item) => item.qty > 0);

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shipping = getShipping(subtotal, governorate);
    const total = subtotal + shipping;
    const fullAddress = [governorate, area, address].filter(Boolean).join(' • ');

    const order = normalizeOrder({
      id: orderId,
      invoiceId,
      customer,
      phone,
      address,
      city: governorate,
      governorate,
      area,
      fullAddress,
      payment,
      paymentStatus: gatewayPayment ? 'pending_gateway' : (vodafonePayment ? 'pending_review' : (payment === 'عند الاستلام' ? 'cash_on_delivery' : 'not_required')),
      paymentReference,
      paymentPhone: vodafonePayment ? vodafoneCashNumber : '',
      paymentSenderPhone,
      paymentTransactionId,
      paymentGateway: gatewayPayment ? 'paymob' : '',
      note,
      items,
      subtotal,
      shipping,
      total,
      status: 'pending',
      deliveryToken: createDeliveryToken(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracking: [
        {
          status: 'pending',
          label: statusMeta.pending.label,
          at: new Date().toISOString(),
        },
      ],
      inventoryState: 'reserved',
    });

    let paymentCheckoutUrl = '';
    const submitButton = event.submitter || elements.checkoutForm?.querySelector('button[type="submit"]');
    const submitButtonText = submitButton?.textContent.trim() || 'إتمام الطلب';
    if (submitButton) {
      submitButton.disabled = true;
      setAnimatedFlowButtonLabel(submitButton, gatewayPayment ? 'جاري فتح بوابة الدفع...' : 'جاري حفظ الطلب...');
    }

    if (gatewayPayment) {
      try {
        const paymentResponse = await fetch('/api/payment-intention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order }),
        });
        const paymentPayload = await paymentResponse.json().catch(() => ({}));
        if (!paymentResponse.ok || !paymentPayload.checkoutUrl) {
          throw new Error(paymentPayload.message || 'payment gateway unavailable');
        }
        paymentCheckoutUrl = paymentPayload.checkoutUrl;
        if (paymentPayload.order?.paymentGatewayReference) {
          order.paymentGatewayReference = paymentPayload.order.paymentGatewayReference;
        }
      } catch (error) {
        showToast('تعذر فتح بوابة الدفع', 'راجع إعدادات Paymob أو جرّب مرة أخرى بعد لحظات.', 'error');
        if (submitButton) {
          submitButton.disabled = false;
          setAnimatedFlowButtonLabel(submitButton, submitButtonText);
        }
        return;
      }
    } else {
      try {
        const savedOrder = await persistSingleOrderToDatabase(order);
        Object.assign(order, savedOrder);
      } catch (error) {
        showToast('تعذر حفظ الطلب', 'راجع الاتصال ثم حاول مرة أخرى. لم يتم تسجيل الطلب.', 'error');
        if (submitButton) {
          submitButton.disabled = false;
          setAnimatedFlowButtonLabel(submitButton, submitButtonText);
        }
        return;
      }
    }

    const previousStocks = new Map(state.products.map((product) => [product.id, product.stock]));

    state.products = state.products.map((product) => {
      const orderedLine = items.find((item) => item.productId === product.id);
      if (!orderedLine) {
        return product;
      }

      const nextStock = Math.max(0, product.stock - orderedLine.qty);
      return {
        ...product,
        stock: nextStock,
      };
    });

    state.orders.unshift(order);
    state.cart = [];

    saveStorage(storageKeys.products, state.products);
    state.productsDirty = false;
    saveStorage(storageKeys.orders, state.orders);
    saveCart();

    if (state.wishlist.length) {
      state.wishlist = state.wishlist.filter((productId) => Boolean(getProduct(productId)));
      saveWishlist();
    }

    syncCartWithInventory();
    renderAll();
    renderDashboard();

    if (elements.checkoutForm) {
      elements.checkoutForm.reset();
      if (elements.paymentMethod) {
        elements.paymentMethod.value = '\u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645';
      }
      populateGovernorateSelect();
    }

    showToast('\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628', `${order.id} \u062f\u062e\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0646\u062c\u0627\u062d.`, 'success');
    showOrderSuccess(order);
    addNotification('order', '\u0637\u0644\u0628 \u062c\u062f\u064a\u062f', `\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 ${order.id} \u0645\u0646 ${customer}.`);
    if (paymentCheckoutUrl) {
      await notifyTelegramOrder(order);
      showToast('تحويل آمن للدفع', 'سيتم فتح صفحة Paymob الآن لإتمام الدفع.', 'info');
      window.location.assign(paymentCheckoutUrl);
      return;
    }

    notifyTelegramOrder(order);

    state.products.forEach((product) => {
      const previousStock = previousStocks.get(product.id) ?? product.stock;
      if (previousStock > 3 && product.stock <= 3 && product.stock > 0) {
        addNotification('inventory', '\u0646\u0641\u0627\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646', `${product.name} \u0646\u0641\u062f \u0645\u0646 \u0627\u0644\u0645\u062a\u062c\u0631.`);
      }
      if (previousStock > 0 && product.stock === 0) {
        addNotification('inventory', 'نفاد المخزون', `${product.name} نفد من المتجر.`);
      }
    });
  }

  function setOrderStatus(orderId, status) {
    if (!statusMeta[status]) {
      return;
    }

    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.status === status) {
      return;
    }

    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.tracking = Array.isArray(order.tracking) ? order.tracking : [];
    order.tracking.unshift({
      status,
      label: statusMeta[status].label,
      at: order.updatedAt,
    });

    if (previousStatus === 'cancelled' && order.inventoryState === 'restored') {
      order.items.forEach((line) => {
        const product = getProduct(line.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - line.qty);
        }
      });
      order.inventoryState = 'reserved';
      saveStorage(storageKeys.products, state.products);
      state.productsDirty = false;
    } else if (status === 'cancelled' && order.inventoryState === 'reserved') {
      order.items.forEach((line) => {
        const product = getProduct(line.productId);
        if (product) {
          product.stock += line.qty;
        }
      });
      order.inventoryState = 'restored';
      saveStorage(storageKeys.products, state.products);
      state.productsDirty = false;
    }

    saveStorage(storageKeys.orders, state.orders);
    persistOrderUpdateToDatabase(order).then(() => {
      syncProductsFromDatabase();
    }).catch(() => {
      showToast('تعذر حفظ تحديث الطلب', 'راجع الاتصال ثم حاول مرة أخرى.', 'error');
      syncOrdersFromDatabase();
      syncProductsFromDatabase();
    });
    renderAll();
    renderDashboard();
    addNotification('order', 'تحديث حالة الطلب', `الطلب ${order.id} أصبح الآن ${statusMeta[status].label}.`);
    showToast('تم تحديث الطلب', `${order.id} - ${statusMeta[status].label}`, 'success');
  }

  function setReturnRequestStatus(requestId, status) {
    if (!returnRequestStatusMeta[status]) {
      return;
    }

    const request = state.returnRequests.find((item) => item.id === requestId);
    if (!request || request.status === status) {
      return;
    }

    request.status = status;
    request.updatedAt = new Date().toISOString();
    saveReturnRequests();
    renderAll();
    renderDashboard();
    addNotification('system', 'تحديث مرتجع', `الطلب ${request.id} أصبح الآن ${returnRequestStatusMeta[status].label}.`);
    showToast('تم تحديث المرتجع', `${request.id} - ${returnRequestStatusMeta[status].label}`, 'success');
  }

  function fillProductForm(product) {
    if (!elements.productForm || !product) {
      return;
    }

    state.editingProductId = product.id;
    renderProductCategoryOptions(product.category);
    if (elements.productId) elements.productId.value = product.id;
    if (elements.productName) elements.productName.value = product.name;
    if (elements.productCategory) elements.productCategory.value = product.category;
    if (elements.productBadge) elements.productBadge.value = product.badge;
    if (elements.productFeatured) elements.productFeatured.checked = Boolean(product.featured);
    if (elements.productNote) elements.productNote.value = product.note;
    if (elements.productColors) elements.productColors.value = product.colors.join(', ');
    if (elements.productModelNames) elements.productModelNames.value = normalizeProductModels(product.models, product.gallery).map((model) => model.name).join('\n');
    renderPriceOptionRows(product.priceOptions);
    if (elements.productPrice) elements.productPrice.value = String(product.price);
    if (elements.productStock) elements.productStock.value = String(product.stock);
    if (elements.productSubmitButton) elements.productSubmitButton.textContent = 'تحديث المنتج';
    if (elements.productResetButton) elements.productResetButton.textContent = 'إلغاء التعديل';
    elements.productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('وضع التعديل', `${product.name} جاهز للتعديل.`, 'success');
  }

  function resetProductForm() {
    state.editingProductId = null;
    if (elements.productForm) {
      elements.productForm.reset();
    }
    if (elements.productId) elements.productId.value = '';
    if (elements.productFeatured) elements.productFeatured.checked = false;
    if (elements.productModelNames) elements.productModelNames.value = '';
    renderPriceOptionRows([]);
    renderProductCategoryOptions(defaultAdminCategories[0]);
    window.setTimeout(() => {
      if (elements.productCategory) elements.productCategory.value = defaultAdminCategories[0];
    }, 0);
    if (elements.productCategory) elements.productCategory.value = 'حلقان';
    if (elements.productSubmitButton) elements.productSubmitButton.textContent = 'إضافة المنتج';
    if (elements.productResetButton) elements.productResetButton.textContent = 'مسح الحقول';
  }

  async function gatherProductImages(existingProduct = null) {
    const frontFile = elements.productFrontImage?.files?.[0] || null;
    const backFile = elements.productBackImage?.files?.[0] || null;
    const sideFile = elements.productSideImage?.files?.[0] || null;
    const modelFiles = Array.from(elements.productModelImages?.files || []);
    const selectedFiles = [frontFile, backFile, sideFile, ...modelFiles].filter(Boolean);
    let processedFiles = 0;

    const updateImageSaveStatus = () => {
      if (!elements.productSubmitButton || !selectedFiles.length) {
        return;
      }

      elements.productSubmitButton.textContent = `جاري ضغط ورفع الصور ${formatCount(processedFiles)} / ${formatCount(selectedFiles.length)}...`;
    };

    const uploadOne = async (file) => {
      if (!file) {
        return '';
      }

      processedFiles += 1;
      updateImageSaveStatus();
      const compressedImage = await compressImageFile(file);
      return uploadProductImage(compressedImage);
    };

    updateImageSaveStatus();
    const front = await uploadOne(frontFile);
    const back = await uploadOne(backFile);
    const side = await uploadOne(sideFile);
    const modelImages = [];
    for (const file of modelFiles) {
      const uploaded = await uploadOne(file);
      if (uploaded) modelImages.push(uploaded);
    }

    const fallbackGallery = existingProduct ? getProductGallery(existingProduct) : [];
    const image = front || fallbackGallery[0] || '';
    const hoverImage = back || fallbackGallery[1] || image;
    const sideImage = side || fallbackGallery[2] || '';

    return { image, hoverImage, sideImage, modelImages };
  }

  function productHasImages(product) {
    return Boolean(product?.image || product?.hoverImage || product?.sideImage || (Array.isArray(product?.gallery) && product.gallery.length));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    const submitButton = elements.productSubmitButton;
    const previousSubmitText = submitButton?.textContent || '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '\u062c\u0627\u0631\u064a \u062d\u0641\u0638 \u0627\u0644\u0645\u0646\u062a\u062c...';
    }

    try {
      await saveProductFromForm();
    } catch (error) {
      console.error('product-submit-failed', error);
      const message = error?.message === 'image-compression-failed'
        ? 'في صورة تالفة أو ضخمة جدًا لم نقدر نضغطها. جرّب صورة JPG/PNG واضحة أو التقط Screenshot للصورة وأعد رفعها.'
        : 'حاول بصورة أصغر أو أعد المحاولة بعد ثواني.';
      showToast('\u062a\u0639\u0630\u0631 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c', message, 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousSubmitText || (state.editingProductId ? '\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0646\u062a\u062c' : '\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c');
      }
    }
  }

  async function saveProductFromForm() {
    const name = normalizeText(elements.productName?.value);
    const category = canonicalCategory(elements.productCategory?.value, 'حلقان');
    const badge = normalizeText(elements.productBadge?.value, 'مميز');
    const featured = Boolean(elements.productFeatured?.checked);
    const note = normalizeText(elements.productNote?.value, '');
    const colors = parseDelimitedList(elements.productColors?.value);
    const modelNames = parseDelimitedList(elements.productModelNames?.value);
    const priceOptions = collectPriceOptions();
    const optionPrices = priceOptions.map((option) => option.price).filter((priceValue) => priceValue > 0);
    const price = Math.max(0, toNumber(elements.productPrice?.value, 0)) || (optionPrices.length ? Math.min(...optionPrices) : 0);
    const stockInput = Math.floor(toNumber(elements.productStock?.value, 0));
    const stock = stockInput > 0 ? stockInput : 999;

    if (!name || !category || price <= 0) {
      showToast('بيانات ناقصة', 'أدخل الاسم والفئة، ثم السعر الأساسي أو اختيارات السعر مثل نحاس واستانلس.', 'warning');
      return;
    }

    const existingProduct = state.products.find((product) => product.id === state.editingProductId) || null;
    const uploadedImages = await gatherProductImages(existingProduct);

    if (!existingProduct && !uploadedImages.image) {
      showToast('الصورة مطلوبة', 'أضف صورة الواجهة على الأقل.', 'warning');
      return;
    }

    const baseProduct = existingProduct || {
      id: nextProductId(state.products),
      createdAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      colors: [],
      sizes: [],
      tone: state.products.length,
      monogram: name.charAt(0),
    };

    const mergedImages = {
      image: uploadedImages.image || baseProduct.image || '',
      hoverImage: uploadedImages.hoverImage || baseProduct.hoverImage || uploadedImages.image || baseProduct.image || '',
      sideImage: uploadedImages.sideImage || baseProduct.sideImage || '',
    };

    const gallery = dedupeList([
      mergedImages.image,
      mergedImages.hoverImage,
      mergedImages.sideImage,
      ...uploadedImages.modelImages,
      ...(Array.isArray(baseProduct.gallery) ? baseProduct.gallery : []),
    ]);
    const modelSourceImages = uploadedImages.modelImages.length ? uploadedImages.modelImages : gallery;
    const models = modelNames.map((modelName, index) => ({
      id: `model-${index + 1}`,
      name: modelName,
      image: modelSourceImages[index] || modelSourceImages[0] || '',
      gallery: [modelSourceImages[index] || modelSourceImages[0] || ''].filter(Boolean),
    }));
    const nextModels = models.length ? models : normalizeProductModels(baseProduct.models, gallery);

    const nextProduct = normalizeProduct({
      ...baseProduct,
      name,
      category,
      badge,
      featured,
      note,
      details: note || baseProduct.details || 'تفاصيل أنيقة وواضحة للمنتج.',
      price,
      stock,
      priceOptions,
      colors,
      compareAtPrice: Math.round(price * 1.15),
      discount: 15,
      image: mergedImages.image,
      hoverImage: mergedImages.hoverImage,
      sideImage: mergedImages.sideImage,
      gallery,
      models: nextModels,
      createdAt: baseProduct.createdAt,
      tone: baseProduct.tone,
      monogram: baseProduct.monogram || name.charAt(0),
    }, state.products.length);

    if (existingProduct) {
      state.products = state.products.map((product) => (product.id === existingProduct.id ? nextProduct : product));
      addNotification('system', 'تحديث منتج', `تم تحديث المنتج ${nextProduct.name}.`);
    } else {
      state.products.unshift(nextProduct);
      addNotification('system', 'منتج جديد', `تمت إضافة المنتج ${nextProduct.name}.`);
    }

    state.products = state.products.map((product, index) => ({
      ...product,
      tone: index,
    }));

    await saveProducts({ strict: true });
    syncCartWithInventory();
    renderAll();
    renderDashboard();
    resetProductForm();
    showToast(existingProduct ? 'تم التحديث' : 'تمت الإضافة', `${nextProduct.name} أصبح جاهزًا في المتجر.`, 'success');

    if (elements.productForm) {
      elements.productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function deleteProduct(productId) {
    const product = getProduct(productId);
    if (!product) {
      return;
    }

    const confirmed = window.confirm(`هل تريد حذف المنتج "${product.name}"؟`);
    if (!confirmed) {
      return;
    }

    state.products = state.products.filter((item) => item.id !== productId);
    state.cart = state.cart.filter((item) => item.productId !== productId);
    state.wishlist = state.wishlist.filter((item) => item !== productId);

    saveProducts();
    saveCart();
    saveWishlist();
    syncCartWithInventory();
    renderAll();
    renderDashboard();
    addNotification('system', 'حذف منتج', `تم حذف المنتج ${product.name}.`);
    showToast('تم الحذف', product.name, 'warning');
  }

  function handleProductGalleryPointerDown(event) {
    const media = event.target.closest('.product-media');
    const blockingLink = event.target.closest('a') && !event.target.closest('.product-image-preview-trigger');
    if (!media || event.target.closest('button, input, select, textarea') || blockingLink) {
      return;
    }

    const card = media.closest('[data-product-id]');
    const product = card?.dataset?.productId ? getProduct(card.dataset.productId) : null;
    if (!card || !product || getProductGallery(product).length < 2) {
      return;
    }

    productCardSwipe.card = card;
    productCardSwipe.productId = product.id;
    productCardSwipe.startX = event.clientX;
    productCardSwipe.startY = event.clientY;
  }

  function handleProductGalleryPointerUp(event) {
    const card = productCardSwipe.card;
    const product = productCardSwipe.productId ? getProduct(productCardSwipe.productId) : null;
    if (!card || !product) {
      productCardSwipe.card = null;
      productCardSwipe.productId = '';
      return;
    }

    const deltaX = event.clientX - productCardSwipe.startX;
    const deltaY = event.clientY - productCardSwipe.startY;
    productCardSwipe.card = null;
    productCardSwipe.productId = '';

    if (Math.abs(deltaX) < 38 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) {
      return;
    }

    const currentIndex = Number(card.dataset.galleryIndex || 0);
    const direction = deltaX < 0 ? 1 : -1;
    card.dataset.gallerySwiped = 'true';
    setProductCardGalleryImage(card, product, currentIndex + direction);
    window.setTimeout(() => {
      delete card.dataset.gallerySwiped;
    }, 360);
  }

  function handleProductGridClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      const clickableCard = event.target.closest('[data-product-id].product-card');
      const clickableProduct = clickableCard?.dataset?.productId ? getProduct(clickableCard.dataset.productId) : null;
      if (clickableProduct) {
        window.location.href = buildProductPageUrl(clickableProduct.id);
      }
      return;
    }

    if (actionButton.dataset.action === 'view-category') {
      event.preventDefault();
      window.location.href = buildCategoryPageUrl(actionButton.dataset.category || 'all');
      return;
    }

    const card = actionButton.closest('[data-product-id]');
    const productId = card?.dataset?.productId;
    const product = productId ? getProduct(productId) : null;
    const action = actionButton.dataset.action;

    if (!product) {
      return;
    }

    if (card?.dataset.gallerySwiped === 'true') {
      event.preventDefault();
      return;
    }

    if (action === 'card-gallery') {
      event.preventDefault();
      event.stopPropagation();
      const currentIndex = Number(card.dataset.galleryIndex || 0);
      const hasIndex = actionButton.dataset.index !== undefined;
      const nextIndex = hasIndex
        ? Number(actionButton.dataset.index || 0)
        : currentIndex + Number(actionButton.dataset.direction || 0);
      setProductCardGalleryImage(card, product, nextIndex);
      return;
    }

    if (action === 'toggle-wishlist') {
      event.preventDefault();
      toggleWishlist(product.id);
      return;
    }

    if (action === 'add-to-cart') {
      event.preventDefault();
      addToCart(product, 1, getCardSelectedVariant(product, card), {
        sourceElement: card,
        openProductPage: false,
      });
      return;
    }

    if (action === 'view-details') {
      event.preventDefault();
      window.location.href = buildProductPageUrl(product.id);
    }
  }

  function handleCartClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const cartRow = button.closest('[data-cart-id]');
    const cartId = cartRow?.dataset?.cartId;
    const action = button.dataset.action;

    if (!cartId) {
      return;
    }

    if (action === 'qty-increase') {
      changeCartQty(cartId, 1);
      return;
    }

    if (action === 'qty-decrease') {
      changeCartQty(cartId, -1);
      return;
    }

    if (action === 'cart-remove') {
      removeCartItem(cartId);
    }
  }

  function handleProductAdminClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const card = button.closest('[data-product-id]');
    const productId = card?.dataset?.productId;
    const action = button.dataset.action;

    if (!productId) {
      return;
    }

    if (action === 'edit-product') {
      fillProductForm(getProduct(productId));
      return;
    }

    if (action === 'delete-product') {
      deleteProduct(productId);
    }
  }

  function handleOrderActions(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const orderCard = button.closest('[data-order-id]');
    const orderId = orderCard?.dataset?.orderId;
    const action = button.dataset.action;

    if (!orderId) {
      return;
    }

    if (action === 'set-order-status') {
      setOrderStatus(orderId, button.dataset.status || 'pending');
      return;
    }

    if (action === 'print-order') {
      window.open(`/order-tracking?q=${encodeURIComponent(orderId)}`, '_blank', 'noopener');
    }
  }

  function handleReturnRequestActions(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const card = button.closest('[data-return-request-id]');
    const requestId = card?.dataset?.returnRequestId;
    const action = button.dataset.action;

    if (!requestId) {
      return;
    }

    if (action === 'set-return-status') {
      setReturnRequestStatus(requestId, button.dataset.status || 'pending');
    }
  }

  function handleCategoryClick(event) {
    const button = event.target.closest('[data-category]');
    if (!button || button.hidden) {
      return;
    }

    const category = canonicalCategory(button.dataset.category || 'all', 'all');
    if (category === 'all') {
      selectCategory('all');
      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.location.href = buildCategoryPageUrl(category);
  }

  function handleStorageSync() {
    state.products = loadProducts();
    state.customCategories = loadCustomCategories();
    state.cart = loadCart();
    state.wishlist = loadWishlist();
    state.orders = loadOrders();
    state.notifications = loadNotifications();
    state.returnRequests = loadReturnRequests();
    state.theme = loadTheme();
    if (document.body?.dataset.page === 'admin') {
      state.adminUnlocked = loadAdminAccess();
    }
    const filteredWishlist = state.wishlist.filter((productId) => Boolean(getProduct(productId)));
    if (filteredWishlist.length !== state.wishlist.length) {
      state.wishlist = filteredWishlist;
      saveWishlist();
    } else {
      state.wishlist = filteredWishlist;
    }
    syncCartWithInventory();
    renderAll();
    setDashboardVisible(state.adminUnlocked);
    if (document.body?.dataset.page === 'admin' && !state.adminUnlocked) {
      openAdminGate();
    } else if (document.body?.dataset.page === 'admin') {
      closeAdminGate();
    }
  }

  function setupHeaderSearch() {
    if (!elements.productSearch) {
      return;
    }

    const topActions = document.querySelector('.top-actions');
    if (!topActions || elements.productSearch.closest('.topbar-search-field')) {
      return;
    }

    const originalField = elements.productSearch.closest('.search-field');
    const originalTools = elements.productSearch.closest('.catalog-tools');
    const headerSearch = document.createElement('label');
    headerSearch.className = 'topbar-search-field';
    headerSearch.innerHTML = '<span class="sr-only">بحث المنتجات</span>';
    elements.productSearch.placeholder = 'بحث...';
    headerSearch.appendChild(elements.productSearch);

    const insertBefore = elements.searchButton || elements.cartJump || topActions.firstElementChild;
    if (insertBefore) {
      topActions.insertBefore(headerSearch, insertBefore);
    } else {
      topActions.appendChild(headerSearch);
    }

    originalField?.remove();
    if (originalTools && !originalTools.querySelector('input, select, button, textarea')) {
      originalTools.classList.add('catalog-tools-relocated');
    }

    if (elements.searchButton) {
      elements.searchButton.hidden = true;
      elements.searchButton.setAttribute('aria-hidden', 'true');
    }
  }

  function bindEvents() {
    elements.searchButton?.addEventListener('click', () => {
      elements.productSearch?.focus();
    });

    elements.wishlistToggle?.addEventListener('click', toggleWishlistFilter);

    elements.cartJump?.addEventListener('click', (event) => {
      if (document.body?.dataset.page === 'cart') {
        return;
      }
      event.preventDefault();
      openCartDrawer();
    });

    elements.brand?.addEventListener('click', handleBrandShortcut);


    elements.productSearch?.addEventListener('input', (event) => {
      state.filters.query = event.target.value || '';
      renderProducts();
    });



    elements.categoryFilters?.addEventListener('click', handleCategoryClick);
    elements.productGrid?.addEventListener('click', handleProductGridClick);
    elements.productGrid?.addEventListener('load', handleProductCardImageLoad, true);
    elements.productGrid?.addEventListener('error', handleProductCardImageError, true);
    observeProductGridOrientations(elements.productGrid);
    syncMobileMenuActions();
    window.setTimeout(syncMobileMenuActions, 250);
    window.setTimeout(syncMobileMenuActions, 900);
    elements.productGrid?.addEventListener('pointerdown', handleProductGalleryPointerDown);
    elements.productGrid?.addEventListener('pointerup', handleProductGalleryPointerUp);
    elements.productGrid?.addEventListener('pointercancel', () => {
      productCardSwipe.card = null;
      productCardSwipe.productId = '';
    });
    elements.productGrid?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const target = event.target.closest('[data-action]');
        if (target) {
          target.click();
          return;
        }
        const card = event.target.closest('[data-product-id].product-card');
        if (card) {
          event.preventDefault();
          window.location.href = buildProductPageUrl(card.dataset.productId);
        }
      }
    });
    elements.cartList?.addEventListener('click', handleCartClick);
    elements.requestedProducts?.addEventListener('click', handleProductAdminClick);
    elements.ordersList?.addEventListener('click', handleOrderActions);
    elements.returnRequestsList?.addEventListener('click', handleReturnRequestActions);
    elements.clearNotificationsButton?.addEventListener('click', clearNotifications);

    elements.checkoutForm?.addEventListener('submit', handleCheckout);
    elements.paymentMethod?.addEventListener('change', updatePaymentProofFields);
    elements.customerGovernorate?.addEventListener('change', (event) => {
      populateAreaSelect(event.target.value);
    });
    elements.clearCartButton?.addEventListener('click', clearCart);

    elements.productForm?.addEventListener('submit', (event) => {
      handleProductSubmit(event);
    });
    elements.productResetButton?.addEventListener('click', () => {
      resetProductForm();
    });
    elements.addPriceOptionButton?.addEventListener('click', () => {
      addPriceOptionRow();
    });
    elements.addCategoryButton?.addEventListener('click', addCustomCategory);
    elements.newCategoryName?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addCustomCategory();
      }
    });
    elements.productPriceOptions?.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-action="remove-price-option"]');
      if (!removeButton) {
        return;
      }
      removeButton.closest('.price-option-row')?.remove();
      if (!elements.productPriceOptions.querySelector('.price-option-row')) {
        addPriceOptionRow();
      }
    });

    elements.orderSearch?.addEventListener('input', (event) => {
      state.filters.orderQuery = event.target.value || '';
      renderOrders();
    });

    elements.orderStatusFilter?.addEventListener('change', (event) => {
      state.filters.orderStatus = event.target.value || 'all';
      renderOrders();
    });
    elements.clearOrdersButton?.addEventListener('click', clearAllOrders);

    elements.adminUnlockButton?.addEventListener('click', unlockAdmin);

    elements.adminSectionButtons?.forEach?.((button) => {
      button.addEventListener('click', () => {
        setAdminSection(button.dataset.adminSection || 'all');
      });
    });

    elements.adminPassword?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        unlockAdmin();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeCartDrawer();
        closeAdminGate();
        closeProductImagePreview();
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="close-image-preview"]')) {
        closeProductImagePreview();
      }
    });

    window.addEventListener('storage', handleStorageSync);
  }

  function bootstrap() {
    state.products = loadProducts();
    state.cart = loadCart();
    state.wishlist = loadWishlist();
    state.orders = loadOrders();
    state.notifications = loadNotifications();
    state.theme = loadTheme();
    state.adminUnlocked = document.body?.dataset.page === 'admin' ? loadAdminAccess() : false;
    const filteredWishlist = state.wishlist.filter((productId) => Boolean(getProduct(productId)));
    if (filteredWishlist.length !== state.wishlist.length) {
      state.wishlist = filteredWishlist;
      saveWishlist();
    } else {
      state.wishlist = filteredWishlist;
    }

    setupHeaderSearch();
    ensureCategoryManager();
    bindEvents();
    renderProductCategoryOptions();
    renderPriceOptionRows([]);
    ensureClearNotificationsButton();
    populateGovernorateSelect();
    ensureMobileBottomNav();
    ensurePaymentProofFields();
    updatePaymentProofFields();
    applyRouteFilters();
    renderAll();
    setTheme(state.theme);
    setDashboardVisible(state.adminUnlocked);
    if (document.body?.dataset.page === 'admin' && !state.adminUnlocked) {
      openAdminGate();
    } else if (document.body?.dataset.page === 'admin') {
      closeAdminGate();
    }
    setAdminSection(state.filters.adminSection);
    updateWishlistToggle();
    updateMobileBottomNavState();

    if (elements.productSearch) {
      state.filters.query = normalizeText(elements.productSearch.value);
    }

    if (state.adminUnlocked) {
      renderDashboard();
    }

    if (document.body?.dataset.page === 'admin') {
      syncProductsFromDatabase();
      syncOrdersFromDatabase();
    }
  }

  function renderDashboard() {
    renderProductCategoryOptions();
    renderAdminCategoryList();
    renderRequestedProducts();
    renderNotifications();
    renderOrders();
    renderReturnRequests();
    renderSummary();
    updateAdminPanelVisibility();
  }

  window.addEventListener('hashchange', updateMobileBottomNavState);
  window.addEventListener('popstate', updateMobileBottomNavState);

  bootstrap();
})();

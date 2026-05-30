(() => {
  const store = window.veloraStore || {};
  const storageKeys = store.storageKeys || {
    products: 'velora-store-v4-products',
    cart: 'velora-store-v4-cart',
    wishlist: 'velora-store-v4-wishlist',
    orders: 'velora-store-v4-orders',
    notifications: 'velora-store-v4-notifications',
    returnRequests: 'velora-store-v4-return-requests',
    adminAccess: 'velora-admin-access-v4-172005',
    theme: 'velora-store-v4-theme',
  };

  const legacyStorageKeys = store.legacyStorageKeys || {
    products: ['velora-store-v3-products', 'velora-store-v2-products'],
    cart: ['velora-store-v3-cart', 'velora-store-v2-cart'],
    wishlist: ['velora-store-v3-wishlist', 'velora-store-v2-wishlist'],
    orders: ['velora-store-v3-orders', 'velora-store-v2-orders'],
    notifications: ['velora-store-v3-notifications', 'velora-store-v2-notifications'],
    returnRequests: ['velora-store-v3-return-requests', 'velora-store-v2-return-requests'],
    adminAccess: ['velora-admin-access-v3-172005', 'velora-admin-access-v2-172005'],
    theme: ['velora-store-v3-theme', 'velora-store-v2-theme'],
  };

  const adminCredentials = store.adminCredentials || { password: '172005' };
  const defaultProducts = Array.isArray(store.products) ? store.products : [];
  const egyptGovernorates = Array.isArray(store.governorates) && store.governorates.length
    ? store.governorates
    : [
        'القاهرة',
        'الجيزة',
        'الإسكندرية',
        'الدقهلية',
        'الشرقية',
        'الغربية',
        'المنوفية',
        'القليوبية',
        'البحيرة',
        'كفر الشيخ',
        'دمياط',
        'بورسعيد',
        'الإسماعيلية',
        'السويس',
        'شمال سيناء',
        'جنوب سيناء',
        'بني سويف',
        'الفيوم',
        'المنيا',
        'أسيوط',
        'سوهاج',
        'قنا',
        'الأقصر',
        'أسوان',
        'البحر الأحمر',
        'الوادي الجديد',
        'مطروح',
      ];
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
    themeToggle: document.getElementById('themeToggle'),
    cartJump: document.getElementById('cartJump'),
    cartCount: document.getElementById('cartCount'),
    productSearch: document.getElementById('productSearch'),
    catalogTools: document.querySelector('.catalog-tools'),
    categoryFilters: document.getElementById('categoryFilters'),
    productGrid: document.getElementById('productGrid'),
    cartList: document.getElementById('cartList'),
    cartBadge: document.getElementById('cartBadge'),
    subtotalValue: document.getElementById('subtotalValue'),
    shippingValue: document.getElementById('shippingValue'),
    totalValue: document.getElementById('totalValue'),
    checkoutForm: document.getElementById('checkoutForm'),
    customerName: document.getElementById('customerName'),
    customerPhone: document.getElementById('customerPhone'),
    customerAddress: document.getElementById('customerAddress'),
    customerArea: document.getElementById('customerArea'),
    customerGovernorate: document.getElementById('customerGovernorate'),
    paymentMethod: document.getElementById('paymentMethod'),
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
    productBadge: document.getElementById('productBadge'),
    productNote: document.getElementById('productNote'),
    productPrice: document.getElementById('productPrice'),
    productStock: document.getElementById('productStock'),
    productFrontImage: document.getElementById('productFrontImage'),
    productBackImage: document.getElementById('productBackImage'),
    productSideImage: document.getElementById('productSideImage'),
    productSubmitButton: document.getElementById('productSubmitButton'),
    productResetButton: document.getElementById('productResetButton'),
    requestedProducts: document.getElementById('requestedProducts'),
    notifications: document.getElementById('notifications'),
    returnRequestsList: document.getElementById('returnRequestsList'),
    orderSearch: document.getElementById('orderSearch'),
    orderStatusFilter: document.getElementById('orderStatusFilter'),
    ordersList: document.getElementById('ordersList'),
    adminSectionButtons: Array.from(document.querySelectorAll('[data-admin-section]')),
    adminGate: document.getElementById('adminGate'),
    adminPassword: document.getElementById('adminPassword'),
    adminUnlockButton: document.getElementById('adminUnlockButton'),
    adminGateHint: document.getElementById('adminGateHint'),
    toastRegion: document.getElementById('toastRegion'),
  };

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-arab');
  const decimalFormatter = new Intl.NumberFormat('ar-EG-u-nu-arab', {
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
    cancelled: { label: 'ملغي', step: -1, className: 'cancelled' },
  };

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const returnRequestStatusMeta = {
    pending: { label: 'قيد المراجعة', className: 'pending' },
    approved: { label: 'مقبول', className: 'approved' },
    rejected: { label: 'مرفوض', className: 'cancelled' },
    processed: { label: 'جارٍ التنفيذ', className: 'processing' },
  };

  const state = {
    products: [],
    cart: [],
    wishlist: [],
    orders: [],
    notifications: [],
    returnRequests: [],
    theme: 'light',
    filters: {
      query: '',
      category: 'all',
      wishlistOnly: false,
      viewMode: 'featured',
      orderQuery: '',
      orderStatus: 'all',
      adminSection: 'all',
    },
    adminUnlocked: false,
    editingProductId: null,
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

  function loadStoredValueWithFallback(primaryKey, fallbackKeys, fallback) {
    const currentValue = loadStorage(primaryKey, null);
    if (currentValue !== null && currentValue !== undefined) {
      return currentValue;
    }

    for (const key of fallbackKeys || []) {
      const legacyValue = loadStorage(key, null);
      if (legacyValue !== null && legacyValue !== undefined) {
        try {
          localStorage.setItem(primaryKey, JSON.stringify(legacyValue));
        } catch {
          // ignore migration write failures
        }
        return legacyValue;
      }
    }

    return cloneValue(fallback);
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

  function normalizeText(value, fallback = '') {
    const text = String(value ?? '').trim();
    return text || fallback;
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(toNumber(value))))} ج.م`;
  }

  function formatCount(value) {
    return moneyFormatter.format(Math.max(0, Math.floor(toNumber(value))));
  }

  function formatDecimal(value, digits = 1) {
    return new Intl.NumberFormat('ar-EG-u-nu-arab', {
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
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image-load-failed'));
      image.src = src;
    });
  }

  async function compressImageFile(file) {
    const originalUrl = await fileToDataUrl(file);

    try {
      const image = await loadImage(originalUrl);
      const maxSize = 1440;
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        return originalUrl;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.82);
      });

      if (!blob) {
        return originalUrl;
      }

      return await fileToDataUrl(blob);
    } catch {
      return originalUrl;
    }
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
      return 'نفد المخزون';
    }
    if (value <= 3) {
      return 'متاح قليلًا';
    }
    return 'متوفر الآن';
  }

  function availabilityClass(stock) {
    return Math.max(0, toNumber(stock)) <= 3 ? 'low' : '';
  }

  function calculateDiscount(product) {
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
    const primaryImage = gallery[0] || source.image || '';
    const hoverImage = gallery[1] || source.hoverImage || primaryImage;
    const colors = normalizeList(source.colors);
    const sizes = normalizeList(source.sizes);
    const price = Math.max(0, toNumber(source.price, 0));
    const compareAtPrice = Math.max(0, toNumber(source.compareAtPrice, price ? Math.round(price * 1.18) : 0));
    const tone = Number.isFinite(Number(source.tone)) ? Number(source.tone) : index;

    return {
      id: normalizeText(source.id, nextProductId(defaultProducts.concat([source]))),
      name: normalizeText(source.name, 'منتج جديد'),
      category: normalizeText(source.category, 'حلقان'),
      badge: normalizeText(source.badge, 'مميز'),
      note: normalizeText(source.note, 'تفاصيل أنيقة وواضحة للمنتج.'),
      details: normalizeText(source.details, normalizeText(source.note, 'تفاصيل أنيقة وواضحة للمنتج.')),
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
          image: normalizeText(item.image),
        }))
      : [];

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shipping = Math.max(0, toNumber(order?.shipping, subtotal >= 600 ? 0 : 40));
    const total = Math.max(0, toNumber(order?.total, subtotal + shipping));
    const status = Object.prototype.hasOwnProperty.call(statusMeta, order?.status) ? order.status : 'pending';

    return {
      id: normalizeText(order?.id, `VEL-${String(nextOrderNumber(state.orders)).padStart(4, '0')}`),
      invoiceId: normalizeText(order?.invoiceId, `INV-${String(String(order?.id || '').replace(/\D/g, '') || nextOrderNumber(state.orders)).padStart(4, '0')}`),
      customer: normalizeText(order?.customer, 'عميل'),
      phone: normalizeText(order?.phone, ''),
      address: normalizeText(order?.address, ''),
      city: normalizeText(order?.city || order?.governorate, ''),
      governorate: normalizeText(order?.governorate || order?.city, ''),
      area: normalizeText(order?.area, ''),
      fullAddress: normalizeText(order?.fullAddress, [normalizeText(order?.governorate || order?.city, ''), normalizeText(order?.area, ''), normalizeText(order?.address, '')].filter(Boolean).join(' • ')),
      payment: normalizeText(order?.payment, 'عند الاستلام'),
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
    const stored = loadStoredValueWithFallback(storageKeys.products, legacyStorageKeys.products, null);
    const base = Array.isArray(stored) && stored.length ? stored : defaultProducts;
    return base.map((product, index) => normalizeProduct(product, index));
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
    return Array.isArray(stored) ? stored.map(normalizeOrder) : [];
  }

  function loadNotifications() {
    const stored = loadStorage(storageKeys.notifications, []);
    return Array.isArray(stored) ? stored.map(normalizeNotification) : [];
  }

  function loadReturnRequests() {
    const stored = loadStorage(storageKeys.returnRequests, []);
    return Array.isArray(stored) ? stored.map((request, index) => normalizeReturnRequest(request, index)) : [];
  }

  function loadTheme() {
    const stored = loadStorage(storageKeys.theme, '');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function loadAdminAccess() {
    const stored = loadStorage(storageKeys.adminAccess, false);
    return Boolean(stored && stored.accessGranted);
  }

  function saveProducts() {
    return saveStorage(storageKeys.products, state.products);
  }

  function saveCart() {
    return saveStorage(storageKeys.cart, state.cart);
  }

  function saveWishlist() {
    return saveStorage(storageKeys.wishlist, state.wishlist);
  }

  function saveOrders() {
    return saveStorage(storageKeys.orders, state.orders);
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
    return saveStorage(storageKeys.adminAccess, { accessGranted: state.adminUnlocked, updatedAt: new Date().toISOString() });
  }

  function getProduct(productId) {
    return state.products.find((product) => product.id === productId) || null;
  }

  function getCartLineId(productId, color, size) {
    return [productId, color || '-', size || '-'].join('|');
  }

  function getCartItem(productId, color, size) {
    const lineId = getCartLineId(productId, color, size);
    return state.cart.find((item) => item.id === lineId) || null;
  }

  function getDefaultVariant(product) {
    return {
      color: product?.colors?.[0] || '',
      size: product?.sizes?.[0] || '',
    };
  }

  function getProductVariantLabel(color, size) {
    const parts = [];
    if (color) parts.push(color);
    if (size) parts.push(size);
    return parts.join(' • ') || 'بدون خيارات';
  }

  function getOrderSequenceLabel(number) {
    return String(number).padStart(4, '0');
  }

  function buildProductPageUrl(productId) {
    return `/product?id=${encodeURIComponent(productId)}`;
  }

  function populateGovernorateSelect() {
    if (!elements.customerGovernorate || elements.customerGovernorate.dataset.populated === 'true') {
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

  function getShipping(subtotal) {
    return subtotal >= 600 ? 0 : (subtotal > 0 ? 40 : 0);
  }

  function cartLinePrice(item) {
    const product = getProduct(item.productId);
    return product ? product.price : 0;
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.qty * cartLinePrice(item), 0);
  }

  function syncCartWithInventory() {
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
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = state.theme;
    saveTheme();

    if (elements.themeToggle) {
      const icon = elements.themeToggle.querySelector('span');
      const label = elements.themeToggle.querySelector('small');
      if (icon) {
        icon.textContent = state.theme === 'dark' ? '☀' : '☾';
      }
      if (label) {
        label.textContent = state.theme === 'dark' ? 'فاتح' : 'داكن';
      }
      elements.themeToggle.setAttribute('aria-pressed', state.theme === 'dark' ? 'true' : 'false');
    }
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

  function handleBrandShortcut(event) {
    if (!elements.brand) {
      return;
    }

    adminShortcut.clicks += 1;
    window.clearTimeout(adminShortcut.timer);
    adminShortcut.timer = window.setTimeout(() => {
      adminShortcut.clicks = 0;
    }, 900);

    if (adminShortcut.clicks < 3) {
      return;
    }

    adminShortcut.clicks = 0;
    event.preventDefault();
    showToast('فتح لوحة التحكم', 'جارٍ الانتقال إلى لوحة الإدارة.', 'success');
    window.setTimeout(() => {
      window.location.href = '/admin';
    }, 180);
  }

  function openAdminGate() {
    if (!elements.adminGate) {
      return;
    }

    elements.adminGate.hidden = false;
    elements.adminGate.setAttribute('aria-hidden', 'false');
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
    if (elements.adminGateHint) {
      elements.adminGateHint.textContent = '';
    }
  }

  function unlockAdmin() {
    const value = normalizeText(elements.adminPassword?.value);
    if (!value) {
      if (elements.adminGateHint) {
        elements.adminGateHint.textContent = 'اكتب كلمة المرور أولًا.';
      }
      return;
    }

    if (value !== adminCredentials.password) {
      if (elements.adminGateHint) {
        elements.adminGateHint.textContent = 'كلمة المرور غير صحيحة.';
      }
      showToast('تعذر الفتح', 'كلمة المرور غير صحيحة.', 'warning');
      return;
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

    const buttons = Array.from(elements.categoryFilters.querySelectorAll('[data-category]'));
    buttons.forEach((button) => {
      const isActive = button.dataset.category === state.filters.category;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function renderCatalogViewModes() {
    const buttons = Array.from(document.querySelectorAll('[data-view-mode]'));
    if (!buttons.length) {
      return;
    }

    buttons.forEach((button) => {
      const isActive = button.dataset.viewMode === state.filters.viewMode;
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
    const mode = state.filters.viewMode || 'featured';

    if (mode === 'bestsellers') {
      return list.sort((left, right) => {
        const reviewDiff = toNumber(right.reviewCount, 0) - toNumber(left.reviewCount, 0);
        const ratingDiff = toNumber(right.rating, 0) - toNumber(left.rating, 0);
        const discountDiff = toNumber(right.discount, 0) - toNumber(left.discount, 0);
        return reviewDiff || ratingDiff || discountDiff || String(left.name || '').localeCompare(String(right.name || ''), 'ar');
      });
    }

    if (mode === 'new') {
      return list.sort((left, right) => {
        const leftIsNew = String(left.badge || '').includes('جديد') ? 1 : 0;
        const rightIsNew = String(right.badge || '').includes('جديد') ? 1 : 0;
        const newDiff = rightIsNew - leftIsNew;
        const ratingDiff = toNumber(right.rating, 0) - toNumber(left.rating, 0);
        const reviewDiff = toNumber(right.reviewCount, 0) - toNumber(left.reviewCount, 0);
        return newDiff || ratingDiff || reviewDiff || String(left.name || '').localeCompare(String(right.name || ''), 'ar');
      });
    }

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

  function ensureCatalogViewModes() {
    if (!elements.catalogTools || elements.catalogTools.querySelector('#catalogViewModes')) {
      return;
    }

    const controls = document.createElement('div');
    controls.id = 'catalogViewModes';
    controls.className = 'catalog-view-switcher';
    controls.innerHTML = `
      <button type="button" class="filter-chip active" data-view-mode="featured" aria-pressed="true">الأبرز</button>
      <button type="button" class="filter-chip" data-view-mode="bestsellers" aria-pressed="false">الأكثر مبيعًا</button>
      <button type="button" class="filter-chip" data-view-mode="new" aria-pressed="false">الجديدة</button>
    `;
    elements.catalogTools.appendChild(controls);
    renderCatalogViewModes();
  }

  function handleCatalogViewModeClick(event) {
    const button = event.target.closest('[data-view-mode]');
    if (!button) {
      return;
    }

    const viewMode = button.dataset.viewMode || 'featured';
    if (state.filters.viewMode === viewMode) {
      return;
    }

    state.filters.viewMode = viewMode;
    renderProducts();
    renderCatalogViewModes();
  }

  function ensureHomeTrustStrip() {
    if (document.querySelector('.home-trust-strip')) {
      return;
    }

    const homeSection = document.querySelector('#home.hero-spotlight');
    if (!homeSection) {
      return;
    }
    return;

    // trust strip removed

  }

  function ensureMobileBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) {
      return;
    }

    if (!document.body || document.body.dataset.page === 'admin') {
      return;
    }

    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav no-print';
    bottomNav.setAttribute('aria-label', 'التنقل السفلي');
    bottomNav.innerHTML = `
      <a href="/" data-mobile-nav="home">
        <span class="mobile-nav-icon" aria-hidden="true">⌂</span>
        <small>الرئيسية</small>
      </a>
      <a href="/#categories" data-mobile-nav="categories">
        <span class="mobile-nav-icon" aria-hidden="true">▦</span>
        <small>الأقسام</small>
      </a>
      <a href="/#collection" data-mobile-nav="products">
        <span class="mobile-nav-icon" aria-hidden="true">⌕</span>
        <small>المنتجات</small>
      </a>
      <a href="/cart" data-mobile-nav="cart">
        <span class="mobile-nav-icon" aria-hidden="true">🛒</span>
        <small>السلة</small>
      </a>
      <a href="/after-sales" data-mobile-nav="returns">
        <span class="mobile-nav-icon" aria-hidden="true">↺</span>
        <small>المرتجع</small>
      </a>
    `;
    document.body.appendChild(bottomNav);
  }

  function updateMobileBottomNavState() {
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (!bottomNav) {
      return;
    }

    const pathname = window.location.pathname;
    const hash = window.location.hash;

    bottomNav.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      let active = false;

      if (href === '/' && pathname === '/' && !hash) {
        active = true;
      } else if (href === '/#categories' && pathname === '/' && hash === '#categories') {
        active = true;
      } else if (href === '/#collection' && pathname === '/' && hash === '#collection') {
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

    const visibleProducts = filterProducts();
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
  }

  function buildProductCard(product, index) {
    const card = document.createElement('article');
    const tone = getTone(product.tone ?? index);
    const wishlistActive = state.wishlist.includes(product.id);
    const discount = calculateDiscount(product);
    const stockLabel = availabilityLabel(product.stock);
    const stockClass = availabilityClass(product.stock);
    const price = formatMoney(product.price);
    const oldPrice = product.compareAtPrice > product.price ? formatMoney(product.compareAtPrice) : '';
    const gallery = getProductGallery(product);
    const primaryImage = gallery[0] || product.image;
    const hoverImage = gallery[1] || product.hoverImage || primaryImage;
    const rating = product.rating > 0 ? `${formatDecimal(product.rating, 1)}/5` : '';
    const pageUrl = buildProductPageUrl(product.id);

    card.className = `product-card${wishlistActive ? ' wishlisted' : ''}`;
    card.style.setProperty('--tone-from', tone.from);
    card.style.setProperty('--tone-to', tone.to);
    card.style.setProperty('--tone-glow', tone.glow);
    card.dataset.productId = product.id;
    card.innerHTML = `
      <div class="product-media loaded">
        <button type="button" class="wishlist-toggle${wishlistActive ? ' active' : ''}" data-action="toggle-wishlist" aria-label="إضافة إلى المفضلة" aria-pressed="${wishlistActive ? 'true' : 'false'}">
          <span aria-hidden="true">${wishlistActive ? '♥' : '♡'}</span>
        </button>
        <span class="product-badge${String(product.badge).includes('مميز') ? ' hot' : ''}">${escapeHtml(product.badge)}</span>
        <span class="product-status ${stockClass}">${escapeHtml(stockLabel)}</span>
        <img class="product-image primary" src="${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" />
        <img class="product-image hover" src="${escapeHtml(hoverImage)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" />
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
            <span class="product-stars">★★★★★</span>
            <strong>${escapeHtml(rating)}</strong>
            <small>${formatCount(product.reviewCount)} مراجعة</small>
          </div>
        ` : ''}
        <div class="price-stack">
          <strong class="product-price">${escapeHtml(price)}</strong>
          ${oldPrice ? `<del class="product-old-price">${escapeHtml(oldPrice)}</del>` : ''}
          ${discount ? `<span class="discount-pill">خصم ${escapeHtml(formatCount(discount))}%</span>` : ''}
        </div>
        <div class="product-actions">
          <button type="button" class="primary-btn" data-action="add-to-cart">أضف للسلة</button>
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
      const product = getProduct(item.productId);
      if (!product) {
        return;
      }
      const line = document.createElement('article');
      const variant = getProductVariantLabel(item.color, item.size);
      const linePrice = product.price;
      line.className = 'cart-item';
      line.dataset.cartId = item.id;
      line.innerHTML = `
        <div class="cart-item-copy">
          <strong>${escapeHtml(product.name)}</strong>
          <p>${escapeHtml(product.category)} • ${escapeHtml(variant)}</p>
          <small>${escapeHtml(formatMoney(linePrice))} للوحدة</small>
        </div>
        <div class="cart-quantity">
          <button type="button" class="qty-btn" data-action="qty-decrease" aria-label="إنقاص">−</button>
          <strong>${escapeHtml(formatCount(item.qty))}</strong>
          <button type="button" class="qty-btn" data-action="qty-increase" aria-label="زيادة">+</button>
        </div>
        <button type="button" class="remove-link" data-action="cart-remove">حذف</button>
      `;
      fragment.appendChild(line);
    });

    elements.cartList.innerHTML = '';
    elements.cartList.appendChild(fragment);
    updateCartCounter();
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
              </div>
              <strong>${escapeHtml(formatMoney(product.price))}</strong>
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
        const variant = getProductVariantLabel(item.color, item.size);
        return `
          <div class="order-item-row">
            <span>${escapeHtml(item.name)}${variant !== 'بدون خيارات' ? ` • ${escapeHtml(variant)}` : ''}</span>
            <strong>${escapeHtml(formatCount(item.qty))} × ${escapeHtml(formatMoney(item.price))}</strong>
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

          <div class="order-progress">${progress}</div>

          <div class="order-footer">
            <strong class="order-total">${escapeHtml(formatMoney(order.total))}</strong>
            <div class="order-actions">${actionButtons}</div>
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
              <strong>${escapeHtml(formatCount(item.qty))} × ${escapeHtml(formatMoney(item.price))}</strong>
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
  }

  function addToCart(product, qty = 1, variant = {}, options = {}) {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      showToast('المخزون غير متاح', 'هذا المنتج نفد حالياً.', 'warning');
      return;
    }

    const selectedColor = normalizeText(variant.color || product.colors[0] || '');
    const selectedSize = normalizeText(variant.size || product.sizes[0] || '');
    const lineId = getCartLineId(product.id, selectedColor, selectedSize);
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
      });
    }

    saveCart();
    renderCart();
    renderSummary();
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
    state.filters.category = category;
    renderCategoryButtons();
    renderProducts();
  }

  function renderAll() {
    setTheme(state.theme);
    setDashboardVisible(state.adminUnlocked);
    updateAdminPanelVisibility();
    updateWishlistToggle();
    renderCategoryButtons();
    renderCatalogViewModes();
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
    const payment = normalizeText(elements.paymentMethod?.value, 'عند الاستلام');
    const note = normalizeText(elements.orderNote?.value);

    if (!customer || !phone || !address || !governorate || !area) {
      showToast('بيانات ناقصة', 'أكمل الاسم والهاتف والمحافظة والمنطقة والعنوان.', 'warning');
      return;
    }

    const nextNumber = nextOrderNumber(state.orders);
    const orderId = `VEL-${getOrderSequenceLabel(nextNumber)}`;
    const invoiceId = `INV-${getOrderSequenceLabel(nextNumber)}`;
    const items = state.cart.map((item) => {
      const product = getProduct(item.productId);
      const price = product ? product.price : 0;
      return {
        productId: item.productId,
        name: product?.name || 'منتج محذوف',
        qty: item.qty,
        price,
        color: item.color,
        size: item.size,
        image: product ? imageSource(product) : '',
      };
    }).filter((item) => item.qty > 0);

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shipping = getShipping(subtotal);
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
      note,
      items,
      subtotal,
      shipping,
      total,
      status: 'pending',
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

    saveProducts();
    saveOrders();
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
        elements.paymentMethod.value = 'عند الاستلام';
      }
      populateGovernorateSelect();
    }

    showToast('تم استلام الطلب', `${order.id} دخل النظام بنجاح.`, 'success');
    addNotification('order', 'طلب جديد', `تم إنشاء الطلب ${order.id} من ${customer}.`);

    state.products.forEach((product) => {
      const previousStock = previousStocks.get(product.id) ?? product.stock;
      if (previousStock > 3 && product.stock <= 3 && product.stock > 0) {
        addNotification('inventory', 'المخزون منخفض', `${product.name} بقي منه ${product.stock} قطعة فقط.`);
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
      saveProducts();
    } else if (status === 'cancelled' && order.inventoryState === 'reserved') {
      order.items.forEach((line) => {
        const product = getProduct(line.productId);
        if (product) {
          product.stock += line.qty;
        }
      });
      order.inventoryState = 'restored';
      saveProducts();
    }

    saveOrders();
    renderAll();
    renderDashboard();
    addNotification('order', 'تحديث حالة الطلب', `الطلب ${order.id} أصبح الآن ${statusMeta[status].label}.`);
    showToast('تم تحديث الطلب', `${order.id} → ${statusMeta[status].label}`, 'success');
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
    showToast('تم تحديث المرتجع', `${request.id} → ${returnRequestStatusMeta[status].label}`, 'success');
  }

  function fillProductForm(product) {
    if (!elements.productForm || !product) {
      return;
    }

    state.editingProductId = product.id;
    if (elements.productId) elements.productId.value = product.id;
    if (elements.productName) elements.productName.value = product.name;
    if (elements.productCategory) elements.productCategory.value = product.category;
    if (elements.productBadge) elements.productBadge.value = product.badge;
    if (elements.productNote) elements.productNote.value = product.note;
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
    if (elements.productCategory) elements.productCategory.value = 'حلقان';
    if (elements.productSubmitButton) elements.productSubmitButton.textContent = 'إضافة المنتج';
    if (elements.productResetButton) elements.productResetButton.textContent = 'مسح الحقول';
  }

  async function gatherProductImages(existingProduct = null) {
    const frontFile = elements.productFrontImage?.files?.[0] || null;
    const backFile = elements.productBackImage?.files?.[0] || null;
    const sideFile = elements.productSideImage?.files?.[0] || null;

    const [front, back, side] = await Promise.all([
      frontFile ? compressImageFile(frontFile) : Promise.resolve(''),
      backFile ? compressImageFile(backFile) : Promise.resolve(''),
      sideFile ? compressImageFile(sideFile) : Promise.resolve(''),
    ]);

    const fallbackGallery = existingProduct ? getProductGallery(existingProduct) : [];
    const image = front || fallbackGallery[0] || '';
    const hoverImage = back || fallbackGallery[1] || image;
    const sideImage = side || fallbackGallery[2] || '';

    return { image, hoverImage, sideImage };
  }

  function productHasImages(product) {
    return Boolean(product?.image || product?.hoverImage || product?.sideImage || (Array.isArray(product?.gallery) && product.gallery.length));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    const name = normalizeText(elements.productName?.value);
    const category = normalizeText(elements.productCategory?.value, 'حلقان');
    const badge = normalizeText(elements.productBadge?.value, 'مميز');
    const note = normalizeText(elements.productNote?.value, '');
    const price = Math.max(0, toNumber(elements.productPrice?.value, 0));
    const stock = Math.max(0, Math.floor(toNumber(elements.productStock?.value, 0)));

    if (!name || !category || price <= 0) {
      showToast('بيانات ناقصة', 'أدخل الاسم والفئة والسعر بشكل صحيح.', 'warning');
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
      ...(Array.isArray(baseProduct.gallery) ? baseProduct.gallery : []),
    ]);

    const nextProduct = normalizeProduct({
      ...baseProduct,
      name,
      category,
      badge,
      note,
      details: note || baseProduct.details || 'تفاصيل أنيقة وواضحة للمنتج.',
      price,
      stock,
      compareAtPrice: baseProduct.compareAtPrice && baseProduct.compareAtPrice > price ? baseProduct.compareAtPrice : Math.round(price * 1.18),
      discount: calculateDiscount({ price, compareAtPrice: Math.round(price * 1.18) }),
      image: mergedImages.image,
      hoverImage: mergedImages.hoverImage,
      sideImage: mergedImages.sideImage,
      gallery,
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

    saveProducts();
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

  function handleProductGridClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      return;
    }

    const card = actionButton.closest('[data-product-id]');
    const productId = card?.dataset?.productId;
    const product = productId ? getProduct(productId) : null;
    const action = actionButton.dataset.action;

    if (!product) {
      return;
    }

    if (action === 'toggle-wishlist') {
      event.preventDefault();
      toggleWishlist(product.id);
      return;
    }

    if (action === 'add-to-cart') {
      event.preventDefault();
      addToCart(product, 1, getDefaultVariant(product), {
        sourceElement: card,
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
    if (!button) {
      return;
    }

    const category = button.dataset.category || 'all';
    selectCategory(category);
  }

  function handleStorageSync() {
    state.products = loadProducts();
    state.cart = loadCart();
    state.wishlist = loadWishlist();
    state.orders = loadOrders();
    state.notifications = loadNotifications();
    state.returnRequests = loadReturnRequests();
    state.theme = loadTheme();
    state.adminUnlocked = loadAdminAccess();
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
    if (state.adminUnlocked) {
      closeAdminGate();
    }
  }

  function bindEvents() {
    elements.searchButton?.addEventListener('click', () => {
      elements.productSearch?.focus();
    });

    elements.wishlistToggle?.addEventListener('click', toggleWishlistFilter);

    elements.themeToggle?.addEventListener('click', () => {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    elements.brand?.addEventListener('click', handleBrandShortcut);

    elements.productSearch?.addEventListener('input', (event) => {
      state.filters.query = event.target.value || '';
      renderProducts();
    });

    elements.categoryFilters?.addEventListener('click', handleCategoryClick);
    elements.catalogTools?.addEventListener('click', handleCatalogViewModeClick);
    elements.productGrid?.addEventListener('click', handleProductGridClick);
    elements.productGrid?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const target = event.target.closest('[data-action]');
        if (target) {
          target.click();
        }
      }
    });
    elements.cartList?.addEventListener('click', handleCartClick);
    elements.requestedProducts?.addEventListener('click', handleProductAdminClick);
    elements.ordersList?.addEventListener('click', handleOrderActions);
    elements.returnRequestsList?.addEventListener('click', handleReturnRequestActions);

    elements.checkoutForm?.addEventListener('submit', handleCheckout);
    elements.clearCartButton?.addEventListener('click', clearCart);

    elements.productForm?.addEventListener('submit', (event) => {
      handleProductSubmit(event);
    });
    elements.productResetButton?.addEventListener('click', () => {
      resetProductForm();
    });

    elements.orderSearch?.addEventListener('input', (event) => {
      state.filters.orderQuery = event.target.value || '';
      renderOrders();
    });

    elements.orderStatusFilter?.addEventListener('change', (event) => {
      state.filters.orderStatus = event.target.value || 'all';
      renderOrders();
    });

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
        closeAdminGate();
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
    state.adminUnlocked = loadAdminAccess();
    const filteredWishlist = state.wishlist.filter((productId) => Boolean(getProduct(productId)));
    if (filteredWishlist.length !== state.wishlist.length) {
      state.wishlist = filteredWishlist;
      saveWishlist();
    } else {
      state.wishlist = filteredWishlist;
    }

    bindEvents();
    populateGovernorateSelect();
    ensureCatalogViewModes();
    ensureHomeTrustStrip();
    ensureMobileBottomNav();
    renderAll();
    setTheme(state.theme);
    setDashboardVisible(state.adminUnlocked);
    setAdminSection(state.filters.adminSection);
    updateWishlistToggle();
    updateMobileBottomNavState();

    if (elements.productSearch) {
      state.filters.query = normalizeText(elements.productSearch.value);
    }

    if (state.adminUnlocked) {
      renderDashboard();
    }
  }

  function renderDashboard() {
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

(() => {
  const store = window.veloraStore || {};
  const storageKeys = store.storageKeys || {
    products: 'velora-store-v4-products',
    cart: 'velora-store-v4-cart',
    wishlist: 'velora-store-v4-wishlist',
    theme: 'velora-store-v4-theme',
  };
  const legacyStorageKeys = store.legacyStorageKeys || {
    cart: ['velora-store-v3-cart', 'velora-store-v2-cart'],
    wishlist: ['velora-store-v3-wishlist', 'velora-store-v2-wishlist'],
    theme: ['velora-store-v3-theme', 'velora-store-v2-theme'],
  };
  const fallbackProducts = Array.isArray(store.products) ? store.products : [];
  const mount = document.getElementById('productPageMount');
  const themeToggle = document.getElementById('themeToggle');
  const cartJump = document.getElementById('cartJump');
  const cartCount = document.getElementById('cartCount');
  const toastRegion = document.getElementById('toastRegion');
  const productOgImage = document.getElementById('productOgImage');
  let cartDrawer = null;

  if (!mount) {
    return;
  }

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn');
  const countFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const decimalFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const state = {
    theme: loadTheme(),
    products: loadProducts(),
    cart: loadCart(),
    wishlist: loadWishlist(),
    productId: new URLSearchParams(window.location.search).get('id') || '',
    galleryIndex: 0,
    modelIndex: 0,
    priceOptionIndex: null,
    color: '',
    size: '',
    quantity: 1,
  };

  state.product = getProduct(state.productId) || state.products[0] || null;
  state.productId = state.product?.id || '';
  state.color = state.product?.colors?.[0] || '';
  state.size = state.product?.sizes?.[0] || '';

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === '') {
        return structuredCloneFallback(fallback);
      }
      return safeParse(raw, structuredCloneFallback(fallback));
    } catch {
      return structuredCloneFallback(fallback);
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

    return structuredCloneFallback(fallback);
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function structuredCloneFallback(value) {
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

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
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
    const source = Array.isArray(value) ? value : [];
    return source
      .map((option) => ({
        label: normalizeOptionLabel(option?.label || option?.name || ''),
        price: Math.max(0, parseLocalizedNumber(option?.price)),
      }))
      .filter((option) => option.label && option.price > 0)
      .sort((first, second) => first.price - second.price || first.label.localeCompare(second.label, 'ar'));
  }

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.max(0, Math.round(toNumber(value))))} ج.م`;
  }

  function formatProductPriceOptions(product) {
    const options = normalizePriceOptions(product?.priceOptions);
    if (options.length) {
      return options.map((option) => `${option.label}: ${formatMoney(option.price)}`).join('\n');
    }
    return formatMoney(product?.price || 0);
  }

  function formatCount(value) {
    return countFormatter.format(Math.max(0, Math.floor(toNumber(value))));
  }

  function dedupeList(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getProductGallery(product) {
    const images = [];
    if (product?.image) images.push(product.image);
    if (product?.hoverImage) images.push(product.hoverImage);
    if (Array.isArray(product?.gallery)) {
      images.push(...product.gallery);
    }
    if (product?.sideImage) images.push(product.sideImage);
    if (product?.backImage) images.push(product.backImage);
    return dedupeList(images.map((item) => normalizeText(item)).filter(Boolean));
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

  function normalizeProduct(product, index = 0) {
    const source = product || {};
    const gallery = getProductGallery(source);
    const models = normalizeProductModels(source.models, gallery);
    const price = Math.max(0, toNumber(source.price, 0));
    const priceOptions = normalizePriceOptions(source.priceOptions);
    const optionPrices = priceOptions.map((option) => option.price).filter((priceValue) => priceValue > 0);
    const finalPrice = price || (optionPrices.length ? Math.min(...optionPrices) : 0);
    const compareAtPrice = Math.max(0, toNumber(source.compareAtPrice, finalPrice ? Math.round(finalPrice * 1.15) : 0));
    const colors = Array.isArray(source.colors) ? source.colors.map((item) => normalizeText(item)).filter(Boolean) : [];
    const sizes = Array.isArray(source.sizes) ? source.sizes.map((item) => normalizeText(item)).filter(Boolean) : [];
    const category = canonicalCategory(source.category, 'حلقان');
    const fallbackCopy = defaultProductCopy(category);

    return {
      id: normalizeText(source.id, `PRD-${String(index + 101).padStart(3, '0')}`),
      name: normalizeText(source.name, 'منتج جديد'),
      category,
      badge: normalizeText(source.badge, 'مميز'),
      note: normalizeProductCopy(source.note, fallbackCopy),
      details: normalizeProductCopy(source.details, normalizeProductCopy(source.note, fallbackCopy)),
      price: finalPrice,
      stock: Math.max(0, Math.floor(toNumber(source.stock, 0))),
      compareAtPrice,
      discount: Math.max(0, toNumber(source.discount, 0)),
      rating: Math.max(0, Math.min(5, toNumber(source.rating, 0))),
      reviewCount: Math.max(0, Math.floor(toNumber(source.reviewCount, 0))),
      image: gallery[0] || normalizeText(source.image, ''),
      hoverImage: gallery[1] || normalizeText(source.hoverImage, gallery[0] || ''),
      sideImage: gallery[2] || normalizeText(source.sideImage, ''),
      gallery,
      models,
      priceOptions,
      colors,
      sizes,
      createdAt: normalizeText(source.createdAt, ''),
      tone: Number.isFinite(Number(source.tone)) ? Number(source.tone) : index,
      monogram: normalizeText(source.monogram, normalizeText(source.name, 'ع').charAt(0) || 'ع'),
    };
  }

  function loadProducts() {
    const stored = loadStoredValueWithFallback(storageKeys.products, legacyStorageKeys.products || [], null);
    if (Array.isArray(stored) && stored.length) {
      return stored.map((product, index) => normalizeProduct(product, index));
    }
    return fallbackProducts.map((product, index) => normalizeProduct(product, index));
  }

  function loadCart() {
    const stored = loadStorage(storageKeys.cart, []);
    return Array.isArray(stored) ? stored : [];
  }

  function loadWishlist() {
    const stored = loadStorage(storageKeys.wishlist, []);
    return Array.isArray(stored) ? stored.map((item) => normalizeText(item)).filter(Boolean) : [];
  }

  async function fetchReviewData() {
    try {
      const response = await fetch('/api/reviews', { cache: 'no-store' });
      if (!response.ok) {
        return { reviews: [], summary: {} };
      }
      const payload = await response.json();
      return {
        reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
        summary: payload && typeof payload.summary === 'object' ? payload.summary : {},
      };
    } catch (error) {
      console.warn('تعذر تحميل تقييمات المنتجات', error);
      return { reviews: [], summary: {} };
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

  async function submitProductReview(form) {
    if (!state.product) {
      return;
    }
    const formData = new FormData(form);
    const rating = Number(formData.get('rating') || 0);
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: state.product.id,
          rating,
          name: normalizeText(formData.get('name'), 'عميل'),
          comment: normalizeText(formData.get('comment')),
        }),
      });
      if (!response.ok) {
        throw new Error('review failed');
      }
      const data = await fetchReviewData();
      applyProductReviewSummary(data.summary);
      state.product = getProduct(state.productId) || state.products[0] || null;
      form.reset();
      showToast('تم إرسال التقييم', 'شكرًا لمشاركتك رأيك في المنتج.', 'success');
      render();
    } catch (error) {
      showToast('تعذر إرسال التقييم', 'حاول مرة أخرى بعد لحظات.', 'error');
    } finally {
      submitButton.disabled = false;
    }
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
      console.warn('تعذر تحميل تقييمات المنتجات', error);
      return { configured: false, products: [] };
    }
  }

  async function syncProductsFromDatabase() {
    const result = await fetchProductsFromDatabase();
    if (!result.configured) {
      return;
    }

    state.products = result.products.map((product, index) => normalizeProduct(product, index));
    applyProductReviewSummary((await fetchReviewData()).summary);
    saveStorage(storageKeys.products, state.products);
    state.product = getProduct(state.productId) || state.products[0] || null;
    if (state.product) {
      state.productId = state.product.id;
      state.color = state.product.colors?.[0] || '';
      state.size = state.product.sizes?.[0] || '';
    }
    updateCartCounter();
    render();
  }

  function loadTheme() {
    const stored = loadStorage(storageKeys.theme, '');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function saveCart() {
    return saveStorage(storageKeys.cart, state.cart);
  }

  function saveWishlist() {
    return saveStorage(storageKeys.wishlist, state.wishlist);
  }

  function saveTheme() {
    return saveStorage(storageKeys.theme, state.theme);
  }

  function getProduct(productId) {
    return state.products.find((product) => product.id === productId) || null;
  }

  function getProductGalleryImage(product, index = 0) {
    const gallery = getProductGallery(product);
    return gallery[index] || gallery[0] || product?.image || '';
  }

  function getProductVariantLabel(color, size, option = '') {
    const parts = [];
    if (option) parts.push(option);
    if (color) parts.push(color);
    if (size) parts.push(size);
    return parts.join(' - ') || 'بدون خيارات';
  }

  function cartLinePrice(item) {
    const product = getProduct(item.productId);
    if (toNumber(item.price, 0) > 0) {
      return toNumber(item.price, 0);
    }
    return product ? toNumber(product.price, 0) : 0;
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, item) => sum + (Number(item.qty) || 0) * cartLinePrice(item), 0);
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

  function availabilityLabel(stock) {
    const value = Math.max(0, toNumber(stock));
    if (value === 0) {
      return 'نفد المخزون';
    }
    if (value <= 3) {
      return 'آخر قطع';
    }
    return 'متوفر الآن';
  }

  function availabilityClass(stock) {
    return Math.max(0, toNumber(stock)) <= 3 ? 'low' : '';
  }

  function isNewProduct(product) {
    const createdAt = product?.createdAt ? new Date(product.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      return Date.now() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 14;
    }
    return String(product?.badge || '').includes('جديد');
  }

  function smartBadge(product) {
    if (toNumber(product?.stock, 0) > 0 && toNumber(product?.stock, 0) <= 3) {
      return { label: 'آخر قطع', className: 'urgent' };
    }
    if (isNewProduct(product)) {
      return { label: 'وصل حديثًا', className: 'new' };
    }
    return {
      label: normalizeText(product?.badge, 'مميز'),
      className: String(product?.badge || '').includes('مميز') ? 'hot' : '',
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

  function updateThemeToggle() {
    if (!themeToggle) {
      return;
    }
    const icon = themeToggle.querySelector('span');
    const label = themeToggle.querySelector('small');
    if (icon) {
      icon.textContent = '';
    }
    if (label) {
      label.textContent = state.theme === 'dark' ? 'فاتح' : 'داكن';
    }
    themeToggle.setAttribute('aria-pressed', state.theme === 'dark' ? 'true' : 'false');
  }

  function setTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = state.theme;
    saveTheme();
    updateThemeToggle();
  }

  function updateCartCounter() {
    const count = state.cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    if (cartCount) {
      cartCount.textContent = formatCount(count);
    }
  }

  function ensureCartDrawer() {
    if (cartDrawer) {
      return cartDrawer;
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
    cartDrawer = drawer;
    return drawer;
  }

  function renderCartDrawer() {
    if (!cartDrawer) {
      return;
    }

    const list = cartDrawer.querySelector('[data-cart-drawer-list]');
    const countLabel = cartDrawer.querySelector('[data-cart-drawer-count]');
    const totalLabel = cartDrawer.querySelector('[data-cart-drawer-total]');
    const checkoutLink = cartDrawer.querySelector('.cart-drawer-actions .primary-btn');
    const count = state.cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
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
    if (!cartDrawer) {
      return;
    }

    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-drawer-open');
    window.setTimeout(() => {
      if (!cartDrawer?.classList.contains('is-open')) {
        cartDrawer.hidden = true;
      }
    }, 220);
  }

  function changeCartQty(cartId, delta) {
    const item = state.cart.find((entry) => entry.id === cartId);
    if (!item) {
      return;
    }

    const product = getProduct(item.productId);
    const maxQty = Math.max(1, Number(product?.stock) || item.qty || 1);
    const nextQty = Math.min(maxQty, (Number(item.qty) || 0) + delta);
    if (nextQty <= 0) {
      state.cart = state.cart.filter((entry) => entry.id !== cartId);
    } else {
      item.qty = nextQty;
    }

    saveCart();
    updateCartCounter();
    renderCartDrawer();
  }

  function removeCartItem(cartId) {
    state.cart = state.cart.filter((entry) => entry.id !== cartId);
    saveCart();
    updateCartCounter();
    renderCartDrawer();
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

  function showToast(title, message, type = 'success') {
    if (!toastRegion) {
      return;
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
    toastRegion.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    window.setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2400);
  }

  function animateAddToCart(sourceElement) {
    if (!cartJump || !sourceElement) {
      return;
    }

    const image = sourceElement.querySelector?.('img') || sourceElement;
    if (!image || typeof image.cloneNode !== 'function') {
      return;
    }

    const sourceRect = image.getBoundingClientRect();
    const targetRect = cartJump.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
      return;
    }

    const flyer = image.cloneNode(true);
    flyer.classList.add('cart-flyer');
    flyer.style.position = 'fixed';
    flyer.style.left = `${sourceRect.left}px`;
    flyer.style.top = `${sourceRect.top}px`;
    flyer.style.width = `${sourceRect.width}px`;
    flyer.style.height = `${sourceRect.height}px`;
    flyer.style.borderRadius = '22px';
    flyer.style.zIndex = '120';
    flyer.style.opacity = '0.95';
    flyer.style.pointerEvents = 'none';
    flyer.style.objectFit = 'cover';
    flyer.style.boxShadow = '0 18px 34px rgba(155, 102, 115, 0.24)';
    document.body.appendChild(flyer);

    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    flyer.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 0.95 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12)`, opacity: 0.05 },
      ],
      {
        duration: 720,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    ).onfinish = () => flyer.remove();
  }

  function getCartLineId(productId, color, size, option = '') {
    return [productId, option || '-', color || '-', size || '-'].join('|');
  }

  function addToCart(product, qty = 1, variant = {}, sourceElement = null) {
    if (!product || product.stock <= 0) {
      showToast('المخزون غير متاح', 'هذا المنتج غير متوفر حاليًا.', 'warning');
      return;
    }

    const priceOptions = normalizePriceOptions(product.priceOptions);
    if (priceOptions.length > 1 && !normalizeText(variant.option)) {
      showToast('اختار النوع أولًا', 'اختار نحاس أو استانلس قبل الإضافة للسلة.', 'warning');
      return;
    }

    const selectedColor = normalizeText(variant.color || product.colors[0] || '');
    const selectedSize = normalizeText(variant.size || product.sizes[0] || '');
    const selectedOption = normalizeText(variant.option || '');
    const selectedPrice = Math.max(0, toNumber(variant.price, 0));
    const lineId = getCartLineId(product.id, selectedColor, selectedSize, selectedOption);
    const existing = state.cart.find((item) => item.id === lineId);
    const nextQty = Math.min(product.stock, (Number(existing?.qty) || 0) + qty);

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
    updateCartCounter();
    renderCartDrawer();
    animateAddToCart(sourceElement);
    showToast('تمت الإضافة', `${product.name} الآن داخل السلة.`, 'success');
  }

  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index !== -1) {
      state.wishlist.splice(index, 1);
      showToast('أضيف إلى المفضلة', getProduct(productId)?.name || '', 'success');
    } else {
      state.wishlist.unshift(productId);
      showToast('أضيف إلى المفضلة', getProduct(productId)?.name || '', 'success');
    }
    state.wishlist = [...new Set(state.wishlist.filter(Boolean))];
    saveWishlist();
    render();
  }

  function buildRelatedProducts(product) {
    return state.products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 3);
  }

  function updateMeta(product) {
    document.title = `${product.name} | HabibaVelora`;
    const description = `تفاصيل ${product.name} في HabibaVelora، مع صور متعددة ومقاسات وسلة شراء متصلة.`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${product.name} | HabibaVelora`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    if (productOgImage) {
      productOgImage.setAttribute('content', getProductGalleryImage(product) || '/assets/habiba-velora-hero.jpg');
    }
  }

  function closeProductImagePreview() {
    document.querySelector('.product-image-preview-shell')?.remove();
    document.body.classList.remove('product-image-preview-open');
  }

  function openProductImagePreview(image, label) {
    if (!image) {
      return;
    }

    closeProductImagePreview();
    const shell = document.createElement('div');
    shell.className = 'product-image-preview-shell';
    shell.innerHTML = `
      <button type="button" class="product-image-preview-backdrop" data-action="close-image-preview" aria-label="إغلاق معاينة الصورة"></button>
      <div class="product-image-preview-panel" role="dialog" aria-modal="true" aria-label="معاينة صورة ${escapeHtml(label)}">
        <button type="button" class="product-image-preview-close" data-action="close-image-preview" aria-label="إغلاق">×</button>
        <img src="${escapeHtml(image)}" alt="${escapeHtml(label)}" loading="eager" decoding="async" fetchpriority="high" />
      </div>
    `;
    document.body.appendChild(shell);
    document.body.classList.add('product-image-preview-open');
    requestAnimationFrame(() => shell.classList.add('is-open'));
  }

  function render() {
    if (!state.product) {
      mount.innerHTML = `
        <section class="section-block content-hero">
          <p class="eyebrow">صفحة المنتج</p>
          <h1>لم نتمكن من العثور على المنتج</h1>
          <p class="product-page-copy">ارجع إلى المتجر الرئيسي لاختيار منتج آخر أو افتح صفحة من المنتجات المتوفرة.</p>
          <a href="/#collection" class="primary-btn">العودة للمتجر</a>
        </section>
      `;
      updateCartCounter();
      return;
    }

    const product = state.product;
    const models = normalizeProductModels(product.models, product.gallery);
    const priceOptions = normalizePriceOptions(product.priceOptions);
    if (priceOptions.length === 1 && state.priceOptionIndex === null) {
      state.priceOptionIndex = 0;
    }
    if (state.modelIndex >= models.length) {
      state.modelIndex = 0;
    }
    if (state.priceOptionIndex !== null && state.priceOptionIndex >= priceOptions.length) {
      state.priceOptionIndex = null;
    }
    const activePriceOption = state.priceOptionIndex === null ? null : (priceOptions[state.priceOptionIndex] || null);
    const mustChoosePriceOption = priceOptions.length > 1 && !activePriceOption;
    const activePrice = activePriceOption ? activePriceOption.price : (priceOptions.length ? 0 : product.price);
    const activeCompareAtPrice = activePrice ? Math.round(activePrice * 1.15) : product.compareAtPrice;
    const activeModel = models[state.modelIndex] || null;
    const modelGallery = activeModel ? dedupeList([activeModel.image, ...activeModel.gallery]) : [];
    const gallery = modelGallery.length ? modelGallery : (getProductGallery(product).length ? getProductGallery(product) : [product.image || '']);
    if (state.galleryIndex >= gallery.length) {
      state.galleryIndex = 0;
    }

    const activeImage = gallery[state.galleryIndex] || gallery[0];
    const colors = product.colors.length ? product.colors : ['بدون لون'];
    const sizes = product.sizes.length ? product.sizes : ['مقاس واحد'];
    const selectedColor = state.color || colors[0];
    const selectedSize = state.size || sizes[0];
    const rating = product.rating > 0 ? `${decimalFormatter.format(product.rating)}/5` : '';
    const discount = calculateDiscount(product);
    const badge = smartBadge(product);
    const relatedProducts = buildRelatedProducts(product);

    updateMeta(product);

    mount.innerHTML = `
      <section class="section-block product-page-shell">
        <div class="product-page-layout">
          <article class="product-page-gallery">
            <div class="product-page-panel product-page-main">
              ${activeImage ? `<button type="button" class="product-image-preview-trigger" data-action="preview-image" aria-label="معاينة صورة ${escapeHtml(product.name)}"></button>` : ''}
              ${activeImage ? `<img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}" loading="eager" fetchpriority="high" decoding="async" />` : `<div class="empty-state compact"><strong>&#1575;&#1604;&#1589;&#1608;&#1585;&#1577; &#1594;&#1610;&#1585; &#1605;&#1578;&#1575;&#1581;&#1577;</strong></div>`}
            </div>
            <div class="product-page-thumbnails">
              ${gallery.map((src, index) => `
                <button type="button" data-action="gallery" data-index="${index}" class="${index === state.galleryIndex ? 'active' : ''}">
                  <img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)} ${index + 1}" loading="eager" decoding="async" />
                </button>
              `).join('')}
            </div>
          </article>

          <aside class="product-page-info">
            <div class="product-page-summary">
              <div class="product-modal-badges">
                <span class="product-badge ${escapeHtml(badge.className)}">${escapeHtml(badge.label)}</span>
                <span class="stock-pill ${availabilityClass(product.stock)}">${escapeHtml(availabilityLabel(product.stock))}</span>
              </div>

              <h2>${escapeHtml(product.name)}</h2>
              <p class="product-page-copy">${escapeHtml(product.details)}</p>

              ${rating ? `
                <div class="product-modal-rating">
                  <span class="product-stars">&#1578;&#1602;&#1610;&#1610;&#1605; &#1575;&#1604;&#1593;&#1605;&#1604;&#1575;&#1569;</span>
                  <strong>${escapeHtml(rating)}</strong>
                  <small>${formatCount(product.reviewCount)} مراجعة</small>
                </div>
              ` : ''}

              <div class="product-modal-price smooth-price">
                <strong class="product-price">${mustChoosePriceOption ? 'اختار النوع لعرض السعر' : escapeHtml(formatMoney(activePrice))}</strong>
                ${activePrice > 0 && activeCompareAtPrice > activePrice ? `<del class="product-old-price">${escapeHtml(formatMoney(activeCompareAtPrice))}</del>` : ''}
                ${activePrice > 0 && discount ? `<span class="discount-pill">خصم ${escapeHtml(formatCount(discount))}%</span>` : ''}
              </div>

              ${priceOptions.length ? `
                <div class="variant-block">
                  <span class="variant-label">اختيارات السعر</span>
                  <div class="variant-group">
                    ${priceOptions.map((option, index) => `
                      <button type="button" class="variant-chip${index === state.priceOptionIndex ? ' active' : ''}" data-action="select-price-option" data-index="${index}">
                        ${escapeHtml(option.label)} - ${escapeHtml(formatMoney(option.price))}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${models.length ? `
                <div class="variant-block model-picker">
                  <span class="variant-label">الشكل / الموديل</span>
                  <div class="model-choice-grid">
                    ${models.map((model, index) => `
                      <button type="button" class="model-choice${index === state.modelIndex ? ' active' : ''}" data-action="select-model" data-index="${index}">
                        ${model.image ? `<img src="${escapeHtml(model.image)}" alt="${escapeHtml(model.name)}" />` : ''}
                        <span>${escapeHtml(model.name)}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="variant-block">
                <span class="variant-label">الألوان</span>
                <div class="variant-group">
                  ${colors.map((color) => `
                    <button type="button" class="variant-chip${selectedColor === color ? ' active' : ''}" data-action="select-color" data-value="${escapeHtml(color)}">${escapeHtml(color)}</button>
                  `).join('')}
                </div>
              </div>

              <div class="variant-block">
                <span class="variant-label">المقاسات</span>
                <div class="variant-group">
                  ${sizes.map((size) => `
                    <button type="button" class="variant-chip${selectedSize === size ? ' active' : ''}" data-action="select-size" data-value="${escapeHtml(size)}">${escapeHtml(size)}</button>
                  `).join('')}
                </div>
              </div>

              <div class="variant-block">
                <span class="variant-label">الكمية</span>
                <div class="quantity-stepper">
                  <button type="button" data-action="quantity-change" data-delta="-1" aria-label="إنقاص">-</button>
                  <strong>${formatCount(state.quantity)}</strong>
                  <button type="button" data-action="quantity-change" data-delta="1" aria-label="زيادة">+</button>
                </div>
              </div>

              <div class="product-modal-actions">
                <button type="button" class="primary-btn" data-action="add-to-cart" ${mustChoosePriceOption ? 'disabled' : ''}>${mustChoosePriceOption ? 'اختار النوع أولًا' : 'أضف للسلة'}</button>
                <button type="button" class="secondary-btn" data-action="wishlist">
                  ${state.wishlist.includes(product.id) ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
                </button>
              </div>

              <form class="product-review-form" data-review-form>
                <div>
                  <span class="variant-label">قيّم المنتج</span>
                  <p>التقييمات تظهر بعد مشاركة العملاء فقط.</p>
                </div>
                <select name="rating" required aria-label="اختيار التقييم">
                  <option value="">اختر التقييم</option>
                  <option value="5">5 نجوم</option>
                  <option value="4">4 نجوم</option>
                  <option value="3">3 نجوم</option>
                  <option value="2">2 نجوم</option>
                  <option value="1">1 نجمة</option>
                </select>
                <input name="name" type="text" placeholder="اسمك اختياري" />
                <textarea name="comment" rows="3" placeholder="اكتب رأيك اختياري"></textarea>
                <button type="submit" class="secondary-btn">إرسال التقييم</button>
              </form>
            </div>

          </aside>
        </div>
      </section>

      <section class="section-block product-page-related">
        <div class="section-heading">
          <div>
            <p class="eyebrow">منتجات مشابهة</p>
            <h2>اختيارات من نفس القسم</h2>
          </div>
        </div>

        <div class="product-page-related-grid">
          ${relatedProducts.length ? relatedProducts.map((item) => `
            <a class="product-page-related-card" href="/product?id=${encodeURIComponent(item.id)}">
              <img src="${escapeHtml(getProductGalleryImage(item))}" alt="${escapeHtml(item.name)}" />
              <strong>${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.category)}</span>
              <span>${escapeHtml(formatProductPriceOptions(item))}</span>
            </a>
          `).join('') : `
            <div class="empty-state compact">
              <strong>لا توجد اقتراحات حاليًا</strong>
              <p>هذا المنتج لا يملك بدائل داخل نفس القسم بعد.</p>
            </div>
          `}
        </div>
      </section>
    `;

    updateCartCounter();
  }

  function handleClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    if (action === 'preview-image') {
      const gallery = getProductGallery(state.product);
      const activeImage = gallery[state.galleryIndex] || gallery[0] || state.product?.image || '';
      openProductImagePreview(activeImage, state.product?.name || 'المنتج');
      return;
    }

    if (action === 'gallery') {
      state.galleryIndex = Number(actionButton.dataset.index || 0);
      render();
      return;
    }

    if (action === 'select-model') {
      state.modelIndex = Number(actionButton.dataset.index || 0);
      state.galleryIndex = 0;
      render();
      return;
    }

    if (action === 'select-color') {
      state.color = normalizeText(actionButton.dataset.value);
      render();
      return;
    }

    if (action === 'select-size') {
      state.size = normalizeText(actionButton.dataset.value);
      render();
      return;
    }

    if (action === 'select-price-option') {
      state.priceOptionIndex = Number(actionButton.dataset.index || 0);
      render();
      return;
    }

    if (action === 'quantity-change') {
      const delta = Number(actionButton.dataset.delta || 0);
      state.quantity = Math.max(1, Math.min(state.product?.stock || 1, state.quantity + delta));
      render();
      return;
    }

    if (action === 'add-to-cart') {
      const priceOptions = normalizePriceOptions(state.product.priceOptions);
      const activePriceOption = state.priceOptionIndex === null ? null : (priceOptions[state.priceOptionIndex] || null);
      if (priceOptions.length > 1 && !activePriceOption) {
        showToast('اختار النوع أولًا', 'اختار نحاس أو استانلس قبل الإضافة للسلة.', 'warning');
        return;
      }
      addToCart(state.product, state.quantity, {
        color: state.color,
        size: state.size,
        option: activePriceOption?.label || '',
        price: activePriceOption?.price || 0,
      }, mount.querySelector('.product-page-main'));
      return;
    }

    if (action === 'wishlist') {
      toggleWishlist(state.product.id);
    }
  }

  function bindEvents() {
    mount.addEventListener('click', handleClick);
    mount.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-review-form]');
      if (!form) {
        return;
      }
      event.preventDefault();
      submitProductReview(form);
    });

    themeToggle?.addEventListener('click', () => {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    cartJump?.addEventListener('click', (event) => {
      event.preventDefault();
      openCartDrawer();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeCartDrawer();
        closeProductImagePreview();
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="close-image-preview"]')) {
        closeProductImagePreview();
      }
    });

    window.addEventListener('storage', () => {
      state.products = loadProducts();
      state.cart = loadCart();
      state.wishlist = loadWishlist();
      state.product = getProduct(state.productId) || state.products[0] || null;
      if (state.product) {
        state.productId = state.product.id;
      }
      updateCartCounter();
      renderCartDrawer();
      render();
    });
  }

  bindEvents();
  setTheme(state.theme);
  updateCartCounter();
  render();
})();


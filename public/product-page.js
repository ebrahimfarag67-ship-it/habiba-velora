(() => {
  const store = window.veloraStore || {};
  const storageKeys = store.storageKeys || {
    products: 'velora-store-v4-products',
    cart: 'velora-store-v4-cart',
    wishlist: 'velora-store-v4-wishlist',
    theme: 'velora-store-v4-theme',
  };
  const legacyStorageKeys = store.legacyStorageKeys || {
    products: ['velora-store-v3-products', 'velora-store-v2-products'],
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

  if (!mount) {
    return;
  }

  const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-arab');
  const countFormatter = new Intl.NumberFormat('ar-EG-u-nu-arab', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const decimalFormatter = new Intl.NumberFormat('ar-EG-u-nu-arab', {
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

  function normalizeProduct(product, index = 0) {
    const source = product || {};
    const gallery = getProductGallery(source);
    const price = Math.max(0, toNumber(source.price, 0));
    const compareAtPrice = Math.max(0, toNumber(source.compareAtPrice, price ? Math.round(price * 1.18) : 0));
    const colors = Array.isArray(source.colors) ? source.colors.map((item) => normalizeText(item)).filter(Boolean) : [];
    const sizes = Array.isArray(source.sizes) ? source.sizes.map((item) => normalizeText(item)).filter(Boolean) : [];

    return {
      id: normalizeText(source.id, `PRD-${String(index + 101).padStart(3, '0')}`),
      name: normalizeText(source.name, 'منتج جديد'),
      category: normalizeText(source.category, 'حلقان'),
      badge: normalizeText(source.badge, 'مميز'),
      note: normalizeText(source.note, 'تفاصيل أنيقة وواضحة للمنتج.'),
      details: normalizeText(source.details, normalizeText(source.note, 'تفاصيل أنيقة وواضحة للمنتج.')),
      price,
      stock: Math.max(0, Math.floor(toNumber(source.stock, 0))),
      compareAtPrice,
      discount: Math.max(0, toNumber(source.discount, 0)),
      rating: Math.max(0, Math.min(5, toNumber(source.rating, 0))),
      reviewCount: Math.max(0, Math.floor(toNumber(source.reviewCount, 0))),
      image: gallery[0] || normalizeText(source.image, ''),
      hoverImage: gallery[1] || normalizeText(source.hoverImage, gallery[0] || ''),
      sideImage: gallery[2] || normalizeText(source.sideImage, ''),
      gallery,
      colors,
      sizes,
      tone: Number.isFinite(Number(source.tone)) ? Number(source.tone) : index,
      monogram: normalizeText(source.monogram, normalizeText(source.name, 'ع').charAt(0) || 'ع'),
    };
  }

  function loadProducts() {
    const stored = loadStoredValueWithFallback(storageKeys.products, legacyStorageKeys.products, null);
    const base = Array.isArray(stored) && stored.length ? stored : fallbackProducts;
    return base.map((product, index) => normalizeProduct(product, index));
  }

  function loadCart() {
    const stored = loadStorage(storageKeys.cart, []);
    return Array.isArray(stored) ? stored : [];
  }

  function loadWishlist() {
    const stored = loadStorage(storageKeys.wishlist, []);
    return Array.isArray(stored) ? stored.map((item) => normalizeText(item)).filter(Boolean) : [];
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

  function getProductVariantLabel(color, size) {
    const parts = [];
    if (color) parts.push(color);
    if (size) parts.push(size);
    return parts.join(' • ') || 'بدون خيارات';
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

  function updateThemeToggle() {
    if (!themeToggle) {
      return;
    }
    const icon = themeToggle.querySelector('span');
    const label = themeToggle.querySelector('small');
    if (icon) {
      icon.textContent = state.theme === 'dark' ? '☀' : '☾';
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

  function getCartLineId(productId, color, size) {
    return [productId, color || '-', size || '-'].join('|');
  }

  function addToCart(product, qty = 1, variant = {}, sourceElement = null) {
    if (!product || product.stock <= 0) {
      showToast('المخزون غير متاح', 'هذا المنتج غير متوفر حاليًا.', 'warning');
      return;
    }

    const selectedColor = normalizeText(variant.color || product.colors[0] || '');
    const selectedSize = normalizeText(variant.size || product.sizes[0] || '');
    const lineId = getCartLineId(product.id, selectedColor, selectedSize);
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
      });
    }

    saveCart();
    updateCartCounter();
    animateAddToCart(sourceElement);
    showToast('تمت الإضافة', `${product.name} الآن داخل السلة.`, 'success');
  }

  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index !== -1) {
      state.wishlist.splice(index, 1);
      showToast('تمت الإزالة من المفضلة', getProduct(productId)?.name || '', 'success');
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
      productOgImage.setAttribute('content', getProductGalleryImage(product) || 'assets/habibvelora-hero-photo.png');
    }
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
    const gallery = getProductGallery(product).length ? getProductGallery(product) : [product.image || ''];
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
    const relatedProducts = buildRelatedProducts(product);

    updateMeta(product);

    mount.innerHTML = `
      <section class="section-block content-hero">
        <p class="eyebrow">صفحة المنتج</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-page-copy">${escapeHtml(product.note || product.details)}</p>
      </section>

      <section class="section-block">
        <div class="product-page-layout">
          <article class="product-page-gallery">
            <div class="product-page-panel product-page-main">
              <img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}" />
            </div>
            <div class="product-page-thumbnails">
              ${gallery.map((src, index) => `
                <button type="button" data-action="gallery" data-index="${index}" class="${index === state.galleryIndex ? 'active' : ''}">
                  <img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)} ${index + 1}" />
                </button>
              `).join('')}
            </div>
          </article>

          <aside class="product-page-info">
            <div class="product-page-summary">
              <div class="product-modal-badges">
                <span class="product-badge${String(product.badge).includes('مميز') ? ' hot' : ''}">${escapeHtml(product.badge)}</span>
                <span class="stock-pill ${availabilityClass(product.stock)}">${escapeHtml(availabilityLabel(product.stock))}</span>
              </div>

              <h2>${escapeHtml(product.name)}</h2>
              <p class="product-page-copy">${escapeHtml(product.details)}</p>

              ${rating ? `
                <div class="product-modal-rating">
                  <span class="product-stars">★★★★★</span>
                  <strong>${escapeHtml(rating)}</strong>
                  <small>${formatCount(product.reviewCount)} مراجعة</small>
                </div>
              ` : ''}

              <div class="product-modal-price">
                <strong class="product-price">${escapeHtml(formatMoney(product.price))}</strong>
                ${product.compareAtPrice > product.price ? `<del class="product-old-price">${escapeHtml(formatMoney(product.compareAtPrice))}</del>` : ''}
                ${discount ? `<span class="discount-pill">خصم ${escapeHtml(formatCount(discount))}%</span>` : ''}
              </div>

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
                  <button type="button" data-action="quantity-change" data-delta="-1" aria-label="إنقاص">−</button>
                  <strong>${formatCount(state.quantity)}</strong>
                  <button type="button" data-action="quantity-change" data-delta="1" aria-label="زيادة">+</button>
                </div>
              </div>

              <div class="product-modal-actions">
                <button type="button" class="primary-btn" data-action="add-to-cart">أضف للسلة</button>
                <button type="button" class="secondary-btn" data-action="wishlist">
                  ${state.wishlist.includes(product.id) ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
                </button>
              </div>
            </div>

            <div class="product-page-benefits">
              <article class="product-page-benefit">
                <strong>صور متعددة</strong>
                <p>واجهة واضحة للمنتج من أكثر من زاوية مع عرض سريع للصورة النشطة.</p>
              </article>
              <article class="product-page-benefit">
                <strong>اختيار مرن</strong>
                <p>حدد اللون والمقاس والكمية قبل الإضافة مباشرة للسلة.</p>
              </article>
              <article class="product-page-benefit">
                <strong>تجربة منظمة</strong>
                <p>صفحة خفيفة وسريعة ومناسبة للموبايل والتابلت واللاب.</p>
              </article>
            </div>

            <div class="product-page-support-grid">
              <article class="product-page-support">
                <strong>دفع متاح</strong>
                <p>عند الاستلام، فودافون كاش، وإنستاباي.</p>
              </article>
              <article class="product-page-support">
                <strong>إرجاع منظم</strong>
                <p>مرجع واضح للفاتورة والمرتجعات بعد الشراء.</p>
              </article>
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
              <span>${escapeHtml(formatMoney(item.price))}</span>
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
    if (action === 'gallery') {
      state.galleryIndex = Number(actionButton.dataset.index || 0);
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

    if (action === 'quantity-change') {
      const delta = Number(actionButton.dataset.delta || 0);
      state.quantity = Math.max(1, Math.min(state.product?.stock || 1, state.quantity + delta));
      render();
      return;
    }

    if (action === 'add-to-cart') {
      addToCart(state.product, state.quantity, { color: state.color, size: state.size }, mount.querySelector('.product-page-main'));
      return;
    }

    if (action === 'wishlist') {
      toggleWishlist(state.product.id);
    }
  }

  function bindEvents() {
    mount.addEventListener('click', handleClick);

    themeToggle?.addEventListener('click', () => {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
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
      render();
    });
  }

  bindEvents();
  setTheme(state.theme);
  updateCartCounter();
  render();
})();

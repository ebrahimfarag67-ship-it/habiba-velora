import { useState, useEffect, useMemo } from 'react';

function getImages(product) {
  if (!product) return [];
  const images = [product.image];
  if (product.hoverImage) images.push(product.hoverImage);
  if (Array.isArray(product.gallery)) {
    images.push(...product.gallery);
  }
  if (product.backImage) images.push(product.backImage);
  if (product.sideImage) images.push(product.sideImage);
  return [...new Set(images.filter(Boolean))];
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0610-\u061a\u064b-\u065f\u06d6-\u06ed]/g, '')
    .trim();
}

function getProductSearchText(product) {
  return [
    product?.name,
    product?.category,
    product?.description,
    product?.id,
    product?.price,
  ].filter(Boolean).join(' ');
}

export default function ProductsGallery({ products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
  }, []);

  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);
  const visibleProducts = useMemo(() => {
    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) => (
      normalizeSearchText(getProductSearchText(product)).includes(normalizedQuery)
    ));
  }, [products, normalizedQuery]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(visibleProducts.length - 1, 0)));
  }, [visibleProducts.length]);

  useEffect(() => {
    if (visibleProducts.length < 2) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleProducts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [visibleProducts.length]);

  useEffect(() => {
    const currentImages = getImages(visibleProducts[currentIndex]);
    if (currentImages.length < 2) {
      return undefined;
    }

    const interval = setInterval(() => {
      setImageIndex((prev) => ({
        ...prev,
        [currentIndex]: ((prev[currentIndex] || 0) + 1) % currentImages.length,
      }));
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex, visibleProducts]);

  const currentProduct = visibleProducts[currentIndex];
  const images = currentProduct ? getImages(currentProduct) : [];
  const currentImageIndex = imageIndex[currentIndex] || 0;
  const currentImage = images[currentImageIndex] || '/assets/habibvelora-logo-transparent.png';

  const getProductUrl = (product) => (
    product?.id ? `/product?id=${encodeURIComponent(product.id)}` : '/products'
  );

  const getImageLoadKey = (product, src) => `${product?.id || product?.name || 'product'}::${src || ''}`;

  const markImageLoaded = (product, src) => {
    const key = getImageLoadKey(product, src);
    setLoadedImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleImageError = (event, product, src) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied !== 'true') {
      image.dataset.fallbackApplied = 'true';
      image.src = '/assets/habibvelora-logo-transparent.png';
      return;
    }

    markImageLoaded(product, src);
  };

  const changeProductImage = (event, productIndex, nextIndex) => {
    event?.preventDefault();
    event?.stopPropagation();

    const productImages = getImages(visibleProducts[productIndex]);
    if (productImages.length < 2) {
      return;
    }

    const normalizedIndex = ((nextIndex % productImages.length) + productImages.length) % productImages.length;
    setCurrentIndex(productIndex);
    setImageIndex((prev) => ({
      ...prev,
      [productIndex]: normalizedIndex,
    }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    const params = new URLSearchParams(window.location.search);

    if (nextQuery) {
      params.set('q', nextQuery);
    } else {
      params.delete('q');
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
    setCurrentIndex(0);
  };

  const showSearchState = query.trim().length > 0;
  const goToPreviousProduct = () => {
    setCurrentIndex((prev) => (
      visibleProducts.length ? (prev - 1 + visibleProducts.length) % visibleProducts.length : 0
    ));
  };
  const goToNextProduct = () => {
    setCurrentIndex((prev) => (
      visibleProducts.length ? (prev + 1) % visibleProducts.length : 0
    ));
  };

  const currentImageLoadKey = getImageLoadKey(currentProduct, currentImage);

  useEffect(() => {
    const fallbackImage = '/assets/habibvelora-logo-transparent.png';
    const readyKeys = [];

    document.querySelectorAll('[data-gallery-image-key]').forEach((image) => {
      if (!image.complete) {
        return;
      }

      const key = image.dataset.galleryImageKey;
      if (!key) {
        return;
      }

      if (image.naturalWidth > 0 || image.dataset.fallbackApplied === 'true') {
        readyKeys.push(key);
        return;
      }

      image.dataset.fallbackApplied = 'true';
      image.src = fallbackImage;
    });

    if (!readyKeys.length) {
      return;
    }

    setLoadedImages((prev) => {
      let changed = false;
      const next = { ...prev };
      readyKeys.forEach((key) => {
        if (!next[key]) {
          next[key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [currentImageLoadKey, imageIndex, visibleProducts]);

  return (
    <div className="products-gallery-shell">
      <header className="products-topbar">
        <a className="brand-block" href="/" aria-label="HabibaVelora">
          <img src="/assets/habibvelora-logo-transparent.png" alt="" className="brand-mark" aria-hidden="true" />
          <div className="brand-copy">
            <strong>HabibaVelora</strong>
            <small>المنتجات</small>
          </div>
        </a>

        <nav className="products-topnav" aria-label="التنقل الرئيسي">
          <a href="/">الرئيسية</a>
          <a href="/#categories">الأقسام</a>
          <a href="/about">قصتنا</a>
          <a href="/follow">تابعينا</a>
          <a href="/after-sales">فاتورة المرتجع</a>
        </nav>

        <form className="topbar-search-field products-search-field" action="/products" role="search" onSubmit={handleSearchSubmit}>
          <input
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحثي عن قطعة"
            aria-label="بحث في المنتجات"
          />
        </form>

        <div className="products-top-actions">
          <button id="searchButton" className="icon-btn" type="button" aria-label="البحث">
            <span aria-hidden="true">🔍</span>
          </button>
          <a id="cartJump" className="cart-icon-btn" href="/cart" aria-label="سلة الشراء">
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M6 6h15l-1.5 7.5H8.1L7 7.5H5M8.5 14.5h10.8a1 1 0 0 1 .98.79l.72 3.6a1 1 0 0 1-.98 1.21H10.3a1 1 0 0 1-.98-.79L7.1 5.8A1 1 0 0 0 6.12 5H3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10.4" cy="20" r="1.3" fill="currentColor" stroke="none"></circle>
              <circle cx="18.5" cy="20" r="1.3" fill="currentColor" stroke="none"></circle>
            </svg>
            <span id="cartCount" className="cart-count-badge">0</span>
          </a>
        </div>
      </header>

      <main className="products-main">
        <div className="gallery-container">
          <div className="products-feed">
            {currentProduct && (
              <div className="product-slide">
                <div className={`product-image-wrapper ${loadedImages[currentImageLoadKey] ? 'is-loaded' : 'is-loading'}`}>
                  <img 
                    key={currentImageLoadKey}
                    data-gallery-image-key={currentImageLoadKey}
                    src={currentImage} 
                    alt={currentProduct.name}
                    className="product-image animated"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={() => markImageLoaded(currentProduct, currentImage)}
                    onError={(event) => handleImageError(event, currentProduct, currentImage)}
                  />
                  {images.length > 1 && (
                    <div className="product-card-gallery-controls product-slide-gallery-controls" aria-label="تقليب صور المنتج">
                      <button
                        type="button"
                        className="product-card-gallery-button prev"
                        onClick={(event) => changeProductImage(event, currentIndex, currentImageIndex - 1)}
                        aria-label="الصورة السابقة"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="product-card-gallery-button next"
                        onClick={(event) => changeProductImage(event, currentIndex, currentImageIndex + 1)}
                        aria-label="الصورة التالية"
                      >
                        ›
                      </button>
                    </div>
                  )}
                  <div className="product-overlay">
                    <p className="product-label">اسم المنتج</p>
                    <h2 className="product-title">{currentProduct.name}</h2>
                  </div>
                </div>

                <div className="product-indicators">
                  {images.map((_, idx) => (
                    <button 
                      key={idx}
                      className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                      onClick={(event) => changeProductImage(event, currentIndex, idx)}
                      aria-label={`صورة ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="products-sidebar">
            {currentProduct && (
              <div className="product-stats">
                <div className="stat-group">
                  <div className="stat-bubble">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-value">{currentProduct.likes || 0}</span>
                  </div>
                  <p className="stat-label">إعجاب</p>
                </div>

                <div className="stat-group">
                  <div className="stat-bubble">
                    <span className="stat-icon">💬</span>
                    <span className="stat-value">{currentProduct.comments || 0}</span>
                  </div>
                  <p className="stat-label">تعليق</p>
                </div>

                <div className="stat-group">
                  <div className="stat-bubble">
                    <span className="stat-icon">🔖</span>
                    <span className="stat-value">{currentProduct.saves || 0}</span>
                  </div>
                  <p className="stat-label">حفظ</p>
                </div>
              </div>
            )}

            <div className="products-navigation">
              <button 
                className="nav-button prev"
                onClick={goToPreviousProduct}
                disabled={!visibleProducts.length}
                aria-label="المنتج السابق"
              >
                ↑
              </button>
              <button 
                className="nav-button next"
                onClick={goToNextProduct}
                disabled={!visibleProducts.length}
                aria-label="المنتج التالي"
              >
                ↓
              </button>
            </div>
          </div>
        </div>

        <div className="products-list-section">
          <div className="products-section-header">
            <p className="eyebrow">{showSearchState ? `${visibleProducts.length} نتيجة بحث` : 'جميع المنتجات'}</p>
            <h2>{showSearchState ? 'نتائج البحث' : 'تصفح المنتجات'}</h2>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="products-empty-state">
              <strong>مفيش منتجات مطابقة</strong>
              <span>جربي كلمة أبسط أو امسحي البحث وشوفي كل القطع.</span>
            </div>
          ) : (
            <div className="products-grid">
              {visibleProducts.map((product, idx) => {
              const cardImages = getImages(product);
              const cardImageIndex = imageIndex[idx] || 0;
              const cardImage = cardImages[cardImageIndex] || product.image || '/assets/habibvelora-logo-transparent.png';
              const cardImageLoadKey = getImageLoadKey(product, cardImage);

              return (
                <a
                  key={product.id || idx}
                  className={`product-card ${idx === currentIndex ? 'active' : ''}`}
                  href={getProductUrl(product)}
                  onMouseEnter={() => setCurrentIndex(idx)}
                  onFocus={() => setCurrentIndex(idx)}
                >
                  <div className={`card-image ${loadedImages[cardImageLoadKey] ? 'is-loaded' : 'is-loading'}`}>
                    <img
                      key={cardImageLoadKey}
                      data-gallery-image-key={cardImageLoadKey}
                      src={cardImage}
                      alt={product.name}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={idx < 2 ? 'high' : 'auto'}
                      onLoad={() => markImageLoaded(product, cardImage)}
                      onError={(event) => handleImageError(event, product, cardImage)}
                    />
                    {cardImages.length > 1 && (
                      <>
                        <div className="product-card-gallery-controls" aria-label="تقليب صور المنتج">
                          <button
                            type="button"
                            className="product-card-gallery-button prev"
                            onClick={(event) => changeProductImage(event, idx, cardImageIndex - 1)}
                            aria-label="الصورة السابقة"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="product-card-gallery-button next"
                            onClick={(event) => changeProductImage(event, idx, cardImageIndex + 1)}
                            aria-label="الصورة التالية"
                          >
                            ›
                          </button>
                        </div>
                        <div className="product-card-gallery-dots" aria-label="اختيار صورة المنتج">
                          {cardImages.map((_, imageIdx) => (
                            <button
                              key={imageIdx}
                              type="button"
                              className={imageIdx === cardImageIndex ? 'active' : ''}
                              onClick={(event) => changeProductImage(event, idx, imageIdx)}
                              aria-label={`صورة ${imageIdx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="card-content">
                    <h3>{product.name}</h3>
                    {product.category && (
                      <p className="card-category">{product.category}</p>
                    )}
                    {product.price && (
                      <p className="card-price-inline">{product.price} ج.م</p>
                    )}
                  </div>
                </a>
              );
              })}
            </div>
          )}
        </div>
      </main>

      <div id="toastRegion" className="toast-region" aria-live="polite" aria-atomic="true"></div>
    </div>
  );
}

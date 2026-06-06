import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProductsGallery({ products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(products.length, 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [products.length]);

  useEffect(() => {
    const imageIntervals = products.map((_, idx) => 
      setInterval(() => {
        setImageIndex((prev) => ({
          ...prev,
          [idx]: ((prev[idx] || 0) + 1) % Math.max(getImages(products[idx]).length, 1),
        }));
      }, 3500)
    );
    
    return () => imageIntervals.forEach(clearInterval);
  }, [products]);

  const getImages = (product) => {
    if (!product) return [];
    const images = [product.image];
    if (product.hoverImage) images.push(product.hoverImage);
    if (Array.isArray(product.gallery)) {
      images.push(...product.gallery);
    }
    return images.filter(Boolean);
  };

  const currentProduct = products[currentIndex];
  const images = currentProduct ? getImages(currentProduct) : [];
  const currentImageIndex = imageIndex[currentIndex] || 0;
  const currentImage = images[currentImageIndex] || '/assets/habibvelora-logo-transparent.png';

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
          <a href="/follow">تابعينا</a>
          <a href="/after-sales">فاتورة المرتجع</a>
        </nav>

        <div className="products-top-actions">
          <button id="searchButton" className="icon-btn" type="button" aria-label="البحث">
            <span aria-hidden="true">🔍</span>
          </button>
          <button id="themeToggle" className="icon-btn" type="button" aria-label="تبديل الوضع" aria-pressed="false">
            <span aria-hidden="true">🌙</span>
            <small>داكن</small>
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
                <div className="product-image-wrapper">
                  <img 
                    src={currentImage} 
                    alt={currentProduct.name}
                    className="product-image animated"
                    onError={(e) => e.target.src = '/assets/habibvelora-logo-transparent.png'}
                  />
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
                      onClick={() => setImageIndex({ ...imageIndex, [currentIndex]: idx })}
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
                onClick={() => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)}
                aria-label="المنتج السابق"
              >
                ↑
              </button>
              <button 
                className="nav-button next"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % products.length)}
                aria-label="المنتج التالي"
              >
                ↓
              </button>
            </div>
          </div>
        </div>

        <div className="products-list-section">
          <div className="products-section-header">
            <p className="eyebrow">جميع المنتجات</p>
            <h2>تصفح المنتجات</h2>
          </div>

          <div className="products-grid">
            {products.map((product, idx) => (
              <div 
                key={idx} 
                className={`product-card ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <div className="card-image">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => e.target.src = '/assets/habibvelora-logo-transparent.png'}
                  />
                  {product.price && (
                    <div className="card-price">{product.price} ريال</div>
                  )}
                </div>
                <div className="card-content">
                  <h3>{product.name}</h3>
                  {product.category && (
                    <p className="card-category">{product.category}</p>
                  )}
                  <button className="card-action-btn">شراء الآن</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div id="toastRegion" className="toast-region" aria-live="polite" aria-atomic="true"></div>
    </div>
  );
}

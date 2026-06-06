import LegacyPage from '../components/LegacyPage';
import { readProducts } from '../lib/products-store';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeCategory(value) {
  const category = String(value || '').trim() || 'all';
  const compactCategory = category
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, '')
    .toLowerCase();

  if (compactCategory === 'اساور') {
    return 'أساور';
  }

  return category;
}

function categoryBodyHtml(categoryName) {
  const safeCategory = escapeHtml(categoryName === 'all' ? 'كل المنتجات' : categoryName);

  return `
  <div class="page-shell category-page-shell">
    <header class="topbar">
      <a class="brand-block" href="/" aria-label="HabibaVelora">
        <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
        <div class="brand-copy">
          <strong>HabibaVelora</strong>
          <small>مجموعة مستقلة</small>
        </div>
      </a>

      <nav class="topnav" aria-label="التنقل الرئيسي">
        <a href="/">الرئيسية</a>
        <a href="/#categories">الأقسام</a>
        <a href="/follow">تابعينا</a>
        <a href="/order-tracking">متابعة الطلب</a>
        <a href="/after-sales">فاتورة المرتجع</a>
      </nav>

      <div class="top-actions">
        <button id="themeToggle" class="icon-btn" type="button" aria-label="تبديل الوضع" aria-pressed="false">
          <span aria-hidden="true"></span>
          <small>داكن</small>
        </button>
        <a id="cartJump" class="cart-icon-btn" href="/cart" aria-label="سلة الشراء">
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M6 6h15l-1.5 7.5H8.1L7 7.5H5M8.5 14.5h10.8a1 1 0 0 1 .98.79l.72 3.6a1 1 0 0 1-.98 1.21H10.3a1 1 0 0 1-.98-.79L7.1 5.8A1 1 0 0 0 6.12 5H3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10.4" cy="20" r="1.3" fill="currentColor" stroke="none"></circle>
            <circle cx="18.5" cy="20" r="1.3" fill="currentColor" stroke="none"></circle>
          </svg>
          <span id="cartCount" class="cart-count-badge">0</span>
        </a>
      </div>
    </header>

    <main>
      <section class="section-block reveal category-page-hero" style="--delay: 0.05s;">
        <a class="secondary-btn category-return-btn" href="/#collection">العودة إلى المتجر</a>
        <div class="category-page-heading">
          <p class="eyebrow">مجموعة HabibaVelora</p>
          <h1 id="categoryPageTitle">${safeCategory}</h1>
          <p id="categoryPageCopy">اختاري من منتجات القسم وافتحي صفحة المنتج للتفاصيل والطلب.</p>
        </div>

        <div class="catalog-tools catalog-tools-minimal category-page-tools">
          <label class="search-field compact">
            <span>بحث داخل المجموعة</span>
            <input id="productSearch" type="search" aria-label="بحث المنتجات" placeholder="اكتبي اسم المنتج..." />
          </label>
        </div>

        <div class="catalog-shell category-page-catalog">
          <div class="catalog-column">
            <div id="productGrid" class="product-grid"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>`;
}

export default function CategoryPage({ initialProducts = [], categoryName = 'all' }) {
  const label = categoryName === 'all' ? 'كل المنتجات' : categoryName;

  return (
    <LegacyPage
      title={`${label} | HabibaVelora`}
      description={`تصفحي منتجات ${label} من HabibaVelora في صفحة مجموعة مستقلة.`}
      bodyHtml={categoryBodyHtml(categoryName)}
      scripts={['/tracking.js', '/script.js', '/main.js']}
      initialProducts={initialProducts}
    />
  );
}

export async function getServerSideProps({ query }) {
  const categoryName = normalizeCategory(Array.isArray(query.name) ? query.name[0] : query.name);

  return {
    props: {
      categoryName,
      initialProducts: await readProducts(),
    },
  };
}

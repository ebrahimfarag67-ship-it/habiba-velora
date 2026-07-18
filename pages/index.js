import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { readProducts } from '../lib/products-store';

const CART_KEY = 'velora-store-v4-cart';
const BRAND_LOGO = '/assets/habibvelora-logo.svg';
const HERO_IMAGE = '/assets/habiba-velora-hero-editorial.png';
const WHATSAPP_DIRECT_URL = 'https://wa.me/201024622437';
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GOOoB46pD9hAySEYNxSQO3?s=cl&p=a&mlu=2';
const INSTAGRAM_URL = 'https://www.instagram.com/velora_accessories.17?igsh=ODUweTBnczNncjd3';

const NAV_LINKS = [
  { label: 'الأقسام', href: '#collections' },
  { label: 'المنتجات', href: '/products' },
  { label: 'اختاري طلبك', href: '#order-guide' },
  { label: 'الشحن', href: '#shipping-policy' },
  { label: 'تتبعي طلبك', href: '/order-tracking' },
];

const ORDER_STEPS = [
  ['01', 'اختاري القطعة', 'اتصفحي الأقسام واختاري المنتج المناسب لستايلك.'],
  ['02', 'راجعي التفاصيل', 'افتحي صفحة المنتج وشوفي الصور والسعر والمقاس أو النوع.'],
  ['03', 'ضيفي للسلة', 'حددي اختيارك واضغطي إضافة للسلة بدون خطوات زيادة.'],
  ['04', 'أكدي الطلب', 'اكتبي بياناتك، وبعدها تقدري تتابعي حالة الطلب.'],
];

const SHIPPING_POINTS = [
  ['تكلفة الشحن', 'بتتحدد حسب المحافظة من شركة الشحن وقت تأكيد الطلب.'],
  ['مدة التجهيز', 'التجهيز والتغليف خلال 48 إلى 72 ساعة عمل.'],
  ['مدة الوصول', 'الوصول غالبًا خلال 2 إلى 5 أيام عمل بعد التسليم للشحن.'],
  ['الاستبدال والإرجاع', 'متاح حسب حالة القطعة وسياسة الإرجاع وقت المراجعة.'],
];

const EDITORIAL_FALLBACKS = [
  {
    id: 'editorial-hero',
    name: 'اختيارات Habiba Velora',
    category: 'The edit',
    image: HERO_IMAGE,
    href: '/products',
    fallback: true,
  },
  {
    id: 'editorial-brand',
    name: 'تفاصيل هادئة لكل يوم',
    category: 'Signature',
    image: '/assets/habiba-velora-hero.png',
    href: '/products',
    fallback: true,
  },
  {
    id: 'editorial-logo',
    name: 'أناقة بتوقيع HV',
    category: 'Velora',
    image: HERO_IMAGE,
    href: '/products',
    fallback: true,
  },
];

function normalizeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value) {
  const amount = Math.max(0, Math.round(toNumber(value)));
  return `${new Intl.NumberFormat('ar-EG').format(amount)} ج.م`;
}

function normalizePriceOptions(options) {
  return (Array.isArray(options) ? options : [])
    .map((option) => ({
      label: normalizeText(option?.label),
      price: Math.max(0, toNumber(option?.price)),
    }))
    .filter((option) => option.label && option.price > 0)
    .sort((first, second) => first.price - second.price || first.label.localeCompare(second.label, 'ar'));
}

function productPrice(product) {
  const options = normalizePriceOptions(product?.priceOptions);
  if (options.length > 1) {
    const prices = options.map((option) => option.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`;
  }
  if (options.length === 1) return formatMoney(options[0].price);
  return toNumber(product?.price) > 0 ? formatMoney(product.price) : 'اكتشفي السعر';
}

function getGallery(product) {
  const images = [
    product?.image,
    product?.hoverImage,
    ...(Array.isArray(product?.gallery) ? product.gallery : []),
    product?.backImage,
    product?.sideImage,
  ];
  return [...new Set(images.map((item) => normalizeText(item)).filter(Boolean))];
}

function normalizeProduct(product, index) {
  const gallery = getGallery(product);
  const priceOptions = normalizePriceOptions(product?.priceOptions);
  const optionPrices = priceOptions.map((option) => option.price);
  const price = Math.max(0, toNumber(product?.price)) || (optionPrices.length ? Math.min(...optionPrices) : 0);
  const compareAtPrice = Math.max(0, toNumber(product?.compareAtPrice));

  return {
    ...product,
    id: normalizeText(product?.id, `product-${index + 1}`),
    name: normalizeText(product?.name, `قطعة مميزة ${index + 1}`),
    category: normalizeText(product?.category, 'إكسسوارات'),
    image: gallery[0] || '',
    gallery,
    price,
    compareAtPrice,
    priceOptions,
    stock: product?.stock === undefined || product?.stock === null || product?.stock === ''
      ? 999
      : Math.max(0, Math.floor(toNumber(product.stock))),
    featured: Boolean(product?.featured || product?.homeFeatured || index < 8),
    badge: normalizeText(product?.badge),
  };
}

function productUrl(product) {
  return `/product?id=${encodeURIComponent(product.id)}`;
}

function categoryUrl(name) {
  return `/category?name=${encodeURIComponent(name)}`;
}

function cartQuantity() {
  if (typeof window === 'undefined') return 0;
  try {
    const cart = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(cart)
      ? cart.reduce((sum, item) => sum + Math.max(1, Math.floor(toNumber(item?.qty, 1))), 0)
      : 0;
  } catch {
    return 0;
  }
}

function ProductImage({ src, alt, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`lux-image-fallback ${className}`} aria-hidden="true">
        <img src={BRAND_LOGO} alt="" />
      </div>
    );
  }
  return <img className={className} src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailed(true)} />;
}

function SectionTitle({ eyebrow, title, copy, light = false }) {
  return (
    <div className={`lux-section-title${light ? ' is-light' : ''}`}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <span>{copy}</span> : null}
    </div>
  );
}

function ProductCard({ product, index }) {
  const sale = product.compareAtPrice > product.price && product.price > 0;
  return (
    <a className="lux-product-card" href={productUrl(product)}>
      <div className="lux-product-media">
        <ProductImage src={product.image} alt={product.name} loading={index < 4 ? 'eager' : 'lazy'} />
        <small>{product.badge || (sale ? 'عرض خاص' : 'اختيار المتجر')}</small>
      </div>
      <div className="lux-product-meta">
        <div>
          <span>{product.category}</span>
          <h3>{product.name}</h3>
        </div>
        <div className="lux-price-stack">
          <strong>{productPrice(product)}</strong>
          {sale ? <del>{formatMoney(product.compareAtPrice)}</del> : null}
        </div>
      </div>
    </a>
  );
}

function HomePage({ initialProducts = [] }) {
  const [products, setProducts] = useState(() => initialProducts.map(normalizeProduct));
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const categoryRailRef = useRef(null);

  useEffect(() => {
    setCartCount(cartQuantity());
    fetch('/api/products')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('products failed'))))
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload?.products;
        if (Array.isArray(list)) setProducts(list.map(normalizeProduct));
      })
      .catch(() => {});
  }, []);

  const liveProducts = useMemo(
    () => products.filter((product) => product.stock !== 0),
    [products],
  );

  const productImages = useMemo(
    () => liveProducts.filter((product) => product.image),
    [liveProducts],
  );

  const heroProducts = productImages.slice(0, 3);
  const heroMainImage = heroProducts[0]?.image || HERO_IMAGE;

  const categories = useMemo(() => {
    const groups = new Map();
    liveProducts.forEach((product) => {
      const current = groups.get(product.category) || {
        name: product.category,
        count: 0,
        image: '',
        href: categoryUrl(product.category),
      };
      current.count += 1;
      if (!current.image && product.image) current.image = product.image;
      groups.set(product.category, current);
    });
    return Array.from(groups.values())
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, 'ar'))
      .slice(0, 10);
  }, [liveProducts]);

  const featuredProducts = useMemo(() => {
    const featured = liveProducts.filter((product) => product.featured && product.image);
    return (featured.length ? featured : productImages).slice(0, 8);
  }, [liveProducts, productImages]);

  const promoProducts = productImages.slice(0, 3);
  const editorialCards = promoProducts.length ? promoProducts : EDITORIAL_FALLBACKS;

  const scrollCategories = (direction) => {
    const rail = categoryRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Habiba Velora | إكسسوارات مختارة بعناية</title>
        <meta
          name="description"
          content="اكتشفي إكسسوارات Habiba Velora المختارة بعناية مع صور منتجات حقيقية وأسعار بالجنيه المصري."
        />
        <meta property="og:title" content="Habiba Velora" />
        <meta property="og:image" content={heroMainImage} />
      </Head>

      <div className="lux-home">
        <header className="lux-navbar">
          <a className="lux-brand" href="/" aria-label="Habiba Velora">
            <img className="brand-mark" src={BRAND_LOGO} alt="" />
            <span>Habiba Velora</span>
          </a>

          <nav className={menuOpen ? 'is-open' : ''} aria-label="القائمة الرئيسية">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lux-nav-actions">
            <a href="/cart" className="lux-cart-link" aria-label={`السلة بها ${cartCount} منتج`}>
              السلة <b>{cartCount}</b>
            </a>
            <button className="lux-menu-toggle" type="button" aria-label="فتح القائمة" onClick={() => setMenuOpen((open) => !open)}>
              <i />
              <i />
            </button>
          </div>
        </header>

        <main>
          <section className="lux-hero">
            <div className="lux-hero-copy">
              <p>Habiba Velora</p>
              <h1>
                أناقة هادئة
                <span>بتفاصيل تلمع في وقتها.</span>
              </h1>
              <strong>إكسسوارات مختارة بعناية، بصور حقيقية من منتجات المتجر وأسعار واضحة بالجنيه المصري.</strong>
              <div className="lux-hero-actions">
                <a className="lux-button lux-button-gold" href="/products">تسوقي الآن</a>
                <a className="lux-text-link" href="#collections">اكتشفي الأقسام</a>
              </div>
            </div>

            <div className="lux-hero-showcase" aria-label="منتجات Habiba Velora">
              <div className="lux-hero-card is-main">
                <ProductImage src={heroMainImage} alt={heroProducts[0]?.name || 'Habiba Velora'} loading="eager" />
              </div>
              <div className="lux-hero-card is-small">
                <ProductImage src={heroProducts[1]?.image || promoProducts[1]?.image || HERO_IMAGE} alt={heroProducts[1]?.name || 'تفاصيل Habiba Velora'} loading="eager" />
              </div>
              <div className="lux-hero-card is-small">
                <ProductImage src={heroProducts[2]?.image || promoProducts[2]?.image || HERO_IMAGE} alt={heroProducts[2]?.name || 'اختيارات Habiba Velora'} loading="eager" />
              </div>
            </div>
          </section>

          <section className="lux-benefit-strip" aria-label="مميزات المتجر">
            <article>
              <b>صور حقيقية</b>
              <span>من المنتجات المضافة في لوحة التحكم.</span>
            </article>
            <article>
              <b>أسعار واضحة</b>
              <span>كل الأسعار بالجنيه المصري ج.م.</span>
            </article>
            <article>
              <b>تسوق سريع</b>
              <span>الأقسام والمنتجات مرتبطة مباشرة بصفحاتها.</span>
            </article>
          </section>

          <section className="lux-section" id="collections">
            <div className="lux-title-row">
              <SectionTitle
                eyebrow="Shop by category"
                title="الأقسام في حركة واحدة"
                copy="اسحبي الشريط أو استخدمي الأسهم، وكل قسم بياخدك لمنتجاته مباشرة."
              />
              <div className="lux-rail-controls" aria-label="تحريك الأقسام">
                <button type="button" onClick={() => scrollCategories(1)} aria-label="السابق">‹</button>
                <button type="button" onClick={() => scrollCategories(-1)} aria-label="التالي">›</button>
              </div>
            </div>

            {categories.length ? (
              <div className="lux-category-rail" ref={categoryRailRef}>
                {categories.map((category, index) => (
                  <a className="lux-category-card" href={category.href} key={category.name}>
                    <ProductImage src={category.image} alt={category.name} loading={index < 3 ? 'eager' : 'lazy'} />
                    <i />
                    <div>
                      <small>{String(index + 1).padStart(2, '0')}</small>
                      <h3>{category.name}</h3>
                      <span>{category.count} منتج</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="lux-empty-state">
                <img src={BRAND_LOGO} alt="" />
                <div>
                  <h3>الأقسام هتظهر تلقائيًا</h3>
                  <p>أول ما تضيف منتجات من لوحة التحكم، هتظهر الأقسام هنا بصور المنتجات الحقيقية.</p>
                </div>
              </div>
            )}
          </section>

          <section className="lux-editorial" id="new-arrivals">
            <div className="lux-editorial-copy">
              <p>New arrivals</p>
              <h2>وصل حديثًا من القطع المختارة.</h2>
              <span>بانرات مبنية على صور المنتجات المتاحة بدل صور وهمية، عشان الصفحة تبقى قريبة من المتجر الحقيقي.</span>
              <a className="lux-button lux-button-dark" href="/products">كل المنتجات</a>
            </div>
            <div className="lux-promo-grid">
              {editorialCards.slice(0, 3).map((product, index) => (
                <a className={`lux-promo-card promo-${index}`} href={product.fallback ? product.href : productUrl(product)} key={product.id}>
                  <ProductImage src={product.image} alt={product.name} />
                  <div>
                    <small>{product.category}</small>
                    <b>{product.name}</b>
                    <span>{product.fallback ? 'تتحدث تلقائيًا من منتجات المتجر' : productPrice(product)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="lux-section" id="store-picks">
            <div className="lux-title-row">
              <SectionTitle
                eyebrow="Store picks"
                title="اختيارات المتجر"
                copy="أبرز المنتجات الحالية، بأسعارها وصورها من نفس بيانات المتجر."
              />
              <a className="lux-outline-link" href="/products">مشاهدة الكل</a>
            </div>

            {featuredProducts.length ? (
              <div className="lux-products-grid">
                {featuredProducts.map((product, index) => (
                  <ProductCard product={product} index={index} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="lux-empty-state">
                <img src={BRAND_LOGO} alt="" />
                <div>
                  <h3>المنتجات لسه بتتجهز</h3>
                  <p>ضيف منتجاتك من لوحة التحكم، والواجهة هتتحدث تلقائيًا من `/api/products`.</p>
                </div>
              </div>
            )}
          </section>

          <section className="lux-guide" id="order-guide">
            <SectionTitle
              eyebrow="How to order"
              title="اختاري طلبك بسهولة"
              copy="القسم ده مدمج داخل الصفحة بعد الأقسام، بنفس الألوان والخطوط."
              light
            />
            <div className="lux-guide-grid">
              {ORDER_STEPS.map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lux-shipping" id="shipping-policy">
            <div>
              <SectionTitle
                eyebrow="Shipping policy"
                title="سياسة الشحن"
                copy="معلومات واضحة في نفس تصميم الصفحة، بدون بلوكات بيضاء منفصلة."
              />
              <a className="lux-outline-link" href="/return-policy">سياسة الإرجاع</a>
            </div>
            <div className="lux-shipping-list">
              {SHIPPING_POINTS.map(([title, copy]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lux-story">
            <div className="lux-story-media">
              <img src={BRAND_LOGO} alt="" />
              <span>HV</span>
            </div>
            <article>
              <p>Our story</p>
              <h2>Habiba Velora بتصميم أهدى وأفخم.</h2>
              <span>
                مكان علامة HV هنا جزء من قصة البراند، مش خلفية مزعجة في أول الصفحة. الواجهة بتركز على المنتجات،
                والأقسام، وخطوات الشراء بدل زحمة الحركات القديمة.
              </span>
              <a className="lux-text-link" href="/about">اقرأي القصة</a>
            </article>
          </section>
        </main>

        <footer className="lux-footer">
          <div>
            <a className="lux-footer-brand" href="/">
              <img src={BRAND_LOGO} alt="" />
              <span>Habiba Velora</span>
            </a>
            <p>أناقة بتفاصيل هادئة، مختارة عشان كل قطعة تعبر عن ذوقك بثقة.</p>
          </div>
          <nav>
            <strong>روابط سريعة</strong>
            <a href="/products">كل المنتجات</a>
            <a href="#collections">الأقسام</a>
            <a href="/order-tracking">تتبع الطلب</a>
            <a href="/after-sales">المرتجعات</a>
          </nav>
          <nav>
            <strong>تواصلي معنا</strong>
            <a href={WHATSAPP_DIRECT_URL} target="_blank" rel="noreferrer">واتساب مباشر</a>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">مجموعة واتساب</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">إنستجرام</a>
          </nav>
        </footer>
      </div>
    </>
  );
}

export default HomePage;

export async function getServerSideProps() {
  try {
    const products = await readProducts();
    return { props: { initialProducts: Array.isArray(products) ? products : [] } };
  } catch {
    return { props: { initialProducts: [] } };
  }
}

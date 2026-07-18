import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { readProducts } from '../lib/products-store';

const CART_KEY = 'velora-store-v4-cart';
const THEME_KEY = 'velora-store-v4-theme';
const FALLBACK_IMAGE = '';
const ADMIN_SHORTCUT_CLICKS = 5;

const PROCESS_STEPS = [
  {
    number: '01',
    icon: 'browse',
    titleAr: 'اختاري القطعة',
    titleEn: 'Choose your piece',
    copyAr: 'اتصفحي الأقسام وشوفي الصور والتفاصيل قبل ما تقرري.',
    copyEn: 'Browse collections and check photos and details before choosing.',
  },
  {
    number: '02',
    icon: 'bag',
    titleAr: 'ضيفيها للسلة',
    titleEn: 'Add to cart',
    copyAr: 'اختاري النوع أو المقاس لو موجود، وبعدها ضيفي المنتج للسلة.',
    copyEn: 'Pick the type or size when available, then add the item to cart.',
  },
  {
    number: '03',
    icon: 'form',
    titleAr: 'أدخلي البيانات',
    titleEn: 'Confirm details',
    copyAr: 'اكتبي بيانات التوصيل وراجعي الطلب قبل الإرسال.',
    copyEn: 'Enter delivery details and review the order before sending.',
  },
  {
    number: '04',
    icon: 'route',
    titleAr: 'تابعي واستلمي',
    titleEn: 'Track and receive',
    copyAr: 'تابعي حالة الطلب لحد ما يوصل لبابك بأمان.',
    copyEn: 'Track the order status until it arrives safely.',
  },
];

const SHIPPING_STEPS = [
  {
    number: '01',
    icon: 'badge-check',
    titleAr: 'تأكيد الطلب',
    titleEn: 'Order confirmation',
    copyAr: 'بنراجع الطلب ونبدأ التجهيز فورًا.',
    copyEn: 'We review your order and start preparing it.',
  },
  {
    number: '02',
    icon: 'package',
    titleAr: 'التجهيز والتغليف',
    titleEn: 'Packing',
    copyAr: 'التجهيز خلال 48 إلى 72 ساعة عمل بعناية.',
    copyEn: 'Prepared carefully within 48 to 72 business hours.',
  },
  {
    number: '03',
    icon: 'truck',
    titleAr: 'التسليم للشحن',
    titleEn: 'Handed to courier',
    copyAr: 'بنسلم الطلب لشركة الشحن وتوصلك بيانات التتبع.',
    copyEn: 'The courier receives it and tracking details are sent.',
  },
  {
    number: '04',
    icon: 'package-check',
    titleAr: 'الاستلام',
    titleEn: 'Delivery',
    copyAr: 'يوصل لبابك خلال 2 إلى 5 أيام عمل بعد التسليم.',
    copyEn: 'Delivered in 2 to 5 business days after handoff.',
  },
];

const WHATSAPP_DIRECT_URL = 'https://wa.me/201024622437';
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GOOoB46pD9hAySEYNxSQO3?s=cl&p=a&mlu=2';
const INSTAGRAM_URL = 'https://www.instagram.com/velora_accessories.17?igsh=ODUweTBnczNncjd3';

const FOOTER_FAQS = [
  {
    question: 'هل في شحن؟',
    answer: 'الشحن متاح، والتكلفة بتتحدد من شركة الشحن حسب المحافظة.',
  },
  {
    question: 'بتوصلوا المحافظات؟',
    answer: 'بنوصّل لجميع المحافظات، وبيتم تأكيد بيانات العنوان قبل تجهيز الطلب.',
  },
  {
    question: 'ممكن أرجع المنتج؟',
    answer: 'ممكن تطلبي إرجاع أو استبدال حسب سياسة الإرجاع وحالة المنتج وقت المراجعة.',
  },
  {
    question: 'طلبي وصل تالف؟',
    answer: 'ابعتي رقم الطلب وصورة واضحة خلال 24 ساعة، وهنراجع الحالة معاك بسرعة.',
  },
  {
    question: 'بتقبلوا كاش؟',
    answer: 'جاري تفعيل خدمة الكاش، والدفع المتاح حاليًا بيظهر لك أثناء تأكيد الطلب.',
  },
];

const FOOTER_LINKS = [
  { label: 'الرئيسية', href: '/' },
  { label: 'كل المنتجات', href: '/products' },
  { label: 'سياسة الشحن', href: '#shipping-policy' },
  { label: 'سياسة الإرجاع', href: '/return-policy' },
  { label: 'قصتنا', href: '/about' },
  { label: 'تابعينا', href: '/follow' },
];

const MONOGRAM_LAYERS = Array.from({ length: 12 }, (_, index) => index);
const MONOGRAM_GEMS = Array.from({ length: 12 }, (_, index) => index + 1);
const MONOGRAM_PARTICLES = Array.from({ length: 16 }, (_, index) => index + 1);

const COLLECTION_TARGET_ID = 'collection';
function normalizeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function parseNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : fallback;
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
  const explicitStock = product?.stock === undefined || product?.stock === null || product?.stock === '';
  const stock = explicitStock ? 999 : Math.max(0, Math.floor(parseNumber(product.stock)));
  const category = normalizeText(product?.category, 'إكسسوارات');
  const name = normalizeText(product?.name, `قطعة ${index + 1}`);

  return {
    id: normalizeText(product?.id, `product-${index + 1}`),
    name,
    category,
    stock,
    image: gallery[0] || FALLBACK_IMAGE,
    gallery,
    featured: Boolean(product?.featured || product?.homeFeatured || index < 6),
  };
}

function readCart() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cartQuantity(cart) {
  return cart.reduce((total, item) => total + Math.max(1, Math.floor(parseNumber(item?.qty, 1))), 0);
}

function readTheme() {
  try {
    window.localStorage.setItem(THEME_KEY, 'dark');
  } catch {
    // ignore unavailable storage
  }

  return 'dark';
}

function applyTheme() {
  document.body.dataset.theme = 'dark';
  try {
    window.localStorage.setItem(THEME_KEY, 'dark');
  } catch {
    // ignore unavailable storage
  }
}

function categoryUrl(name) {
  return `/category?name=${encodeURIComponent(name)}`;
}

function buildCategoryCards(products) {
  const groups = new Map();

  products.forEach((product) => {
    const current = groups.get(product.category) || {
      name: product.category,
      count: 0,
      products: [],
    };
    current.count += 1;
    current.products.push(product);
    groups.set(product.category, current);
  });

  return Array.from(groups.values())
    .map((category) => {
      const representative =
        category.products.find((product) => product.featured && product.image) ||
        category.products.find((product) => product.image) ||
        category.products[0];
      return {
        ...category,
        href: categoryUrl(category.name),
        image: representative?.image || FALLBACK_IMAGE,
      };
    })
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, 'ar'));
}

function FooterSocialIcon({ type }) {
  if (type === 'instagram') {
    return (
      <svg viewBox="0 0 448 512" aria-hidden="true">
        <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141Zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.5 74.7-74.7 74.7Zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8Zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S3.3 127.6 1.6 163.5c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8-.1-184.9ZM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1Z" />
      </svg>
    );
  }

  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 320 512" aria-hidden="true">
        <path d="M279.14 288 293 197.7h-86.7v-58.6c0-24.7 12.1-48.8 50.9-48.8H296V13.6S260.4 7.5 226.3 7.5c-73.2 0-121.1 44.4-121.1 124.7v65.5H24V288h81.2v216h101.1V288Z" />
      </svg>
    );
  }

  if (type === 'whatsapp-group') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.1 3.2C9.1 3.2 3.5 8.8 3.5 15.7c0 2.2.6 4.3 1.6 6.1L3.8 28l6.4-1.7c1.7.9 3.7 1.5 5.9 1.5 6.9 0 12.5-5.6 12.5-12.5S23 3.2 16.1 3.2Zm0 22.3c-1.9 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.3-.4c-1-1.5-1.6-3.3-1.6-5.1C5.9 10.1 10.5 5.6 16.1 5.6s10.2 4.5 10.2 10.1-4.6 9.8-10.2 9.8Z" />
        <path d="M21.4 18.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-.9 1.2s-.4.2-.7.1c-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 2.9 1.2 3.1c.2.2 2 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1 0-.3-.1-.6-.3Z" />
        <path d="M22.3 8.4c1.8.1 3.2 1.6 3.2 3.4M24.8 6.4c2.4.8 4.1 3.1 4.1 5.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 448 512" aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 1.9 131.6 1.9 254c0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157Zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5Zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.5-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.5-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6Z" />
    </svg>
  );
}

const REFERENCE_HERO_IMAGE = '/assets/habiba-velora-hero.png';
const FALLBACK_CATEGORY_CARDS = [
  {
    name: 'سلاسل',
    count: 12,
    href: categoryUrl('سلاسل'),
    image: '/api/product-image?path=products%2F1780175302885-xu1ai4zdzs.png',
  },
  {
    name: 'حلقان',
    count: 2,
    href: categoryUrl('حلقان'),
    image: '/api/product-image?path=products%2F1781303680353-0gwq1nj8iy8e.webp',
  },
  {
    name: 'أساور',
    count: 2,
    href: categoryUrl('أساور'),
    image: '/api/product-image?path=products%2F1780531944146-ch6hveymv5s.png',
  },
  {
    name: 'انسيالات',
    count: 2,
    href: categoryUrl('انسيالات'),
    image: '/api/product-image?path=products%2F1780532099844-qqpdx9cuei.png',
  },
  {
    name: 'خواتم',
    count: 1,
    href: categoryUrl('خواتم'),
    image: '/api/product-image?path=products%2F1780530255626-7itj27ex7sn.png',
  },
];
function ContactButton({ href = '#collection', children, onClick }) {
  return (
    <a className="home-hero-contact-button" href={href} onClick={onClick}>
      <span>{children}</span>
    </a>
  );
}

function MotionMarqueeSection({ items }) {
  const categoriesWithImages = items.filter((item) => item.image);
  const fallbackItems = [{
    name: 'Habiba Velora',
    href: '#collection',
    image: REFERENCE_HERO_IMAGE,
    count: 0,
  }];
  const displayItems = categoriesWithImages.length ? categoriesWithImages : fallbackItems;
  const rowOneBase = displayItems;
  const rowTwoBase = [...displayItems].reverse();
  const rowOne = rowOneBase.concat(rowOneBase, rowOneBase);
  const rowTwo = rowTwoBase.concat(rowTwoBase, rowTwoBase);

  return (
    <section className="motion-marquee-section" aria-label="معاينة أقسام Habiba Velora" data-no-translate>
      <div className="motion-marquee-row motion-marquee-row-one">
        {rowOne.map((item, index) => (
          <a className="motion-marquee-tile" href={item.href} key={`marquee-one-${item.name}-${index}`}>
            <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
            <span>{item.name}</span>
          </a>
        ))}
      </div>
      <div className="motion-marquee-row motion-marquee-row-two" aria-hidden="true">
        {rowTwo.map((item, index) => (
          <a className="motion-marquee-tile" href={item.href} tabIndex={-1} key={`marquee-two-${item.name}-${index}`}>
            <img src={item.image} alt="" loading="lazy" decoding="async" />
            <span>{item.count ? `${item.count} منتج في ${item.name}` : 'Habiba Velora'}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function HomeHeroImage({
  onAdminShortcut,
  onCollectionJump,
}) {
  return (
    <section
      className="clean-section home-hero-image home-hero-image-static reveal"
      aria-label="Habiba Velora"
      data-no-translate
    >
      <header className="clean-header clean-home-header">
        <nav className="clean-nav" aria-label="Reference hero navigation">
          <a href="#brand-story">قصتي</a>
          <a href="#collection" onClick={onCollectionJump}>الأقسام</a>
          <a href="/products">المنتجات</a>
          <a href="/follow">تواصل</a>
        </nav>
      </header>

      <a className="home-hero-image-link" href="#collection" onClick={onCollectionJump} aria-label="تسوقي مجموعة Habiba Velora">
        <img
          className="home-hero-art"
          src={REFERENCE_HERO_IMAGE}
          alt="Habiba Velora"
          decoding="async"
          fetchPriority="high"
        />
      </a>

      <a className="home-hero-admin-hotspot" href="/" onClick={onAdminShortcut} aria-label="Habiba Velora home">HV</a>
    </section>
  );
}

function ReferenceAboutSection() {
  const storyLines = [
    'صنعنا اللحظة التي تشعرين فيها أنكِ لا تحتاجين إلى شيء آخر.',
    'من مصر، بكل ما فيها من أصالة وجمال.',
    'إلى المرأة التي تستحق ما هو أبعد من العادي.',
    'رحلتنا بدأت بشغف حقيقي بالتفاصيل، واختيار قطع تعيش بجمالها وتعبّر عن الثقة والذوق.',
  ];

  return (
    <section className="reference-about-section reference-brand-story" id="brand-story" aria-labelledby="referenceAboutTitle" data-no-translate>
      <div className="reference-story-copy">
        <p className="reference-section-kicker">قصتي</p>
        <h2 id="referenceAboutTitle" className="reference-gradient-heading">Habiba Velora</h2>
        <div className="reference-story-lines">
          {storyLines.map((line, index) => (
            <span style={{ '--story-line': index }} key={line}>{line}</span>
          ))}
        </div>
        <ContactButton href="/about">اكتشفي القصة</ContactButton>
      </div>
      <div className="reference-story-mark">
        <div className="velora-monogram-scene" aria-hidden="true" dir="ltr" lang="en">
          <div className="velora-monogram-glow" />
          <div className="velora-silk-plane" />
          <div className="velora-caustic-field" />
          {MONOGRAM_PARTICLES.map((particle) => (
            <span key={`story-particle-${particle}`} className={`velora-particle p-${particle}`} />
          ))}

          <div className="velora-monogram-orbit">
            <div className="velora-monogram-object">
              <span className="velora-monogram-halo" />
              <span className="velora-3d-ring velora-3d-ring-back" />
              {MONOGRAM_LAYERS.map((layer) => (
                <span
                  key={`story-layer-${layer}`}
                  className="velora-monogram-layer"
                  style={{ '--layer': layer }}
                >
                  HV
                </span>
              ))}
              <span className="velora-monogram-core">HV</span>
              <span className="velora-monogram-shine">HV</span>
              <span className="velora-3d-ring velora-3d-ring-front" />
              <span className="velora-ring-stone" />
              {MONOGRAM_GEMS.map((gem) => (
                <i key={`story-gem-${gem}`} className={`velora-gem g-${gem}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReferenceJourneySection({ onCollectionJump }) {
  const quickLinks = [
    { label: 'الأقسام', href: '#collection', onClick: onCollectionJump },
    { label: 'كل المنتجات', href: '/products' },
    { label: 'تتبع الطلب', href: '/order-tracking' },
    { label: 'المرتجع', href: '/after-sales' },
    { label: 'تواصل', href: '/follow' },
  ];

  return (
    <section className="reference-journey-section" id="reference-services" aria-labelledby="referenceJourneyTitle" data-no-translate>
      <div className="reference-journey-head">
        <p className="reference-section-kicker">تجربة المتجر</p>
        <h2 id="referenceJourneyTitle">اختاري طلبك</h2>
        <p>كل التفاصيل المهمة بقت داخل نفس الصفحة، من اختيار القطعة لحد الشحن والروابط السريعة.</p>
      </div>

      <div className="reference-journey-grid">
        <div className="reference-journey-panel reference-order-panel">
          <div className="reference-panel-head">
            <span>01</span>
            <h3>خطوات الطلب</h3>
          </div>
          <div className="reference-step-list">
            {PROCESS_STEPS.map((step) => (
              <article className="reference-mini-step" key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h4>{step.titleAr}</h4>
                  <p>{step.copyAr}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="reference-journey-panel reference-shipping-panel">
          <div className="reference-panel-head">
            <span>02</span>
            <h3>سياسة الشحن</h3>
          </div>
          <div className="reference-step-list">
            {SHIPPING_STEPS.map((step) => (
              <article className="reference-mini-step" key={`journey-shipping-${step.number}`}>
                <span>{step.number}</span>
                <div>
                  <h4>{step.titleAr}</h4>
                  <p>{step.copyAr}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="reference-shipping-note">
            أسعار الشحن بتحددها شركة الشحن حسب المحافظة، و Habiba Velora ليس لها دخل في التسعير.
          </p>
        </div>
      </div>

      <nav className="reference-page-menu" aria-label="روابط سريعة داخل الصفحة">
        {quickLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={link.onClick}>
            {link.label}
          </a>
        ))}
        <a href={WHATSAPP_DIRECT_URL} target="_blank" rel="noreferrer">واتساب</a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">إنستجرام</a>
      </nav>
    </section>
  );
}

function ReferenceProjectsSection({ items }) {
  const categoryItems = items.filter((item) => item.image);

  return (
    <section className="reference-projects-section" id="collection" aria-labelledby="referenceProjectsTitle" data-no-translate>
      <h2 id="referenceProjectsTitle" className="reference-gradient-heading">الأقسام</h2>
      <div className="reference-project-stack">
        {categoryItems.length > 0 ? categoryItems.map((category, index) => (
          <div className="reference-category-stage" style={{ '--card-index': index }} key={category.name}>
            <article className="reference-project-card reference-category-card">
              <div className="reference-project-head">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{category.count} منتج</small>
                <h3>{category.name}</h3>
                <a href={category.href}>دخول القسم</a>
              </div>
              <div className="reference-category-media">
                <img src={category.image} alt={category.name} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
                <div className="reference-category-copy">
                  <p>قسم مختار من Habiba Velora بمنتجاته وصورته الحقيقية من المتجر.</p>
                  <strong>تسوقي {category.name}</strong>
                </div>
              </div>
            </article>
          </div>
        )) : (
          <div className="reference-empty-collections">
            <strong>الأقسام هتظهر هنا أول ما تضيف منتجات.</strong>
            <p>ضيف منتج وحدد القسم، والواجهة هتعرض صورة كل قسم تلقائيًا.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function VeloraMonogramShowcase() {
  return (
    <section className="clean-section velora-3d-signature reveal" aria-labelledby="velora3dTitle" data-no-translate>
      <div className="clean-section-parallax velora-3d-stage">
        <div className="velora-3d-copy">
          <p className="clean-process-kicker">HABIBA VELORA</p>
          <h2 id="velora3dTitle">لم نصنع مجوهرات.</h2>
          <div className="velora-3d-story-lines">
            <span style={{ '--story-line': 0 }}>صنعنا اللحظة التي تشعرين فيها أنكِ لا تحتاجين إلى شيء آخر.</span>
            <span style={{ '--story-line': 1 }}>من مصر، بكل ما فيها من أصالة وجمال.</span>
            <span style={{ '--story-line': 2 }}>إلى المرأة التي تستحق ما هو أبعد من العادي.</span>
            <span style={{ '--story-line': 3 }}>رحلتنا بدأت بشغف حقيقي بالتفاصيل، واختيار قطع تعيش بجمالها وتعبّر عن الثقة والذوق.</span>
          </div>
          <a className="velora-3d-story-link" href="/about">اكتشفي من أنتِ معنا</a>
        </div>

        <div className="velora-monogram-scene" aria-hidden="true" dir="ltr" lang="en">
          <div className="velora-monogram-glow" />
          <div className="velora-silk-plane" />
          <div className="velora-caustic-field" />
          {MONOGRAM_PARTICLES.map((particle) => (
            <span key={`particle-${particle}`} className={`velora-particle p-${particle}`} />
          ))}

          <div className="velora-monogram-orbit">
            <div className="velora-monogram-object">
              <span className="velora-monogram-halo" />
              <span className="velora-3d-ring velora-3d-ring-back" />
              {MONOGRAM_LAYERS.map((layer) => (
                <span
                  key={`layer-${layer}`}
                  className="velora-monogram-layer"
                  style={{ '--layer': layer }}
                >
                  HV
                </span>
              ))}
              <span className="velora-monogram-core">HV</span>
              <span className="velora-monogram-shine">HV</span>
              <span className="velora-3d-ring velora-3d-ring-front" />
              <span className="velora-ring-stone" />
              {MONOGRAM_GEMS.map((gem) => (
                <i key={`gem-${gem}`} className={`velora-gem g-${gem}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ initialProducts = [] }) {
  const [liveProducts, setLiveProducts] = useState([]);
  const products = useMemo(
    () => {
      const sourceProducts = liveProducts.length ? liveProducts : initialProducts;
      return sourceProducts.map((product, index) => normalizeProduct(product, index));
    },
    [initialProducts, liveProducts],
  );
  const availableProducts = useMemo(
    () => products.filter((product) => product.stock !== 0),
    [products],
  );
  const categoryCards = useMemo(() => {
    const cards = buildCategoryCards(availableProducts);
    return cards.length ? cards : FALLBACK_CATEGORY_CARDS;
  }, [availableProducts]);
  const [cartCount, setCartCount] = useState(0);
  const adminShortcut = useRef({ clicks: 0, timer: null });

  useEffect(() => {
    setCartCount(cartQuantity(readCart()));
    const nextTheme = readTheme();
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function refreshProducts() {
      try {
        const response = await fetch('/api/products', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (Array.isArray(payload.products) && payload.products.length) {
          setLiveProducts(payload.products);
        }
      } catch {
        // The server-rendered products remain available if the refresh fails.
      }
    }

    refreshProducts();

    return () => controller.abort();
  }, []);

  function handleAdminShortcut(event) {
    event.preventDefault();
    adminShortcut.current.clicks += 1;
    window.clearTimeout(adminShortcut.current.timer);
    adminShortcut.current.timer = window.setTimeout(() => {
      adminShortcut.current.clicks = 0;
    }, 2200);

    if (adminShortcut.current.clicks >= ADMIN_SHORTCUT_CLICKS) {
      adminShortcut.current.clicks = 0;
      window.location.href = '/admin';
    }
  }

  function handleCollectionJump(event) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    const target = document.getElementById(COLLECTION_TARGET_ID);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!target) {
      window.location.hash = COLLECTION_TARGET_ID;
      return;
    }

    if (prefersReducedMotion) {
      target.scrollIntoView({ block: 'start' });
      window.history.replaceState(null, '', `#${COLLECTION_TARGET_ID}`);
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${COLLECTION_TARGET_ID}`);
  }

  return (
    <>
      <Head>
        <title>Habiba Velora | أقسام الإكسسوارات</title>
        <meta
          name="description"
          content="تسوقي أقسام Habiba Velora وشوفي القطع من واجهة خفيفة وسريعة."
        />
      </Head>
      <Script src="/language.js" strategy="lazyOnload" />

      <div className="clean-storefront premium-storefront" dir="rtl">
        <main className="clean-scroll-container">
          <HomeHeroImage
            cartCount={cartCount}
            onAdminShortcut={handleAdminShortcut}
            onCollectionJump={handleCollectionJump}
          />

          <MotionMarqueeSection items={categoryCards} />

          <ReferenceAboutSection />

          <ReferenceProjectsSection items={categoryCards} />

          <ReferenceJourneySection onCollectionJump={handleCollectionJump} />
        </main>

        <footer className="clean-footer velora-site-footer reveal" data-no-translate>
          <div className="velora-footer-inner">
            <section className="velora-footer-brand" aria-label="Habiba Velora">
              <p className="velora-footer-kicker">HABIBA VELORA</p>
              <h2>Habiba<br />Velora</h2>
              <p>
                أناقة بتفاصيل هادئة، وتصميمات مختارة عشان كل قطعة تعبر عن ذوقك بثقة.
              </p>
              <div className="velora-social-row" aria-label="روابط التواصل">
                <a href={WHATSAPP_DIRECT_URL} target="_blank" rel="noreferrer" aria-label="واتساب مباشر">
                  <FooterSocialIcon type="whatsapp" />
                </a>
                <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer" aria-label="مجموعة واتساب">
                  <FooterSocialIcon type="whatsapp-group" />
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="إنستجرام">
                  <FooterSocialIcon type="instagram" />
                </a>
                <span className="velora-social-pending" aria-label="فيسبوك قريبًا">
                  <FooterSocialIcon type="facebook" />
                </span>
              </div>
            </section>

            <section className="velora-footer-column velora-footer-faq" aria-labelledby="footerFaqTitle">
              <p className="velora-footer-kicker" id="footerFaqTitle">الأسئلة الشائعة</p>
              <div className="velora-footer-faq-list">
                {FOOTER_FAQS.map((item, index) => (
                  <details key={item.question} open={index === 0}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="velora-footer-column" aria-labelledby="footerLinksTitle">
              <p className="velora-footer-kicker" id="footerLinksTitle">روابط سريعة</p>
              <nav className="velora-footer-links" aria-label="روابط سريعة">
                {FOOTER_LINKS.map((link) => (
                  <a key={link.href} href={link.href}>{link.label}</a>
                ))}
              </nav>
            </section>

            <section className="velora-footer-column" aria-labelledby="footerContactTitle">
              <p className="velora-footer-kicker" id="footerContactTitle">تواصلي معنا</p>
              <nav className="velora-footer-links velora-footer-contact" aria-label="تواصل معنا">
                <a href={WHATSAPP_DIRECT_URL} target="_blank" rel="noreferrer">واتساب مباشر</a>
                <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">مجموعة واتساب</a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">إنستجرام</a>
                <span>فيسبوك قريبًا</span>
                <span>بنرد خلال 24 ساعة</span>
              </nav>
            </section>
          </div>
        </footer>

      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: { initialProducts: await readProducts() } };
}

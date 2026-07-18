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

const SHIPPING_NOTES = [
  {
    icon: 'wallet',
    titleAr: 'تكلفة الشحن',
    titleEn: 'Shipping cost',
    copyAr: 'بتتحدد من شركة الشحن حسب المحافظة، وبتعرفها عند تأكيد الطلب.',
    copyEn: 'Set by the courier by governorate and confirmed with your order.',
  },
  {
    icon: 'clock',
    titleAr: 'مدة التوصيل',
    titleEn: 'Delivery time',
    copyAr: 'من 2 إلى 5 أيام عمل بعد تسليم الطلب لشركة الشحن.',
    copyEn: '2 to 5 business days after the courier receives the order.',
  },
  {
    icon: 'map-pin',
    titleAr: 'تتبع الشحنة',
    titleEn: 'Tracking',
    copyAr: 'رقم التتبع يوصلك بعد تسليم الطلب لشركة الشحن.',
    copyEn: 'Tracking details are sent after the courier handoff.',
  },
  {
    icon: 'shield',
    titleAr: 'ملاحظة مهمة',
    titleEn: 'Important note',
    copyAr: 'راجعي العنوان والرقم؛ تأخير شركة الشحن خارج مسؤوليتنا.',
    copyEn: 'Please check your address and phone number before confirming.',
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

function ProcessStepIcon({ type }) {
  const icons = {
    browse: (
      <>
        <path d="M13.8 21.8a8 8 0 1 1 5.7-2.35L26 25.9" />
        <path d="M10.2 13.7a3.7 3.7 0 0 1 3.7-3.7" />
        <path className="process-icon-spark" d="M23.4 5.7v3.2M21.8 7.3H25" />
      </>
    ),
    bag: (
      <>
        <path d="M9.4 12.3h13.2l-1 13.4H10.4Z" />
        <path d="M12.3 12.2V10a3.7 3.7 0 0 1 7.4 0v2.2" />
        <path d="M13.1 17.2h5.8" />
      </>
    ),
    form: (
      <>
        <path d="M10.5 6.7h11A2.5 2.5 0 0 1 24 9.2v15.6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 8 24.8V9.2a2.5 2.5 0 0 1 2.5-2.5Z" />
        <path d="M12.3 12.2h7.4M12.3 16.4h5.6" />
        <path d="m13 22.2 2 2 4.5-5" />
      </>
    ),
    route: (
      <>
        <path d="M9.3 8.4a3.3 3.3 0 0 1 6.6 0c0 2.6-3.3 6-3.3 6s-3.3-3.4-3.3-6Z" />
        <path d="M19.2 22.8a3.3 3.3 0 0 1 6.6 0c0 2.6-3.3 5.9-3.3 5.9s-3.3-3.3-3.3-5.9Z" />
        <path d="M12.7 14.8c-2.7.9-4.2 2.2-4 3.7.4 3.1 7.7 1.4 8.5 4.2.3 1.2-.7 2.2-2.8 3" />
        <path className="process-icon-fill" d="M12.6 8.4h.1M22.5 22.8h.1" />
      </>
    ),
    'badge-check': (
      <>
        <path d="M16 4.8 20 7l4.5.6.7 4.5 2.3 3.9-2.3 3.9-.7 4.5-4.5.6-4 2.2-4-2.2-4.5-.6-.7-4.5L4.5 16l2.3-3.9.7-4.5L12 7Z" />
        <path d="m11.6 16.4 2.7 2.7 6.1-6.4" />
      </>
    ),
    package: (
      <>
        <path d="M7.2 11.1 16 6.4l8.8 4.7v9.8L16 25.6l-8.8-4.7Z" />
        <path d="M7.6 11.3 16 16l8.4-4.7M16 16v9.2" />
        <path d="m11.9 8.9 8.4 4.7" />
      </>
    ),
    truck: (
      <>
        <path d="M4.8 11.3h12.8v9.4H4.8Z" />
        <path d="M17.6 14.2h4.4l3.8 4v2.5h-8.2" />
        <path d="M8.6 24.1a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM23 24.1a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M2.7 14.6h4M1.6 17.6h5.1" />
      </>
    ),
    'package-check': (
      <>
        <path d="M7.2 11.4 16 6.7l8.8 4.7v9.5L16 25.5l-8.8-4.6Z" />
        <path d="M7.6 11.6 16 16.2l8.4-4.6M16 16.2v9" />
        <path d="m18.5 21.2 2 2 4.3-4.8" />
      </>
    ),
    wallet: (
      <>
        <path d="M7.2 9.4h15.2a2.8 2.8 0 0 1 2.8 2.8v10.6a2.8 2.8 0 0 1-2.8 2.8H7.2a2.8 2.8 0 0 1-2.8-2.8V12.2a2.8 2.8 0 0 1 2.8-2.8Z" />
        <path d="M21 15.1h5.2v5.2H21a2.6 2.6 0 0 1 0-5.2Z" />
        <path className="process-icon-fill" d="M22.2 17.7h.1" />
      </>
    ),
    clock: (
      <>
        <circle cx="16" cy="16" r="10.2" />
        <path d="M16 10.4v6.1l4.4 2.6" />
        <path className="process-icon-spark" d="M7.2 7.2 5.6 5.6M24.8 7.2l1.6-1.6" />
      </>
    ),
    'map-pin': (
      <>
        <path d="M16 4.8a7.1 7.1 0 0 1 7.1 7.1c0 5.4-7.1 14.5-7.1 14.5S8.9 17.3 8.9 11.9A7.1 7.1 0 0 1 16 4.8Z" />
        <circle cx="16" cy="11.9" r="2.4" />
        <path d="M8 25.5c1.8 1.2 4.6 1.9 8 1.9s6.2-.7 8-1.9" />
      </>
    ),
    shield: (
      <>
        <path d="M16 4.8 25 8v7.3c0 5.8-3.6 9.9-9 12-5.4-2.1-9-6.2-9-12V8Z" />
        <path d="m11.7 16 2.8 2.8 6-6.3" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`process-svg process-svg-${type}`}>
      {icons[type] || icons.browse}
    </svg>
  );
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

const HERO_TITLE = 'Habiba Velora';
const REFERENCE_HERO_IMAGE = '/assets/habiba-velora-interface-hero.png';
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
const REFERENCE_SERVICES = [
  ['01', 'أقسام حقيقية', 'كل قسم ظاهر في التصميم بيتغذى من منتجات المتجر نفسها، بصورة منتج حقيقية وعدد المنتجات المتاحة.'],
  ['02', 'صور أوضح', 'الصور الكبيرة بتدي مساحة للقطعة إنها تظهر بشكل راق بدل كروت صغيرة مزدحمة.'],
  ['03', 'تسوق أسرع', 'الشريط المتحرك يفتح القسم مباشرة، وكارت القسم الرئيسي ينقلك للمنتجات بدون لف كثير.'],
  ['04', 'قصة البراند', 'علامة HV المتحركة أصبحت داخل جزء قصتي، في مكان أنسب وأقرب لهوية Habiba Velora.'],
  ['05', 'واجهة أخف', 'التحميل الزائد اتشال، والبنية الحالية بتعرض المحتوى المهم أولًا مع حركة ناعمة ومضبوطة.'],
];

function SplitHeroTitle() {
  return (
    <h1 id="veloraHeroTitle" className="home-hero-title" aria-label="Habiba Velora">
      <span className="home-hero-word" aria-hidden="true">
        {Array.from(HERO_TITLE).map((letter, letterIndex) => (
          <span
            className={`home-hero-char${letter === ' ' ? ' is-space' : ''}`}
            style={{ '--char-index': letterIndex }}
            key={`${letter}-${letterIndex}`}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </span>
    </h1>
  );
}

function ContactButton({ href = '#collection', children, onClick }) {
  return (
    <a className="home-hero-contact-button" href={href} onClick={onClick}>
      <span>{children}</span>
    </a>
  );
}

function Hero3DMark() {
  return (
    <div className="home-hero-3d-mark" aria-hidden="true" dir="ltr" lang="en">
      <div className="velora-monogram-scene">
        <div className="velora-monogram-glow" />
        <div className="velora-silk-plane" />
        <div className="velora-caustic-field" />
        {MONOGRAM_PARTICLES.map((particle) => (
          <span key={`hero-particle-${particle}`} className={`velora-particle p-${particle}`} />
        ))}

        <div className="velora-monogram-orbit">
          <div className="velora-monogram-object">
            <span className="velora-monogram-halo" />
            <span className="velora-3d-ring velora-3d-ring-back" />
            {MONOGRAM_LAYERS.map((layer) => (
              <span
                key={`hero-layer-${layer}`}
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
              <i key={`hero-gem-${gem}`} className={`velora-gem g-${gem}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
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
      aria-labelledby="veloraHeroTitle"
      data-no-translate
    >
      <img
        className="home-hero-interface-image"
        src={REFERENCE_HERO_IMAGE}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      <header className="clean-header clean-home-header">
        <nav className="clean-nav" aria-label="Reference hero navigation">
          <a href="#brand-story">قصتي</a>
          <a href="#collection" onClick={onCollectionJump}>الأقسام</a>
          <a href="/products">المنتجات</a>
          <a href="/follow">تواصل</a>
        </nav>
      </header>

      <h1 id="veloraHeroTitle" className="home-hero-seo-title">Habiba Velora</h1>

      <div className="home-hero-bottom-bar">
        <p className="home-hero-copy">
          قطع مختارة بتفاصيل هادئة ولمعة تليق بكل لحظة.
        </p>
        <ContactButton href="#collection" onClick={onCollectionJump}>تسوقي الآن</ContactButton>
      </div>

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

function ReferenceServicesSection() {
  return (
    <section className="reference-services-section" aria-labelledby="referenceServicesTitle" data-no-translate>
      <h2 id="referenceServicesTitle">تفاصيل سريعة</h2>
      <div className="reference-services-list">
        {REFERENCE_SERVICES.slice(0, 3).map(([number, title, copy], index) => (
          <article className="reference-service-item" style={{ '--item-index': index }} key={number}>
            <span className="reference-service-number">{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReferenceProjectsSection({ items }) {
  const categoryItems = items.filter((item) => item.image);
  const railRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  function scrollCategoryRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.75,
      behavior: 'smooth',
    });
  }

  function handleRailWheel(event) {
    const rail = railRef.current;
    if (!rail || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    rail.scrollLeft += event.deltaY;
  }

  function handleRailPointerDown(event) {
    const rail = railRef.current;
    if (!rail) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: rail.scrollLeft,
    };
    rail.classList.add('is-dragging');
    rail.setPointerCapture?.(event.pointerId);
  }

  function handleRailPointerMove(event) {
    const rail = railRef.current;
    if (!rail || !dragRef.current.active) return;
    const distance = event.clientX - dragRef.current.startX;
    rail.scrollLeft = dragRef.current.scrollLeft - distance;
  }

  function stopRailDrag(event) {
    const rail = railRef.current;
    if (!rail) return;
    dragRef.current.active = false;
    rail.classList.remove('is-dragging');
    rail.releasePointerCapture?.(event.pointerId);
  }

  function handleCategoryPointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
    const my = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);

    event.currentTarget.style.setProperty('--card-mx', mx);
    event.currentTarget.style.setProperty('--card-my', my);
  }

  function handleCategoryPointerLeave(event) {
    event.currentTarget.style.setProperty('--card-mx', '0');
    event.currentTarget.style.setProperty('--card-my', '0');
  }

  return (
    <section className="reference-projects-section" id="collection" aria-labelledby="referenceProjectsTitle" data-no-translate>
      <div className="reference-category-title-row">
        <h2 id="referenceProjectsTitle" className="reference-gradient-heading">الأقسام</h2>
        <div className="reference-category-controls" aria-label="تحريك الأقسام">
          <button type="button" onClick={() => scrollCategoryRail(1)} aria-label="تحريك يمين">‹</button>
          <button type="button" onClick={() => scrollCategoryRail(-1)} aria-label="تحريك شمال">›</button>
        </div>
      </div>
      <div
        className="reference-project-stack"
        ref={railRef}
        onWheel={handleRailWheel}
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={stopRailDrag}
        onPointerCancel={stopRailDrag}
        onPointerLeave={stopRailDrag}
      >
        {categoryItems.length > 0 ? categoryItems.map((category, index) => (
          <div className="reference-category-stage" style={{ '--card-index': index }} key={category.name}>
            <article
              className="reference-project-card reference-category-card"
              onPointerMove={handleCategoryPointerMove}
              onPointerLeave={handleCategoryPointerLeave}
            >
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

          <ReferenceProjectsSection items={categoryCards} />

          <ReferenceAboutSection />

          <ReferenceJourneySection onCollectionJump={handleCollectionJump} />

          {false && (
            <>
          <section className="clean-section clean-process reveal legacy-process-section" aria-labelledby="veloraProcessTitle" data-no-translate>
            <div className="clean-section-parallax clean-process-stage">
              <div className="clean-process-head">
                <p className="clean-process-kicker">
                  <span className="lang-ar">رحلة الطلب</span>
                  <span className="lang-en">Order flow</span>
                </p>
                <h2 id="veloraProcessTitle">
                  <span className="lang-ar">اختاري. اطلبي. تابعي.</span>
                  <span className="lang-en">Pick. Order. Track.</span>
                </h2>
                <p>
                  <span className="lang-ar">ببساطة وأناقة.</span>
                  <span className="lang-en">Simple and elegant.</span>
                </p>
              </div>

              <div className="clean-process-track">
                {PROCESS_STEPS.map((step, stepIndex) => (
                  <article
                    className="clean-process-step"
                    key={step.number}
                    tabIndex={0}
                  >
                    <span className="clean-process-number">{step.number}</span>
                    <span className="clean-process-icon">
                      <ProcessStepIcon type={step.icon} />
                    </span>
                    <span className="clean-process-title">
                      <span className="lang-ar">{step.titleAr}</span>
                      <span className="lang-en">{step.titleEn}</span>
                    </span>
                    <span className="clean-process-copy">
                      <span className="lang-ar">{step.copyAr}</span>
                      <span className="lang-en">{step.copyEn}</span>
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="clean-section clean-catalog reveal legacy-catalog-section" id="legacy-collection" aria-labelledby="collectionTitle">
            <div className="clean-section-parallax clean-catalog-content">
              <div className="clean-catalog-head" data-no-translate>
                <p>
                  <span className="lang-ar">مجموعة Habiba Velora</span>
                  <span className="lang-en">Habiba Velora Collection</span>
                </p>
                <h2 id="collectionTitle">
                  <span className="lang-ar">كل الأقسام</span>
                  <span className="lang-en">All Collections</span>
                </h2>
              </div>
              {categoryCards.length > 0 ? (
                <div className="clean-category-grid">
                  {categoryCards.map((category, index) => (
                    <a
                      key={category.name}
                      className="clean-category-card"
                      href={category.href}
                      style={{ '--card-index': index }}
                      >
                        <div className="clean-category-media">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            loading={index < 4 ? 'eager' : 'lazy'}
                            decoding="async"
                            fetchPriority={index < 4 ? 'high' : 'auto'}
                          />
                        ) : (
                          <div className="clean-category-placeholder" aria-hidden="true">HV</div>
                        )}
                        <span>{category.count} منتج</span>
                      </div>
                      <div className="clean-category-info">
                        <small>قسم</small>
                        <h3>{category.name}</h3>
                        <strong>دخول القسم</strong>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="clean-empty-state">
                  <strong>الأقسام هتظهر هنا أول ما تضيف منتجات.</strong>
                  <p>ضيف منتج وحدد القسم، والواجهة هتعرض كارت القسم تلقائيًا.</p>
                </div>
              )}
            </div>
          </section>

          <section className="clean-section clean-shipping-policy reveal legacy-shipping-section" id="shipping-policy" aria-labelledby="shippingPolicyTitle" data-no-translate>
            <div className="clean-section-parallax clean-shipping-stage">
              <div className="clean-process-head clean-shipping-head">
                <p className="clean-process-kicker">
                  <span className="lang-ar">سياسة الشحن</span>
                  <span className="lang-en">Shipping policy</span>
                </p>
                <h2 id="shippingPolicyTitle">
                  <span className="lang-ar">من التجهيز لحد الاستلام.</span>
                  <span className="lang-en">From packing to delivery.</span>
                </h2>
                <p>
                  <span className="lang-ar">كل خطوة واضحة عشان طلبك يوصلك من غير لخبطة.</span>
                  <span className="lang-en">A clear path so your order arrives without confusion.</span>
                </p>
              </div>

              <div className="clean-shipping-alert">
                <strong>
                  <span className="lang-ar">تنبيه مهم</span>
                  <span className="lang-en">Important</span>
                </strong>
                <span>
                  <span className="lang-ar">أسعار الشحن بتحددها شركة الشحن حسب المحافظة، و Habiba Velora ليس لها دخل في التسعير.</span>
                  <span className="lang-en">Shipping prices are set by the courier by governorate; Habiba Velora does not price shipping.</span>
                </span>
              </div>

              <div className="clean-process-track clean-shipping-track">
                {SHIPPING_STEPS.map((step) => (
                  <article
                    className="clean-process-step clean-shipping-step"
                    key={`shipping-${step.number}`}
                    tabIndex={0}
                  >
                    <span className="clean-process-number">{step.number}</span>
                    <span className="clean-process-icon">
                      <ProcessStepIcon type={step.icon} />
                    </span>
                    <span className="clean-process-title">
                      <span className="lang-ar">{step.titleAr}</span>
                      <span className="lang-en">{step.titleEn}</span>
                    </span>
                    <span className="clean-process-copy">
                      <span className="lang-ar">{step.copyAr}</span>
                      <span className="lang-en">{step.copyEn}</span>
                    </span>
                  </article>
                ))}
              </div>

              <div className="clean-shipping-notes">
                {SHIPPING_NOTES.map((note) => (
                  <article className="clean-shipping-note" key={note.titleAr} tabIndex={0}>
                    <span className="clean-shipping-note-icon" aria-hidden="true">
                      <ProcessStepIcon type={note.icon} />
                    </span>
                    <strong>
                      <span className="lang-ar">{note.titleAr}</span>
                      <span className="lang-en">{note.titleEn}</span>
                    </strong>
                    <p>
                      <span className="lang-ar">{note.copyAr}</span>
                      <span className="lang-en">{note.copyEn}</span>
                    </p>
                  </article>
                ))}
              </div>

              <p className="clean-shipping-signature">HABIBA VELORA ✦ SHIPPING POLICY</p>
            </div>
          </section>
            </>
          )}
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

        {false && (
        <nav className="clean-mobile-dock legacy-mobile-dock" aria-label="تنقل سريع">
          <a href="/" data-mobile-nav="home" onClick={handleAdminShortcut}>
            <span className="mobile-nav-icon" aria-hidden="true">
              <span className="mobile-nav-logo-text">HV</span>
            </span>
            <small>الرئيسية</small>
          </a>
          <a className="active" href="#collection" data-mobile-nav="categories" onClick={handleCollectionJump}>
            <span className="mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
              </svg>
            </span>
            <small>الأقسام</small>
          </a>
          <a href="/order-tracking" data-mobile-nav="tracking">
            <span className="mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 12h4l2-4 4 8 2-4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <small>تتبع</small>
          </a>
          <a href="/cart" data-mobile-nav="cart" aria-label={`السلة بها ${cartCount} منتج`}>
            <b>{cartCount}</b>
            <small>السلة</small>
          </a>
          <a href="/after-sales" data-mobile-nav="returns">
            <span className="mobile-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 7 5 11l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 11h9.5a4.5 4.5 0 1 1 0 9H12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <small>المرتجع</small>
          </a>
        </nav>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: { initialProducts: await readProducts() } };
}

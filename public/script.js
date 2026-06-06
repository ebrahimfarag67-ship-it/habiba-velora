const tonePalette = [
  { from: '#f4d8d9', to: '#d98ea2', glow: 'rgba(255,255,255,0.24)' },
  { from: '#f3dec9', to: '#d3a072', glow: 'rgba(255,255,255,0.22)' },
  { from: '#eadcf0', to: '#b88cc7', glow: 'rgba(255,255,255,0.22)' },
  { from: '#f1d4c8', to: '#c06e83', glow: 'rgba(255,255,255,0.22)' },
];

const storageKeys = {
  products: 'velora-store-v4-products',
  cart: 'velora-store-v4-cart',
  wishlist: 'velora-store-v4-wishlist',
  orders: 'velora-store-v4-orders',
  notifications: 'velora-store-v4-notifications',
  returnRequests: 'velora-store-v4-return-requests',
  adminAccess: 'velora-admin-access-v4-172005',
  theme: 'velora-store-v4-theme',
};

const legacyStorageKeys = {
  cart: ['velora-store-v3-cart', 'velora-store-v2-cart'],
  wishlist: ['velora-store-v3-wishlist', 'velora-store-v2-wishlist'],
  orders: ['velora-store-v3-orders', 'velora-store-v2-orders'],
  notifications: ['velora-store-v3-notifications', 'velora-store-v2-notifications'],
  returnRequests: ['velora-store-v3-return-requests', 'velora-store-v2-return-requests'],
  adminAccess: ['velora-admin-access-v3-172005', 'velora-admin-access-v2-172005'],
  theme: ['velora-store-v3-theme', 'velora-store-v2-theme'],
};

const adminCredentials = {
  password: '172005',
};

const defaultProducts = [];
const defaultOrders = [];

const governorateAreas = {
  القاهرة: ['مدينة نصر', 'مصر الجديدة', 'النزهة', 'عين شمس', 'المطرية', 'السلام أول', 'السلام ثان', 'المرج', 'شبرا', 'روض الفرج', 'الساحل', 'الزاوية الحمراء', 'حدائق القبة', 'الوايلي', 'الزيتون', 'الشرابية', 'وسط القاهرة', 'باب الشعرية', 'الأزبكية', 'بولاق', 'عابدين', 'الموسكي', 'غرب القاهرة', 'قصر النيل', 'الزمالك', 'الدرب الأحمر', 'الجمالية', 'الخليفة', 'المقطم', 'منشأة ناصر', 'السيدة زينب', 'مصر القديمة', 'دار السلام', 'البساتين', 'المعادي', 'طرة', 'حلوان', 'المعصرة', '15 مايو', 'التبين', 'القاهرة الجديدة', 'الشروق', 'بدر'],
  الجيزة: ['الجيزة', 'الدقي', 'العجوزة', 'الهرم', 'فيصل', 'بولاق الدكرور', 'العمرانية', 'الطالبية', 'إمبابة', 'الوراق', 'أوسيم', 'كرداسة', 'منشأة القناطر', 'أبو النمرس', 'الحوامدية', 'البدرشين', 'العياط', 'الصف', 'أطفيح', 'الواحات البحرية', '6 أكتوبر', 'الشيخ زايد', 'حدائق أكتوبر'],
  الإسكندرية: ['المنتزه أول', 'المنتزه ثان', 'شرق', 'وسط', 'غرب', 'الجمرك', 'العجمي', 'العامرية أول', 'العامرية ثان', 'برج العرب'],
  الدقهلية: ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'أجا', 'السنبلاوين', 'المنزلة', 'بلقاس', 'شربين', 'منية النصر', 'تمي الأمديد', 'الجمالية', 'محلة دمنة', 'بني عبيد', 'نبروه', 'ميت سلسيل', 'الكردي', 'المطرية', 'جمصة'],
  الشرقية: ['الزقازيق', 'بلبيس', 'منيا القمح', 'أبو حماد', 'أبو كبير', 'فاقوس', 'الحسينية', 'كفر صقر', 'أولاد صقر', 'ههيا', 'الإبراهيمية', 'ديرب نجم', 'مشتول السوق', 'القنايات', 'صان الحجر', 'منشأة أبو عمر', 'العاشر من رمضان'],
  الغربية: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة', 'قطور', 'بسيون', 'سمنود'],
  المنوفية: ['شبين الكوم', 'منوف', 'أشمون', 'قويسنا', 'تلا', 'الباجور', 'بركة السبع', 'الشهداء', 'السادات', 'سرس الليان'],
  القليوبية: ['بنها', 'قليوب', 'القناطر الخيرية', 'الخانكة', 'كفر شكر', 'طوخ', 'شبين القناطر', 'شبرا الخيمة', 'العبور', 'الخصوص', 'قها'],
  البحيرة: ['دمنهور', 'كفر الدوار', 'رشيد', 'إدكو', 'أبو المطامير', 'أبو حمص', 'الدلنجات', 'المحمودية', 'الرحمانية', 'إيتاي البارود', 'حوش عيسى', 'شبراخيت', 'كوم حمادة', 'بدر', 'وادي النطرون', 'النوبارية'],
  'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'قلين', 'سيدي سالم', 'الرياض', 'بيلا', 'الحامول', 'بلطيم', 'برج البرلس'],
  دمياط: ['دمياط', 'فارسكور', 'كفر سعد', 'الزرقا', 'كفر البطيخ', 'رأس البر', 'دمياط الجديدة'],
  بورسعيد: ['بورفؤاد', 'الشرق', 'العرب', 'المناخ', 'الضواحي', 'الزهور', 'الجنوب', 'غرب بورسعيد'],
  الإسماعيلية: ['الإسماعيلية', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'التل الكبير', 'أبو صوير', 'القصاصين'],
  السويس: ['السويس', 'الأربعين', 'عتاقة', 'الجناين', 'فيصل'],
  'شمال سيناء': ['العريش', 'الشيخ زويد', 'رفح', 'بئر العبد', 'الحسنة', 'نخل'],
  'جنوب سيناء': ['طور سيناء', 'شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'سانت كاترين', 'رأس سدر', 'أبو رديس', 'أبو زنيمة'],
  'بني سويف': ['بني سويف', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا', 'سمسطا', 'الفشن'],
  الفيوم: ['الفيوم', 'سنورس', 'إطسا', 'طامية', 'أبشواي', 'يوسف الصديق'],
  المنيا: ['المنيا', 'العدوة', 'مغاغة', 'بني مزار', 'مطاي', 'سمالوط', 'أبو قرقاص', 'ملوي', 'دير مواس', 'المنيا الجديدة'],
  أسيوط: ['أسيوط', 'ديروط', 'القوصية', 'منفلوط', 'أبنوب', 'أبو تيج', 'الغنايم', 'ساحل سليم', 'البداري', 'صدفا', 'الفتح', 'أسيوط الجديدة'],
  سوهاج: ['سوهاج', 'أخميم', 'البلينا', 'المراغة', 'المنشأة', 'دار السلام', 'جرجا', 'جهينة', 'ساقلتة', 'طما', 'طهطا', 'العسيرات'],
  قنا: ['قنا', 'أبو تشت', 'فرشوط', 'نجع حمادي', 'دشنا', 'الوقف', 'قفط', 'قوص', 'نقادة'],
  الأقصر: ['الأقصر', 'الزينية', 'البياضية', 'القرنة', 'أرمنت', 'إسنا', 'الطود'],
  أسوان: ['أسوان', 'دراو', 'كوم أمبو', 'نصر النوبة', 'إدفو', 'أبو سمبل', 'أسوان الجديدة'],
  'البحر الأحمر': ['الغردقة', 'رأس غارب', 'سفاجا', 'القصير', 'مرسى علم', 'الشلاتين', 'حلايب'],
  'الوادي الجديد': ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط'],
  مطروح: ['مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'النجيلة', 'سيدي براني', 'السلوم', 'سيوة'],
};

const shippingFees = {};
const egyptGovernorates = Object.keys(governorateAreas);

window.veloraStore = {
  products: Array.isArray(window.veloraInitialProducts) && window.veloraInitialProducts.length
    ? window.veloraInitialProducts
    : defaultProducts,
  orders: defaultOrders,
  storageKeys,
  legacyStorageKeys,
  adminCredentials,
  governorates: egyptGovernorates,
  governorateAreas,
  shippingFees,
  paymentMethods: ['عند الاستلام', 'فودافون كاش', 'فيزا / ماستر كارد'],
  tonePalette,
};

function populateVeloraAreaSelect(governorateSelect, areaSelect) {
  if (!governorateSelect || !areaSelect || governorateSelect.dataset.veloraFallbackReady === 'true') {
    return;
  }

  governorateSelect.innerHTML = [
    '<option value="">اختر المحافظة</option>',
    ...egyptGovernorates.map((governorate) => `<option value="${governorate}">${governorate}</option>`),
  ].join('');

  const updateAreas = () => {
    const areas = governorateAreas[governorateSelect.value] || [];
    areaSelect.innerHTML = [
      '<option value="">اختر المنطقة / المركز</option>',
      ...areas.map((area) => `<option value="${area}">${area}</option>`),
    ].join('');
  };

  governorateSelect.addEventListener('change', updateAreas);
  governorateSelect.dataset.veloraFallbackReady = 'true';
  updateAreas();
}

function ensureVeloraGovernorates() {
  populateVeloraAreaSelect(
    document.getElementById('customerGovernorate'),
    document.getElementById('customerArea'),
  );
  populateVeloraAreaSelect(
    document.getElementById('returnGovernorate'),
    document.getElementById('returnArea'),
  );
}

function normalizeVeloraNavHref(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  try {
    const url = new URL(raw, window.location.origin);
    return `${url.pathname}${url.hash}`.replace(/\/$/, '') || '/';
  } catch {
    return raw.replace(/\/$/, '') || '/';
  }
}

function findVeloraNavLink(nav, targets) {
  const targetSet = new Set(targets.map((target) => normalizeVeloraNavHref(target)));
  return Array.from(nav.querySelectorAll('a')).find((link) => {
    const href = normalizeVeloraNavHref(link.getAttribute('href') || link.href);
    return targetSet.has(href);
  }) || null;
}

function ensureVeloraNavLink(nav, href, label) {
  const link = findVeloraNavLink(nav, [href]);
  if (link) {
    link.textContent = label;
    return link;
  }

  const nextLink = document.createElement('a');
  nextLink.href = href;
  nextLink.textContent = label;
  return nextLink;
}

function ensureVeloraTopNav() {
  document.querySelectorAll('.topnav').forEach((nav) => {
    const anchor = findVeloraNavLink(nav, ['#categories', '/#categories', '/']) || nav.firstElementChild;
    const trackingLink = ensureVeloraNavLink(nav, '/order-tracking', 'متابعة الطلب');
    const returnsLink = ensureVeloraNavLink(nav, '/after-sales', 'فاتورة المرتجع');

    if (anchor) {
      anchor.after(trackingLink);
    } else {
      nav.appendChild(trackingLink);
    }
    trackingLink.after(returnsLink);
  });

  const returnHeader = document.querySelector('.return-header');
  if (returnHeader && !returnHeader.querySelector('.topnav')) {
    const nav = document.createElement('nav');
    nav.className = 'topnav return-header-nav';
    nav.setAttribute('aria-label', 'التنقل الرئيسي');
    nav.innerHTML = `
      <a href="/">المتجر</a>
      <a href="/#categories">الأقسام</a>
      <a href="/order-tracking">متابعة الطلب</a>
      <a href="/after-sales">فاتورة المرتجع</a>
    `;
    const backLink = returnHeader.querySelector('a.secondary-btn');
    returnHeader.insertBefore(nav, backLink || null);
  }
}

function ensureVeloraCommonUi() {
  ensureVeloraGovernorates();
  ensureVeloraTopNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureVeloraCommonUi);
} else {
  ensureVeloraCommonUi();
}

window.setTimeout(ensureVeloraCommonUi, 500);
window.setTimeout(ensureVeloraCommonUi, 1500);

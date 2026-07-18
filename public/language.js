(() => {
  const storageKey = 'velora-store-v4-language';
  const defaultLanguage = 'ar';
  const supportedLanguages = new Set(['ar', 'en']);
  let currentLanguage = loadLanguage();
  let observer = null;
  let isApplying = false;
  let applyTimer = null;
  const originalTextNodes = new WeakMap();
  const originalAttributeNames = {
    placeholder: 'data-original-placeholder',
    'aria-label': 'data-original-aria-label',
    title: 'data-original-title',
    'data-i18n-label': 'data-original-i18n-label',
  };

  const translations = {
    'الرئيسية': 'Home',
    'المتجر': 'Store',
    'الأقسام': 'Categories',
    'حركة القطع على الطبيعة': 'Pieces in Motion',
    'تسوقي بعد المشاهدة': 'Shop After Watching',
    'تفاصيل بتلمع في الحركة': 'Details that shine in motion',
    'لقطات قريبة للّوك الحقيقي من HabibaVelora، عشان تشوفي اللمعة والحجم والإحساس قبل ما تختاري.': 'Close-up HabibaVelora reels show shine, scale, and feel before you choose.',
    'لقطات مختارة': 'Selected Reels',
    'كل فيديوهات HabibaVelora': 'All HabibaVelora Videos',
    'افتتاحية ناعمة': 'Soft Opening',
    'تفاصيل الإضاءة': 'Light Details',
    'حركة القطعة': 'Piece in Motion',
    'لوك يومي': 'Daily Look',
    'لمسة ذهبية': 'Golden Touch',
    'قريب من المنتج': 'Close to Product',
    'ستايل خفيف': 'Light Style',
    'لقطة سريعة': 'Quick Shot',
    'خامة ولمعة': 'Texture and Shine',
    'نهاية أنيقة': 'Elegant Finish',
    'تسوقي حسب القسم': 'Shop by Category',
    'دخول القسم': 'Open Collection',
    'المنتجات': 'Products',
    'تابعينا': 'Follow Us',
    'اللغة': 'Language',
    'المرتجع': 'Returns',
    'فاتورة المرتجع': 'Return Invoice',
    'متابعة الطلب': 'Track Order',
    'تتبع الطلب': 'Track Order',
    'الشروط': 'Terms',
    'الإرجاع': 'Returns',
    'العودة للمتجر': 'Back to Store',
    'رجوع للمتجر': 'Back to Store',
    'العودة إلى المتجر': 'Back to Store',
    'استكمال التسوق': 'Continue Shopping',
    'متابعة التسوق': 'Continue Shopping',
    'السلة': 'Cart',
    'سلة الشراء': 'Cart',
    'سلة شراء مرتبة': 'Organized Cart',
    'سلة شراء احترافية': 'Professional Cart',
    'مراجعة الطلب وتأكيده من صفحة مستقلة': 'Review and complete your order',
    'كل المنتجات المختارة تظهر هنا مع الإجمالي وبيانات الشحن والدفع قبل إرسال الطلب.': 'Your selected items, totals, shipping and payment details appear here before submitting.',
    'مراجعة سريعة': 'Quick Review',
    'راجعي الطلب بسرعة قبل الدفع': 'Review your order before checkout',
    'الإجمالي الفرعي': 'Subtotal',
    'الإجمالي النهائي': 'Total',
    'التوصيل': 'Shipping',
    'السلة فارغة': 'Your cart is empty',
    'السلة فارغة الآن': 'Your cart is empty',
    'اختاري منتج، والدرج هيفتح لك مراجعة سريعة هنا.': 'Choose a product, then review it here.',
    'أضف للسلة': 'Add to Cart',
    'إضافة سريعة': 'Quick Add',
    'صفحة المنتج': 'Product Page',
    'اختاري النوع': 'Choose Type',
    'بدون خيارات': 'No Options',
    'حذف': 'Remove',
    'إنقاص': 'Decrease',
    'زيادة': 'Increase',
    'متابعة الدفع': 'Proceed to Checkout',
    'إتمام الطلب': 'Complete Order',
    'تأكيد الطلب': 'Complete Order',
    'تفريغ السلة': 'Clear Cart',
    'الاسم': 'Name',
    'الهاتف': 'Phone',
    'العنوان التفصيلي': 'Detailed Address',
    'المحافظة': 'Governorate',
    'المنطقة / المركز': 'Area / District',
    'طريقة الدفع': 'Payment Method',
    'ملاحظات إضافية': 'Additional Notes',
    'عند الاستلام': 'Cash on Delivery',
    'فودافون كاش': 'Vodafone Cash',
    'فودافون كاش مباشر': 'Vodafone Cash Direct',
    'فيزا / ماستر كارد': 'Visa / Mastercard',
    'فودافون كاش - دفع آمن': 'Vodafone Cash - Secure Payment',
    'دفع إلكتروني آمن': 'Secure Online Payment',
    'بانتظار تأكيد Paymob': 'Waiting for Paymob Confirmation',
    'فشل أو رفض الدفع': 'Payment Failed or Declined',
    'اختر المحافظة': 'Choose Governorate',
    'اختر المنطقة / المركز': 'Choose Area / District',
    'حلقان': 'Earrings',
    'سلاسل': 'Necklaces',
    'انسيالات': 'Bracelets',
    'خواتم': 'Rings',
    'كفرات': 'Cases',
    'أساور': 'Bracelets',
    'الكل': 'All',
    'كل التصميمات': 'All Designs',
    'كل المنتجات': 'All Products',
    'مجموعة HabibaVelora': 'HabibaVelora Collection',
    'اختاري من منتجات القسم وافتحي صفحة المنتج للتفاصيل والطلب.': 'Choose from this collection and open the product page for details.',
    'إكسسوارات بتفاصيل هادئة': 'Elegant accessories with soft details',
    'إكسسوارات أنيقة بتفاصيل ناعمة.': 'Elegant accessories with soft details.',
    'منتجات مميزة': 'Featured Products',
    'تصفح مجموعاتنا': 'Browse Our Collections',
    'تصاميم ناعمة للّوك اليومي': 'Soft designs for daily looks',
    'لمعة هادئة وتفاصيل أنيقة': 'Soft shine and elegant details',
    'قطع خفيفة بتنسيق راقٍ': 'Light pieces with refined styling',
    'اختيارات دقيقة ومميزة': 'Delicate and special picks',
    'ستايل عملي بلمسة أنيقة': 'Practical style with an elegant touch',
    'تصاميم مرنة لكل مناسبة': 'Flexible designs for every occasion',
    'داكن': 'Dark',
    'فاتح': 'Light',
    'إغلاق السلة': 'Close Cart',
    'بحث المنتجات': 'Search Products',
    'ابحثي عن منتج...': 'Search products...',
    'بحث...': 'Search...',
    'إبحثي عن منتج...': 'Search products...',
    'ابحث عن منتج...': 'Search products...',
    'اكتبي اسم المنتج...': 'Search products...',
    'اكتب اسم المنتج أو الوصف...': 'Search by product name or description...',
    'اكتب اسم المنتج...': 'Search products...',
    'من': 'From',
    'محفوظ': 'Saved',
    'حفظ': 'Save',
    'متوفر الآن': 'Available Now',
    'آخر قطع': 'Last Pieces',
    'نفد المخزون': 'Sold Out',
    'وصل حديثًا': 'New Arrival',
    'مميز': 'Featured',
    'لا توجد منتجات مطابقة': 'No matching products',
    'جرّب كلمة بحث أخرى أو غيّر القسم الحالي.': 'Try another search term or change the current category.',
    'كل الموجود في القسم': 'Everything in this collection',
    'اختيار أنيق من المجموعة': 'An elegant pick from the collection',
    'من قسم': 'From Collection',
    'افتح القسم': 'Open Collection',
    'شوف كل المجموعة': 'View Full Collection',
    'أقسام مميزة': 'Featured Collections',
    'قطع مختارة بتتغير مع كل قسم.': 'Curated pieces that change with each collection.',
    'أضف منتجات من الكتالوج ثم أكمل الطلب من هنا.': 'Add products from the catalog, then complete your order here.',
    'عند وصول طلب أو تعديل منتج ستظهر التنبيهات هنا.': 'Orders and product updates will appear here.',
    'لا توجد منتجات حتى الآن': 'No products yet',
    'أضف أول منتج من النموذج الموجود في اللوحة.': 'Add your first product from the admin form.',
    'المخزون غير متاح': 'Stock Unavailable',
    'هذا المنتج نفد حالياً.': 'This product is currently sold out.',
    'اختار النوع أولًا': 'Choose Type First',
    'افتح صفحة المنتج واختار نحاس أو استانلس قبل الإضافة للسلة.': 'Open the product page and choose brass or stainless before adding to cart.',
    'السلة فارغة': 'Cart Empty',
    'أضف منتجات أولًا قبل إكمال الطلب.': 'Add products before completing your order.',
    'منتج محذوف': 'Deleted Product',
    'تمت الإضافة': 'Added',
    'الآن داخل السلة.': 'is now in your cart.',
    'إضافة إلى المفضلة': 'Add to Wishlist',
    'فتح صفحة': 'Open Page',
    'تقييم العملاء': 'Customer Rating',
    'منتجات مشابهة': 'Similar Products',
    'اختيارات من نفس القسم': 'More From This Collection',
    'لا توجد اقتراحات حاليًا': 'No suggestions right now',
    'هذا المنتج لا يملك بدائل داخل نفس القسم بعد.': 'This product has no alternatives in the same collection yet.',
    'اختار النوع لعرض السعر': 'Choose a type to show the price',
    'اختيارات السعر': 'Price Options',
    'الشكل / الموديل': 'Style / Model',
    'الألوان': 'Colors',
    'المقاسات': 'Sizes',
    'الكمية': 'Quantity',
    'إزالة من المفضلة': 'Remove from Wishlist',
    'أضف للمفضلة': 'Add to Wishlist',
    'قيّم المنتج': 'Rate Product',
    'التقييمات تظهر بعد مشاركة العملاء فقط.': 'Ratings appear after customers share feedback.',
    'اختر التقييم': 'Choose Rating',
    'اختار عدد النجوم': 'Choose Stars',
    'نجمة واحدة': 'One Star',
    'اسمك اختياري': 'Your name, optional',
    'اكتب رأيك اختياري': 'Write your feedback, optional',
    'إرسال التقييم': 'Submit Review',
    'نجوم': 'Stars',
    'نجمة': 'Star',
    'لم نتمكن من العثور على المنتج': 'Product Not Found',
    'ارجع إلى المتجر الرئيسي لاختيار منتج آخر أو افتح صفحة من المنتجات المتوفرة.': 'Go back to the main store to choose another available product.',
  };

  const placeholders = {
    'ابحثي عن منتج...': 'Search products...',
    'إبحثي عن منتج...': 'Search products...',
    'بحث...': 'Search...',
    'ابحث عن منتج...': 'Search products...',
    'اكتب اسم المنتج أو الوصف...': 'Search by product name or description...',
    'اكتبي اسم المنتج...': 'Search products...',
    'اكتب اسم المنتج...': 'Search products...',
    'اسم العميل': 'Customer name',
    'الشارع / المنطقة / رقم الشقة': 'Street / area / apartment number',
    'مثال: التغليف هدية': 'Example: gift wrapping',
  };

  const reverseTranslations = Object.fromEntries(
    Object.entries(translations).map(([arabic, english]) => [english, arabic]),
  );
  const reversePlaceholders = Object.fromEntries(
    Object.entries(placeholders).map(([arabic, english]) => [english, arabic]),
  );

  function loadLanguage() {
    try {
      const stored = localStorage.getItem(storageKey);
      return supportedLanguages.has(stored) ? stored : defaultLanguage;
    } catch {
      return defaultLanguage;
    }
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // ignore unavailable storage
    }
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function hasArabic(value) {
    return /[\u0600-\u06ff]/.test(String(value || ''));
  }

  function transliterateArabic(value) {
    const map = {
      ء: 'a',
      آ: 'aa',
      أ: 'a',
      إ: 'e',
      ا: 'a',
      ب: 'b',
      ت: 't',
      ث: 'th',
      ج: 'g',
      ح: 'h',
      خ: 'kh',
      د: 'd',
      ذ: 'z',
      ر: 'r',
      ز: 'z',
      س: 's',
      ش: 'sh',
      ص: 's',
      ض: 'd',
      ط: 't',
      ظ: 'z',
      ع: 'a',
      غ: 'gh',
      ف: 'f',
      ق: 'q',
      ك: 'k',
      ل: 'l',
      م: 'm',
      ن: 'n',
      ه: 'h',
      ة: 'a',
      و: 'w',
     ؤ: 'o',
      ي: 'y',
      ى: 'a',
      ئ: 'e',
      لا: 'la',
      '،': ',',
      '؛': ';',
      '؟': '?',
      '٪': '%',
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };

    return String(value || '')
      .replace(/لا/g, 'la')
      .replace(/[\u0600-\u06ff٪،؛؟]/g, (character) => map[character] || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function withOriginalSpacing(original, translated) {
    const start = String(original).match(/^\s*/)?.[0] || '';
    const end = String(original).match(/\s*$/)?.[0] || '';
    return `${start}${translated}${end}`;
  }

  function translateValue(value, dictionary, reverseDictionary, options = {}) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return value;
    }

    const patternTranslation = translatePattern(normalized);
    if (patternTranslation) {
      return withOriginalSpacing(value, patternTranslation);
    }

    if (currentLanguage === 'en' && dictionary[normalized]) {
      return withOriginalSpacing(value, dictionary[normalized]);
    }

    if (currentLanguage === 'ar' && reverseDictionary[normalized]) {
      return withOriginalSpacing(value, reverseDictionary[normalized]);
    }

    if (currentLanguage === 'en' && options.fallbackTransliterate !== false && hasArabic(normalized)) {
      const transliterated = transliterateArabic(value);
      return transliterated ? withOriginalSpacing(value, transliterated) : value;
    }

    return value;
  }

  function translatePattern(text) {
    if (currentLanguage === 'en') {
      let match = text.match(/^فتح صفحة\s+(.+)$/);
      if (match) {
        return `Open ${match[1]} Page`;
      }

      match = text.match(/^معاينة صورة\s+(.+)$/);
      if (match) {
        return `Preview ${match[1]} Image`;
      }

      match = text.match(/^من قسم\s+(.+)$/);
      if (match) {
        return `From ${translateValue(match[1], translations, reverseTranslations)} Collection`;
      }

      match = text.match(/^(.+?)\s+الآن داخل السلة\.$/);
      if (match) {
        return `${match[1]} is now in your cart.`;
      }

      match = text.match(/^(.+?)\s+مراجعة$/);
      if (match) {
        return `${match[1]} reviews`;
      }

      match = text.match(/^(\d+)\s+نجوم$/);
      if (match) {
        return `${match[1]} stars`;
      }

      match = text.match(/^(\d+)\s+نجمة$/);
      if (match) {
        return `${match[1]} star`;
      }

      match = text.match(/^(.+?)\s+-\s+(.+?)\s+ج\.م$/);
      if (match) {
        return `${translateValue(match[1], translations, reverseTranslations)} - ${match[2]} EGP`;
      }

      match = text.match(/^(.+?)\s+ج\.م\s+للوحدة$/);
      if (match) {
        return `${match[1]} EGP each`;
      }

      match = text.match(/^من\s+(.+?)\s+ج\.م$/);
      if (match) {
        return `From ${match[1]} EGP`;
      }

      match = text.match(/^(.+?)\s+ج\.م$/);
      if (match) {
        return `${match[1]} EGP`;
      }

      match = text.match(/^خصم\s+(.+)$/);
      if (match) {
        return `${match[1]} off`;
      }

      match = text.match(/^(.+?)\s+(عنصر|عناصر)$/);
      if (match) {
        const count = match[1];
        return `${count} ${count === '1' ? 'item' : 'items'}`;
      }

      match = text.match(/^قسم\s+(.+)$/);
      if (match) {
        return `${translateValue(match[1], translations, reverseTranslations)} Collection`;
      }

      match = text.match(/^(.+?)\s+منتج\s+متاح\s+داخل\s+المجموعة\..*$/);
      if (match) {
        return `${match[1]} products available in this collection. Open any product for details and ordering.`;
      }

      if (text === 'لا توجد منتجات داخل هذا القسم حاليًا، ارجعي للمتجر لاختيار مجموعة أخرى.') {
        return 'No products are currently available in this collection. Go back to the store and choose another collection.';
      }
    }

    if (currentLanguage === 'ar') {
      let match = text.match(/^(.+?)\s+EGP each$/);
      if (match) {
        return `${match[1]} ج.م للوحدة`;
      }

      match = text.match(/^From\s+(.+?)\s+EGP$/);
      if (match) {
        return `من ${match[1]} ج.م`;
      }

      match = text.match(/^(.+?)\s+EGP$/);
      if (match) {
        return `${match[1]} ج.م`;
      }

      match = text.match(/^(.+?)\s+off$/);
      if (match) {
        return `خصم ${match[1]}`;
      }

      match = text.match(/^(.+?)\s+(item|items)$/);
      if (match) {
        return `${match[1]} ${match[1] === '1' ? 'عنصر' : 'عناصر'}`;
      }

      match = text.match(/^(.+?)\s+Collection$/);
      if (match) {
        return `قسم ${translateValue(match[1], translations, reverseTranslations)}`;
      }

      match = text.match(/^(.+?)\s+products available in this collection\..*$/);
      if (match) {
        return `${match[1]} منتج متاح داخل المجموعة. اختاري القطعة وافتحي صفحة المنتج للتفاصيل والطلب.`;
      }
    }

    return '';
  }

  function translateTextNode(node) {
    if (!originalTextNodes.has(node) && hasArabic(node.nodeValue)) {
      originalTextNodes.set(node, node.nodeValue);
    }

    if (currentLanguage === 'ar' && originalTextNodes.has(node)) {
      const originalValue = originalTextNodes.get(node);
      if (node.nodeValue !== originalValue) {
        node.nodeValue = originalValue;
      }
      return;
    }

    const sourceValue = originalTextNodes.get(node) || node.nodeValue;
    const nextValue = translateValue(sourceValue, translations, reverseTranslations);
    if (nextValue !== node.nodeValue) {
      node.nodeValue = nextValue;
    }
  }

  function translateAttributes(root) {
    const nodes = root.querySelectorAll?.('[placeholder], [aria-label], [title], [data-i18n-label]') || [];
    nodes.forEach((node) => {
      if (node.closest?.('[data-no-translate]')) {
        return;
      }

      if (node.placeholder !== undefined) {
        if (!node.dataset.originalPlaceholder && hasArabic(node.placeholder)) {
          node.dataset.originalPlaceholder = node.placeholder;
        }

        const sourcePlaceholder = currentLanguage === 'ar'
          ? (node.dataset.originalPlaceholder || node.placeholder)
          : (node.dataset.originalPlaceholder || node.placeholder);
        const nextPlaceholder = currentLanguage === 'ar'
          ? sourcePlaceholder
          : translateValue(sourcePlaceholder, placeholders, reversePlaceholders);
        if (nextPlaceholder !== node.placeholder) {
          node.placeholder = nextPlaceholder;
        }
      }

      ['aria-label', 'title', 'data-i18n-label'].forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (!value) {
          return;
        }

        const originalAttributeName = originalAttributeNames[attribute];
        if (originalAttributeName && !node.getAttribute(originalAttributeName) && hasArabic(value)) {
          node.setAttribute(originalAttributeName, value);
        }

        const sourceValue = originalAttributeName
          ? (node.getAttribute(originalAttributeName) || value)
          : value;
        const nextValue = currentLanguage === 'ar'
          ? sourceValue
          : translateValue(sourceValue, translations, reverseTranslations);
        if (nextValue !== value) {
          node.setAttribute(attribute, nextValue);
        }
      });
    });
  }

  function translateText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest('[data-no-translate]')) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!normalizeText(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    nodes.forEach(translateTextNode);
  }

  function createLanguageButton(id, className) {
    const button = document.createElement('button');
    button.id = id;
    button.className = className;
    button.type = 'button';
    bindLanguageButton(button);
    return button;
  }

  function bindLanguageButton(button) {
    if (!button || button.dataset.languageBound === 'true') {
      return;
    }
    button.dataset.languageBound = 'true';
    button.addEventListener('click', () => {
      setLanguage(currentLanguage === 'ar' ? 'en' : 'ar');
    });
  }

  function ensureLanguageToggle() {
    if (document.body?.dataset.page === 'admin') {
      return;
    }

    const actions = document.querySelector('.top-actions');
    if (actions && !document.getElementById('languageToggle')) {
      const button = createLanguageButton('languageToggle', 'icon-btn language-toggle');
      actions.insertBefore(button, actions.firstElementChild);
    }

    bindLanguageButton(document.getElementById('languageToggle'));
    bindLanguageButton(document.getElementById('mobileNavLanguageToggle'));
  }

  function updateLanguageToggle() {
    [document.getElementById('languageToggle'), document.getElementById('mobileNavLanguageToggle')]
      .filter(Boolean)
      .forEach((button) => {
        const label = currentLanguage === 'ar' ? 'EN' : 'AR';
        const icon = button.querySelector('.mobile-nav-icon');
        if (icon) {
          icon.textContent = label;
        } else {
          button.textContent = label;
        }
        button.setAttribute('aria-label', currentLanguage === 'ar' ? 'Switch to English' : 'التحويل إلى العربية');
        button.setAttribute('title', currentLanguage === 'ar' ? 'English' : 'العربية');
      });
  }

  function applyLanguage(root = document.body) {
    if (!root || isApplying) {
      return;
    }

    isApplying = true;
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';
    document.body.dataset.language = currentLanguage;
    ensureLanguageToggle();
    updateLanguageToggle();
    translateAttributes(root);
    translateText(root);
    isApplying = false;
  }

  function scheduleApply() {
    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(() => {
      if (currentLanguage === defaultLanguage) {
        document.documentElement.lang = defaultLanguage;
        document.documentElement.dir = 'rtl';
        document.body.dataset.language = defaultLanguage;
        ensureLanguageToggle();
        updateLanguageToggle();
        return;
      }

      applyLanguage();
    }, 80);
  }

  function setLanguage(language) {
    currentLanguage = supportedLanguages.has(language) ? language : defaultLanguage;
    saveLanguage(currentLanguage);
    applyLanguage();
    observeChanges();
  }

  function observeChanges() {
    observer?.disconnect();
    observer = new MutationObserver(() => {
      if (!isApplying) {
        scheduleApply();
      }
    });
    const observerOptions = currentLanguage === defaultLanguage
      ? {
          childList: true,
          subtree: true,
        }
      : {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['placeholder', 'aria-label', 'title'],
        };

    observer.observe(document.body, observerOptions);
  }

  function applyDefaultLanguageShell() {
    document.documentElement.lang = defaultLanguage;
    document.documentElement.dir = 'rtl';
    document.body.dataset.language = defaultLanguage;
    ensureLanguageToggle();
    updateLanguageToggle();
  }

  function init() {
    if (currentLanguage === defaultLanguage) {
      applyDefaultLanguageShell();
    } else {
      applyLanguage();
    }
    observeChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

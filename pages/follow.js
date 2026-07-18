import LegacyPage from '../components/LegacyPage';

const directWhatsappUrl = 'https://wa.me/201024622437';
const whatsappUrl = 'https://chat.whatsapp.com/GOOoB46pD9hAySEYNxSQO3?s=cl&p=a&mlu=2';
const instagramUrl = 'https://www.instagram.com/velora_accessories.17?igsh=ODUweTBnczNncjd3';
const whatsappIcon = '<svg viewBox="0 0 448 512" focusable="false"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 1.9 131.6 1.9 254c0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157Zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5Zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.5-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.5-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6Z"/></svg>';
const whatsappGroupIcon = '<svg viewBox="0 0 32 32" focusable="false"><path d="M16.1 3.2C9.1 3.2 3.5 8.8 3.5 15.7c0 2.2.6 4.3 1.6 6.1L3.8 28l6.4-1.7c1.7.9 3.7 1.5 5.9 1.5 6.9 0 12.5-5.6 12.5-12.5S23 3.2 16.1 3.2Zm0 22.3c-1.9 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.3-.4c-1-1.5-1.6-3.3-1.6-5.1C5.9 10.1 10.5 5.6 16.1 5.6s10.2 4.5 10.2 10.1-4.6 9.8-10.2 9.8Z"/><path d="M21.4 18.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-.9 1.2s-.4.2-.7.1c-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 2.9 1.2 3.1c.2.2 2 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1 0-.3-.1-.6-.3Z"/><path d="M22.3 8.4c1.8.1 3.2 1.6 3.2 3.4M24.8 6.4c2.4.8 4.1 3.1 4.1 5.7"/></svg>';
const instagramIcon = '<svg viewBox="0 0 448 512" focusable="false"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141Zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.5 74.7-74.7 74.7Zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8Zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S3.3 127.6 1.6 163.5c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8-.1-184.9ZM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1Z"/></svg>';
const facebookIcon = '<svg viewBox="0 0 320 512" focusable="false"><path d="M279.14 288 293 197.7h-86.7v-58.6c0-24.7 12.1-48.8 50.9-48.8H296V13.6S260.4 7.5 226.3 7.5c-73.2 0-121.1 44.4-121.1 124.7v65.5H24V288h81.2v216h101.1V288Z"/></svg>';

const bodyHtml = `
  <div class="page-shell follow-page-shell">
    <header class="topbar service-topbar">
      <a class="brand-block" href="/" aria-label="HabibaVelora">
        <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
        <div class="brand-copy">
          <strong>HabibaVelora</strong>
          <small>تابعينا وروابطنا الرسمية</small>
        </div>
      </a>

      <nav class="topnav" aria-label="التنقل الرئيسي">
        <a href="/">الرئيسية</a>
        <a href="/#categories">الأقسام</a>
        <a href="/#collection">المنتجات</a>
        <a href="/about">قصتنا</a>
        <a href="/follow">تابعينا</a>
        <a href="/cart">السلة</a>
      </nav>

      <div class="top-actions">
        <a href="/#collection" class="secondary-btn">العودة للمتجر</a>
      </div>
    </header>

    <main>
      <section class="section-block follow-hero reveal" style="--delay: 0.05s;">
        <div class="section-heading">
          <div>
            <p class="eyebrow">تابعينا</p>
            <h1>روابط HabibaVelora الرسمية</h1>
            <p>اختاري القناة المناسبة وتابعي أحدث المنتجات والعروض بسهولة.</p>
          </div>
        </div>

        <div class="follow-links-grid">
          <a class="follow-link-card whatsapp direct" href="${directWhatsappUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">${whatsappIcon}</span>
            <div>
              <strong>واتساب مباشر</strong>
              <small>للاستفسار السريع ومتابعة الطلبات</small>
            </div>
          </a>

          <a class="follow-link-card whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">${whatsappGroupIcon}</span>
            <div>
              <strong>مجموعة واتساب</strong>
              <small>انضمي للقناة وتابعي التحديثات الجديدة</small>
            </div>
          </a>

          <a class="follow-link-card instagram" href="${instagramUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">${instagramIcon}</span>
            <div>
              <strong>إنستجرام</strong>
              <small>تابعي الصور، التفاصيل، وأحدث القطع</small>
            </div>
          </a>

          <span class="follow-link-card facebook pending" aria-label="فيسبوك قريبًا">
            <span class="follow-link-icon" aria-hidden="true">${facebookIcon}</span>
            <div>
              <strong>فيسبوك</strong>
              <small>الرابط هيتضاف أول ما يكون جاهز</small>
            </div>
          </span>

          <a class="follow-link-card about" href="/about">
            <span class="follow-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 3.5 20 8v8l-8 4.5L4 16V8Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
                <path d="M8.4 10.2h7.2M8.4 13.8h5.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
              </svg>
            </span>
            <div>
              <strong>قصتنا</strong>
              <small>اعرفي قصة Habiba Velora ورحلتنا</small>
            </div>
          </a>
        </div>
      </section>
    </main>
  </div>
`;

export default function FollowPage() {
  return (
    <LegacyPage
      title="تابعينا | HabibaVelora"
      description="روابط HabibaVelora الرسمية: قناة واتساب وإنستجرام."
      bodyHtml={bodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
    />
  );
}

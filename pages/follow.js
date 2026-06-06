import LegacyPage from '../components/LegacyPage';

const whatsappUrl = 'https://chat.whatsapp.com/GOOoB46pD9hAySEYNxSQO3?s=cl&p=a&mlu=2';
const instagramUrl = 'https://www.instagram.com/velora_accessories.17?igsh=ODUweTBnczNncjd3';

const bodyHtml = `
  <div class="page-shell follow-page-shell">
    <header class="topbar">
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
          <a class="follow-link-card whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path fill="currentColor" d="M12.04 2.02c-5.5 0-9.98 4.43-9.98 9.9 0 1.74.46 3.44 1.34 4.94L2 22l5.28-1.34a10.05 10.05 0 0 0 4.76 1.2c5.5 0 9.98-4.43 9.98-9.9s-4.48-9.94-9.98-9.94Zm0 18.04a8.25 8.25 0 0 1-4.2-1.14l-.3-.18-3.13.8.84-3.03-.2-.31a8.1 8.1 0 0 1-1.24-4.28c0-4.47 3.7-8.1 8.23-8.1 4.54 0 8.24 3.63 8.24 8.1 0 4.48-3.7 8.14-8.24 8.14Zm4.53-6.07c-.25-.12-1.48-.72-1.71-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.22-.75-.65-1.24-1.45-1.39-1.7-.14-.25-.01-.38.12-.5.11-.12.25-.28.37-.42.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.33-.77-1.82-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.66.3-.23.25-.86.84-.86 2.03s.88 2.34 1 2.51c.13.17 1.74 2.62 4.22 3.67.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.47-.07 1.48-.6 1.69-1.16.21-.57.21-1.06.15-1.16-.06-.1-.22-.16-.47-.28Z" />
              </svg>
            </span>
            <div>
              <strong>قناة واتساب</strong>
              <small>انضمي للقناة وتابعي التحديثات الجديدة</small>
            </div>
          </a>

          <a class="follow-link-card instagram" href="${instagramUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="1.9" />
                <circle cx="12" cy="12" r="4.15" fill="none" stroke="currentColor" stroke-width="1.9" />
                <circle cx="17.35" cy="6.65" r="1.25" fill="currentColor" />
              </svg>
            </span>
            <div>
              <strong>إنستجرام</strong>
              <small>تابعي الصور، التفاصيل، وأحدث القطع</small>
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

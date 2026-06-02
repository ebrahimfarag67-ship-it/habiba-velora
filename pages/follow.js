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
            <span class="follow-link-icon" aria-hidden="true">☎</span>
            <div>
              <strong>قناة واتساب</strong>
              <small>انضمي للقناة وتابعي التحديثات الجديدة</small>
            </div>
          </a>

          <a class="follow-link-card instagram" href="${instagramUrl}" target="_blank" rel="noreferrer">
            <span class="follow-link-icon" aria-hidden="true">◎</span>
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

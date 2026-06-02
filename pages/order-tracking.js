import LegacyPage from '../components/LegacyPage';

const html = `<div class="page-shell">
  <header class="topbar">
    <a class="brand-block" href="/" aria-label="HabibaVelora">
      <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
      <div class="brand-copy">
        <strong>HabibaVelora</strong>
        <small>تتبع الطلب</small>
      </div>
    </a>
    <nav class="topnav" aria-label="التنقل الرئيسي">
      <a href="/">المتجر</a>
      <a href="/order-tracking">تتبع الطلب</a>
      <a href="/after-sales">فاتورة المرتجع</a>
    </nav>
    <div class="top-actions">
      <a href="/cart" class="secondary-btn">السلة</a>
    </div>
  </header>
  <main>
    <section class="section-block content-hero">
      <p class="eyebrow">تتبع الطلب</p>
      <h1>اعرف حالة طلبك بخطوة واحدة</h1>
      <p>اكتب رقم الطلب أو رقم الفاتورة أو رقم الهاتف لمعرفة آخر حالة مسجلة من لوحة التحكم.</p>
      <form id="trackingForm" class="tracking-form">
        <input id="trackingLookup" type="search" placeholder="مثال: VEL-0001 أو INV-0001 أو رقم الهاتف" required />
        <button type="submit" class="primary-btn">بحث</button>
      </form>
    </section>
    <section id="trackingResult" class="section-block"></section>
  </main>
</div>
<div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>`;

export default function OrderTrackingPage() {
  return (
    <LegacyPage
      title="تتبع الطلب | HabibaVelora"
      description="صفحة مستقلة لتتبع حالة الطلب من HabibaVelora"
      bodyHtml={html}
      scripts={['/tracking.js', '/script.js', '/order-tracking.js']}
    />
  );
}

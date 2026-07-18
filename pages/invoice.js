import LegacyPage from '../components/LegacyPage';

const html = `<div class="page-shell invoice-print-page">
  <header class="topbar service-topbar no-print">
    <a class="brand-block" href="/" aria-label="HabibaVelora">
      <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
      <div class="brand-copy">
        <strong>HabibaVelora</strong>
        <small>فاتورة الطلب</small>
      </div>
    </a>
    <nav class="topnav" aria-label="التنقل الرئيسي">
      <a href="/">المتجر</a>
      <a href="/#collection">الأقسام</a>
      <a href="/order-tracking">تتبع الطلب</a>
      <a href="/after-sales">فاتورة المرتجع</a>
      <a href="/follow">تابعينا</a>
      <a href="/about">قصتنا</a>
    </nav>
    <div class="top-actions">
      <a href="/cart" class="secondary-btn">السلة</a>
    </div>
  </header>
  <main>
    <section id="invoicePrintMount" class="section-block"></section>
  </main>
</div>`;

export default function InvoicePage() {
  return (
    <LegacyPage
      title="فاتورة الطلب | HabibaVelora"
      description="فاتورة شحن قابلة للطباعة مع كود تأكيد التسليم"
      bodyHtml={html}
      scripts={['/tracking.js', '/invoice.js']}
    />
  );
}

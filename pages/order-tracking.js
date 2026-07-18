import LegacyPage from '../components/LegacyPage';

const html = `<div class="page-shell">
  <header class="topbar service-topbar">
    <a class="brand-block" href="/" aria-label="HabibaVelora">
      <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
      <div class="brand-copy">
        <strong>HabibaVelora</strong>
        <small>\u062a\u062a\u0628\u0639 \u0627\u0644\u0637\u0644\u0628</small>
      </div>
    </a>
    <nav class="topnav" aria-label="\u0627\u0644\u062a\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064a\u0633\u064a">
      <a href="/">\u0627\u0644\u0645\u062a\u062c\u0631</a>
      <a href="/#collection">\u0627\u0644\u0623\u0642\u0633\u0627\u0645</a>
      <a href="/order-tracking">\u062a\u062a\u0628\u0639 \u0627\u0644\u0637\u0644\u0628</a>
      <a href="/after-sales">\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u062a\u062c\u0639</a>
      <a href="/follow">\u062a\u0627\u0628\u0639\u064a\u0646\u0627</a>
      <a href="/about">\u0642\u0635\u062a\u0646\u0627</a>
    </nav>
    <div class="top-actions">
      <a href="/cart" class="secondary-btn">\u0627\u0644\u0633\u0644\u0629</a>
    </div>
  </header>
  <main>
    <section class="section-block content-hero">
      <p class="eyebrow">\u062a\u062a\u0628\u0639 \u0627\u0644\u0637\u0644\u0628</p>
      <h1>\u0645\u0633\u0627\u0631 \u0637\u0644\u0628\u0643 \u0628\u0648\u0636\u0648\u062d \u0645\u0646 \u0623\u0648\u0644 \u0644\u062d\u0638\u0629 \u062d\u062a\u0649 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645</h1>
      <p>\u0627\u0643\u062a\u0628 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 \u0623\u0648 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u0644\u0645\u0639\u0631\u0641\u0629 \u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b.</p>
      <form id="trackingForm" class="tracking-form">
        <input id="trackingLookup" type="search" placeholder="\u0645\u062b\u0627\u0644: VEL-0001 \u0623\u0648 INV-0001 \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641" required />
        <button type="submit" class="primary-btn animated-flow-button flow-track">
          <svg class="arr-1" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.5 5.5 20 12l-6.5 6.5-1.4-1.4 4.1-4.1H4v-2h12.2l-4.1-4.1 1.4-1.4Z" />
          </svg>
          <span class="circle" aria-hidden="true"></span>
          <span class="text">\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0637\u0644\u0628</span>
          <svg class="arr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.5 5.5 20 12l-6.5 6.5-1.4-1.4 4.1-4.1H4v-2h12.2l-4.1-4.1 1.4-1.4Z" />
          </svg>
        </button>
      </form>
    </section>
    <section id="trackingResult" class="section-block"></section>
  </main>
</div>
<div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>`;

export default function OrderTrackingPage() {
  return (
    <LegacyPage
      title="\u062a\u062a\u0628\u0639 \u0627\u0644\u0637\u0644\u0628 | HabibaVelora"
      description="\u0635\u0641\u062d\u0629 \u0645\u0633\u062a\u0642\u0644\u0629 \u0644\u062a\u062a\u0628\u0639 \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 HabibaVelora"
      bodyHtml={html}
      scripts={['/tracking.js', '/script.js', '/order-tracking.js']}
    />
  );
}

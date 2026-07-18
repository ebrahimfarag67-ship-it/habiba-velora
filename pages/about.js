import LegacyPage from '../components/LegacyPage';

const bodyHtml = `
  <div class="page-shell about-page-shell">
    <header class="topbar service-topbar">
      <a class="brand-block" href="/" aria-label="Habiba Velora">
        <img src="/assets/habibvelora-logo-transparent.png" alt="" class="brand-mark" aria-hidden="true" />
        <div class="brand-copy">
          <strong>Habiba Velora</strong>
          <small>من نحن وقصة البراند</small>
        </div>
      </a>

      <nav class="topnav" aria-label="التنقل الرئيسي">
        <a href="/">الرئيسية</a>
        <a href="/#collection">الأقسام</a>
        <a href="/products">كل المنتجات</a>
        <a href="/about">قصتنا</a>
        <a href="/follow">تابعينا</a>
        <a href="/cart">السلة</a>
      </nav>

      <div class="top-actions">
        <a href="/#collection" class="secondary-btn">العودة للمتجر</a>
      </div>
    </header>

    <main class="about-page-main" data-no-translate>
      <section class="about-hero reveal">
        <p class="about-eyebrow">من نحن</p>
        <h1>Habiba Velora</h1>
        <p>رحلة شغف، وثقة، وأناقة بتكبر يوم بعد يوم.</p>
      </section>

      <section class="about-story-layout reveal">
        <article class="about-story-card">
          <p>في عالم الموضة، كل براند له بداية…</p>
          <p>وبداية <strong>Habiba Velora</strong> كانت حلم بسيط بدأ بشغف حقيقي بالتفاصيل والأناقة المختلفة.</p>
          <p>الرحلة بدأت بخطوات صغيرة، واختيار منتجات بعناية، مع اهتمام حقيقي إن كل قطعة تكون أكثر من مجرد إكسسوار أو منتج عادي… لكن قطعة تعبر عن الذوق، الثقة، والشخصية.</p>
          <p>ومع الوقت، بدأ البراند يكبر خطوة بخطوة، من تصوير المنتجات وصناعة المحتوى على Instagram، إلى بناء مجتمع من الناس اللي بيثقوا في ذوقنا وجودتنا.</p>
          <p>لكن اللي ميّز رحلتنا فعلًا إننا كنا قريبين من الناس في كل خطوة.</p>
          <p>كنا ننزل بنفسنا في الأماكن والفعاليات ونتابع آراء العملاء بشكل مباشر، نسمع تفاصيلهم، ونعرف إيه اللي بيخلي المنتج فعلًا مميز ومريح ليهم. لأن بالنسبة لينا، رأي العميل مش مجرد تقييم… ده جزء أساسي من تطوير البراند.</p>
          <p>وفي <strong>Habiba Velora</strong> إحنا مؤمنين إن الجودة الحقيقية هي اللي تعيش.</p>
          <p>علشان كده بنهتم إن المنتجات اللي بنقدمها تكون بخامات ممتازة، وتصميمات عملية وأنيقة، سواء كانت إكسسوارات، ستانلس ستيل، أو قطع فضة مختارة بعناية — منتجات تفضل محتفظة بجمالها وجودتها حتى مع الاستخدام الطويل.</p>
          <p>ومع تطور الحلم، قررنا نكبر أكتر…</p>
          <p>فبدأنا في إنشاء موقع إلكتروني وتجربة متكاملة تسهّل الوصول لمنتجاتنا، بالإضافة لمشاركة رحلتنا وتفاصيل البراند عبر منصات التواصل المختلفة مثل TikTok وInstagram.</p>
          <p>في النهاية، <strong>Habiba Velora</strong> مش مجرد براند…</p>
          <p>دي رحلة شغف، وثقة، وأناقة بتكبر يوم بعد يوم.</p>
          <p class="about-story-welcome">Welcome to Habiba Velora</p>
        </article>

        <aside class="about-story-side">
          <div class="about-side-mark">
            <img src="/assets/habibvelora-logo-transparent.png" alt="" aria-hidden="true" />
          </div>
          <div class="about-side-note">
            <span>01</span>
            <strong>تفاصيل تختاريها بثقة</strong>
            <p>كل قطعة بتتقدم بروح هادية، جودة واضحة، وذوق قريب من الناس.</p>
          </div>
          <div class="about-side-note">
            <span>02</span>
            <strong>قريبة من العميلة</strong>
            <p>رأيك جزء من تطوير البراند، مش مجرد تقييم بعد الشراء.</p>
          </div>
          <div class="about-side-note">
            <span>03</span>
            <strong>جودة تعيش</strong>
            <p>بنختار خامات وتصميمات تفضل جميلة مع الاستخدام الطويل.</p>
          </div>
        </aside>
      </section>

      <section class="about-values reveal" aria-label="قيم Habiba Velora">
        <article>
          <span>الشغف</span>
          <p>بداية البراند كانت من حب التفاصيل والاختيارات المختلفة.</p>
        </article>
        <article>
          <span>الثقة</span>
          <p>نهتم إن تجربة الشراء تكون واضحة وقريبة من العميل.</p>
        </article>
        <article>
          <span>الأناقة</span>
          <p>قطع مختارة بعناية تعبر عن الذوق والشخصية.</p>
        </article>
      </section>
    </main>
  </div>
`;

export default function AboutPage() {
  return (
    <LegacyPage
      title="من نحن | Habiba Velora"
      description="تعرفي على قصة Habiba Velora ورحلة البراند من الشغف بالتفاصيل إلى تجربة تسوق متكاملة."
      bodyHtml={bodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
    />
  );
}

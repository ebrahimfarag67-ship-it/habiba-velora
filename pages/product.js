import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';

export default function ProductPage() {
  const page = PAGE_CONTENT.product;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js', '/script.js', '/product-page.js']}
      extraHead={
        <meta
          id="productOgImage"
          property="og:image"
          content="/assets/habibvelora-hero-photo.png"
        />
      }
    />
  );
}
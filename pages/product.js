import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';
import { readProducts } from '../lib/products-store';

export default function ProductPage({ initialProducts = [] }) {
  const page = PAGE_CONTENT.product;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js', '/script.js', '/product-page.js?v=20260615-order-ui-v2']}
      initialProducts={initialProducts}
      extraHead={
        <meta
          id="productOgImage"
          property="og:image"
          content=""
        />
      }
    />
  );
}

export async function getServerSideProps() {
  return { props: { initialProducts: await readProducts() } };
}


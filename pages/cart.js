import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';
import { readProducts } from '../lib/products-store';

export default function CartPage({ initialProducts = [] }) {
  const page = PAGE_CONTENT.cart;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
      initialProducts={initialProducts}
    />
  );
}

export async function getServerSideProps() {
  return { props: { initialProducts: await readProducts() } };
}

import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';

export default function CartPage() {
  const page = PAGE_CONTENT.cart;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
    />
  );
}
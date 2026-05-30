import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';

export default function AdminPage() {
  const page = PAGE_CONTENT.admin;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
    />
  );
}
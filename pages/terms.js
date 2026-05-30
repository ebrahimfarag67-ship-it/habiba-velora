import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';

export default function TermsPage() {
  const page = PAGE_CONTENT.terms;

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={page.bodyHtml}
      scripts={['/tracking.js']}
    />
  );
}
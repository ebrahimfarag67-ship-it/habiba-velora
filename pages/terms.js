import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';

export default function TermsPage() {
  const page = PAGE_CONTENT.terms;
  const cashOnlyBodyHtml = page.bodyHtml
    .replace('طرق دفع متاحة', 'طريقة الدفع الحالية')
    .replace(
      /الدفع عند الاستلام، فودافون كاش مباشر على رقم المتجر، أو دفع إلكتروني بالفيزا من خلال Paymob\./,
      'الدفع المتاح حاليًا هو الدفع عند الاستلام فقط، وسيتم تفعيل باقي الطرق بعد جاهزيتها.',
    );

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={cashOnlyBodyHtml}
      scripts={['/tracking.js']}
    />
  );
}

import LegacyPage from '../components/LegacyPage';
import { PAGE_CONTENT } from '../lib/page-content';
import { readProducts } from '../lib/products-store';

export default function CartPage({ initialProducts = [] }) {
  const page = PAGE_CONTENT.cart;
  const cashOnlyBodyHtml = page.bodyHtml.replace(
    /\n\s*<option value="فودافون كاش">فودافون كاش مباشر<\/option>\n\s*<option value="فيزا \/ ماستر كارد">فيزا \/ ماستر كارد<\/option>/,
    '',
  )
    .replace('<h1>مراجعة الطلب وتأكيده من صفحة مستقلة</h1>', '<h1>السلة</h1>')
    .replace('<p>كل المنتجات المختارة تظهر هنا مع الإجمالي وبيانات الشحن والدفع قبل إرسال الطلب.</p>', '')
    .replace('<h2>سلة شراء احترافية</h2>', '');

  return (
    <LegacyPage
      title={page.title}
      description={page.description}
      bodyHtml={cashOnlyBodyHtml}
      scripts={['/tracking.js', '/script.js', '/main.js']}
      initialProducts={initialProducts}
    />
  );
}

export async function getServerSideProps() {
  return { props: { initialProducts: await readProducts() } };
}

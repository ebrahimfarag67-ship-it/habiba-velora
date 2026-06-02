import LegacyPage from '../components/LegacyPage';

const html = `<div class="page-shell invoice-print-page">
  <main>
    <section id="invoicePrintMount" class="section-block"></section>
  </main>
</div>`;

export default function InvoicePage() {
  return (
    <LegacyPage
      title="فاتورة الطلب | HabibaVelora"
      description="فاتورة شحن قابلة للطباعة مع كود تأكيد التسليم"
      bodyHtml={html}
      scripts={['/tracking.js', '/invoice.js']}
    />
  );
}

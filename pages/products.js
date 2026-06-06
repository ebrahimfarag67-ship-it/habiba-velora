import Head from 'next/head';
import Script from 'next/script';
import ProductsGallery from '../components/ProductsGallery';
import { readProducts } from '../lib/products-store';

export default function ProductsPage({ initialProducts = [] }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f3e4d3" />
        <link rel="icon" href="/assets/habibvelora-logo-transparent.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/habibvelora-logo-transparent.png" />
        <title>HabibaVelora | المنتجات</title>
        <meta name="description" content="تصفح جميع منتجات HabibaVelora مع صور متحركة وتفاصيل شاملة" />
      </Head>

      <ProductsGallery products={initialProducts} />

      <Script id="velora-initial-products" strategy="beforeInteractive">
        {`window.veloraInitialProducts=${JSON.stringify(initialProducts).replace(/</g, '\\u003c')};`}
      </Script>
      
      <Script src="/language.js" strategy="beforeInteractive" />
      <Script src="/script.js" strategy="beforeInteractive" />
    </>
  );
}

export async function getServerSideProps() {
  return { 
    props: { 
      initialProducts: await readProducts() 
    } 
  };
}

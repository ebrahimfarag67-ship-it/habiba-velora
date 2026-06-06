import Head from 'next/head';
import Script from 'next/script';

export default function LegacyPage({
  title,
  description,
  bodyHtml,
  scripts = [],
  extraHead = null,
  initialProducts = [],
}) {
  const initialStoreScript = `window.veloraInitialProducts=${JSON.stringify(initialProducts).replace(/</g, '\\u003c')};`;
  const preloadImages = [...new Set(
    initialProducts
      .flatMap((product) => [product?.image, product?.hoverImage, ...(Array.isArray(product?.gallery) ? product.gallery : [])])
      .filter(Boolean)
      .slice(0, 4),
  )];

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f3e4d3" />
        <link rel="icon" href="/assets/habibvelora-logo-transparent.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/habibvelora-logo-transparent.png" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="ga-id" content="" />
        <meta name="facebook-pixel-id" content="" />
        {preloadImages.map((src) => (
          <link key={src} rel="preload" as="image" href={src} fetchPriority="high" />
        ))}
        {extraHead}
      </Head>

      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      <Script id="velora-initial-products" strategy="beforeInteractive">
        {initialStoreScript}
      </Script>

      <Script src="/language.js" strategy="beforeInteractive" />

      {scripts.map((src) => (
        <Script
          key={src}
          src={src}
          strategy={src === '/script.js' ? 'beforeInteractive' : 'afterInteractive'}
        />
      ))}
    </>
  );
}

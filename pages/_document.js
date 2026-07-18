import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      pathname: ctx.pathname,
    };
  }

  render() {
    const pathname = this.props.pathname || '';
    const bodyClassName = pathname === '/cart' ? 'cart-page' : '';
    const bodyDataPage = pathname === '/' ? 'home' : pathname.replace(/^\/+/, '') || 'home';

    return (
      <Html lang="ar" dir="rtl">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Cormorant+Garamond:wght@600;700&family=Kanit:wght@300;400;500;600;700;800;900&family=Manrope:wght@600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className={bodyClassName} data-page={bodyDataPage} data-theme="dark">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

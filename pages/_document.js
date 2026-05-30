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
        <Head />
        <body className={bodyClassName} data-page={bodyDataPage}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

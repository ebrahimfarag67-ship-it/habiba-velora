import '../styles.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const THEME_KEY = 'velora-store-v4-theme';
const FORCED_THEME = 'dark';
const ADMIN_SHORTCUT_CLICKS = 5;
const ADMIN_SHORTCUT_WINDOW_MS = 2200;

function installBrandFallbacks() {
  document.querySelectorAll('img.brand-mark').forEach((image) => {
    const replaceBrokenLogo = () => {
      if (!image.isConnected || image.dataset.veloraFallback === '1') return;

      const fallback = document.createElement('span');
      fallback.className = `${image.className} brand-mark-fallback`.trim();
      fallback.setAttribute('aria-hidden', 'true');
      fallback.textContent = 'HV';
      image.dataset.veloraFallback = '1';
      image.replaceWith(fallback);
    };

    if (image.complete && image.naturalWidth === 0) {
      replaceBrokenLogo();
      return;
    }

    image.addEventListener('error', replaceBrokenLogo, { once: true });
  });
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    document.body.dataset.theme = FORCED_THEME;
    try {
      window.localStorage.setItem(THEME_KEY, FORCED_THEME);
    } catch {
      // Dark mode still applies through the body dataset.
    }
  }, [router.asPath]);

  useEffect(() => {
    installBrandFallbacks();
    const fallbackTimer = window.setTimeout(installBrandFallbacks, 700);
    return () => window.clearTimeout(fallbackTimer);
  }, [router.asPath]);

  useEffect(() => {
    let clicks = 0;
    let resetTimer;

    const isHomeLink = (anchor) => {
      if (!anchor) return false;
      const url = new URL(anchor.href, window.location.origin);
      return url.origin === window.location.origin && url.pathname === '/';
    };

    const handleHomeShortcut = (event) => {
      if (window.location.pathname !== '/') return;
      const anchor = event.target?.closest?.('a');
      if (!isHomeLink(anchor)) return;

      event.preventDefault();
      clicks += 1;
      window.clearTimeout(resetTimer);

      if (clicks >= ADMIN_SHORTCUT_CLICKS) {
        clicks = 0;
        window.location.href = '/admin';
        return;
      }

      resetTimer = window.setTimeout(() => {
        clicks = 0;
      }, ADMIN_SHORTCUT_WINDOW_MS);
    };

    document.addEventListener('click', handleHomeShortcut, true);

    return () => {
      window.clearTimeout(resetTimer);
      document.removeEventListener('click', handleHomeShortcut, true);
    };
  }, []);

  return (
    <div className="site-page-content">
      <Component {...pageProps} />
    </div>
  );
}

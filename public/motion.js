(function () {
  if (window.__veloraMotionInstalled) {
    return;
  }

  window.__veloraMotionInstalled = true;

  const MOTION_SELECTOR = [
    '.clean-header',
    '.clean-nav',
    '.clean-search-field',
    '.clean-cart-link',
    '.clean-process-head > *',
    '.clean-process-step',
    '.clean-catalog',
    '.clean-catalog-head',
    '.clean-category-card',
    '.velora-3d-copy',
    '.velora-monogram-scene',
    '.clean-shipping-alert',
    '.clean-shipping-step',
    '.clean-shipping-note',
    '.clean-shipping-signature',
    '.velora-footer-brand',
    '.velora-footer-column',
    '.velora-social-row a',
    '.about-hero',
    '.about-story-card',
    '.about-story-side',
    '.about-values article',
    '.reveal',
    '.section-block',
    '.products-topbar',
    '.gallery-container',
    '.product-slide',
    '.products-sidebar',
    '.products-section-header',
    '.products-list-section .products-grid .product-card',
    '.product-grid:not(.product-grid-loading) > .product-card',
    'body[data-page="category"] .category-page-catalog .product-card',
    '.product-page-shell',
    '.product-page-panel',
    '.product-page-summary > *',
    '.product-page-related-card',
    '.cart-page-panel',
    '.cart-item',
    '.cart-summary',
    '.return-form-panel',
    '.return-summary-panel',
    '.return-request-card',
    '.tracking-card',
    '.tracking-details-card',
    '.route-step',
    '.follow-link-card',
    '.invoice-print-card',
    '.section-heading',
  ].join(',');
  const PERSIST_SELECTOR = [
    '.clean-header',
    '.velora-footer-brand',
    '.velora-footer-column',
    '.velora-monogram-scene',
    '.products-list-section .products-grid .product-card',
    '.product-grid:not(.product-grid-loading) > .product-card',
    'body[data-page="category"] .category-page-catalog .product-card',
    '.product-page-related-card',
  ].join(',');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;
  let lastScrollY = window.scrollY || 0;
  let ticking = false;

  function reveal(element) {
    element.classList.add('hv-motion-in');
    element.classList.add('active');
  }

  function conceal(element) {
    // Reveal once. Re-hiding elements while scrolling made mobile text feel like
    // it was jumping in and out instead of staying stable.
    return;
  }

  function updateScrollDirection() {
    const currentScrollY = window.scrollY || 0;
    const direction = currentScrollY >= lastScrollY ? 'down' : 'up';
    document.body.dataset.scrollDirection = direction;
    lastScrollY = currentScrollY;
    ticking = false;
  }

  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollDirection);
      ticking = true;
    }
  }

  function prepare(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const elements = Array.from(scope.querySelectorAll(MOTION_SELECTOR));

    if (root && root.matches && root.matches(MOTION_SELECTOR)) {
      elements.unshift(root);
    }

    elements.forEach((element, index) => {
      if (element.dataset.hvMotion === '1') {
        return;
      }

      const siblings = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) => child.matches?.(MOTION_SELECTOR))
        : [];
      const siblingIndex = siblings.indexOf(element);
      const motionIndex = Math.min(siblingIndex >= 0 ? siblingIndex : index, 10);

      element.dataset.hvMotion = '1';
      element.style.setProperty('--motion-index', String(motionIndex));
      element.style.setProperty('--motion-delay', `${motionIndex * 55}ms`);
      element.style.setProperty('--motion-sweep-delay', `${220 + (motionIndex * 42)}ms`);

      if (prefersReducedMotion) {
        reveal(element);
        return;
      }

      if (element.matches(PERSIST_SELECTOR)) {
        reveal(element);
      }

      observer.observe(element);
    });
  }

  function start() {
    document.body.classList.add('hv-motion-ready');
    document.body.dataset.scrollDirection = 'down';

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll(MOTION_SELECTOR).forEach((element) => {
        element.dataset.hvMotion = '1';
        reveal(element);
      });
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
          } else {
            conceal(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '-6% 0px -10% 0px',
        threshold: 0.16,
      },
    );

    prepare(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            prepare(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('load', () => prepare(document), { once: true });
    window.setTimeout(() => prepare(document), 450);
    window.setTimeout(() => prepare(document), 1200);
  }

  function initPageTransitions() {
    if (window.__veloraPageTransitions) {
      return;
    }

    window.__veloraPageTransitions = true;
    document.body.classList.add('velora-page-ready');

    window.addEventListener('pageshow', () => {
      document.body.classList.remove('velora-page-leaving');
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');

      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute('download') ||
        (link.target && link.target !== '_self')
      ) {
        return;
      }

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) {
        return;
      }

      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash
      ) {
        return;
      }

      document.body.classList.add('velora-page-leaving');
      event.preventDefault();
      window.setTimeout(() => {
        window.location.href = nextUrl.href;
      }, 150);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  initPageTransitions();
}());

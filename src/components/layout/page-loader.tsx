
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;
      if (targetUrl !== currentUrl) {
        NProgress.start();
      }
    };

    const handleMutation: MutationCallback = () => {
      const anchorElements = document.querySelectorAll('a[href]');
      anchorElements.forEach(anchor => {
        if (anchor.getAttribute('data-nprogress-attached') !== 'true') {
          anchor.addEventListener('click', handleAnchorClick);
          anchor.setAttribute('data-nprogress-attached', 'true');
        }
      });
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Initial run
    handleMutation([], mutationObserver);

    return () => {
      mutationObserver.disconnect();
      const anchorElements = document.querySelectorAll('a[href]');
      anchorElements.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
        anchor.removeAttribute('data-nprogress-attached');
      });
    };
  }, []);

  return null;
}

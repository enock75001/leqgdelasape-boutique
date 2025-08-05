
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// To be called when a link is clicked
const handleLinkClick = (url: string) => {
  const currentUrl = window.location.href;
  const targetUrl = new URL(url, window.location.href).href;

  // Only start progress if the URL is different
  if (targetUrl !== currentUrl) {
    NProgress.start();
  }
};

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Effect to handle the completion of the progress bar
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Effect to attach and clean up click listeners on anchor tags
  useEffect(() => {
    const handleMutation: MutationCallback = (mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Query all anchor tags in the document
          const anchorElements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a[href]');
          
          anchorElements.forEach(anchor => {
            // Check if the event listener has already been added
            if (!(anchor as any).__nprogress_listener_added__) {
              const clickHandler = () => handleLinkClick(anchor.href);
              anchor.addEventListener('click', clickHandler);
              (anchor as any).__nprogress_listener_added__ = true;
              // Store the handler to remove it later
              (anchor as any).__nprogress_handler__ = clickHandler;
            }
          });
        }
      });
    };

    // Initial setup
    const initialAnchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a[href]');
    initialAnchors.forEach(anchor => {
        if (!(anchor as any).__nprogress_listener_added__) {
            const clickHandler = () => handleLinkClick(anchor.href);
            anchor.addEventListener('click', clickHandler);
            (anchor as any).__nprogress_listener_added__ = true;
            (anchor as any).__nprogress_handler__ = clickHandler;
        }
    });

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Cleanup function
    return () => {
      mutationObserver.disconnect();
      const allAnchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a[href]');
      allAnchors.forEach(anchor => {
        if ((anchor as any).__nprogress_listener_added__ && (anchor as any).__nprogress_handler__) {
          anchor.removeEventListener('click', (anchor as any).__nprogress_handler__);
          delete (anchor as any).__nprogress_listener_added__;
          delete (anchor as any).__nprogress_handler__;
        }
      });
    };
  }, []);

  return null;
}

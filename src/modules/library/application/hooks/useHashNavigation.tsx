/**
 * @fileoverview Hash navigation hook with collapsible-aware scrolling.
 *
 * @module src/modules/library/application/hooks/useHashNavigation
 * @version 1.2.0
 * @author Typeir
 * @since 2.0.0
 */
'use client';

import { DETAILS_OPENED_EVENT, REVEAL_EVENT } from '@/lib/constants/domEvents';
import { useEffect } from 'react';

/**
 * Opens the nearest closed ancestor {@link HTMLDetailsElement} of
 * {@link element}.
 *
 * @param {Element} element - The scroll target element.
 * @returns {HTMLDetailsElement | null} The opened details element, or null
 *   if no closed details ancestor was found.
 */
function openNearestClosedDetails(element: Element): HTMLDetailsElement | null {
  const details = element.closest<HTMLDetailsElement>('details');

  if (details && !details.hasAttribute('open')) {
    details.setAttribute('open', '');
    window.dispatchEvent(new CustomEvent(DETAILS_OPENED_EVENT));
    return details;
  }

  return null;
}

/**
 * Asks every sheet above {@link element} to turn to the page holding it.
 *
 * @description A sheet keeps its other pages hidden rather than absent, so an
 * anchor on one of them resolves to a real element with nothing on screen. The
 * ask bubbles, so a page nested inside another page is reached by one dispatch:
 * each sheet it passes turns to its own page on the way up.
 *
 * @param {Element} element - The scroll target element.
 * @returns {boolean} Whether anything was hidden and had to be shown.
 */
function revealEnclosingPages(element: Element): boolean {
  const hidden = element.closest('[data-sheet-page][hidden]') !== null;
  element.dispatchEvent(new CustomEvent(REVEAL_EVENT, { bubbles: true }));
  return hidden;
}

/**
 * Scrolls the viewport so that {@link element} sits at ~40% from the top
 * of the screen.
 *
 * @param {Element} element - The scroll target element.
 * @returns {void}
 */
function scrollToElementAtReadingPosition(element: Element): void {
  const rect = element.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - window.innerHeight * 0.4;

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth',
  });
}

/**
 * Enables automatic hash navigation for elements with `data-anchor` attributes.
 *
 * @remarks
 * This hook must be used in a client component.
 *
 * @example
 * // In a client component:
 * 'use client';
 *
 * export default function Page() {
 *   useHashNavigation();
 *   return <div>{content}</div>;
 * }
 *
 * @example
 * // Navigate to an anchor programmatically:
 * window.location.hash = '#my-section';
 * // Will scroll to: <h2 data-anchor="my-section">My Section</h2>
 *
 * @returns {void}
 */
export function useHashNavigation(): void {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        return;
      }

      const element = document.querySelector(`[data-anchor="${hash}"]`);

      if (!element) {
        return;
      }

      const openedDetails = openNearestClosedDetails(element);
      const scrollTarget = openedDetails ?? element;
      const turned = revealEnclosingPages(element);

      /* A page that was hidden has no place on the screen until the sheet has
         turned and the browser has laid it out again, and where to scroll to
         cannot be read before then. Two frames: one for the turn to be
         committed, one for what it changed to be measured. */
      if (turned) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            scrollToElementAtReadingPosition(scrollTarget),
          ),
        );
        return;
      }

      scrollToElementAtReadingPosition(scrollTarget);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
}

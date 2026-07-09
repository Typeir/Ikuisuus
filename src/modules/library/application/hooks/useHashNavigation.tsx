/**
 * @fileoverview Hash navigation hook with collapsible-aware scrolling.
 * When the target anchor is inside a collapsed {@code <details>} element,
 * the details are opened and scrolling targets the stable container rather
 * than the shifting inner element. Targets are positioned at ~40% from the
 * viewport top for natural reading flow.
 *
 * @module src/lib/hooks/useHashNavigation
 * @version 1.2.0
 * @author Typeir
 * @since 2.0.0
 */
'use client';

import { useEffect } from 'react';

/**
 * Custom event name fired after a closed details is opened so that
 * layout-dependent observers (e.g. SectionTrack) can rescan the DOM.
 */
const DETAILS_OPENED_EVENT = 'ik:details-opened';

/**
 * Opens the nearest ancestor {@link HTMLDetailsElement} of {@link element}
 * if it is currently closed so that the enclosed content becomes visible.
 *
 * Dispatches a {@link DETAILS_OPENED_EVENT} custom event on {@link window}
 * after opening so that layout-dependent widgets can rescan the DOM.
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
 * Scrolls the viewport so that {@link element} sits at roughly 40% from the
 * top of the screen, producing a more natural reading position than
 * {@link Element.scrollIntoView}.
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
 * Listens for hash changes in the URL and smoothly scrolls to the first
 * element with a matching `data-anchor` attribute. When the target is inside
 * a collapsed collapsible the nearest {@code <details>} ancestor is opened
 * and scrolling targets the stable container element. The scroll position
 * places the target at ~40% from the viewport top for a natural reading flow.
 *
 * @remarks
 * This hook must be used in a client component. It sets up event listeners
 * for the `hashchange` event and cleans them up on unmount.
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

      scrollToElementAtReadingPosition(scrollTarget);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
}

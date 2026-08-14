/**
 * @fileoverview Embed Link Bridge
 * @description Routes link clicks inside an embedded frame: library links
 * navigate via the router, all others open in a new window.
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module src/lib/embed/EmbedLinkBridge
 */

'use client';

import { isPlainLeftClick } from '@/lib/utils/isPlainLeftClick';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { classifyEmbedLink } from './classifyEmbedLink';

/**
 * Window features for bubbled navigations. `noopener` detaches the new window
 * from the opening frame.
 */
const BUBBLE_FEATURES = 'noopener';

/**
 * Intercepts and routes link clicks inside an embedded frame.
 *
 * Modified clicks — middle button, ctrl/cmd, shift, alt — are ignored and left
 * to the browser.
 *
 * @component
 * @returns {null} Nothing; the component exists for its side effect
 */
export const EmbedLinkBridge = (): null => {
  const router = useRouter();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const action = classifyEmbedLink(
        anchor.getAttribute('href'),
        window.location.origin,
      );

      if (action.kind === 'ignore') return;

      event.preventDefault();

      if (action.kind === 'internal') {
        router.push(action.href);
        return;
      }

      window.open(action.href, '_blank', BUBBLE_FEATURES);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [router]);

  return null;
};

/**
 * @fileoverview Embed Link Bridge
 * @description Mounted once inside the chrome-less embed shell, this component
 * owns every link click in the frame: library links navigate in place, and
 * everything else opens a new top-level window.
 *
 * A single delegated capture-phase listener covers the whole document, so MDX
 * prose links, aspect pills and any component-rendered anchor are handled
 * without each one knowing it is inside an embed.
 *
 * The new window is opened from within the click handler rather than by asking
 * the host page to open it. Popup blockers require transient user activation in
 * the window that calls `open`, and activation does not travel across a
 * `postMessage`, so a host-side handler would be blocked. The frame itself has
 * the activation, and the iframe's `allow-popups` plus
 * `allow-popups-to-escape-sandbox` let the result be an ordinary window.
 *
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
 * Window features for bubbled navigations. `noopener` severs the new window's
 * handle back to the frame that opened it.
 */
const BUBBLE_FEATURES = 'noopener';

/**
 * Intercepts link clicks inside an embedded frame and routes them by target.
 *
 * Renders nothing. Modified clicks — middle button, ctrl/cmd, shift, alt — are
 * left to the browser, which already opens them in a new tab or window.
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

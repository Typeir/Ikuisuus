/**
 * @fileoverview Embed Link Classifier
 * @description Decides what an embedded frame should do with a clicked link.
 *
 * An embed renders one library page and nothing else. Only other library pages
 * may replace it in-frame; a tag, an aspect, a tool, the home page or an
 * external site would all drag wiki chrome and unrelated routes into a panel
 * sized for an article, so they leave the frame entirely and open in a new
 * window instead.
 *
 * The classifier is pure so the rule can be tested without a DOM. Its caller
 * owns the side effects.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module src/lib/embed/classifyEmbedLink
 */

import {
  isEmbedPathname,
  isLibraryPathname,
  toEmbedPathname,
} from './embedRoutes';

/**
 * What the embed should do with a clicked link.
 *
 * `ignore` leaves the event alone — in-page anchors, `mailto:`, `tel:` and
 * anything unparseable are the browser's business. `internal` navigates within
 * the frame. `bubble` opens a new top-level window.
 */
export type EmbedLinkAction =
  | { kind: 'ignore' }
  | { kind: 'internal'; href: string }
  | { kind: 'bubble'; href: string };

/**
 * Protocols that never navigate the frame and must reach the browser untouched.
 */
const PASSTHROUGH_PROTOCOLS = new Set([
  'mailto:',
  'tel:',
  'sms:',
  'blob:',
  'javascript:',
]);

/**
 * Classifies a link clicked inside an embedded frame.
 *
 * Same-origin library and embed routes resolve to `internal`, rewritten onto
 * the embed tree so the chrome-less shell survives the navigation. Every other
 * navigable target resolves to `bubble`.
 *
 * @param {string | null | undefined} rawHref - The anchor's `href` attribute, as authored
 * @param {string} origin - The frame's own origin (e.g. `"https://example.com"`)
 * @returns {EmbedLinkAction} The action the caller should take
 */
export const classifyEmbedLink = (
  rawHref: string | null | undefined,
  origin: string,
): EmbedLinkAction => {
  if (!rawHref) return { kind: 'ignore' };
  if (rawHref.startsWith('#')) return { kind: 'ignore' };

  let url: URL;

  try {
    url = new URL(rawHref, origin);
  } catch {
    return { kind: 'ignore' };
  }

  if (PASSTHROUGH_PROTOCOLS.has(url.protocol)) return { kind: 'ignore' };

  if (url.origin !== origin) return { kind: 'bubble', href: url.href };

  if (isEmbedPathname(url.pathname) || isLibraryPathname(url.pathname)) {
    return {
      kind: 'internal',
      href: `${toEmbedPathname(url.pathname)}${url.search}${url.hash}`,
    };
  }

  return { kind: 'bubble', href: url.href };
};

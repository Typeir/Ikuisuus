/**
 * @fileoverview Embed Link Classifier
 * @description Decides what an embedded frame should do with a clicked link.
 * A pure function; its caller owns the side effects.
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
 * `ignore` does nothing. `internal` navigates within the frame. `bubble`
 * opens a new top-level window.
 */
export type EmbedLinkAction =
  | { kind: 'ignore' }
  | { kind: 'internal'; href: string }
  | { kind: 'bubble'; href: string };

/**
 * Protocols that never navigate the frame and reach the browser unchanged.
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
 * Same-origin library and embed routes return `internal`, rewritten onto the
 * embed tree. Every other navigable target returns `bubble`.
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

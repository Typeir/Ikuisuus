/**
 * @fileoverview What a sheet's bar calls its pages.
 * @module modules/library/presentation/components/slots/sheetNames
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { type Division } from './divisions';

/**
 * Names for the bar, with the opening every page shares taken off.
 *
 * @param {Division[]} pages - The pages the bar carries
 * @returns {string[]} What to print for each, in order
 */
export function unprefixed(pages: Division[]): string[] {
  const names = pages.map((page) => page.name);
  if (names.length < 2) return names;

  let shared = names[0];
  for (const name of names.slice(1)) {
    let at = 0;
    while (at < shared.length && at < name.length && shared[at] === name[at]) {
      at += 1;
    }
    shared = shared.slice(0, at);
  }
  const cut = Math.max(
    ...[' ', ',', '(', '–', '-'].map((mark) => shared.lastIndexOf(mark)),
  );
  if (cut < 1) return names;

  const trimmed = names.map((name) => {
    const rest = name
      .slice(cut + 1)
      .replace(/^[\s,–(-]+/, '')
      .trim();
    return /^[^()]*\)$/.test(rest) ? rest.slice(0, -1).trim() : rest;
  });
  return trimmed.every((name) => name !== '') ? trimmed : names;
}

/**
 * Remark Library Link Plugin
 *
 * @fileoverview Remark plugin expanding shorthand library links into full
 * routes, so prose can address a page as `/rules/…` instead of repeating
 * `/en/library/` on every link.
 *
 * Rewrites link targets only. A link already carrying a locale, addressing a
 * reserved app path, or pointing off-site is left exactly as authored.
 *
 * @module lib/md/remarkLibraryLink
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

import { DEFAULT_KEYWORD_LOCALE } from '@/lib/constants/locales';
import { expandLibraryUrl } from './libraryUrl';

/**
 * Options for the library link plugin.
 *
 * @interface LibraryLinkOptions
 * @property {string} [locale] - Locale of the document being compiled
 */
export interface LibraryLinkOptions {
  locale?: string;
}

/** MDAST node carrying a link target. */
interface UrlNode extends Node {
  url: string;
}

/**
 * Expands shorthand library links in a document.
 *
 * @param {LibraryLinkOptions} [options] - Plugin options
 * @returns {Function} Unified transformer
 *
 * @example
 * unified().use(remarkLibraryLink, { locale: 'en' });
 * // [Prone](/rules/steel-and-strife/conditions#prone)
 * // -> /en/library/rules/steel-and-strife/conditions#prone
 */
const remarkLibraryLink: Plugin<[LibraryLinkOptions?], Root> = (
  options = {},
) => {
  const locale = options.locale ?? DEFAULT_KEYWORD_LOCALE;

  return (tree: Root) => {
    visit(tree, ['link', 'definition'], (node: Node) => {
      const target = node as UrlNode;
      if (typeof target.url !== 'string') return;

      target.url = expandLibraryUrl(target.url, locale);
    });
  };
};

export default remarkLibraryLink;

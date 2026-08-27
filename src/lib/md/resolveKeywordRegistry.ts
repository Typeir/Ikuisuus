/**
 * Keyword Registry Resolution
 *
 * @fileoverview Loads the discovered keyword namespaces for a locale so the
 * compile paths can hand them to the remark plugin. Server only; the runtime
 * compiler has no filesystem and omits the registry, which leaves keywords
 * rendered but unlinked.
 *
 * @module lib/md/resolveKeywordRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import path from 'path';
import type { KeywordRegistry } from './keywordIndex';
import { discoverKeywordIndexes } from './keywordIndexRegistry';

/** Locale scanned when a caller names none. */
export const DEFAULT_KEYWORD_LOCALE = 'en';

/**
 * Discovers the keyword namespaces declared by a locale. Discovery is scoped to
 * one locale because namespaces merge across files, and two locales declaring
 * the same namespace would contest every shared value.
 *
 * @param {string} [locale] - Locale directory beneath the content root
 * @returns {Promise<KeywordRegistry>} Namespace mapped to its contents
 */
export async function resolveKeywordRegistry(
  locale: string = DEFAULT_KEYWORD_LOCALE,
): Promise<KeywordRegistry> {
  const root = path.join(process.cwd(), 'src/content', locale);
  return discoverKeywordIndexes(root);
}

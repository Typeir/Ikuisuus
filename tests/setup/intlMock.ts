/**
 * @fileoverview next-intl mock backed by the real English message files with
 * `{param}` interpolation. Provides `createRealMessageIntlMock` for tests that
 * assert user-visible copy.
 * @module tests/setup/intlMock
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import characterSheet from '../../messages/en/characterSheet.json';
import common from '../../messages/en/common.json';
import layout from '../../messages/en/layout.json';

/** English catalogue keyed by top-level i18n namespace. */
const MESSAGES: Record<string, unknown> = { characterSheet, common, layout };

/**
 * Walks a dot-separated path through the message tree.
 *
 * @function resolvePath
 * @param {unknown} root - Node to start from
 * @param {string} [path] - Dot-separated path, e.g. `characterSheet.coinPouch`
 * @returns {unknown} The resolved node, or undefined when absent
 */
const resolvePath = (root: unknown, path?: string): unknown => {
  if (!path) return root;
  return path
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      root,
    );
};

/**
 * Substitutes `{param}` placeholders using the supplied values. Placeholders
 * with no matching value are left intact.
 *
 * @function interpolate
 * @param {string} template - Message template
 * @param {Record<string, unknown>} [values] - Interpolation values
 * @returns {string} Interpolated message
 */
const interpolate = (
  template: string,
  values?: Record<string, unknown>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) =>
    values && name in values ? String(values[name]) : match,
  );

/**
 * Builds a `next-intl` module replacement whose `useTranslations` resolves
 * against the real English messages. Unknown keys fall back to the key itself.
 *
 * @function createRealMessageIntlMock
 * @param {T} actual - The unmocked `next-intl` module (spread through so
 *   `NextIntlClientProvider` and friends keep working)
 * @returns {T & Record<string, unknown>} Module replacement for `vi.mock`
 * @template {Record<string, unknown>} T
 */
export const createRealMessageIntlMock = <T extends Record<string, unknown>>(
  actual: T,
): T & Record<string, unknown> => ({
  ...actual,
  useLocale: () => 'en',
  useTranslations: (namespace?: string) => {
    const scope = resolvePath(MESSAGES, namespace);
    return (key: string, values?: Record<string, unknown>) => {
      const message = resolvePath(scope, key);
      return typeof message === 'string' ? interpolate(message, values) : key;
    };
  },
});

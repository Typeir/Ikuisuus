/**
 * @fileoverview remarkLibraryLink Unit Tests
 * @description Tests that shorthand link targets expand during compilation and
 * that nothing else in the document is touched.
 *
 * @module tests/unit/src/lib/md/remarkLibraryLink.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';

import remarkLibraryLink from '@/lib/md/remarkLibraryLink';

/**
 * Runs a document through the plugin.
 *
 * @param {string} source - Markdown source
 * @param {string} [locale] - Locale to expand into
 * @returns {string} Transformed markdown
 */
const run = (source: string, locale = 'en'): string =>
  unified()
    .use(remarkParse)
    .use(remarkLibraryLink, { locale })
    .use(remarkStringify)
    .processSync(source)
    .toString();

describe('remarkLibraryLink', () => {
  it('should expand a shorthand link target', () => {
    const out = run('See [Prone](/rules/steel-and-strife/conditions#prone).');

    expect(out).toContain(
      '/en/library/rules/steel-and-strife/conditions#prone',
    );
  });

  it('should expand a reference definition', () => {
    const out = run(
      ['See [Prone][p].', '', '[p]: /rules/steel-and-strife/conditions'].join(
        '\n',
      ),
    );

    expect(out).toContain('/en/library/rules/steel-and-strife/conditions');
  });

  it('should leave a link that already carries its locale', () => {
    const out = run('See [Prone](/en/library/rules/steel-and-strife/conditions).');

    expect(out).not.toContain('/en/library/en/');
    expect(out).toContain('/en/library/rules/steel-and-strife/conditions');
  });

  it('should leave an external link alone', () => {
    const out = run('See [docs](https://example.com/rules/x).');

    expect(out).toContain('https://example.com/rules/x');
  });

  it('should leave link text untouched', () => {
    const out = run('See [/rules/x is the path](/rules/x).');

    expect(out).toContain('/rules/x is the path');
  });

  it('should expand into the locale it is given', () => {
    const out = run('See [Prone](/rules/x).', 'fi');

    expect(out).toContain('/fi/library/rules/x');
  });

  it('should default to the fallback locale when given none', () => {
    const out = unified()
      .use(remarkParse)
      .use(remarkLibraryLink)
      .use(remarkStringify)
      .processSync('See [Prone](/rules/x).')
      .toString();

    expect(out).toContain('/en/library/rules/x');
  });
});

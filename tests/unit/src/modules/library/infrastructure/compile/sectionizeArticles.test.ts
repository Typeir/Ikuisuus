/**
 * @fileoverview sectionizeArticles Tests
 * @description Anchor registry and entry helpers behind rehypeSectionize.
 *
 * @module tests/unit/src/modules/library/infrastructure/compile/sectionizeArticles
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  Anchors,
  articleize,
  textOf,
} from '@/modules/library/infrastructure/compile/sectionizeArticles';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { describe, expect, it } from 'vitest';

describe('Anchors', () => {
  it('should keep the first slug, prefix a repeat with its parent, then number', () => {
    const a = new Anchors();
    expect(a.claim('bite', undefined)).toBe('bite');
    expect(a.claim('bite', 'drone')).toBe('drone-bite');
    expect(a.claim('bite', 'drone')).toBe('drone-bite-2');
    expect(a.claim('bite', undefined)).toBe('bite-2');
  });
});

describe('textOf', () => {
  it('should concatenate nested text', () => {
    const tree = fromHtml('<p><strong>A</strong> b <em>c</em></p>', { fragment: true });
    expect(textOf(tree.children[0])).toBe('A b c');
  });
});

describe('articleize', () => {
  it('should article entries only inside a section, li > article', () => {
    const tree = fromHtml(
      '<ul><li><p><strong>Outside.</strong> x</p></li></ul><section data-anchor="s"><ul><li><p><strong>Bite.</strong> Melee.</p></li></ul></section>',
      { fragment: true },
    );
    articleize(tree as never, new Anchors(), undefined, false, false, false);
    const out = toHtml(tree);
    expect(out).toContain('<section data-anchor="s"><ul><li><article data-anchor="bite">');
    expect(out).not.toContain('<article data-anchor="outside">');
  });
});

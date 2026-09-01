/**
 * @fileoverview truncateMdx Unit Tests
 * @description Covers both cut modes and the property that motivates the
 * module: whatever comes back still compiles.
 *
 * @module tests/unit/src/lib/md/truncateMdx.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/truncateMdx Module under test
 */

import { ELLIPSIS, truncateMdxSource } from '@/lib/md/truncateMdx';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { describe, expect, it } from 'vitest';

/**
 * Asserts the source is still valid MDX by compiling it.
 *
 * @param {string} source - Source to compile
 * @returns {void}
 */
function expectCompiles(source: string): void {
  expect(() => compileRuntimeSync({ source, components: {} })).not.toThrow();
}

describe('truncateMdxSource', () => {
  describe('stopAtComponent', () => {
    it('should cut before the first matching component', () => {
      const source = [
        'Lede paragraph.',
        '',
        '<Collapsible title="More">',
        '',
        'Hidden.',
        '',
        '</Collapsible>',
      ].join('\n');

      const result = truncateMdxSource(source, {
        stopAtComponent: 'Collapsible',
      });

      expect(result.source).toBe('Lede paragraph.');
      expect(result.truncated).toBe(true);
    });

    it('should return the whole document when the component is absent', () => {
      const source = 'Just prose.\n\nAnd more.';

      const result = truncateMdxSource(source, {
        stopAtComponent: 'Collapsible',
      });

      expect(result.source).toBe(source);
      expect(result.truncated).toBe(false);
    });

    it('should not match a component whose name merely shares a prefix', () => {
      const source = 'Lede.\n\n<CollapsibleGroup />\n';

      const result = truncateMdxSource(source, {
        stopAtComponent: 'Collapsible',
      });

      expect(result.truncated).toBe(false);
    });

    it('should leave a preceding element closed', () => {
      const source = [
        'Text with <Unit value={3} /> inline.',
        '',
        '<Collapsible title="More">',
        '',
        'Hidden.',
        '',
        '</Collapsible>',
      ].join('\n');

      const result = truncateMdxSource(source, {
        stopAtComponent: 'Collapsible',
      });

      expectCompiles(result.source);
    });
  });

  describe('maxChars', () => {
    it('should keep whole blocks while they fit', () => {
      const source = ['First block.', '', 'Second block.', '', 'Third.'].join(
        '\n',
      );

      const result = truncateMdxSource(source, { maxChars: 20 });

      expect(result.source).toBe('First block.');
      expect(result.truncated).toBe(true);
    });

    it('should cut inside the first block when it alone is over budget', () => {
      const source = 'One two three four five six seven eight nine ten.';

      const result = truncateMdxSource(source, { maxChars: 20 });

      expect(result.source.length).toBeLessThan(source.length);
      expect(result.source.endsWith(' ')).toBe(false);
      expect(result.truncated).toBe(true);
    });

    it('should append the ellipsis only when asked', () => {
      const source = 'One two three four five six seven eight nine ten.';

      expect(
        truncateMdxSource(source, { maxChars: 20, ellipsis: true }).source,
      ).toContain(ELLIPSIS);
      expect(
        truncateMdxSource(source, { maxChars: 20 }).source,
      ).not.toContain(ELLIPSIS);
    });

    it('should not count markup characters against the budget', () => {
      const bold = '**One two three four.**';
      const plain = 'One two three four.';

      expect(truncateMdxSource(bold, { maxChars: 19 }).truncated).toBe(
        truncateMdxSource(plain, { maxChars: 19 }).truncated,
      );
    });

    it('should leave a bold run closed rather than split it', () => {
      const source =
        'Opening words here and then **a bold run that runs past the budget**.';

      const result = truncateMdxSource(source, { maxChars: 35 });

      expectCompiles(result.source);
    });

    it('should not split a JSX element', () => {
      const source =
        'Some opening prose that fills the budget before <Unit value={3} /> lands.';

      const result = truncateMdxSource(source, { maxChars: 30 });

      expectCompiles(result.source);
    });

    it('should return the whole document when it fits', () => {
      const source = 'Short.';

      const result = truncateMdxSource(source, { maxChars: 500 });

      expect(result.source).toBe('Short.');
      expect(result.truncated).toBe(false);
    });
  });

  describe('both limits', () => {
    it('should take whichever cut comes first', () => {
      const source = [
        'A short lede.',
        '',
        'A second paragraph that pushes well past a small budget.',
        '',
        '<Collapsible title="More">',
        '',
        'Hidden.',
        '',
        '</Collapsible>',
      ].join('\n');

      const result = truncateMdxSource(source, {
        stopAtComponent: 'Collapsible',
        maxChars: 20,
      });

      expect(result.source).toBe('A short lede.');
    });
  });

  it('should pass empty source straight through', () => {
    expect(truncateMdxSource('', { maxChars: 10 })).toEqual({
      source: '',
      truncated: false,
    });
  });
});

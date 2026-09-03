/**
 * @fileoverview Slot card T13: escaping probe.
 * @description Six authored values per spelling: apostrophe, double quote,
 * link, emphasis, literal brace, and a two-line value. Records which
 * characters survive the attribute spelling and which need the element form.
 *
 * @module tests/unit/src/modules/library/slots/slots.escaping.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { describe, expect, it } from 'vitest';
import { renderSource } from './harness';

/**
 * Value cases under probe.
 */
const CASES: Record<string, string> = {
  apostrophe: "Dreamer's path",
  doubleQuote: 'The "Dreamer" path',
  link: '[_Bane_](/en/library/spells/bane)',
  emphasis: '_Repose_',
  brace: 'a { b',
  twoLine: 'Line one\nLine two',
};

/**
 * Builds a one-feature source in the given spelling around one value.
 *
 * @param {string} spelling - `attr` double-quoted attribute, `attr1` single-quoted attribute, `element` slot element
 * @param {string} value - Slot value
 * @returns {string} MDX source
 */
function probeSource(spelling: string, value: string): string {
  if (spelling === 'element') {
    return `<Feature>\n\n#### Probe\n\n<Cost>${value}</Cost>\n\nTail.\n\n</Feature>\n`;
  }
  if (spelling === 'attr1') {
    return `<Feature cost='${value}'>\n\n#### Probe\n\nTail.\n\n</Feature>\n`;
  }
  return `<Feature cost="${value}">\n\n#### Probe\n\nTail.\n\n</Feature>\n`;
}

describe('T13 escaping probe', () => {
  it('apostrophes survive both spellings', async () => {
    for (const spelling of ['attr', 'element']) {
      const html = await renderSource(probeSource(spelling, CASES.apostrophe));
      expect(html, `${spelling} apostrophe`).toMatch(/Dreamer(&#x27;|')s path/);
    }
  }, 120000);

  it('double quotes break a double-quoted attribute, survive a single-quoted one and the element', async () => {
    const broken = await renderSource(probeSource('attr', CASES.doubleQuote));
    expect(broken, 'attr double quote fails').toContain('mdx-empty');
    for (const spelling of ['attr1', 'element']) {
      const html = await renderSource(probeSource(spelling, CASES.doubleQuote));
      expect(html, `${spelling} double quote`).toMatch(
        /The (&quot;|")Dreamer(&quot;|") path/,
      );
    }
  }, 120000);

  it('links render in both spellings, since a slot attribute is desugared to its element', async () => {
    for (const spelling of ['attr', 'element']) {
      const html = await renderSource(probeSource(spelling, CASES.link));
      expect(html, `${spelling} link`).toMatch(/Bane<\/em><\/a>/);
      expect(html, `${spelling} link source`).not.toContain('](/en/library');
    }
  }, 120000);

  it('emphasis renders in both spellings', async () => {
    for (const spelling of ['attr', 'element']) {
      const html = await renderSource(probeSource(spelling, CASES.emphasis));
      expect(html, `${spelling} emphasis`).toMatch(/<em>Repose<\/em>/);
    }
  }, 120000);

  it('a literal brace survives the attribute and breaks the element', async () => {
    const attribute = await renderSource(probeSource('attr', CASES.brace));
    expect(attribute, 'attr brace').toContain('a { b');
    const element = await renderSource(probeSource('element', CASES.brace));
    expect(element, 'element brace breaks').toContain('mdx-empty');
  }, 120000);

  it('two-line values survive both spellings', async () => {
    for (const spelling of ['attr', 'element']) {
      const html = await renderSource(probeSource(spelling, CASES.twoLine));
      expect(html, `${spelling} two-line`).toContain('Line one');
      expect(html, `${spelling} two-line tail`).toContain('Line two');
    }
  }, 120000);
});

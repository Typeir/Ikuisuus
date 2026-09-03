/**
 * @fileoverview Slot card T15: truncateMdx and search prose.
 *
 * @module tests/unit/src/modules/library/slots/slots.search.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { truncateMdxSource } from '@/lib/md/truncateMdx';
import { extractProse } from '@scripts/search/extractProse';
import { describe, expect, it } from 'vitest';
import { elementFeature, fixtureSource } from './harness';

describe('T15 truncateMdx', () => {
  it('stopAtComponent misses a multi-line opener and cuts a one-line opener', () => {
    const multiLine = truncateMdxSource(fixtureSource(), {
      stopAtComponent: 'Heirloom',
    });
    expect(multiLine.truncated, 'multi-line opener').toBe(false);

    const oneLine = truncateMdxSource(
      `# Probe\n\nPrimer.\n\n<Heirloom attunement="required">\n\n_Very rare Heirloom_\n\n</Heirloom>\n`,
      { stopAtComponent: 'Heirloom' },
    );
    expect(oneLine.truncated).toBe(true);
    expect(oneLine.source).not.toContain('<Heirloom');
  });

  it('maxChars 450 cuts inside the card', () => {
    const result = truncateMdxSource(fixtureSource(), { maxChars: 450 });
    expect(result.truncated).toBe(true);
    expect(result.source, 'JSX counts no text').toContain('<Heirloom');
  });
});

describe('T15 search prose', () => {
  it('feature prose survives', () => {
    expect(extractProse(fixtureSource())).toContain(
      'You sweep the blade in a great lunar arc',
    );
  });

  it('attribute slot values are dropped, element slot values are kept', () => {
    expect(extractProse(fixtureSource())).not.toContain('1 Minor Action');
    expect(extractProse(elementFeature('1 Minor Action'))).toContain(
      '1 Minor Action',
    );
  });

  it('no slot value doubles into prose', () => {
    const prose = extractProse(fixtureSource());
    const count = (prose.match(/1 Minor Action/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(1);
  });
});

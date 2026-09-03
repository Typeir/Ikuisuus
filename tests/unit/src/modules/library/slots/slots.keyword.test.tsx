/**
 * @fileoverview Slot card T3: keyword href in slots.
 * @description Mocks the keyword graph and file service so `[# kw:Repose #]`
 * resolves deterministically; asserts the resolved `<Keyword>` carries an href
 * in both spellings.
 *
 * @module tests/unit/src/modules/library/slots/slots.keyword.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadKeywordGraph = vi.fn();
const producerOf = vi.fn();
const getFile = vi.fn();

vi.mock('@/lib/db/content/keywordGraph', () => ({
  loadKeywordGraph: (...args: unknown[]) => loadKeywordGraph(...args),
  producerOf: (...args: unknown[]) => producerOf(...args),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: (...args: unknown[]) => getFile(...args),
}));

import React from 'react';
import { elementFeature, renderFixture, renderSource } from './harness';

/**
 * A rules file defining the Repose heading.
 */
const RULES_CONTENT = [
  '## Repose',
  '',
  'A period of rest between ventures.',
  '',
  '---',
].join('\n');

const PRODUCER = {
  file: 'src/content/en/rules/steel-and-strife/effects.rule.mdx',
  route: '/library/rules/steel-and-strife/effects',
};

beforeEach(() => {
  loadKeywordGraph.mockReset().mockResolvedValue({});
  producerOf.mockReset().mockReturnValue(PRODUCER);
  getFile.mockReset().mockResolvedValue({
    content: RULES_CONTENT,
    resolvedPath: PRODUCER.file,
  });
});

afterEach(() => vi.restoreAllMocks());

describe('T3 keyword href in slots', () => {
  it('attributes: the keyword in a recharge attribute resolves with href', async () => {
    const html = await renderSource(
      `<Feature cost="1 Major Action" recharge="1/[# kw:Repose #]">\n\n#### Probe\n\nTail.\n\n</Feature>\n`,
    );
    const anchor = html.match(/<a [^>]*data-keyword="repose"[^>]*>/);
    expect(anchor).not.toBeNull();
    expect(anchor?.[0] ?? '').toMatch(/href="[^"]*#repose"/);
  });

  it('attributes: the fixture resolves the keyword its charges slot writes', async () => {
    const html = await renderFixture();
    const charges = html.match(
      /<span[^>]*data-slot="charges"[^>]*>[\s\S]*?<\/span><\/span>/,
    )?.[0] ?? '';
    expect(charges).toMatch(/<a [^>]*data-keyword="repose"[^>]*>/);
    expect(charges).toMatch(/href="[^"]*#repose"/);
  });

  it('elements: the keyword in the Cost element resolves with href', async () => {
    const html = await renderSource(elementFeature('1/[# kw:Repose #]'));
    const anchor = html.match(/<a [^>]*data-keyword="repose"[^>]*>/);
    expect(anchor).not.toBeNull();
    expect(anchor?.[0] ?? '').toMatch(/href="[^"]*#repose"/);
  });
});

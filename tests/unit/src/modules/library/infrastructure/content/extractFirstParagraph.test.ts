/**
 * @fileoverview Unit tests for extractFirstParagraph.
 * @module tests/unit/src/modules/library/infrastructure/content/extractFirstParagraph
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { extractFirstParagraph } from '@/modules/library/infrastructure/content/extractFirstParagraph';
import { describe, expect, it } from 'vitest';

describe('extractFirstParagraph', () => {
  it('returns first non-empty paragraph after heading', () => {
    const block = [
      '## Header',
      '',
      'First paragraph.',
      '',
      'Second paragraph.',
    ].join('\n');
    expect(extractFirstParagraph(block)).toBe('First paragraph.');
  });
});

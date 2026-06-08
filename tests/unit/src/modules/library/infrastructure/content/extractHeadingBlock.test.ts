/**
 * @fileoverview Unit tests for extractHeadingBlock.
 * @module tests/unit/src/modules/library/infrastructure/content/extractHeadingBlock
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { extractHeadingBlock } from '@/modules/library/infrastructure/content/extractHeadingBlock';
import { describe, expect, it } from 'vitest';

describe('extractHeadingBlock', () => {
  it('returns the matching heading block', () => {
    const source = [
      '# Root',
      '',
      '## Feature A',
      'Text A',
      '',
      '## Feature B',
      'Text B',
    ].join('\n');
    expect(extractHeadingBlock(source, 'Feature A')).toContain('Text A');
  });

  it('returns null when heading is missing', () => {
    expect(extractHeadingBlock('# Root\n\nBody', 'Missing')).toBeNull();
  });
});

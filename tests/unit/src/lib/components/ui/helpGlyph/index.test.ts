/**
 * @fileoverview HelpGlyph barrel re-export test
 * @module tests/unit/src/lib/components/ui/helpGlyph/index
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import { HelpGlyph } from '@/lib/components/ui/helpGlyph';
import { describe, expect, it } from 'vitest';

describe('helpGlyph barrel exports', () => {
  it('exports HelpGlyph', () => {
    expect(HelpGlyph).toBeTypeOf('function');
  });
});

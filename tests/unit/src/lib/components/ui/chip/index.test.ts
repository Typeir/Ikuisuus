/**
 * @fileoverview Chip barrel re-export test
 * @description Smoke test ensuring `Chip` is re-exported from the index.
 *
 * @module tests/unit/lib/components/ui/chip/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Chip } from '@/lib/components/ui/chip';
import { describe, expect, it } from 'vitest';

describe('chip barrel exports', () => {
  it('exports Chip', () => {
    expect(Chip).toBeTypeOf('function');
  });
});

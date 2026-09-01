/**
 * @fileoverview IconButton barrel re-export test
 * @description Smoke test ensuring `IconButton` is re-exported from the index.
 *
 * @module tests/unit/src/lib/components/ui/iconButton/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import { IconButton } from '@/lib/components/ui/iconButton';
import { describe, expect, it } from 'vitest';

describe('iconButton barrel exports', () => {
  it('exports IconButton', () => {
    expect(IconButton).toBeDefined();
    expect(typeof IconButton === 'function' || typeof IconButton === 'object').toBe(true);
  });
});

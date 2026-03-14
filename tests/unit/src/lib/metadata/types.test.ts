/**
 * @fileoverview Metadata Types Smoke Test
 * @description Verifies that all type exports are importable and well-formed.
 *
 * @module tests/unit/lib/metadata/types
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { describe, expect, it } from 'vitest';

describe('types module', () => {
  it('should export type-only module without runtime errors', async () => {
    const mod = await import('@/lib/metadata/types');
    expect(mod).toBeDefined();
  });
});

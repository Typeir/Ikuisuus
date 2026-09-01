/**
 * @fileoverview Metadata Barrel Export Smoke Test
 * @description Verifies that the index barrel re-exports all expected symbols.
 *
 * @module tests/unit/src/lib/metadata/index.test
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { describe, expect, it } from 'vitest';

describe('metadata barrel export', () => {
  it('should re-export all expected functions', async () => {
    const mod = await import('@/lib/metadata');

    expect(mod.fnv1a32).toBeDefined();
    expect(mod.contentHash).toBeDefined();
    expect(mod.syncMetadata).toBeDefined();
  });
});

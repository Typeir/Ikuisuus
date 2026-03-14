/**
 * @fileoverview Metadata Barrel Export Smoke Test
 * @description Verifies that the index barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/metadata/index
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { describe, expect, it } from 'vitest';

describe('metadata barrel export', () => {
  it('should re-export all expected functions', async () => {
    const mod = await import('@/lib/metadata');

    expect(mod.fnv1a32).toBeDefined();
    expect(mod.contentHash).toBeDefined();
    expect(mod.safeReadFile).toBeDefined();
    expect(mod.safeWriteFile).toBeDefined();
    expect(mod.getMatchingFiles).toBeDefined();
    expect(mod.ensureDirectory).toBeDefined();
    expect(mod.GameData).toBeDefined();
    expect(mod.ItemData).toBeDefined();
    expect(mod.getContentDirectory).toBeDefined();
    expect(mod.getMetadataBackend).toBeDefined();
    expect(mod.getMetadataOutputPath).toBeDefined();
    expect(mod.runGenerator).toBeDefined();
    expect(mod.runWithCli).toBeDefined();
    expect(mod.parseTitle).toBeDefined();
    expect(mod.parseProperties).toBeDefined();
    expect(mod.parseCharges).toBeDefined();
    expect(mod.startTimer).toBeDefined();
    expect(mod.endTimer).toBeDefined();
    expect(mod.loadSharedData).toBeDefined();
    expect(mod.syncMetadata).toBeDefined();
    expect(mod.extractDamageTags).toBeDefined();
    expect(mod.extractAllTags).toBeDefined();
    expect(mod.clean).toBeDefined();
    expect(mod.toKebabCase).toBeDefined();
    expect(mod.validateTag).toBeDefined();
    expect(mod.getRarityFromCR).toBeDefined();
    expect(mod.validateMetadata).toBeDefined();
  });
});

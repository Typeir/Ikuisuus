/**
 * @fileoverview Shared Data Loader Unit Tests
 * @description Tests for shared-data.json loading and caching.
 *
 * @module tests/unit/src/lib/metadata/sharedData.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    clearSharedDataCache,
    loadSharedData,
} from '@scripts/metadata/sharedData';
import { afterEach, describe, expect, it } from 'vitest';

describe('loadSharedData', () => {
  afterEach(() => {
    clearSharedDataCache();
  });

  it('should return a SharedData object with all required sections', async () => {
    const data = await loadSharedData();

    expect(data).toBeDefined();
    expect(data.gameData).toBeDefined();
    expect(data.itemData).toBeDefined();
    expect(data.spellData).toBeDefined();
    expect(data.worldData).toBeDefined();
    expect(data.taxonomies).toBeDefined();
    expect(data.patterns).toBeDefined();
  });

  it('should return non-empty damage types', async () => {
    const data = await loadSharedData();
    expect(data.gameData.damageTypes.length).toBeGreaterThan(0);
    expect(data.gameData.damageTypes).toContain('fire');
  });

  it('should return six abilities', async () => {
    const data = await loadSharedData();
    expect(data.gameData.abilities).toHaveLength(6);
    expect(data.gameData.abilities[0]).toHaveProperty('short');
    expect(data.gameData.abilities[0]).toHaveProperty('long');
  });

  it('should return rarity thresholds in descending minCR order', async () => {
    const data = await loadSharedData();
    const thresholds = data.taxonomies.rarityThresholds;
    expect(thresholds.length).toBeGreaterThan(0);

    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i - 1].minCR).toBeGreaterThanOrEqual(
        thresholds[i].minCR,
      );
    }
  });

  it('should cache results on subsequent calls', async () => {
    const first = await loadSharedData();
    const second = await loadSharedData();
    expect(first).toBe(second);
  });
});

describe('clearSharedDataCache', () => {
  it('should clear the cache so next load re-reads from disk', async () => {
    const first = await loadSharedData();
    clearSharedDataCache();
    const second = await loadSharedData();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

/**
 * Metadata Generation Integration Tests
 * 
 * @fileoverview Integration tests for the metadata generation pipeline,
 * testing monster, heirloom, and spell metadata extraction.
 */

import { describe, it, expect } from 'vitest';
import { parseMonsterFile } from '@scripts/metadata/generateMonsterMetadata.mjs';
import { parseHeirloomFile } from '@scripts/metadata/generateHeirloomMetadata.mjs';
import { parseSpellFile } from '@scripts/metadata/generateSpellMetadata.mjs';
import { GameData, ItemData } from '@scripts/core/shared-utils.mjs';

describe('Metadata Generation Pipeline', () => {
  describe('Generator Module Exports', () => {
    it('should export parseMonsterFile function', () => {
      expect(parseMonsterFile).toBeDefined();
      expect(typeof parseMonsterFile).toBe('function');
    });

    it('should export parseHeirloomFile function', () => {
      expect(parseHeirloomFile).toBeDefined();
      expect(typeof parseHeirloomFile).toBe('function');
    });

    it('should export parseSpellFile function', () => {
      expect(parseSpellFile).toBeDefined();
      expect(typeof parseSpellFile).toBe('function');
    });

    it('should export GameData from shared-utils', () => {
      expect(GameData).toBeDefined();
      expect(typeof GameData.getDamageTypes).toBe('function');
      expect(typeof GameData.getConditions).toBe('function');
    });

    it('should export ItemData from shared-utils', () => {
      expect(ItemData).toBeDefined();
      expect(typeof ItemData.getRarities).toBe('function');
      expect(typeof ItemData.getWeaponProperties).toBe('function');
    });
  });
});

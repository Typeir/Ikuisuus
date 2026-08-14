/**
 * @fileoverview Integration tests for monster, heirloom, and spell
 * metadata extraction.
 */

import { parseHeirloomFile } from '@scripts/metadata/generateHeirloomMetadata';
import { parseMonsterFile } from '@scripts/metadata/generateMonsterMetadata';
import { parseSpellFile } from '@scripts/metadata/generateSpellMetadata';
import { describe, expect, it } from 'vitest';
import { GameData, ItemData } from '../../../../scripts/metadata';

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

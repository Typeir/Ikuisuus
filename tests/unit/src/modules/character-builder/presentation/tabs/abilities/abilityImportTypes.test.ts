/**
 * @fileoverview Ability Import Types Tests
 * @description Verifies SOURCE_PATHS mapping integrity.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/abilities/abilityImportTypes.test
 */

import { SOURCE_PATHS } from '@/modules/character-builder/presentation/tabs/abilities/abilityImportTypes';
import { describe, expect, it } from 'vitest';

describe('abilityImportTypes', () => {
  it('has source paths for all import tabs', () => {
    const tabs = ['spells', 'heirlooms', 'trinkets', 'feats'] as const;
    for (const tab of tabs) {
      expect(SOURCE_PATHS[tab]).toBeTruthy();
    }
  });
});

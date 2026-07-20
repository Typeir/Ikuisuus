/**
 * @fileoverview Import Ability Mapper Tests
 * @description Verifies mapImportToAbility produces valid CharacterAbility objects.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/abilities/importAbilityMapper.test
 */

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import { mapImportToAbility } from '@/modules/character-builder/presentation/tabs/abilities/importAbilityMapper';
import { describe, expect, it } from 'vitest';

const makeSpell = (overrides?: Partial<SpellMetadata>): SpellMetadata =>
  ({
    slug: 'test-spell',
    title: 'Test Spell',
    description: 'A test spell.',
    level: 1,
    school: 'Evocation',
    castingTimeRaw: '1 action',
    range: '60 ft.',
    duration: 'Instantaneous',
    components: { verbal: true, somatic: true, material: false },
    ...overrides,
  }) as SpellMetadata;

const makeHeirloom = (
  overrides?: Partial<HeirloomMetadata>,
): HeirloomMetadata =>
  ({
    slug: 'test-heirloom',
    title: 'Test Heirloom',
    description: 'A test heirloom.',
    rarity: 'Rare',
    itemType: 'Weapon',
    ...overrides,
  }) as HeirloomMetadata;

const makeTrinket = (overrides?: Partial<TrinketMetadata>): TrinketMetadata =>
  ({
    slug: 'test-trinket',
    title: 'Test Trinket',
    description: 'A test trinket.',
    itemType: 'Wondrous Item',
    ...overrides,
  }) as TrinketMetadata;

const makeFeat = (overrides?: Partial<FeatMetadata>): FeatMetadata =>
  ({
    slug: 'test-feat',
    title: 'Test Feat',
    description: 'A test feat.',
    ...overrides,
  }) as FeatMetadata;

describe('mapImportToAbility', () => {
  it('maps a spell to a CharacterAbility', () => {
    const ability = mapImportToAbility(makeSpell(), 'spells');
    expect(ability.type).toBe('Spell');
    expect(ability.name).toBe('Test Spell');
    expect(ability.importedFrom).toBe('spells');
    expect(ability.mechanics).toContain('**Test Spell**');
  });

  it('maps an heirloom to a CharacterAbility', () => {
    const ability = mapImportToAbility(makeHeirloom(), 'heirlooms');
    expect(ability.type).toBe('Heirloom');
    expect(ability.name).toBe('Test Heirloom');
    expect(ability.importedFrom).toBe('heirlooms');
  });

  it('maps a trinket to a CharacterAbility', () => {
    const ability = mapImportToAbility(makeTrinket(), 'trinkets');
    expect(ability.type).toBe('Trinket');
    expect(ability.name).toBe('Test Trinket');
    expect(ability.importedFrom).toBe('trinkets');
  });

  it('maps a feat to a CharacterAbility', () => {
    const ability = mapImportToAbility(makeFeat(), 'feats');
    expect(ability.type).toBe('Feat');
    expect(ability.name).toBe('Test Feat');
    expect(ability.importedFrom).toBe('feats');
  });

  it('maps a spell with all components', () => {
    const ability = mapImportToAbility(
      makeSpell({
        components: {
          verbal: true,
          somatic: true,
          material: true,
          materialDescription: 'a diamond worth 50 gp',
        },
      }),
      'spells',
    );
    expect(ability.mechanics).toContain('M (a diamond worth 50 gp)');
  });
});

/**
 * @fileoverview Monster Feature Extractor Tests
 * @description Tests for action, trait, reaction, multiattack, recharge,
 * and spellcasting extraction from classified monster sections.
 *
 * @module tests/unit/src/lib/utils/monsterFeatureExtractor.test
 */

import {
    extractActions,
    extractSpellcasting,
    extractTraits,
    parseRechargeFromHeading,
    splitBySubHeadings,
} from '@scripts/metadata/extraction/monsterFeatureExtractor';
import type { MonsterSection } from '@scripts/metadata/extraction/monsterSectionClassifier';
import { describe, expect, it } from 'vitest';

function makeSection(
  type: MonsterSection['type'],
  lines: string[],
): MonsterSection {
  return {
    type,
    heading: type.charAt(0).toUpperCase() + type.slice(1),
    startLine: 0,
    endLine: lines.length,
    lines,
  };
}

describe('parseRechargeFromHeading', () => {
  it('parses (Recharge 5-6)', () => {
    expect(parseRechargeFromHeading('Cannon Tongue (Recharge 5–6)')).toEqual({
      min: 5,
      max: 6,
    });
  });

  it('parses (Recharge 6)', () => {
    expect(parseRechargeFromHeading('Grand Mooncleave (Recharge 6)')).toEqual({
      min: 6,
      max: 6,
    });
  });

  it('parses charge-recharge (3 charges, Recharge 5-6)', () => {
    const result = parseRechargeFromHeading(
      'Missiles (3 charges, Recharge 5-6)',
    );
    expect(result).toEqual({ min: 5, max: 6, charges: 3 });
  });

  it('returns undefined for no recharge', () => {
    expect(parseRechargeFromHeading('Gnawing Bite')).toBeUndefined();
  });
});

describe('extractTraits', () => {
  it('extracts simple traits by sub-heading', () => {
    const section = makeSection('traits', [
      '##### Rot-Fed Husk',
      'The rotworm does not require air, food, drink, or sleep.',
      '##### Necrotic Instability',
      'When reduced to 0 HP, it ruptures. 2d6 healing to ally.',
    ]);

    const features = extractTraits(section);
    expect(features).toHaveLength(2);
    expect(features[0].name).toBe('Rot-Fed Husk');
    expect(features[0].trigger).toBe('passive');
    expect(features[1].name).toBe('Necrotic Instability');
  });

  it('detects auto-fail in traits', () => {
    const section = makeSection('traits', [
      '##### Fragile Form',
      'The creature automatically fails all saving throws.',
    ]);

    const features = extractTraits(section);
    expect(features[0].auto_fail_saves).toBe(true);
    expect(features[0].flags).toContain('auto_fail');
  });
});

describe('extractActions', () => {
  it('extracts a simple melee attack', () => {
    const section = makeSection('actions', [
      '##### Gnawing Bite',
      '_Melee Weapon Attack:_ +3 to hit, reach 5 ft., one target.',
      '_Hit:_ 7 (1d8 + 1) necrotic damage.',
    ]);

    const features = extractActions(section);
    expect(features).toHaveLength(1);
    expect(features[0].name).toBe('Gnawing Bite');
    expect(features[0].attack).toBeDefined();
    expect(features[0].attack!.type).toBe('melee');
    expect(features[0].attack!.bonus).toBe(3);
    expect(features[0].trigger).toBe('action');
  });

  it('extracts multiattack with H4 heading children', () => {
    const section = makeSection('actions', [
      '#### Multiattack',
      'The creature makes two claw attacks and one bite attack.',
      '#### Bite',
      '_Melee Weapon Attack:_ +8 to hit, reach 5 ft., one target.',
      '_Hit:_ 13 (2d8 + 4) piercing damage.',
    ]);

    const features = extractActions(section);
    const multi = features.find((f) => f.name === 'Multiattack');
    expect(multi).toBeDefined();
    expect(multi!.multiattack).toBeDefined();
    expect(multi!.multiattack!.attacks.length).toBeGreaterThan(0);

    const bite = features.find((f) => f.name === 'Bite');
    expect(bite).toBeDefined();
    expect(bite!.attack).toBeDefined();
    expect(bite!.damage).toBe('2d8 + 4');
    expect(bite!.damageType).toBe('piercing');
  });

  it('extracts inline bold-label attacks from multiattack', () => {
    const section = makeSection('actions', [
      '#### Multiattack',
      'The avian makes one bite attack and one talons attack.',
      '',
      '- **Bite.**  ',
      '  _Melee Weapon Attack:_ +8 to hit, reach 5 ft., one target.  ',
      '  _Hit:_ 13 (2d8 + 4) piercing damage.',
      '',
      '- **Talons.**  ',
      '  _Melee Weapon Attack:_ +8 to hit, reach 5 ft., one target.  ',
      '  _Hit:_ 11 (2d6 + 4) slashing damage.',
    ]);

    const features = extractActions(section);
    expect(features.length).toBe(3);

    const multi = features.find((f) => f.name === 'Multiattack');
    expect(multi).toBeDefined();
    expect(multi!.multiattack).toBeDefined();

    const bite = features.find((f) => f.name === 'Bite');
    expect(bite).toBeDefined();
    expect(bite!.attack!.type).toBe('melee');
    expect(bite!.attack!.bonus).toBe(8);
    expect(bite!.damage).toBe('2d8 + 4');
    expect(bite!.damageType).toBe('piercing');

    const talons = features.find((f) => f.name === 'Talons');
    expect(talons).toBeDefined();
    expect(talons!.damage).toBe('2d6 + 4');
    expect(talons!.damageType).toBe('slashing');
  });

  it('extracts recharge actions', () => {
    const section = makeSection('actions', [
      '#### Quacke (Recharge 5–6)',
      'Releases a blast in a 60-foot cone.',
      'DC 16 Constitution saving throw, 10d8 thunder damage.',
    ]);

    const features = extractActions(section);
    expect(features[0].recharge).toEqual({ min: 5, max: 6 });
    expect(features[0].saving_throw).toBeDefined();
  });

  it('detects saving throw in action body', () => {
    const section = makeSection('actions', [
      '#### Aura Blast',
      'Each creature must make a DC 20 Wisdom saving throw.',
    ]);

    const features = extractActions(section);
    expect(features[0].saving_throw).toBeDefined();
    expect(features[0].saving_throw!.ability).toBe('wis');
    expect(features[0].saving_throw!.dc).toBe(20);
  });

  it('extracts reactions with correct trigger', () => {
    const section = makeSection('reactions', [
      '#### Abominable Reflex',
      'When attacked, the attacker takes 2d6 bludgeoning damage.',
    ]);

    const features = extractActions(section, 'reaction');
    expect(features[0].trigger).toBe('reaction');
    expect(features[0].name).toBe('Abominable Reflex');
  });

  it('handles ranged attacks', () => {
    const section = makeSection('actions', [
      '#### Cannon Tongue',
      '_Ranged Weapon Attack:_ +20 to hit, range 600 ft., one target.',
      '_Hit:_ 25 (20d8) force damage.',
    ]);

    const features = extractActions(section);
    expect(features[0].attack!.type).toBe('ranged');
    expect(features[0].attack!.bonus).toBe(20);
  });
});

describe('extractSpellcasting', () => {
  it('extracts a full spellcasting block', () => {
    const section = makeSection('spellcasting', [
      'Ludwig is a 10th-level spellcaster. His spellcasting ability is Constitution (spell save DC 19, +11 to hit with spell attacks).',
      '| Spell Level | Slots | Spells |',
      '| --- | --- | --- |',
      '| **1st level (4 slots)** | 4 | Bloodlash Rebuke |',
      '| **2nd level (3 slots)** | 3 | Hold Person |',
      '| **3rd level (3 slots)** | 3 | Counterspell |',
      '| **4th level (3 slots)** | 3 | Phantasmal Killer |',
      '| **5th level (2 slots)** | 2 | Steel Wind Strike |',
    ]);

    const feat = extractSpellcasting(section);
    expect(feat).not.toBeNull();
    expect(feat!.spellcasting).toBeDefined();
    expect(feat!.spellcasting!.level).toBe(10);
    expect(feat!.spellcasting!.ability).toBe('constitution');
    expect(feat!.spellcasting!.dc).toBe(19);
    expect(feat!.spellcasting!.attack_bonus).toBe(11);
    expect(feat!.spellcasting!.slots[1]).toBe(4);
    expect(feat!.spellcasting!.slots[5]).toBe(2);
  });

  it('returns null for empty section', () => {
    const section = makeSection('spellcasting', ['No spellcasting info here.']);
    expect(extractSpellcasting(section)).toBeNull();
  });
});

describe('splitBySubHeadings', () => {
  it('splits by H4 headings', () => {
    const subs = splitBySubHeadings([
      '#### Alpha',
      'Alpha body.',
      '#### Beta',
      'Beta body.',
    ]);

    expect(subs).toHaveLength(2);
    expect(subs[0].name).toBe('Alpha');
    expect(subs[0].origin).toBe('heading');
    expect(subs[1].name).toBe('Beta');
    expect(subs[1].origin).toBe('heading');
  });

  it('splits by bold-label bullets', () => {
    const subs = splitBySubHeadings([
      '- **First.**  ',
      '  Body of first.',
      '- **Second.**  ',
      '  Body of second.',
    ]);

    expect(subs).toHaveLength(2);
    expect(subs[0].name).toBe('First');
    expect(subs[0].origin).toBe('bold');
    expect(subs[1].name).toBe('Second');
    expect(subs[1].origin).toBe('bold');
  });

  it('splits mixed headings and bold labels', () => {
    const subs = splitBySubHeadings([
      '#### Multiattack',
      'Makes two attacks.',
      '- **Bite.**  ',
      '  _Melee Weapon Attack._',
      '- **Claw.**  ',
      '  _Melee Weapon Attack._',
    ]);

    expect(subs).toHaveLength(3);
    expect(subs[0].name).toBe('Multiattack');
    expect(subs[0].origin).toBe('heading');
    expect(subs[1].name).toBe('Bite');
    expect(subs[1].origin).toBe('bold');
    expect(subs[2].name).toBe('Claw');
    expect(subs[2].origin).toBe('bold');
  });
});

describe('enrichFromBody flat damage', () => {
  it('parses primary damage formula and type', () => {
    const section = makeSection('actions', [
      '#### Gnawing Bite',
      '_Melee Weapon Attack:_ +3 to hit, reach 5 ft., one target.',
      '_Hit:_ 7 (1d8 + 1) necrotic damage.',
    ]);

    const features = extractActions(section);
    expect(features[0].damage).toBe('1d8 + 1');
    expect(features[0].damageType).toBe('necrotic');
    expect(features[0].damageFlat).toBeUndefined();
  });

  it('parses extra "plus" damage', () => {
    const section = makeSection('actions', [
      '#### Shadow Dagger',
      '_Melee Weapon Attack:_ +10 to hit, reach 5 ft., one target.',
      '_Hit:_ 15 (2d6 + 5) piercing damage plus 10 (3d6) psychic damage.',
    ]);

    const features = extractActions(section);
    expect(features[0].damage).toBe('2d6 + 5');
    expect(features[0].damageType).toBe('piercing');
    expect(features[0].damageFlat).toBe('3d6');
    expect(features[0].damageFlatType).toBe('psychic');
  });

  it('flattens saving throw dc to number', () => {
    const section = makeSection('actions', [
      '#### Quacke (Recharge 5–6)',
      'Releases a blast in a 60-foot cone.',
      'DC 16 Constitution saving throw, 10d8 thunder damage.',
    ]);

    const features = extractActions(section);
    expect(features[0].saving_throw).toEqual({ ability: 'con', dc: 16 });
  });
});

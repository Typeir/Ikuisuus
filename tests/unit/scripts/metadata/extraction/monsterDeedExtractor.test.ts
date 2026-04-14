/**
 * @fileoverview Monster Deed & Phase Extractor Tests
 * @description Tests for legendary deed act, stratagem, lair, and phase
 * extraction from classified monster sections.
 *
 * @module tests/unit/src/lib/utils/monsterDeedExtractor.test
 */

import {
    extractDeedActs,
    extractDeedLair,
    extractDeedPhases,
    extractDeedStratagems,
} from '@scripts/metadata/extraction/monsterDeedExtractor';
import type { MonsterSection } from '@scripts/metadata/extraction/monsterSectionClassifier';
import { describe, expect, it } from 'vitest';

function makeSection(
  type: MonsterSection['type'],
  lines: string[],
): MonsterSection {
  return {
    type,
    heading: 'Test Section',
    startLine: 0,
    endLine: lines.length,
    lines,
  };
}

describe('extractDeedActs', () => {
  it('extracts deed acts from bullet list', () => {
    const section = makeSection('deed_act', [
      'Can expend legendary deeds.',
      '- **Detect.** (Costs 1 Deed) The creature makes a Perception check.',
      '- **Lurch.** (Costs 2 Deeds) The creature moves up to 30 ft.',
      '- **Brine Rattle.** (Costs 3 Deeds) DC 23 Dexterity saving throw, 12d8 poison damage.',
    ]);

    const features = extractDeedActs(section);
    expect(features).toHaveLength(3);
    expect(features[0].name).toBe('Detect');
    expect(features[0].legendary_deed!.cost).toBe(1);
    expect(features[1].name).toBe('Lurch');
    expect(features[1].legendary_deed!.cost).toBe(2);
    expect(features[2].name).toBe('Brine Rattle');
    expect(features[2].legendary_deed!.cost).toBe(3);
  });

  it('detects saving throw in deed act body', () => {
    const section = makeSection('deed_act', [
      '- **Rattle.** (Costs 2 Deeds) DC 23 Dexterity saving throw or 12d8 poison damage.',
    ]);

    const features = extractDeedActs(section);
    expect(features[0].saving_throw).toBeDefined();
    expect(features[0].saving_throw!.ability).toBe('dex');
  });

  it('assigns deed_act category', () => {
    const section = makeSection('deed_act', [
      '- **Attack.** (Costs 1 Deed) Makes one attack.',
    ]);

    const features = extractDeedActs(section);
    expect(features[0].legendary_deed!.category).toBe('act');
  });
});

describe('extractDeedStratagems', () => {
  it('extracts stratagem with declare/resolve', () => {
    const section = makeSection('deed_stratagem', [
      '#### The Pit Remembers',
      '**Declare** at end of turn.',
      'The creature attempts to consume a 120-foot cone.',
      '**Resolve** at start of next turn.',
      'DC 24 Strength saving throw.',
    ]);

    const features = extractDeedStratagems(section);
    expect(features).toHaveLength(1);
    expect(features[0].name).toBe('The Pit Remembers');
    expect(features[0].legendary_deed!.category).toBe('stratagem');
    expect(features[0].legendary_deed!.declare_resolve).toBe(true);
  });

  it('extracts stratagem with recharge', () => {
    const section = makeSection('deed_stratagem', [
      '#### Grand Mooncleave (Recharge 6)',
      '**Declare (Turn 1)**: channels power.',
      '**Resolve (Turn 2)**: 600-ft.-long, 40-ft.-wide line.',
      'DC 20 Dexterity saving throw.',
    ]);

    const features = extractDeedStratagems(section);
    expect(features[0].recharge).toEqual({ min: 6, max: 6 });
    expect(features[0].saving_throw).toBeDefined();
  });

  it('detects area in stratagem body', () => {
    const section = makeSection('deed_stratagem', [
      '#### Blast Wave',
      'All creatures in a 60-foot cone must save.',
    ]);

    const features = extractDeedStratagems(section);
    expect(features[0].target).toBeDefined();
    expect(features[0].target!.range).toBe(60);
    expect(features[0].target!.type).toBe('cone');
  });
});

describe('extractDeedLair', () => {
  it('extracts lair deed options', () => {
    const section = makeSection('deed_lair', [
      'Cannot use same lair deed two rounds in a row.',
      '---',
      '#### Forlorn Summons',
      'Summons creatures within 60 feet.',
      '---',
      '#### Mass Rusting',
      'DC 23 Constitution saving throw.',
    ]);

    const features = extractDeedLair(section);
    expect(features).toHaveLength(2);
    expect(features[0].name).toBe('Forlorn Summons');
    expect(features[0].legendary_deed!.category).toBe('lair');
    expect(features[1].name).toBe('Mass Rusting');
    expect(features[1].saving_throw).toBeDefined();
  });
});

describe('extractDeedPhases', () => {
  it('extracts phase with HP threshold', () => {
    const section = makeSection('deed_phase', [
      '#### Bloodied (50% HP): Moonfall',
      'Ludwig leaps into the air.',
      '##### New Attack',
      'A new attack becomes available.',
    ]);

    const features = extractDeedPhases(section);
    expect(features).toHaveLength(2);
    expect(features[0].phase).toBeDefined();
    expect(features[0].phase!.hp_threshold).toBe(50);
    expect(features[0].phase!.name).toBe('bloodied');
    expect(features[0].phase!.features_added).toContain('New Attack');
    expect(features[1].name).toBe('New Attack');
    expect(features[1].flags).toContain('phase_added');
  });

  it('extracts Doomed phase with added features', () => {
    const section = makeSection('deed_phase', [
      '#### Doomed (25% HP): Long Night',
      'At the brink of death, Ludwig manifests the Serpentine Dreams.',
      '#### Serpentine Dreams',
      '_Melee Weapon Attack:_ +15 to hit.',
      '#### Iron Reserve',
      'Once per round, can replace attack.',
      '#### Saints Reversal (Reaction)',
      'When targeted by melee attack.',
    ]);

    const features = extractDeedPhases(section);
    expect(features).toHaveLength(4);
    const doomed = features[0];
    expect(doomed.phase!.hp_threshold).toBe(25);
    expect(doomed.phase!.features_added).toContain('Serpentine Dreams');
    expect(doomed.phase!.features_added).toContain('Iron Reserve');
  });

  it('marks phases with nested_feature flag', () => {
    const section = makeSection('deed_phase', [
      '#### Wounded (75%)',
      'AC reduced by 1.',
    ]);

    const features = extractDeedPhases(section);
    expect(features[0].flags).toContain('nested_feature');
  });
});

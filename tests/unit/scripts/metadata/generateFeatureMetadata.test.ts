/**
 * @fileoverview Monster Feature Generator Integration Tests
 * @description Tests the end-to-end feature extraction pipeline by feeding
 * real-format MDX content through the classifier and extractors.
 *
 * @module tests/unit/scripts/metadata/generateFeatureMetadata.test
 */

import {
    extractDeedActs,
    extractDeedLair,
    extractDeedPhases,
    extractDeedStratagems,
} from '@scripts/metadata/extraction/monsterDeedExtractor';
import {
    extractActions,
    extractTraits,
} from '@scripts/metadata/extraction/monsterFeatureExtractor';
import { classifySections } from '@scripts/metadata/extraction/monsterSectionClassifier';
import { describe, expect, it } from 'vitest';

const ROTWORM_LINES = [
  '# Rotworm',
  '_Small monstrosity, Unaligned_',
  '| **Armor Class** | **Hit Points** | **Speed** |',
  '| 12 | 18 (4d6 + 4) | 20 ft., burrow 10 ft. |',
  '---',
  '### Traits',
  '##### Rot-Fed Husk',
  'The rotworm does not require air, food, drink, or sleep.',
  '##### Necrotic Instability',
  'When the rotworm is reduced to **0 hit points**, one creature within **5 feet** regains **7 (2d6)** hit points.',
  '---',
  '### Actions',
  '##### Gnawing Bite',
  '_Melee Weapon Attack:_ +3 to hit, reach 5 ft., one target.',
  '_Hit:_ 7 (1d8 + 1) necrotic damage.',
];

const BOSS_LINES = [
  '## Traits',
  '#### Legendary Deeds',
  'The boss has **3 legendary deeds per round**.',
  '#### Regeneration',
  'Regains **20 HP** at the start of each turn.',
  '## Actions',
  '#### Multiattack',
  'The boss makes one Cannon Tongue attack and two Crushing Claw attacks.',
  '#### Crushing Claw',
  '_Melee Weapon Attack:_ +17 to hit, reach 20 ft., one target.',
  '_Hit:_ 55 (8d10 + 10) bludgeoning damage.',
  '## Legendary Deed: Act',
  '- **Detect.** (Costs 1 Deed) Makes a Perception check.',
  '- **Lurch.** (Costs 2 Deeds) Moves up to 30 ft.',
  '## Legendary Deed: Stratagem',
  '#### The Pit Remembers',
  '**Declare** at end of turn; **Resolve** at start of next.',
  'DC 24 Strength saving throw in a 120-foot cone.',
  '## Legendary Deed: Lair',
  '#### Forlorn Summons',
  'Summons creatures within 60 feet.',
  '#### Mass Rusting',
  'DC 23 Constitution saving throw within 60 feet.',
  '## Legendary Deed: Phase',
  '#### Bloodied (50% HP): Moonfall',
  'The boss leaps into the air.',
  '##### New Attack',
  'New attack becomes available.',
];

describe('End-to-end Rotworm (Archetype H)', () => {
  const sections = classifySections(ROTWORM_LINES);

  it('classifies Rotworm into traits and actions', () => {
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('traits');
    expect(sections[1].type).toBe('actions');
  });

  it('extracts 2 traits', () => {
    const traits = extractTraits(sections[0], 'rotworm.sheet.mdx');
    expect(traits).toHaveLength(2);
    expect(traits[0].name).toBe('Rot-Fed Husk');
    expect(traits[1].name).toBe('Necrotic Instability');
  });

  it('extracts 1 action with attack data', () => {
    const actions = extractActions(sections[1], 'rotworm.sheet.mdx');
    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('Gnawing Bite');
    expect(actions[0].attack).toBeDefined();
    expect(actions[0].attack!.bonus).toBe(3);
    expect(actions[0].attack!.type).toBe('melee');
  });
});

describe('End-to-end Boss (Archetype M)', () => {
  const sections = classifySections(BOSS_LINES);

  it('classifies boss into 6 sections', () => {
    expect(sections).toHaveLength(6);
    expect(sections.map((s) => s.type)).toEqual([
      'traits',
      'actions',
      'deed_act',
      'deed_stratagem',
      'deed_lair',
      'deed_phase',
    ]);
  });

  it('extracts traits including legendary deeds trait', () => {
    const traits = extractTraits(sections[0], 'boss.sheet.mdx');
    expect(traits).toHaveLength(2);
    expect(traits[0].name).toBe('Legendary Deeds');
  });

  it('extracts multiattack in actions', () => {
    const actions = extractActions(sections[1], 'boss.sheet.mdx');
    const multi = actions.find((a) => a.name === 'Multiattack');
    expect(multi).toBeDefined();
    expect(multi!.multiattack).toBeDefined();
  });

  it('extracts deed acts with costs', () => {
    const acts = extractDeedActs(sections[2], 'boss.sheet.mdx');
    expect(acts).toHaveLength(2);
    expect(acts[0].legendary_deed!.cost).toBe(1);
    expect(acts[1].legendary_deed!.cost).toBe(2);
  });

  it('extracts stratagem with declare/resolve', () => {
    const strats = extractDeedStratagems(sections[3], 'boss.sheet.mdx');
    expect(strats).toHaveLength(1);
    expect(strats[0].legendary_deed!.declare_resolve).toBe(true);
  });

  it('extracts lair deeds', () => {
    const lairs = extractDeedLair(sections[4], 'boss.sheet.mdx');
    expect(lairs).toHaveLength(2);
    expect(lairs[0].name).toBe('Forlorn Summons');
    expect(lairs[1].name).toBe('Mass Rusting');
  });

  it('extracts phase with HP threshold and added features', () => {
    const phases = extractDeedPhases(sections[5], 'boss.sheet.mdx');
    expect(phases).toHaveLength(2);
    expect(phases[0].phase!.hp_threshold).toBe(50);
    expect(phases[0].phase!.features_added).toContain('New Attack');
    expect(phases[1].name).toBe('New Attack');
    expect(phases[1].flags).toContain('phase_added');
  });
});

describe('Full pipeline feature count', () => {
  it('produces expected feature counts for simple monster', () => {
    const sections = classifySections(ROTWORM_LINES);
    let count = 0;
    for (const section of sections) {
      if (section.type === 'traits')
        count += extractTraits(section, 'f').length;
      if (section.type === 'actions')
        count += extractActions(section, 'f').length;
    }
    expect(count).toBe(3);
  });

  it('produces expected feature counts for boss monster', () => {
    const sections = classifySections(BOSS_LINES);
    let count = 0;
    for (const section of sections) {
      if (section.type === 'traits')
        count += extractTraits(section, 'f').length;
      if (section.type === 'actions')
        count += extractActions(section, 'f').length;
      if (section.type === 'deed_act')
        count += extractDeedActs(section, 'f').length;
      if (section.type === 'deed_stratagem')
        count += extractDeedStratagems(section, 'f').length;
      if (section.type === 'deed_lair')
        count += extractDeedLair(section, 'f').length;
      if (section.type === 'deed_phase')
        count += extractDeedPhases(section, 'f').length;
    }
    expect(count).toBe(11);
  });
});

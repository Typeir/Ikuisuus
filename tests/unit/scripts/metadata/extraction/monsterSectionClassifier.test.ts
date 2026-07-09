/**
 * @fileoverview Monster Section Classifier Tests
 * @description Tests for heading classification, section splitting, and
 * heading-level-agnostic section detection.
 *
 * @module tests/unit/src/lib/utils/monsterSectionClassifier.test
 */

import {
    classifyHeading,
    classifySections,
    parseSectionHeading,
    type SectionType,
} from '@scripts/metadata/extraction/monsterSectionClassifier';
import { describe, expect, it } from 'vitest';

describe('classifyHeading', () => {
  const cases: [string, SectionType][] = [
    ['Traits', 'traits'],
    ['Trait', 'traits'],
    ['Actions', 'actions'],
    ['Action', 'actions'],
    ['Reactions', 'reactions'],
    ['Reaction', 'reactions'],
    ['Bonus Actions', 'minor_actions'],
    ['Legendary Deed: Act', 'deed_act'],
    ['Legendary Deed: Stratagem', 'deed_stratagem'],
    ['Legendary Deed: Lair', 'deed_lair'],
    ['Legendary Deed: Phase', 'deed_phase'],
    ['Spellcasting', 'spellcasting'],
    ['Condition: Incubating Inferno', 'condition'],
    ['Bloodrage (1/Repose)', 'bloodrage'],
    ['**Traits**', 'traits'],
    ['_Actions_', 'actions'],
    ['Random Heading', 'unknown'],
    ['Equipment', 'unknown'],
  ];

  it.each(cases)('classifies "%s" as %s', (heading, expected) => {
    expect(classifyHeading(heading)).toBe(expected);
  });
});

describe('parseSectionHeading', () => {
  it('parses H2 heading', () => {
    expect(parseSectionHeading('## Actions')).toEqual({
      level: 2,
      text: 'Actions',
    });
  });

  it('parses H3 heading', () => {
    expect(parseSectionHeading('### Traits')).toEqual({
      level: 3,
      text: 'Traits',
    });
  });

  it('returns null for H4+ headings', () => {
    expect(parseSectionHeading('#### Some Sub-Heading')).toBeNull();
    expect(parseSectionHeading('##### Deep Heading')).toBeNull();
  });

  it('returns null for non-heading lines', () => {
    expect(parseSectionHeading('Regular text')).toBeNull();
    expect(parseSectionHeading('- **Bold bullet**')).toBeNull();
  });
});

describe('classifySections', () => {
  it('splits a simple monster into sections', () => {
    const lines = [
      '# Monster Name',
      '_Medium beast, Neutral_',
      '| **Armor Class** | **Hit Points** | **Speed** |',
      '| 12 | 18 | 30 ft. |',
      '---',
      '### Traits',
      '##### Some Trait',
      'Trait body text.',
      '---',
      '### Actions',
      '##### Bite',
      '_Melee Weapon Attack:_ +3 to hit, reach 5 ft.',
    ];

    const sections = classifySections(lines);
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('traits');
    expect(sections[0].heading).toBe('Traits');
    expect(sections[1].type).toBe('actions');
    expect(sections[1].heading).toBe('Actions');
  });

  it('handles legendary deed sections', () => {
    const lines = [
      '## Traits',
      'Some trait text.',
      '## Actions',
      'Some action text.',
      '## Legendary Deed: Act',
      '- **Detect.** (Costs 1 Deed) Makes a check.',
      '## Legendary Deed: Stratagem',
      '#### Grand Move',
      'Stratagem body.',
      '## Legendary Deed: Lair',
      '#### Earth Shake',
      'Lair body.',
      '## Legendary Deed: Phase',
      '#### Bloodied (50%)',
      'Phase body.',
    ];

    const sections = classifySections(lines);
    expect(sections).toHaveLength(6);
    expect(sections[0].type).toBe('traits');
    expect(sections[1].type).toBe('actions');
    expect(sections[2].type).toBe('deed_act');
    expect(sections[3].type).toBe('deed_stratagem');
    expect(sections[4].type).toBe('deed_lair');
    expect(sections[5].type).toBe('deed_phase');
  });

  it('applies line offset for multi-block files', () => {
    const lines = ['## Traits', 'Text.', '## Actions', 'Text.'];
    const sections = classifySections(lines, 50);
    expect(sections[0].startLine).toBe(50);
    expect(sections[1].startLine).toBe(52);
  });

  it('discards lines before first section heading', () => {
    const lines = [
      '# Name',
      '_Size type_',
      'Stat table rows...',
      '### Traits',
      'Trait text.',
    ];
    const sections = classifySections(lines);
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('traits');
    expect(sections[0].lines).toContain('Trait text.');
  });

  it('handles spellcasting and condition sections', () => {
    const lines = [
      '## Spellcasting',
      'Monster is a 10th-level spellcaster.',
      '## Condition: Red Ruin',
      'Custom condition effects.',
    ];
    const sections = classifySections(lines);
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('spellcasting');
    expect(sections[1].type).toBe('condition');
  });

  it('returns empty array for files with no section headings', () => {
    const lines = ['# Monster Name', '_Medium beast_', 'Some text only.'];
    expect(classifySections(lines)).toHaveLength(0);
  });
});

/**
 * @fileoverview Tests for the slot-form shim the metadata generators read through.
 * @description Round trips: a v1 sample goes through its converter, then
 * through the shim, and the generator sees what it saw before.
 *
 * @module tests/unit/scripts/metadata/slotForms.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import { parseMonsterSource } from '@scripts/metadata/generateMonsterMetadata';
import { parseSpellSource } from '@scripts/metadata/generateSpellMetadata';
import { parseTrinketSource } from '@scripts/metadata/generateTrinketMetadata';
import { loadSharedData } from '@scripts/metadata/sharedData';
import {
  ordinal,
  parentVocationOf,
  readElementSlots,
  readHostTag,
  unslotFeat,
  unslotMonster,
  unslotSpell,
  unslotTrinket,
  unslotVocation,
} from '@scripts/metadata/slotForms';
import { beforeAll, describe, expect, it } from 'vitest';
import { migrateFeat } from '../../../../scripts/content/migrate-feat.mjs';
import { migrateMonsterSheet } from '../../../../scripts/content/migrate-monster-sheet.mjs';
import { migrateSpellBlock } from '../../../../scripts/content/migrate-spell-block.mjs';
import { migrateTrinket } from '../../../../scripts/content/migrate-trinket.mjs';
import { migrateVocation } from '../../../../scripts/content/migrate-vocation.mjs';

let sharedData: Awaited<ReturnType<typeof loadSharedData>>;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

const SPELL = `---
source: Ikuisuus
contentType: spells
aspects:
  - school:evocation
---

# Cone of Cold

A frigid blast erupts in a widening cone.

---

> **Cone of Cold**
> _5th-level Spell (Ritual)_
> **Casting Time**: 1 Major Action
> **Components**: V, S, M (a small crystal)
> **Duration**: Concentration, up to 1 minute
> **Range**: Self ([= 12 stride;ADJ =] cone)
> **Targets**: Creatures within the cone
>
> A blast of cold air erupts from your hands. Targets save Constitution, halving [% 8d8 frost %].
>
> **Overcast:** the spell gains [% 1d8 %] damage.

#### Spell Lists

- [_Wizard Spell List_](/en/library/character-creation/vocations/wizard/spells)
`;

const SHEET = `---
source: Ikuisuus
contentType: monsters
---

# Rotworm

_Small monstrosity, Unaligned_

| **Armor Class** | **Hit Points** | **Speed** |
| --------------- | -------------- | --------- |
| 12 (natural) | 18 ([% 4d6 +4 %]) | [= 4 stride =], burrow [= 2 stride =] |

| STR     | DEX     | CON     | INT    | WIS     | CHA    |
| ------- | ------- | ------- | ------ | ------- | ------ |
| 12 (+1) | 10 (+0) | 13 (+1) | 2 (−4) | 10 (+0) | 5 (−3) |

- **Challenge**: 2 (450 XP)
- **Tier Bonus**: +1
- **Saving Throws**: Con +2
- **Skills**: Stealth +4
- **Damage Resistances**: Dark
- **Damage Vulnerabilities**: Fire
- **Condition Immunities**: [# kw:condition:Terrified #]
- **Senses**: Blindsight [= 2 stride =], passive Perception 10
- **Languages**: —

---

## Traits

#### Rot-Fed Husk

The rotworm does not require air, food, drink, or sleep.

## Actions

#### Gnawing Bite

Accuracy +2, reach [= 1 stride =], one creature. On a hit, 7 ([% 1d8 +1 dark %]).
`;

const TRINKET = `---
source: Ikuisuus
contentType: trinkets
---

# Bola
Adventuring Gear

A set of weighted cords designed to entangle.

**Damage**: —
**Properties**: Thrown, Special (restrain, trip)
**Range**: 30/60
**Weight**: [= 1 burden =].
`;

const FEAT = `---
source: Ikuisuus
contentType: feats
---

# Sharpshooter

_Prerequisite: **Archery** Fighting Style_

You can make shots that others find impossible.

---

Increase your Strength or Dexterity score by 1.

- **Bypass Cover.** Your ranged weapon attacks ignore half cover.
`;

const VOCATION = `# Rogue

Rogues rely on cunning.

---

## Core Rogue Traits

| Trait                          | Value                          |
| ------------------------------ | ------------------------------ |
| **Primary Ability**            | Dexterity                      |
| **Hit Point Die**              | d8 per Rogue level             |
| **Saving Throw Proficiencies** | Dexterity and Intelligence     |
| **Skill Proficiencies**        | Choose 4: Acrobatics, Stealth  |
| **Weapon Proficiencies**       | Simple weapons                 |
| **Armor Training**             | Light armor                    |
| **Starting Equipment**         | (A) Leather Armor, 8 GP<br/>(B) 100 GP |

---

## 1st Level – Expertise

Choose two skill proficiencies.

<Collapsible>
## 3rd Level – Steady Aim

Aim.
</Collapsible>
`;

/**
 * Metadata fields a round trip must keep.
 *
 * @param {object} record - Generator output
 * @param {string[]} keys - Fields to keep
 * @returns {Record<string, unknown>} Subset
 */
const pick = (record: object, keys: string[]): Record<string, unknown> =>
  Object.fromEntries(keys.map((key) => [key, (record as Record<string, unknown>)[key]]));

describe('readHostTag', () => {
  it('reads a multi-line tag with quoted values and bare flags', () => {
    const lines = ['<Spell', '  level="3"', "  targets='a \"quoted\" word'", '  ritual', '  cost="1 Major Action">', 'Body'];
    expect(readHostTag(lines, 0)).toEqual({
      name: 'Spell',
      attrs: { level: '3', targets: 'a "quoted" word', ritual: true, cost: '1 Major Action' },
      start: 0,
      end: 4,
    });
    expect(readHostTag(['<Feat repeatable>'], 0)?.attrs).toEqual({ repeatable: true });
    expect(readHostTag(['plain text'], 0)).toBeNull();
  });

  it('reads element-form slots in the paragraph after a tag', () => {
    const lines = ['<Vocation armor="None">', '', '<Equipment>(A) 8 GP<br/>(B) 100 GP</Equipment>', '<Trades>Any</Trades>', '', 'Prose'];
    expect(readElementSlots(lines, 1)).toEqual({
      slots: { equipment: '(A) 8 GP<br/>(B) 100 GP', trades: 'Any' },
      end: 3,
    });
    expect(readElementSlots(['', 'Prose'], 0)).toEqual({ slots: {}, end: -1 });
  });
});

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [30, '30th'],
  ])('%i → %s', (value, text) => {
    expect(ordinal(value)).toBe(text);
  });
});

describe('unslotSpell', () => {
  it('lets the generator read a converted spell as it read the blockquote', () => {
    const converted = migrateSpellBlock(SPELL).text;
    expect(converted).toContain('<Spell');
    const before = parseSpellSource(SPELL, 'src/content/en/spells/cone-of-cold.spell.mdx', sharedData);
    const after = parseSpellSource(converted, 'src/content/en/spells/cone-of-cold.spell.mdx', sharedData);
    const keys = ['level', 'school', 'quality', 'castingTime', 'castingTimeRaw', 'range', 'duration', 'concentration', 'components', 'description', 'spellLists', 'tags'];
    expect(pick(after, keys)).toEqual(pick(before, keys));
    expect(pick(after, ['level', 'concentration'])).toEqual({ level: 5, concentration: true });
  });

  it('writes the rarity and the tiers back as the generator reads them', () => {
    const source = '<Spell\n  level="10"\n  rarity="legendary"\n  cost="1 Major Action">\n\nProse.\n\n<Overcast>more.</Overcast>\n\n<Overcast at="6th+">\n\n**Hailfall.**\n\n</Overcast>\n\n</Spell>\n';
    const text = unslotSpell(source);
    expect(text.split('\n').length).toBe(source.split('\n').length);
    expect(text).toContain('> _10th-Level Legendary Spell_\n> **Casting Time**: 1 Major Action\n');
    expect(text).toContain('\nProse.\n\n**Overcast:** more.\n\n**Overcast (6th+):**\n\n**Hailfall.**\n');
    expect(text).not.toMatch(/<\/?(Spell|Overcast)/);
    expect(unslotSpell('<Spell level="cantrip" overcast="one more">\n\nProse.\n\n</Spell>\n')).toBe('> _Cantrip_\n\nProse.\n\n**Overcast:** one more\n');
    expect(unslotSpell('No tag here.')).toBe('No tag here.');
  });
});

describe('unslotMonster', () => {
  it('lets the generator read a converted sheet as it read the tables', () => {
    const converted = migrateMonsterSheet(SHEET).text;
    expect(converted).toContain('<Monster');
    const path = 'src/content/en/monsters/rotworm.sheet.mdx';
    const [before] = parseMonsterSource(SHEET, path, sharedData) as Record<string, unknown>[];
    const [after] = parseMonsterSource(converted, path, sharedData) as Record<string, unknown>[];
    expect(after).toBeDefined();
    const keys = ['title', 'size', 'creatureType', 'alignment', 'ac', 'hp', 'speed', 'scores', 'saves', 'skills', 'damageResistances', 'damageVulnerabilities', 'conditionImmunities', 'senses', 'languages', 'cr', 'tierBonus', 'tags'];
    expect(pick(after, keys)).toEqual(pick(before, keys));
    expect((after.features as Array<{ name: string }>).map((f) => f.name)).toEqual(
      (before.features as Array<{ name: string }>).map((f) => f.name),
    );
    expect(after.cr).toBe('2');
    expect(after.tierBonus).toBe(1);
  });

  it('restores a tier bonus the converter dropped as derived', () => {
    const text = unslotMonster('<Monster\n  size="Large"\n  type="Beast"\n  alignment="Unaligned"\n  challenge="7"\n  xp="2,900">\n\n<Trait>\n\n#### Bite\n\n</Trait>\n\n</Monster>\n');
    expect(text).toContain('- **Challenge**: 7 (2,900 XP)\n- **Tier Bonus**: +3');
    expect(text).toContain('_Large Beast, Unaligned_');
    expect(text).not.toMatch(/<\/?(Trait|Monster)/);
  });
});

describe('unslotTrinket', () => {
  it('lets the generator read a converted trinket as it read the stat lines', () => {
    const converted = migrateTrinket(TRINKET).text;
    expect(converted).toContain('<Trinket');
    const path = 'src/content/en/items/trinkets/bolas.trinket.mdx';
    const before = parseTrinketSource(TRINKET, path, sharedData) as Record<string, unknown>;
    const after = parseTrinketSource(converted, path, sharedData) as Record<string, unknown>;
    const keys = ['title', 'itemType', 'description', 'damage', 'properties', 'range', 'burden', 'tags'];
    expect(pick(after, keys)).toEqual(pick(before, keys));
    expect(after.itemType).toBe('Adventuring Gear');
    expect(before.weight).toBe('1 burden.');
    expect(after.weight).toBe('1 burden');
  });
});

describe('unslotFeat', () => {
  it('restores the prerequisite line in place and the ability sentence at the end, keeping line count', () => {
    const converted = migrateFeat(FEAT).text;
    const text = unslotFeat(converted);
    expect(text.split('\n').length).toBe(converted.split('\n').length);
    expect(text).toContain('# Sharpshooter\n\n_Prerequisite: **Archery** Fighting Style_\n');
    expect(text.trimEnd().endsWith('Increase your Strength or Dexterity score by 1.')).toBe(true);
    expect(text).not.toMatch(/<\/?Feat/);
  });
});

describe('unslotVocation', () => {
  it('restores the core traits table and the level headings, keeping line count', () => {
    const converted = migrateVocation(VOCATION).text;
    const text = unslotVocation(converted);
    expect(text.split('\n').length).toBe(converted.split('\n').length);
    expect(text).toContain('| Trait | Value |\n| **Primary Ability** | Dexterity |\n| **Hit Point Die** | d8 per Rogue level |');
    expect(text).toContain('| **Starting Equipment** | (A) Leather Armor, 8 GP<br/>(B) 100 GP |');
    expect(text).toContain('\n## 1st Level – Expertise\n');
    expect(text).toMatch(/<Collapsible>\n+## 3rd Level – Steady Aim\n/);
    expect(text).not.toMatch(/<\/?(Vocation|Feature|Equipment)/);
    const featureLine = text.split('\n').findIndex((l) => l === '## 1st Level – Expertise');
    const convertedLine = converted.split('\n').findIndex((l) => l === '## Expertise');
    expect(featureLine).toBe(convertedLine);
  });

  it('passes a file without tags through untouched', () => {
    expect(unslotVocation(VOCATION)).toBe(VOCATION);
  });

  it('blanks a specialization host and reads its parent, keeping line count', () => {
    const source = '# Arcane Trickster\n\n<Specialization vocation="rogue">\n\n<Feature level="3">\n\n## Cunning Spellcasting\n\nYou cast.\n\n</Feature>\n\n</Specialization>\n';
    const text = unslotVocation(source);
    expect(text.split('\n').length).toBe(source.split('\n').length);
    expect(text).toContain('\n## 3rd Level – Cunning Spellcasting\n');
    expect(text).not.toMatch(/<\/?(Specialization|Feature)/);
    expect(parentVocationOf(source)).toBe('rogue');
    expect(parentVocationOf('# Bare\n\nNo tag.\n')).toBeUndefined();
  });
});

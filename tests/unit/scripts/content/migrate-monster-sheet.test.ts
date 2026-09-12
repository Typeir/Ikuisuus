/**
 * @fileoverview Tests for the monster sheet converter.
 * @description A v1 header becomes the `<Monster>` tag, features become
 * blocks, and anything the converter cannot read whole is skipped with a
 * reason rather than half-converted.
 *
 * @module tests/unit/scripts/content/migrate-monster-sheet.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import {
  migrateMonsterSheet,
  tierBonusFor,
} from '../../../../scripts/content/migrate-monster-sheet.mjs';

const SHEET = `---
source: Ikuisuus
contentType: monsters
---

# Rotworm

_Small monstrosity, Unaligned_

<BlendedImage src='/library/images/monsters/rotworm.webp' alt='Rotworm' />

| **Armor Class** | **Hit Points** | **Speed**             |
| --------------- | -------------- | --------------------- |
| 12              | 18 ([% 4d6 +4 %])   | [= 4 stride =], burrow [= 2 stride =] |

| STR     | DEX     | CON     | INT    | WIS     | CHA    |
| ------- | ------- | ------- | ------ | ------- | ------ |
| 12 (+1) | 10 (+0) | 13 (+1) | 2 (−4) | 10 (+0) | 5 (−3) |

- **Lethality**: 1
- **Tier Bonus**: +1
- **Saving Throws**: Con +2
- **Damage Resistances**: Dark
- **Condition Immunities**: [# kw:condition:Terrified #]
- **Senses**: Blindsight [= 2 stride =], passive Perception 10
- **Languages**: —

---

### Traits

##### Rot-Fed Husk

The rotworm does not require air, food, drink, or sleep.

---

### Actions

##### Gnawing Bite (Recharge 5–6)

Accuracy +2, reach [= 1 stride =], one creature.
`;

/**
 * Converts a sheet and returns its lines.
 *
 * @param {string} text - Sheet text
 * @returns {{ lines: string[], notes: string[], skipped?: string }} Result
 */
const convert = (text: string) => {
  const result = migrateMonsterSheet(text);
  return {
    lines: result.text.split('\n'),
    notes: result.notes,
    skipped: result.skipped,
  };
};

describe('migrateMonsterSheet', () => {
  it('moves the header into one tag and drops what the card derives', () => {
    const { lines, notes } = convert(SHEET);
    const tag = lines.slice(
      lines.indexOf('<Monster'),
      lines.indexOf('  languages="—">') + 1,
    );
    expect(tag).toEqual([
      '<Monster',
      '  size="Small"',
      '  type="monstrosity"',
      '  alignment="Unaligned"',
      '  armorClass="12"',
      '  hitPoints="18 ([% 4d6 +4 %])"',
      '  speed="[= 4 stride =], burrow [= 2 stride =]"',
      '  str="12"',
      '  dex="10"',
      '  con="13"',
      '  int="2"',
      '  wis="10"',
      '  cha="5"',
      '  lethality="1"',
      '  saves="Con +2"',
      '  resistances="Dark"',
      '  conditionImmunities="[# kw:condition:Terrified #]"',
      '  senses="Blindsight [= 2 stride =], passive Perception 10"',
      '  languages="—">',
    ]);
    expect(lines.join('\n')).not.toContain('_Small monstrosity');
    expect(lines.join('\n')).not.toContain('Tier Bonus');
    expect(lines[lines.length - 2]).toBe('</Monster>');
    expect(notes).toEqual([]);
  });

  it('keeps the image and the title ahead of the tag', () => {
    const { lines } = convert(SHEET);
    expect(lines.indexOf('# Rotworm')).toBeLessThan(
      lines.findIndex((l) => l.startsWith('<BlendedImage')),
    );
    expect(lines.findIndex((l) => l.startsWith('<BlendedImage'))).toBeLessThan(
      lines.indexOf('<Monster'),
    );
  });

  it('wraps features by section and lifts a heading parenthetical', () => {
    const text = convert(SHEET).lines.join('\n');
    expect(text).toContain(
      '<Trait>\n\n##### Rot-Fed Husk\n\nThe rotworm does not require air, food, drink, or sleep.\n\n</Trait>',
    );
    expect(text).toContain('<Action recharge="5–6">\n\n##### Gnawing Bite\n');
    expect(text).toContain('one creature.\n\n</Action>\n\n</Monster>');
  });

  it('splits lethality and XP, keeps a tier bonus the rating does not give', () => {
    const text = SHEET.replace(
      '- **Lethality**: 1\n- **Tier Bonus**: +1',
      '- **Lethality**: 23 (32,000 XP)\n- **Tier Bonus**: +9',
    );
    const { lines, notes } = convert(text);
    expect(lines).toContain('  lethality="23"');
    expect(lines).toContain('  xp="32,000"');
    expect(lines).toContain('  tierBonus="+9">');
    expect(notes).toEqual(['tier bonus +9 kept: the rating gives +8']);
  });

  it('reads a save DC from the prose, or from a header bullet', () => {
    const prose =
      SHEET +
      '\nIts casting ability is Wisdom (spell save DC **16**, +8 to hit).\n';
    expect(convert(prose).lines).toContain('  saveDc="16">');
    const bullet = SHEET.replace(
      '- **Languages**: —',
      '- **Languages**: —\n- **Spell Save DC**: 15',
    );
    const { lines } = convert(bullet);
    expect(lines).toContain('  saveDc="15">');
    expect(lines.join('\n')).not.toContain('**Spell Save DC**');
  });

  it('stamps deed and cost slots from the section', () => {
    const text =
      SHEET +
      `
---

## Legendary Deed: Act

#### Reposition (Costs 1 Deed)

Moves.

## Minor Actions

#### Shove

Pushes.

## Reactions

#### Parry

Blocks.
`;
    const out = convert(text).lines.join('\n');
    expect(out).toContain(
      '<Action deed="act" cost="1 Deed">\n\n#### Reposition\n',
    );
    expect(out).toContain('<Action cost="1 Minor Action">\n\n#### Shove\n');
    expect(out).toContain('<Action cost="1 Reaction">\n\n#### Parry\n');
  });

  it('leaves features under an unknown section unwrapped and says so', () => {
    const text =
      SHEET +
      '\n---\n\n## Spellcasting\n\n#### Innate Spellcasting\n\nCasts.\n';
    const { lines, notes } = convert(text);
    expect(lines.join('\n')).toContain(
      '## Spellcasting\n\n#### Innate Spellcasting',
    );
    expect(lines.join('\n')).not.toContain('<Action>\n\n#### Innate');
    expect(notes).toContain('features under "Spellcasting" left unwrapped');
  });

  it('moves an unknown header bullet into the body and reports it', () => {
    const text = SHEET.replace(
      '- **Languages**: —',
      '- **Languages**: —\n- **Legendary Deeds**: 3 per round',
    );
    const { lines, notes } = convert(text);
    expect(lines.indexOf('- **Legendary Deeds**: 3 per round')).toBeGreaterThan(
      lines.indexOf('  languages="—">'),
    );
    expect(notes).toContain('header bullet left in the body: Legendary Deeds');
  });

  it.each([
    [
      'already on the slot form',
      SHEET.replace('_Small monstrosity, Unaligned_', '<Monster size="Small">'),
    ],
    ['2 stat blocks; convert by hand', SHEET + '\n- **Lethality**: 2\n'],
    [
      'no Armor Class / Hit Points / Speed table',
      SHEET.replace('**Armor Class**', 'AC'),
    ],
  ])('skips with "%s"', (reason, text) => {
    const result = migrateMonsterSheet(text);
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe(reason);
    expect(result.text).toBe(text);
  });

  it('notes an identity line it cannot read', () => {
    const { lines, notes } = convert(
      SHEET.replace('_Small monstrosity, Unaligned_', '_War Goddess_'),
    );
    expect(lines).toContain('_War Goddess_');
    expect(lines.join('\n')).not.toContain('size=');
    expect(notes).toContain(
      'identity line not read; size, type and alignment stay as prose',
    );
  });
});

describe('tierBonusFor', () => {
  it.each([
    ['1/4', 1],
    ['1', 1],
    ['3', 1],
    ['4', 2],
    ['23', 8],
    ['x', null],
  ])('%s → %s', (lethality, bonus) => {
    expect(tierBonusFor(lethality)).toBe(bonus);
  });
});

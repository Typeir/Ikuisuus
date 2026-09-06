/**
 * @fileoverview Tests for the spell blockquote converter.
 * @description The blockquote header becomes the `<Spell>` tag, the body is
 * unquoted, and each overcast shape the corpus writes lands where the
 * component reads it.
 *
 * @module tests/unit/scripts/content/migrate-spell-block.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import { migrateSpellBlock } from '../../../../scripts/content/migrate-spell-block.mjs';

const HEAD = `---
source: Ikuisuus
contentType: spells
aspects:
  - school:conjuration
---

# Acid Splash

A pocket of unstable matter collapses mid-cast.

---
`;

const BLOCK = `
> **Acid Splash**
> _Cantrip_
> **Casting Time**: 1 Major Action
> **Components**: V, S
> **Duration**: Instantaneous
> **Range**: [= 12 stride =]
> **Targets**: Up to two creatures
>
> You hurl a bubble of acid.
>
> Targets save Dexterity or take [% 1d6 chemical %].
`;

const TAIL = `
#### Spell Lists

- [_Wizard Spell List_](/en/library/character-creation/vocations/wizard/spells)
`;

/**
 * Converts and returns the text.
 *
 * @param {string} text - Spell file
 * @returns {string} Converted text
 */
const out = (text: string): string => migrateSpellBlock(text).text;

describe('migrateSpellBlock', () => {
  it('moves the header into the tag and unquotes the body', () => {
    const text = out(HEAD + BLOCK + '> **Overcast:** the spell gains [% 1d6 %] damage.  \n' + TAIL);
    expect(text).toContain(`---

<Spell
  level="cantrip"
  school="conjuration"
  cost="1 Major Action"
  components="V, S"
  duration="Instantaneous"
  range="[= 12 stride =]"
  targets="Up to two creatures"
  overcast="the spell gains [% 1d6 %] damage.">

You hurl a bubble of acid.

Targets save Dexterity or take [% 1d6 chemical %].

</Spell>

#### Spell Lists
`);
    expect(text).not.toContain('**Acid Splash**');
    expect(text).not.toContain('_Cantrip_');
    expect(text).toContain('  - school:conjuration');
  });

  it('reads a numbered level and the ritual flag', () => {
    const text = out(HEAD + BLOCK.replace('_Cantrip_', '_3rd-level Spell (Ritual)_'));
    expect(text).toContain('<Spell\n  level="3"\n  school="conjuration"\n  ritual\n  cost=');
  });

  it('reads a Legendary Spell as legendary rarity', () => {
    const text = out(HEAD + BLOCK.replace('_Cantrip_', '_10th-Level Legendary Spell_'));
    expect(text).toContain('<Spell\n  level="10"\n  rarity="legendary"\n  school="conjuration"\n  cost=');
    expect(text).not.toContain('Legendary Spell_');
  });

  it('puts a plain overcast followed by prose in place, and a tier owns what follows it', () => {
    const text = out(
      HEAD +
        BLOCK +
        '>  \n> **Overcast:** the spell gains [% 1d8 %] damage.  \n>  \n> **Overcast (6th+):** **Hailfall.**  \n> **Targets**: creatures in a cylinder  \n> The cold drops from above.  \n',
    );
    expect(text).not.toContain('overcast=');
    expect(text).toContain(
      '<Overcast>the spell gains [% 1d8 %] damage.</Overcast>\n\n<Overcast at="6th+">\n\n**Hailfall.**  \n**Targets**: creatures in a cylinder  \nThe cold drops from above.  \n\n</Overcast>\n\n</Spell>',
    );
    expect(text).toContain('targets="Up to two creatures"');
  });

  it('keeps a table under an empty overcast line inside the element', () => {
    const text = out(HEAD + BLOCK + '>  \n> **Overcast:**  \n>  \n> | **Level** | **Age** |\n> | --- | --- |\n> | 6th | 7 days |\n');
    expect(text).toContain('<Overcast>\n\n| **Level** | **Age** |\n| --- | --- |\n| 6th | 7 days |\n\n</Overcast>');
  });

  it('carries a named overcast into the element as bold text', () => {
    const text = out(HEAD + BLOCK + '>  \n> **Overcast: Agony.** the threshold gains 20.  \n> **Overcast (9th+): Rigor.** the threshold gains 20.  \n');
    expect(text).toContain('<Overcast>**Agony.** the threshold gains 20.</Overcast>');
    expect(text).toContain('<Overcast at="9th+">**Rigor.** the threshold gains 20.</Overcast>');
  });

  it('leaves a double-parenthetical overcast as prose and reports it', () => {
    const result = migrateSpellBlock(HEAD + BLOCK + '>  \n> **Overcast (4th+) (per +1):** the delayed damage gains [% 1d4 %].  \n');
    expect(result.text).toContain('\n**Overcast (4th+) (per +1):** the delayed damage gains [% 1d4 %].  \n');
    expect(result.notes).toEqual([
      'overcast line kept as prose: **Overcast (4th+) (per +1):** the delayed damage gains [% 1d4 %].',
    ]);
  });

  it('lifts a targets line written after the header', () => {
    const result = migrateSpellBlock(
      HEAD + BLOCK.replace('> **Targets**: Up to two creatures\n', '') + '> **Targets**: one creature  \n',
    );
    expect(result.text).toContain('targets="one creature"');
    expect(result.notes).toContain('targets line found after the header; lifted');
  });

  it('keeps a flavour blockquote before the stat block and a name line that differs', () => {
    const result = migrateSpellBlock(
      HEAD + '\n> “A proverb.”  \n\n---\n' + BLOCK.replace('**Acid Splash**', '**Acid Bubble**'),
    );
    expect(result.text).toContain('> “A proverb.”  \n\n---\n\n<Spell');
    expect(result.text).toContain('\n**Acid Bubble**\n');
    expect(result.notes).toContain('name line kept as prose: **Acid Bubble**');
  });

  it.each([
    ['already on the slot form', HEAD + '<Spell level="1">\n</Spell>\n'],
    ['no blockquote stat block', HEAD],
    ['2 stat blocks; convert by hand', HEAD + BLOCK + '\n' + BLOCK],
  ])('skips with "%s"', (reason, text) => {
    const result = migrateSpellBlock(text);
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe(reason);
  });
});

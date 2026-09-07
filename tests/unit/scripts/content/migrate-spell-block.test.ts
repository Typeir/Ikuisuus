/**
 * @fileoverview Tests for the spell blockquote converter.
 * @description The blockquote header becomes the `<Spell>` tag, the body is
 * unquoted, and overcast lines stay in the body as prose.
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

const OVERCAST = '**Overcast:** the spell gains [% 1d6 %] damage.  ';

/**
 * Converts and returns the text.
 *
 * @param {string} text - Spell file
 * @returns {string} Converted text
 */
const out = (text: string): string => migrateSpellBlock(text).text;

describe('migrateSpellBlock', () => {
  it('moves the header into the tag, unquotes the body and keeps overcast as prose', () => {
    const text = out(HEAD + BLOCK + `>  \n> ${OVERCAST}\n` + TAIL);
    expect(text).toContain(
      `---

<Spell
  level="cantrip"
  cost="1 Major Action"
  components="V, S"
  duration="Instantaneous"
  range="[= 12 stride =]"
  targets="Up to two creatures">

You hurl a bubble of acid.

Targets save Dexterity or take [% 1d6 chemical %].

` +
        OVERCAST +
        `

</Spell>

#### Spell Lists
`,
    );
    expect(text).not.toContain('**Acid Splash**');
    expect(text).not.toContain('_Cantrip_');
    expect(text).not.toContain('school=');
    expect(text).not.toContain('overcast=');
    expect(text).toContain('  - school:conjuration');
  });

  it('reads a numbered level and the ritual flag', () => {
    const text = out(HEAD + BLOCK.replace('_Cantrip_', '_3rd-level Spell (Ritual)_'));
    expect(text).toContain('<Spell\n  level="3"\n  ritual\n  cost=');
  });

  it('reads a Legendary Spell as legendary rarity', () => {
    const text = out(HEAD + BLOCK.replace('_Cantrip_', '_10th-Level Legendary Spell_'));
    expect(text).toContain('<Spell\n  level="10"\n  rarity="legendary"\n  cost=');
    expect(text).not.toContain('Legendary Spell_');
  });

  it('leaves every overcast shape in the body verbatim', () => {
    const shapes = [
      '**Overcast:** the spell gains [% 1d8 %] damage.  ',
      '**Overcast (6th+):** **Hailfall.**  ',
      '**Targets**: creatures in a cylinder  ',
      '**Overcast (9th+): Rigor.** the threshold gains 20.  ',
      '**Overcast (4th+) (per +1):** the delayed damage gains [% 1d4 %].  ',
      '**Overcast:**  ',
      '',
      '| **Level** | **Age** |',
      '| --- | --- |',
      '| 6th | 7 days |',
    ];
    const quoted = shapes.map((line) => (line ? `> ${line}` : '>  ')).join('\n');
    const result = migrateSpellBlock(HEAD + BLOCK + '>  \n' + quoted + '\n');
    expect(result.text).toContain(`\n${shapes.join('\n')}\n\n</Spell>`);
    expect(result.text).not.toContain('<Overcast');
    expect(result.text).toContain('targets="Up to two creatures"');
    expect(result.notes).toEqual([]);
  });

  it('lifts a targets line written after the header, but not one under an overcast', () => {
    const result = migrateSpellBlock(
      HEAD +
        BLOCK.replace('> **Targets**: Up to two creatures\n', '') +
        '> **Targets**: one creature  \n> **Overcast (6th+):**  \n> **Targets**: two creatures  \n',
    );
    expect(result.text).toContain('targets="one creature"');
    expect(result.text).toContain('**Overcast (6th+):**  \n**Targets**: two creatures  ');
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

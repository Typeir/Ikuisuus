/**
 * @fileoverview Tests for the spell list converter.
 * @description Spell tables become `<SpellList>` with one column per extra
 * header, bullet lists of spell links become the tag with or without a Cost
 * column
 *
 * @module tests/unit/scripts/content/migrate-spell-list.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { describe, expect, it } from 'vitest';
import { migrateSpellList, spellListLines } from '../../../../scripts/content/migrate-spell-list.mjs';

const TABLE = `<Trait>

#### Spell Point Casting

- **Save DC**: 18

| **Spell**                                               | **Cost** |
| ------------------------------------------------------- | -------- |
| [_Omen_](/en/library/spells/omen)                       | At Will  |
| [_Ray of Sickness_](/en/library/spells/ray-of-sickness) | 1        |

</Trait>
`;

describe('spellListLines', () => {
  it('writes a self-closing tag without columns, values in a string, and rows for values with commas', () => {
    expect(spellListLines(['omen'], [])).toEqual(['<SpellList spells="omen" />']);
    expect(spellListLines(['omen', 'chill'], [{ label: 'Cost', values: ['At Will', ''] }])).toEqual([
      '<SpellList spells="omen, chill">',
      '  <Column label="Cost" values="At Will, " />',
      '</SpellList>',
    ]);
    expect(spellListLines(['omen', 'chill'], [{ label: 'Cost', values: ['4 (1st), once', ''] }])).toEqual([
      '<SpellList spells="omen, chill">',
      '  <Column label="Cost">',
      '    <Row at="omen">4 (1st), once</Row>',
      '  </Column>',
      '</SpellList>',
    ]);
  });
});

describe('migrateSpellList', () => {
  it('turns a spell table into the tag with its extra column', () => {
    const result = migrateSpellList(TABLE);
    expect(result.changed).toBe(true);
    expect(result.notes).toEqual([]);
    expect(result.text).toBe(`<Trait>

#### Spell Point Casting

- **Save DC**: 18

<SpellList spells="omen, ray-of-sickness">
  <Column label="Cost" values="At Will, 1" />
</SpellList>

</Trait>
`);
  });

  it('keeps a table whose first column is not a spell link, with a note', () => {
    const result = migrateSpellList(
      '| Spell Level | Slots | Spells |\n| --- | --- | --- |\n| 1st | 4 | [_Shield_](/en/library/spells/shield) |\n',
    );
    expect(result.changed).toBe(false);
    expect(result.notes).toEqual(['table kept: Spell Level | Slots | Spells']);
  });

  it('turns bare spell bullets into the tag and spell-point tails into a Cost column', () => {
    const bare = migrateSpellList('- [_Shield_](/en/library/spells/shield)\n- [_Misty Step_](/en/library/spells/misty-step)\n');
    expect(bare.text).toBe('<SpellList spells="shield, misty-step" />\n');
    const points = migrateSpellList(
      '- [_Shield_](/en/library/spells/shield) — **2 spell points**\n- [_Misty Step_](/en/library/spells/misty-step) — **3 spell points**\n- [_Omen_](/en/library/spells/omen)\n',
    );
    expect(points.text).toBe(
      '<SpellList spells="shield, misty-step, omen">\n  <Column label="Cost" values="2 spell points, 3 spell points, " />\n</SpellList>\n',
    );
    expect(points.notes).toEqual(['spell-point tails became a Cost column']);
  });

  it('keeps lists whose tails are prose or whose items are not all spell links', () => {
    const result = migrateSpellList(
      '- [_Blur_](/en/library/spells/blur) — the form blurs\n\n- [_Lesser Restoration_](/en/library/spells/lesser-restoration), or [_Wish_](/en/library/spells/wish) can cure it.\n',
    );
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe('no spell table or list read');
    expect(result.notes).toEqual([
      'list kept: - [_Blur_](/en/library/spells/blur) — the form blurs',
      'list kept: - [_Lesser Restoration_](/en/library/spells/lesser-restoration), or [_Wish_](/en/library/spells/wish) can cure it.',
    ]);
  });

  it.each([
    ['already has spell lists', '<SpellList spells="omen" />\n'],
    ['no spell links', '# Frog\n\nNo casting.\n'],
  ])('skips with "%s"', (reason, text) => {
    const result = migrateSpellList(text);
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe(reason);
  });
});

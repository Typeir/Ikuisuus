/**
 * @fileoverview Tests for the progression table converter.
 *
 * @module tests/unit/scripts/content/migrate-progression.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import { migrateProgression } from '@scripts/content/migrate-progression';
import { describe, expect, it } from 'vitest';

const PAGE = `# Rogue

<Vocation hitDie="d8 per Rogue level">

## Rogue Progression

| Level | Tier Bonus | Features                         | Sneak Attack | Cantrips | 1st | 2nd | 3rd | 4th |
| ----- | ---------- | -------------------------------- | ------------ | -------- | --- | --- | --- | --- |
| 1     | +1         | **Expertise**, Sneak Attack      | [% 1d6 %]    | 2        | –   | –   | –   | –   |
| 2     | +1         | –                                | [% 1d6 %]    | 2        | –   | –   | –   | –   |
| 3     | +1         | Rogue Specialization, Steady Aim | [% 2d6 %]    | 2        | 2   | –   | –   | –   |
| 4     | +2         | Feat                             | [% 2d6 %]    | 3        | 3   | –   | –   | –   |
| 5     | +2         | Expertise                        | [% 3d6 %]    | 3        | 3   | –   | –   | –   |
| 6     | +2         | Id Feature                       | [% 3d6 %]    | 3        | 4   | –   | –   | –   |

<Feature level="1">

## Expertise

</Feature>

<Feature level="1">

## Sneak Attack

</Feature>

<Feature level="3">

## Steady Aim

</Feature>

<Feature level="3">

## Rogue Specialization

</Feature>

</Vocation>
`;

describe('migrateProgression', () => {
  it('writes the tag from the table and reports every cell the rebuilt table changes', () => {
    const result = migrateProgression(PAGE);
    expect(result.changed).toBe(true);
    expect(result.text).toContain(`## Rogue Progression

<Progression casting="third" feats="4" specialization="Id: 6" levels="6">
  <Column label="Features">
    <Row at="5" unique>Expertise</Row>
  </Column>
  <Column label="Sneak Attack">
    <Row at="1">[% 1d6 %]</Row>
    <Row at="3">[% 2d6 %]</Row>
    <Row at="5">[% 3d6 %]</Row>
  </Column>
  <Column label="Cantrips" values="2, 2, 2, 3, 3, 3" />
</Progression>

<Feature level="1">`);
    expect(result.text).not.toContain('| Level |');
    expect(result.notes).toEqual([
      'level 3, Features: authored "Rogue Specialization, Steady Aim", built "Steady Aim, Rogue Specialization"',
      'level 6, 1st: authored "4", built "3"',
    ]);
    expect(result.notes.some((n) => n.includes('Id'))).toBe(false);
  });

  it('skips a page without a host tag, without a table, or already on the tag', () => {
    expect(migrateProgression(PAGE.replace('<Vocation hitDie="d8 per Rogue level">', '')).skipped).toBe(
      'no host tag; run migrate-vocation first',
    );
    expect(migrateProgression('# X\n\n<Vocation>\n\nProse.\n\n</Vocation>\n').skipped).toBe('no progression table');
    const converted = migrateProgression(PAGE).text;
    expect(migrateProgression(converted).skipped).toBe('already on the tag');
  });

  it('matches a table name to its heading through a qualifier or a longer name, and merges milestones at one level', () => {
    const page = `# Warrior

<Vocation>

| Level | Tier Bonus | Features                                   |
| ----- | ---------- | ------------------------------------------ |
| 1     | +1         | Spellcasting                               |
| 2     | +1         | Action Surge (One Use), Tactical Mind      |
| 3     | +1         | Druid Specialization                       |
| 4     | +2         | Action Surge (Two Uses), Indomitable (One) |

<Feature level="1">

## Warrior Spellcasting

</Feature>

<Feature level="2">

## Action Surge

</Feature>

<Feature level="2">

## Tactical Mind

</Feature>

<Feature level="3">

## Druid Circle

</Feature>

</Vocation>
`;
    const result = migrateProgression(page);
    expect(result.text).toContain(
      '<Progression levels="4">\n  <Column label="Features">\n    <Row at="4" unique>Action Surge (Two Uses), Indomitable (One)</Row>\n  </Column>\n</Progression>',
    );
    expect(result.notes).toEqual([
      'level 1: table "Spellcasting", page "Warrior Spellcasting"; the page\'s name is printed',
      'level 2: table "Action Surge (One Use)", page "Action Surge"; the page\'s name is printed',
      'level 3: table "Druid Specialization" against page "Druid Circle"; the page\'s names are printed',
      'level 1, Features: authored "Spellcasting", built "Warrior Spellcasting"',
      'level 2, Features: authored "Action Surge (One Use), Tactical Mind", built "Action Surge, Tactical Mind"',
      'level 3, Features: authored "Druid Specialization", built "Druid Circle"',
    ]);
  });

  it('reads a points caster, a column before Features, and a Feat heading that names its own row', () => {
    const page = `# Scion

<Vocation>

| Level | Tier Bonus | Sorcery Points | Features       | Spell Points | Max Spell Level |
| ----- | ---------- | -------------- | -------------- | ------------ | --------------- |
| 1     | +1         | –              | Innate Sorcery | 2            | 1               |
| 2     | +1         | 2              | Feat           | 4            | 1               |

<Feature level="1">

## Innate Sorcery

</Feature>

<Feature level="2">

## Feat

</Feature>

</Vocation>
`;
    const result = migrateProgression(page);
    expect(result.text).toContain('<Progression casting="points" feats="2" levels="2">\n  <Column label="Sorcery Points" values=", 2" />\n</Progression>');
    expect(result.notes).toEqual(['column Sorcery Points sat before Features; it prints after']);
  });
});

/**
 * @fileoverview Tests for the vocation converter.
 * @description The core traits table becomes the `<Vocation>` tag, a value an
 * attribute cannot hold goes in element form
 *
 * @module tests/unit/scripts/content/migrate-vocation.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import { migrateVocation } from '../../../../scripts/content/migrate-vocation.mjs';

const VOCATION = `---
source: Ikuisuus
contentType: vocations
---

# Rogue

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
| **Trade Proficiencies**        | [Thievery](/en/library/items/tools/thievery) |
| **Armor Training**             | Light armor                    |
| **Starting Equipment**         | (A) Leather Armor, 8 GP<br/>(B) 100 GP |

---

## Becoming a Rogue

- Gain the Rogue's level 1 features.

## 1st Level – Expertise

Choose two skill proficiencies.

---

## 1st Level - Sneak Attack

Once per turn.

## Level 5: Sorcerous Restoration

Odd heading.
`;

describe('migrateVocation', () => {
  it('turns the core table into the tag, its heading first inside, the br row in element form', () => {
    const result = migrateVocation(VOCATION);
    expect(result.text).toContain(`---

<Vocation
  primaryAbility="Dexterity"
  hitDie="d8 per Rogue level"
  saves="Dexterity and Intelligence"
  skills="Choose 4: Acrobatics, Stealth"
  trades="[Thievery](/en/library/items/tools/thievery)"
  weapons="Simple weapons"
  armor="Light armor">

## Core Rogue Traits

<Equipment>(A) Leather Armor, 8 GP<br/>(B) 100 GP</Equipment>

---

## Becoming a Rogue
`);
    expect(result.text).not.toContain('| **Primary Ability**');
    expect(result.text.trimEnd().endsWith('</Vocation>')).toBe(true);
  });

  it('wraps level headings, moves a closing rule out of the block and reports an odd heading', () => {
    const result = migrateVocation(VOCATION);
    expect(result.text).toContain(`<Feature level="1">

## Expertise

Choose two skill proficiencies.

</Feature>

---

<Feature level="1">

## Sneak Attack

Once per turn.

</Feature>

## Level 5: Sorcerous Restoration
`);
    expect(result.notes).toEqual(['heading kept: ## Level 5: Sorcerous Restoration']);
  });

  it('closes a block at a Collapsible boundary and separates the tags with a blank line', () => {
    const text = `# Trickster\n\n<Collapsible>\n## 3rd Level – Cunning Spellcasting\nYou cast.\n\n### Cantrips\n\nThree.\n</Collapsible>\n\n<Collapsible>\n## 9th Level – Ambush\n\nStrike.\n</Collapsible>\n`;
    const result = migrateVocation(text);
    expect(result.text).toBe(`# Trickster

<Collapsible>

<Feature level="3">

## Cunning Spellcasting
You cast.

### Cantrips

Three.

</Feature>

</Collapsible>

<Collapsible>

<Feature level="9">

## Ambush

Strike.

</Feature>

</Collapsible>
`);
  });

  it('wraps a specialization in its host tag, the parent read from the folder', () => {
    const text = `---\nsource: Ikuisuus\n---\n\n# Arcane Trickster\n\n_A rogue who steals with spells._\n\n## 3rd Level – Cunning Spellcasting\n\nYou cast.\n`;
    const result = migrateVocation(text, 'src/content/en/character-creation/vocations/rogue/arcane-trickster.specialization.mdx');
    expect(result.text).toBe(`---
source: Ikuisuus
---

# Arcane Trickster

<Specialization vocation="rogue">

_A rogue who steals with spells._

<Feature level="3">

## Cunning Spellcasting

You cast.

</Feature>

</Specialization>
`);
    const again = migrateVocation(result.text, 'vocations/rogue/arcane-trickster.specialization.mdx');
    expect(again.changed).toBe(false);
    expect(again.notes).toEqual(['already wrapped in its host tag', 'level features already wrapped']);
  });

  it('leaves a table with an unknown row and says why', () => {
    const text = VOCATION.replace('| **Armor Training**             | Light armor                    |', '| **Trip**                       | Knock prone                    |');
    const result = migrateVocation(text);
    expect(result.text).toContain('## Core Rogue Traits');
    expect(result.text).not.toContain('<Vocation');
    expect(result.notes).toContain('core traits table kept: unknown row Trip');
  });

  it('skips a file with nothing to move, and notes what is already done', () => {
    const done = migrateVocation('# Bare\n\n<Vocation primaryAbility="x">\n\n<Feature level="1">\n\n## A\n\n</Feature>\n\n</Vocation>\n');
    expect(done.changed).toBe(false);
    expect(done.skipped).toBe('nothing to move');
    expect(done.notes).toEqual(['core traits already on the slot form', 'level features already wrapped']);
  });
});

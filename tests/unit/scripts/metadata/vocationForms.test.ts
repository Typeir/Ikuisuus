/**
 * @fileoverview Tests for the vocation slot-form shim.
 * @description Round trips
 *
 * @module tests/unit/scripts/metadata/vocationForms.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  parentVocationOf,
  readElementSlots,
  unslotVocation,
} from '@scripts/metadata/vocationForms';
import { describe, expect, it } from 'vitest';

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

const VOCATION_SLOTTED = `# Rogue

Rogues rely on cunning.

---

<Vocation
  primaryAbility="Dexterity"
  hitDie="d8 per Rogue level"
  saves="Dexterity and Intelligence"
  skills="Choose 4: Acrobatics, Stealth"
  weapons="Simple weapons"
  armor="Light armor">

## Core Rogue Traits

<Equipment>(A) Leather Armor, 8 GP<br/>(B) 100 GP</Equipment>

---

<Feature level="1">

## Expertise

Choose two skill proficiencies.

</Feature>

<Collapsible>

<Feature level="3">

## Steady Aim

Aim.

</Feature>

</Collapsible>

</Vocation>
`;

describe('readElementSlots', () => {
  it('reads element-form slots in the paragraph after a tag', () => {
    const lines = ['<Vocation armor="None">', '', '<Equipment>(A) 8 GP<br/>(B) 100 GP</Equipment>', '<Trades>Any</Trades>', '', 'Prose'];
    expect(readElementSlots(lines, 1)).toEqual({
      slots: { equipment: '(A) 8 GP<br/>(B) 100 GP', trades: 'Any' },
      end: 3,
    });
    expect(readElementSlots(['', 'Prose'], 0)).toEqual({ slots: {}, end: -1 });
  });
});

describe('unslotVocation', () => {
  it('restores the core traits table and the level headings, keeping line count', () => {
    const converted = VOCATION_SLOTTED;
    const text = unslotVocation(converted);
    expect(text.split('\n').length).toBe(converted.split('\n').length);
    expect(text).toContain('## Core Rogue Traits\n\n| Trait | Value |\n| **Primary Ability** | Dexterity |\n| **Hit Point Die** | d8 per Rogue level |');
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

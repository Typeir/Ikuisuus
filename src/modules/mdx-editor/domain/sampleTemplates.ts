/**
 * @fileoverview Sample Content Templates
 * @description Perfectly formatted nothingburgers, one per content kind, for
 * blank-page syndrome. Neutral stats, lorem ipsum feature text, no prose of
 * interest. Every template must stay parseable by its metadata generator —
 * the unit tests run each through `parseMetadataFromSource`.
 *
 * @module modules/mdx-editor/domain/sampleTemplates
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * One insertable sample. Menu labels live in the mdxEditor.toolbar message
 * namespace, keyed off `key`.
 *
 * @property {string} key - Stable identifier
 * @property {string} content - Full MDX source including frontmatter
 */
export interface SampleTemplate {
  key: string;
  content: string;
}

const LOREM = 'Lorem ipsum dolor sit amet, adipiscing consectetur elit.';

const CREATURE = `---
source: Ikuisuus
contentType: monsters
---

# Sample Creature
_Medium Beast, Neutral_

| **Armor Class** | **Hit Points** | **Speed** |
| ---------------- | -------------- | ---------- |
| 10 (natural) | 10 ([% 2d8 +1 %]) | [= 6 stride =] |

| STR | DEX | CON | INT | WIS | CHA |
| --- | --- | --- | --- | --- | --- |
| 10 (+0) | 10 (+0) | 10 (+0) | 10 (+0) | 10 (+0) | 10 (+0) |

- **Saving Throws**: None
- **Damage Resistances**: None
- **Damage Immunities**: None
- **Damage Vulnerabilities**: None
- **Condition Immunities**: None
- **Senses**: passive Perception 10
- **Languages**: None
- **Challenge**: 1 (200 XP)
- **Tier Bonus**: +2

---

## Traits

#### Lorem Ipsum
${LOREM}

---

## Actions

#### Lorem Strike
_Melee Weapon Attack:_ +2 to hit, reach [= 1 stride =], one target.
_Hit:_ 3 ([% 1d4 +1 bludgeoning %]).
`;

const HEIRLOOM = `---
source: Ikuisuus
contentType: heirlooms
---

# Sample Heirloom

_Common (requires attunement)_
_Longsword +0 (Versatile)_

${LOREM}

---

## Item Properties

- **Type**: Longsword (Martial, Versatile)
- **Damage**: [% 1d8 slashing %] ([% 1d10 %])
- **Weight**: [= 2 burden =]

---

## Special Features

- **Lorem Feature**:
  ${LOREM}
`;

const SPELL = `---
source: Ikuisuus
contentType: spells
---

# Sample Spell

${LOREM}

> **Sample Spell**
> _1st-level Evocation_
> **Casting Time**: 1 Major Action
> **Range**: [= 6 stride =]
> **Components**: V, S
> **Duration**: Instantaneous
>
> ${LOREM}

#### Spell Lists

This spell appears on the following spell lists:

- [_Wizard Spell List_](/en/library/character-creation/vocations/wizard/spells)
`;

const TRINKET = `---
source: Ikuisuus
contentType: trinkets
---

# Sample Trinket
Adventuring Gear

${LOREM}

**Damage**: —
**Properties**: None
**Range**: —
**Weight**: [= 1 burden =].
`;

const RULE = `---
contentType: rules
source: Ikuisuus
---

# Sample Rule

${LOREM}

## Lorem Section

${LOREM}
`;

const WORLD = `---
source: Ikuisuus
contentType: world
---

# Sample World Page

${LOREM}

## Lorem Section

${LOREM}
`;

/**
 * The insertable samples, in menu order.
 */
export const SAMPLE_TEMPLATES: readonly SampleTemplate[] = [
  { key: 'creature', content: CREATURE },
  { key: 'heirloom', content: HEIRLOOM },
  { key: 'spell', content: SPELL },
  { key: 'trinket', content: TRINKET },
  { key: 'rule', content: RULE },
  { key: 'world', content: WORLD },
];

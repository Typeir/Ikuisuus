---
name: mdx-format-monsters
description: >
  Detailed format conventions for monster stat block files (.sheet.mdx).
  Use when authoring, refactoring, or auditing monster sheets in
  src/content/en/monsters/. Covers the required stat block structure,
  ability score table, Challenge Rating, section dividers, feature headings,
  Legendary Deeds, Spellcasting blocks, the Meta MDX directive, metadata
  fields extracted by generateMonsterMetadata.ts, and all health-check rules
  specific to .sheet.mdx files.
---

# MDX Format: Monster Sheets

## Purpose

This skill governs the format of monster stat block files. Use it when
creating new monsters, refactoring existing sheets, or diagnosing
`monster-sheet-*` health-check violations.

## When to Use

- Authoring a new `.sheet.mdx` file
- Fixing `monster-sheet-missing-stat-table` or `monster-sheet-missing-cr` violations
- Adding Legendary Deeds, Lair actions, or Spellcasting blocks
- Running `npm run generate-metadata` and debugging parse failures
- Reviewing feature extraction output (see also: `feature-extraction` skill)

## File Information

| Field      | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Location   | `src/content/en/monsters/`                                    |
| Extension  | `.sheet.mdx` (required — generator ignores other extensions)  |
| Generator  | `scripts/metadata/generateMonsterMetadata.ts`                 |
| API Route  | `src/app/api/monsters/route.ts`                               |
| Multi-stat | A single file may contain multiple stat blocks (array output) |

## Required Structure

```mdx
# Monster Name

_Size Type, Alignment_

<BlendedImage
  src='/library/images/monsters/monster-name.webp'
  alt='Monster Name'
/>

Optional flavor or lore prose here.

| **Armor Class**    | **Hit Points**  | **Speed**           |
| ------------------ | --------------- | ------------------- |
| 16 (natural armor) | 170 (16d8 + 98) | 25 ft., swim 30 ft. |

| **STR** | **DEX** | **CON** | **INT** | **WIS** | **CHA** |
| ------- | ------- | ------- | ------- | ------- | ------- |
| 16 (+3) | 12 (+1) | 20 (+5) | 1 (-5)  | 10 (+0) | 22 (+6) |

- **Saving Throws**: Dex +5, Con +9
- **Skills**: Insight +6, Persuasion +10
- **Damage Resistances**: Fire, Cold
- **Damage Immunities**: Psychic
- **Condition Immunities**: Poisoned
- **Senses**: Darkvision 60 ft., passive Perception 12
- **Languages**: Common, Deep Speech
- **Challenge**: 11 (7,200 XP)
- **Proficiency Bonus**: +4

---

## Traits

#### Trait Name

Trait description text.

---

## Actions

#### Multiattack

The creature makes two attacks.

#### Bite

_Melee Weapon Attack:_ +7 to hit, reach 5 ft., one target. _Hit:_ 10 (2d6 + 3) piercing damage.

---

## Bonus Actions

#### Reposition

The creature moves up to half its speed without provoking opportunity attacks.

---

## Reactions

#### Parry

The creature adds 3 to its AC against one melee attack that would hit it.

---

## Legendary Deeds

The creature has **3 legendary deeds per round**, and regains all expended deeds
at the start of its turn.

#### Deed Name

_(Costs 1 Deed)_ Description of what the deed does.

---

## Legendary Deed: Act

#### Option Name _(Costs 1 Deed)_

Description of the legendary act option.

---

## Legendary Deed: Lair

At the start of the highest-initiative creature's turn, the monster may use a
lair deed.

#### Lair Effect Name

Description of the lair effect.
```

### Section Rules

| Section                   | Required? | Separator              | Heading level |
| ------------------------- | --------- | ---------------------- | ------------- |
| `## Traits`               | Yes       | `---` before and after | `##`          |
| `## Actions`              | Yes       | `---` before and after | `##`          |
| `## Bonus Actions`        | Optional  | `---` before and after | `##`          |
| `## Reactions`            | Optional  | `---` before and after | `##`          |
| `## Legendary Deeds`      | Optional  | `---` before and after | `##`          |
| `## Legendary Deed: Act`  | Optional  | `---` before           | `##`          |
| `## Legendary Deed: Lair` | Optional  | `---` before           | `##`          |

Individual features always use `####` (H4) headings.

### Stat Block Property List

All property lines use `- **PropertyName**: value` format. Omit lines that
have no value (e.g., if there are no damage resistances, omit that line).

```
- **Saving Throws**: ...       (only saves with proficiency)
- **Skills**: ...              (only proficient skills)
- **Damage Vulnerabilities**: ...
- **Damage Resistances**: ...
- **Damage Immunities**: ...
- **Condition Immunities**: ...
- **Senses**: ...              (always include passive Perception)
- **Languages**: ...
- **Challenge**: CR (XP)       ← REQUIRED
- **Proficiency Bonus**: +N    ← REQUIRED
```

### Spellcasting Block

```mdx
#### Spellcasting

The creature is a Nth-level spellcaster. Its spellcasting ability is Ability
(spell save DC N, +N to hit with spell attacks). It has the following spells prepared:

- **Cantrips (at will)**: _Spell Name, Spell Name_
- **1st level (4 slots)**: _Spell Name, Spell Name_
- **2nd level (3 slots)**: _Spell Name_
```

Place in `## Actions` if it uses an action to cast, or in `## Traits` if passive.

### Meta Directive

Use `<Meta>` to attach machine-readable enrichment data to a feature that
the parser cannot infer from prose alone. Place immediately after the
feature's `####` heading:

```mdx
#### Vorpal Strike

<Meta critRange={19} saveDC={17} saveAbility='con' />

_Melee Weapon Attack:_ +9 to hit, reach 5 ft., one target...
```

See the `feature-extraction` skill for full `<Meta>` field reference.

### Multi-Stat-Block Files

A single `.sheet.mdx` file may contain multiple stat blocks separated by `---`
and a new `# Heading`. The generator outputs an array. Use this pattern for
variants (e.g., Young / Adult / Ancient dragon) that share a page.

## Metadata Fields

Fields extracted by `generateMonsterMetadata.ts` into `.metadata.json`:

| Field                 | Source in MDX                                    |
| --------------------- | ------------------------------------------------ |
| `slug`                | Filename (kebab-case, no extension)              |
| `title`               | `# Heading`                                      |
| `size`                | First word of `_Size Type, Alignment_` italic    |
| `type`                | Middle words of italic line (e.g., "Aberration") |
| `alignment`           | Last part of italic line                         |
| `ac`                  | First column of AC/HP/Speed table                |
| `hp`                  | Second column (formula in parentheses)           |
| `speeds`              | Third column (parsed into object)                |
| `abilityScores`       | STR–CHA table (score and modifier)               |
| `savingThrows`        | `**Saving Throws**` bullet                       |
| `damageResistances`   | `**Damage Resistances**` bullet                  |
| `damageImmunities`    | `**Damage Immunities**` bullet                   |
| `conditionImmunities` | `**Condition Immunities**` bullet                |
| `senses`              | `**Senses**` bullet                              |
| `languages`           | `**Languages**` bullet                           |
| `cr`                  | `**Challenge**` bullet (CR number)               |
| `xp`                  | `**Challenge**` bullet (XP in parentheses)       |
| `proficiencyBonus`    | `**Proficiency Bonus**` bullet                   |
| `tags`                | Extracted from damage types, conditions, traits  |
| `features`            | Array from feature-extraction pipeline           |

## Format Rules

| Rule                               | Severity | Description                                                    |
| ---------------------------------- | -------- | -------------------------------------------------------------- |
| `non-kebab-filename`               | critical | Filename must be kebab-case (e.g., `giant-fire-ant.sheet.mdx`) |
| `monster-sheet-missing-stat-table` | critical | Must contain STR/DEX/CON/INT/WIS/CHA ability score table       |
| `monster-sheet-missing-cr`         | warning  | Must contain `**Challenge**: N (XP)` line                      |
| `fullsize-image-path`              | critical | Use `/library/images/` not `/full-size/`                       |
| `raw-img-tag`                      | critical | Use `<BlendedImage>` not `<img>`                               |
| `missing-alt-text`                 | warning  | `<BlendedImage>` requires a descriptive `alt` prop             |
| `unregistered-component`           | critical | Only use components registered in `src/lib/components/mdx/`    |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component        | Usage in Monster Sheets                          |
| ---------------- | ------------------------------------------------ |
| `<BlendedImage>` | Monster artwork image (optional but recommended) |
| `<Meta>`         | Feature enrichment directive for parser          |
| `<MonsterTable>` | Used on index pages only, not in stat blocks     |

## Common Pitfalls

- **Missing stat table**: The generator and health check both require the
  `| **STR** | **DEX** | ...` table. If the monster has no meaningful ability
  scores, fill them in as `— (—)` rather than omitting the table.
- **CR line format**: Must be `- **Challenge**: 11 (7,200 XP)` — CR first,
  XP in parentheses. The parser splits on the space and parenthesis.
- **Feature heading level**: Individual traits/actions MUST use `####` (H4).
  Using `###` breaks the feature extraction parser.
- **Section H2 before `---`**: Each major section (`## Traits`, `## Actions`,
  etc.) must be preceded by a `---` separator line, not just a blank line.
- **Multi-variant separator**: When a file has two stat blocks, place `---`
  then start the second with a fresh `# Name` H1. Do not use `##` for the
  second stat block's name.
- **`<img>` tags**: Never use raw `<img>`. The health check flags it as
  critical. Use `<BlendedImage src='...' alt='...' />` instead.

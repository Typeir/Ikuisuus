---
name: mdx-format-monsters
description: >
  Monster stat block format (.sheet.mdx). Required structure, stat table,
  Challenge Rating, section dividers, feature headings, Legendary Deeds,
  Spellcasting, Meta directive, metadata fields (generateMonsterMetadata.ts),
  health-check rules.
---

# MDX Format: Monster Sheets

## Purpose

Formats monster stat block files. Use when creating, refactoring, auditing sheets.
Diagnose `monster-sheet-*` health-check violations.

## When to Use

- Author new `.sheet.mdx`
- Fix `monster-sheet-missing-stat-table` or `monster-sheet-missing-cr`
- Add Legendary Deeds, Lair actions, Spellcasting
- Run `npm run generate-metadata`, debug parse failures
- Review feature extraction (see: `feature-extraction` skill)

## File Info

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| Location   | src/content/en/monsters/                             |
| Ext        | .sheet.mdx (required; generator ignores others)      |
| Generator  | scripts/metadata/generateMonsterMetadata.ts          |
| API        | src/app/api/monsters/route.ts                        |
| Multi-stat | Single file may contain multiple stat blocks (array) |

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

| Section                   | Req? | Separator          | Level |
| ------------------------- | ---- | ------------------ | ----- |
| `## Traits`               | Yes  | `---` before/after | `##`  |
| `## Actions`              | Yes  | `---` before/after | `##`  |
| `## Bonus Actions`        | Opt  | `---` before/after | `##`  |
| `## Reactions`            | Opt  | `---` before/after | `##`  |
| `## Legendary Deeds`      | Opt  | `---` before/after | `##`  |
| `## Legendary Deed: Act`  | Opt  | `---` before       | `##`  |
| `## Legendary Deed: Lair` | Opt  | `---` before       | `##`  |

Individual features use `####` (H4).

### Stat Block Property List

Format: `- **Name**: value`. Omit empty lines. Mandatory: Challenge, Proficiency Bonus.

```
- **Saving Throws**: (proficiency only)
- **Skills**: (proficiency only)
- **Damage Vulnerabilities**: ...
- **Damage Resistances**: ...
- **Damage Immunities**: ...
- **Condition Immunities**: ...
- **Senses**: ... (include passive Perception)
- **Languages**: ...
- **Challenge**: CR (XP)       ← REQUIRED
- **Proficiency Bonus**: +N    ← REQUIRED
```

### Spellcasting Block

```mdx
#### Spellcasting

Level N spellcaster. Ability (DC N, +N spell hit). Prepared:

- **Cantrips**: _Name, Name_
- **1st level (N slots)**: _Name, Name_
- **2nd level (N slots)**: _Name_
```

Place in `## Actions` (action cast) or `## Traits` (passive).

### Meta Directive

Attach enrichment data parser can't infer. Place after `####` heading:

```mdx
#### Vorpal Strike

<Meta critRange={19} saveDC={17} saveAbility='con' />

_Melee Weapon Attack:_ +9 to hit...
```

See `feature-extraction` skill for full `<Meta>` reference.

### Multi-Stat-Block Files

Single file = multiple blocks separated by `---` + new `# Heading`. Generator outputs array.
Use for variants (Young/Adult/Ancient dragon).

## Metadata Fields

`generateMonsterMetadata.ts` → `.metadata.json`:

| Field            | Source                   |
| ---------------- | ------------------------ |
| slug             | Filename (kebab)         |
| title            | `# Heading`              |
| size             | 1st word italic          |
| type             | middle words             |
| alignment        | last part                |
| ac/hp/speeds     | AC/HP/Speed table        |
| abilityScores    | STR-CHA table            |
| savingThrows     | `**Saving Throws**`      |
| damage\*         | `**Damage**` bullets     |
| senses           | `**Senses**`             |
| languages        | `**Languages**`          |
| cr/xp            | `**Challenge**`          |
| proficiencyBonus | `**Proficiency**`        |
| tags             | damage types, conditions |
| features         | feature-extraction array |

## Format Rules

| Rule                             | Severity | Fix                               |
| -------------------------------- | -------- | --------------------------------- |
| non-kebab-filename               | critical | Rename to kebab-case              |
| monster-sheet-missing-stat-table | critical | Add STR/DEX/CON/INT/WIS/CHA table |
| monster-sheet-missing-cr         | warning  | Add `**Challenge**: N (XP)`       |
| fullsize-image-path              | critical | Use `/library/images/`            |
| raw-img-tag                      | critical | Use `<BlendedImage>`              |
| missing-alt-text                 | warning  | Add `alt` prop                    |
| unregistered-component           | critical | Use registered components only    |

See `mdx-format` skill for universal rules.

## Available MDX Components

| Component        | Usage                             |
| ---------------- | --------------------------------- |
| `<BlendedImage>` | Artwork (optional, recommended)   |
| `<Meta>`         | Feature enrichment directive      |
| `<MonsterTable>` | Index pages only, NOT stat blocks |

## Pitfalls

- **Missing stat table** → Generator needs it. Fill empty as `— (—)` if no scores.
- **CR format** → `- **Challenge**: 11 (7,200 XP)`. CR first, XP in parens.
- **Feature H4** → Use `####`. `###` breaks parser.
- **Section separators** → Precede each major section with `---`, not just blank.
- **Multi-variant** → Separate blocks with `---`, then fresh `# Name` H1.
- **No `<img>` tags** → Use `<BlendedImage src='...' alt='...' />` only.

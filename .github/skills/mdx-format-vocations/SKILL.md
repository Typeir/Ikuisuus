---
name: mdx-format-vocations
description: >
  Vocation main.mdx format. Intro, Core Traits table, Becoming section, feature
  progression table with anchors, Collapsible blocks, optional spellcasting,
  metadata (generateVocationMetadata.ts), main.mdx-only parsing rule.
---

# MDX Format: Vocations

## Purpose

Formats vocation main files. Each vocation = dedicated dir. Main description +
feature table live in `main.mdx` (only file parsed for metadata).

## When to Use

- Author new `main.mdx` for vocation
- Add/reformat Core Traits table
- Update feature progression table
- Add Collapsible feature block
- Debug vocation parse with `npm run generate-metadata`

## File Information

| Field     | Value                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| Location  | `src/content/en/character-creation/vocations/{vocation}/`                     |
| Filename  | `main.mdx` (must be exactly this name — other files are not parsed)           |
| Generator | `scripts/metadata/generateVocationMetadata.ts`                                |
| API Route | `src/app/api/vocations/route.ts`                                              |
| Companion | Specialization files in the same directory (see `mdx-format-specializations`) |

## Required Structure

```mdx
# Fighter

Fighters rule many battlefields. Questing knights, royal champions, and elite
soldiers share an unparalleled prowess with weapons and armor. They are well
acquainted with death, both meting it out and defying it.

---

## Core Fighter Traits

| Trait                          | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| **Primary Ability**            | Strength or Dexterity                                   |
| **Hit Point Die**              | d10 per Fighter level                                   |
| **Saving Throw Proficiencies** | Strength and Constitution                               |
| **Skill Proficiencies**        | Choose 2: Acrobatics, Athletics, History...             |
| **Weapon Proficiencies**       | Simple and Martial weapons                              |
| **Armor Training**             | Light, Medium, and Heavy Armor; Shields                 |
| **Starting Equipment**         | Choose A or B: (A) Chain Mail, Greatsword... (B) 155 gp |

---

## Becoming a Fighter

### As a Level 1 Fighter

- Gain all the traits in the **Core Fighter Traits** table.
- Gain the level 1 features listed in the **Fighter Features** table.

### As a Mixed Fighter

- Gain the following from **Core Fighter Traits**: Hit Point Die, proficiency
  with Martial weapons, and training with Light and Medium armor and Shields.
- Gain the Fighter's level 1 features listed in the **Fighter Features** table.

---

## Fighter Vocation Features

| Level | Proficiency Bonus | Features                    | Second Wind Uses |
| ----- | ----------------- | --------------------------- | ---------------- |
| 1     | +2                | Fighting Style, Second Wind | 2                |
| 2     | +2                | Action Surge, Tactical Mind | 2                |
| 3     | +2                | Fighter Specialization      | 2                |

---

<Collapsible>
## 1st Level – Second Wind

As a **Minor Action**, you regain hit points equal to **1d10 + your Fighter level**.

You may use this feature **twice**.

</Collapsible>

<Collapsible>
## 2nd Level – Action Surge

Once on your turn you can take one additional action.

</Collapsible>
```

### Intro Section

The intro follows the `# Vocation Name` H1 and ends at the first `---`
divider. Write 2–4 paragraphs of flavor describing what the vocation does
and who plays it. Keep it narrative, not mechanical.

### Core Traits Table

The `## Core {Vocation} Traits` section contains a two-column markdown table
with bold left-column labels and plain-text descriptions:

```mdx
| Trait                          | Description          |
| ------------------------------ | -------------------- |
| **Primary Ability**            | ...                  |
| **Hit Point Die**              | d{N} per {Voc} level |
| **Saving Throw Proficiencies** | ...                  |
| **Skill Proficiencies**        | Choose N: ...        |
| **Weapon Proficiencies**       | ...                  |
| **Armor Training**             | ...                  |
| **Starting Equipment**         | Choose A or B:...    |
```

The generator reads this table to extract `traits`, `hitDie`,
`savingThrows`, `skillProficiencies`, `weaponProficiencies`, and
`armorTraining`.

### Becoming Section

`## Becoming a {Vocation}` has two sub-sections — level 1 character and
mixed (multiclass) character. Both use bullet lists.

### Feature Progression Table

`## {Vocation} Vocation Features` contains a level progression table:

```mdx
| Level | Proficiency Bonus | Features             | [Extra Columns] |
| ----- | ----------------- | -------------------- | --------------- |
| 1     | +2                | Feature A, Feature B | values          |
```

Feature names in the table that have a corresponding Collapsible below must
have **anchor fragment links**:

```mdx
| 1 | +2 | [Fighting Style](#fighting-style), [Second Wind](#second-wind) | 2 |
```

The anchor slugs are auto-generated from the H2 heading text inside each
Collapsible (kebab-case, lowercase). This links the table entry to the
Collapsible block below.

For spellcasting vocations, the table may include additional columns:
Cantrips Known, Prepared Spells, and spell slot counts (1st–9th level).

### Feature Collapsible Blocks

Each vocation feature is wrapped in a `<Collapsible>` block:

```mdx
<Collapsible>
## Nth Level – Feature Name

Feature description. May use any standard markdown (lists, tables, bold, etc.).

</Collapsible>
```

The `## Nth Level – Feature Name` heading inside the Collapsible is H2.
The level prefix follows the pattern: `Nth Level –` with an em-dash (`–`).

### Spellcasting Vocations

Spellcasting vocations add a spell slot progression table in the feature
table, and typically include a Spellcasting section in the Collapsibles:

```mdx
<Collapsible>
## 1st Level – Spellcasting

**Spell Slots.** You can cast prepared spells using spell slots shown in
the Wizard Features table...

**Cantrips.** You know N cantrips from the Wizard spell list...

</Collapsible>
```

The `spellcasting` metadata field is inferred from the presence of spell
slot columns in the feature table.

## Metadata Fields

Fields extracted by `generateVocationMetadata.ts` into `.metadata.json`:

| Field                 | Source in MDX                                                |
| --------------------- | ------------------------------------------------------------ |
| `slug`                | Directory name (kebab-case)                                  |
| `title`               | `# Heading`                                                  |
| `description`         | Intro paragraphs before first `---`                          |
| `traits`              | Key–value map from Core Traits table                         |
| `hitDie`              | Parsed from **Hit Point Die** row (`d6`, `d8`, `d10`, `d12`) |
| `savingThrows`        | Parsed from **Saving Throw Proficiencies** row               |
| `skillProficiencies`  | Parsed from **Skill Proficiencies** row                      |
| `weaponProficiencies` | Parsed from **Weapon Proficiencies** row                     |
| `armorTraining`       | Parsed from **Armor Training** row                           |
| `spellcasting`        | Inferred from spell slot columns in progression table        |
| `features`            | Array of `{ level, name }` from progression table            |

## Format Rules

| Rule                     | Severity | Description                                                       |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `non-kebab-filename`     | critical | Directory name must be kebab-case (filename is always `main.mdx`) |
| `unregistered-component` | critical | Only `<Collapsible>` and `<FilteredSpellTable>` are expected      |
| `color-literal-in-mdx`   | warning  | No inline hex colors                                              |

The `missing-h1` and `multiple-h1` rules do **not** apply to vocations,
which always have exactly one `# Title` at the top.

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component              | Usage in Vocation Files                            |
| ---------------------- | -------------------------------------------------- |
| `<Collapsible>`        | Wraps each feature block (standard usage)          |
| `<FilteredSpellTable>` | Spell list page that renders the vocation's spells |
| `<SpellTable>`         | Alternative spell display component                |

## Common Pitfalls

- **Non-`main.mdx` filename**: The generator only reads `main.mdx`. A file
  named `fighter.mdx` in the same directory will be ignored.
- **Anchor links in progression table**: If a feature in the table doesn't
  have an anchor link, clicking it won't scroll to the Collapsible. Generate
  the anchor from the H2 text inside the Collapsible (kebab-lowercase).
- **Em-dash vs hyphen in feature headings**: Feature headings use `–` (em-dash
  U+2013), not `-` (hyphen). `## 1st Level – Second Wind` is correct;
  `## 1st Level - Second Wind` is wrong.
- **Core Traits table row order**: The generator reads rows by label name,
  not by position, so order does not affect parsing — but maintain the
  canonical order (Primary Ability, Hit Die, Saves, Skills, Weapons, Armor,
  Equipment) for consistency across vocations.
- **Specialization file in same directory**: Files matching
  `*.specialization.mdx` in the vocation directory are handled by a separate
  generator. Do not duplicate their content in `main.mdx`.

---
name: mdx-format-feats
description: >
  Feat format (.mdx). Prerequisite line, flavor, horizontal rule, ability
  increase phrasing, bold-bullet features, fighting-styles/ exclusion, metadata
  (generateFeatMetadata.ts), format rules.
---

# MDX Format: Feats

## Purpose

Formats feat files. Two-part: flavor before `---`, then mechanics (ability
increase + bold-labeled feature bullets). Parser extracts prerequisites,
abilities, feature names + descriptions.

## When to Use

- Author new feat `.mdx`
- Fix prerequisite line format
- Add/reformat feature bullets
- Debug feat parse with `npm run generate-metadata`
- Audit `fighting-styles/` exclusion

## File Information

| Field      | Value                                                      |
| ---------- | ---------------------------------------------------------- |
| Location   | `src/content/en/character-creation/feats/`                 |
| Extension  | `.mdx` (plain — no special extension prefix)               |
| Generator  | `scripts/metadata/generateFeatMetadata.ts`                 |
| Exclusions | `main.mdx` and all files in `fighting-styles/` are skipped |

## Required Structure

```mdx
# Feat Name

_Prerequisite: **Feature Name** or condition description_

Flavor text describing the feat's lore rationale and narrative justification.
One to three sentences is typical. Keep it grounded in the setting.

---

Increase your **Ability Score by 1**, to a maximum of **20**.

When you take this feat, you gain the following benefits:

- **Feature Name.** Description of what the feature does. May span multiple
  sentences. Additional mechanical detail goes here.

- **Second Feature.** Description of the second feature. Keep each benefit
  discrete.
```

### Prerequisite Line

The prerequisite line immediately follows the `# Title` heading and is an
italic line:

```mdx
_Prerequisite: **Feature Name** qualifier_
```

- Wrap the specific required feature or ability in `**bold**` within the italic.
- Use `_No attribute prerequisite._` when there is no prerequisite.
- Common patterns:
  - `_Prerequisite: **Strength** 13 or higher_`
  - `_Prerequisite: **Great Weapon Fighting** style_`
  - `_Prerequisite: **Spellcasting** or **Pact Magic** feature_`
  - `_No attribute prerequisite._`

The generator reads this line to extract `prerequisite` (string) and
`hasPrerequisite` (boolean).

### Flavor Text

The flavor text paragraph(s) between the prerequisite line and the `---`
separator are free-form prose. This is the only narrative content in a feat.

- Do not include mechanical details here.
- One to three paragraphs maximum.
- Optional: may be omitted entirely (just `---` after the prerequisite).

### Horizontal Rule Separator

A single `---` separates the flavor section from the mechanical benefits.
This is required — the generator uses it as a section boundary.

### Ability Increase Line

When the feat grants an ability score increase, place a standalone sentence
immediately after the `---`:

```mdx
Increase your **Constitution score by 1**, to a maximum of **20**.
```

Parser requirements for `abilityIncrease` extraction:

- Must start with "Increase your"
- Ability name must be in `**bold**`
- "by N" must appear with the amount in `**bold**` or as plain text
- "to a maximum of **20**" or "to a maximum of 20" closes the sentence

If the feat increases multiple scores, write one sentence per score on
separate lines, or use "your choice of ability score".

### Feature Bullets

Feature benefits use the bold-label bullet format:

```mdx
- **Feature Name.** Description of the feature's mechanical effect.
```

**Critical formatting rules:**

- The period (`.`) must be **inside the bold span**: `**Name.**` not `**Name**.`
- Feature name is sentence-case (capitalize first word only, unless a proper noun)
- The label and description are on one logical line (wrap with markdown
  continuation, not a hard newline)
- Multiple paragraphs within one feature are not supported by the parser —
  keep each feature to one logical block

### No Components

Feat files do not use MDX components. Plain markdown only.

## Metadata Fields

Fields extracted by `generateFeatMetadata.ts` into `.metadata.json`:

| Field             | Source in MDX                                                 |
| ----------------- | ------------------------------------------------------------- |
| `slug`            | Filename (kebab-case, no extension)                           |
| `title`           | `# Heading`                                                   |
| `description`     | First paragraph before `---`                                  |
| `prerequisite`    | Full text of italic `_Prerequisite: ..._` line                |
| `hasPrerequisite` | `false` if line is "No attribute prerequisite", else `true`   |
| `abilityIncrease` | Parsed from "Increase your **X** by N" sentence               |
| `features`        | Array of `{ name, description, tags }` from bold-bullet items |
| `tags`            | Gameplay tags extracted from feature descriptions             |
| `indexVersion`    | Currently `1`                                                 |

### `abilityIncrease` Object Shape

```json
{
  "abilities": ["con"],
  "amount": 1,
  "maximum": 20
}
```

Ability keys are lowercase abbreviations: `str`, `dex`, `con`, `int`, `wis`, `cha`.

## Format Rules

| Rule                     | Severity | Description                              |
| ------------------------ | -------- | ---------------------------------------- |
| `non-kebab-filename`     | critical | Filename must be kebab-case              |
| `missing-h1`             | warning  | File must start with `# Feat Name`       |
| `unregistered-component` | critical | Feat files should have no MDX components |
| `color-literal-in-mdx`   | warning  | No inline hex colors in style attributes |

See the `mdx-format` skill for the full universal rules table.

## Fighting Styles Subdirectory

Files inside `src/content/en/character-creation/feats/fighting-styles/`
are **excluded from metadata generation**. They follow the same structural
format as regular feats but are treated as a sub-index by the generator.

Each fighting-style feat still needs a `# Title`, prerequisite line, and
feature bullets — they just won't appear in the `/api/feats` response.

## Common Pitfalls

- **Period outside bold span**: `**Name.**` is correct. `**Name**.` (period
  outside) breaks the parser's feature name extraction regex.
- **Missing `---` separator**: The `---` is required. Without it the parser
  cannot split flavor from mechanics, and `description` will capture
  everything or nothing.
- **No-prerequisite line missing**: When there is no prerequisite, still
  include `_No attribute prerequisite._`. Omitting the line entirely causes
  `hasPrerequisite` to be undefined rather than `false`.
- **Ability increase sentence**: "Increase your **Constitution score** by
  **1**" is equivalent to "Increase your **Constitution score by 1**". Both
  work, but the score name must be bold. Plain-text ability names are not
  parsed.
- **MDX components in feat files**: Feats should be plain markdown. If you
  want a collapsible variant table, reconsider the design — feats are not
  Bloodline boons.
- **Multiple features merged into one bullet**: Keep each `- **Name.**` item
  to a single feature. Do not chain multiple named benefits under one bullet.

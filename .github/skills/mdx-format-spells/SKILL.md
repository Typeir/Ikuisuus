---
name: mdx-format-spells
description: >
  Spell format (.mdx). Optional YAML frontmatter, flavor text, required blockquote
  stat block, bold properties, At Higher Levels, Spell Lists with links, metadata
  (generateSpellMetadata.ts), health-check rule.
---

# MDX Format: Spells

## Purpose

Formats spell files. Flavor + blockquote stat block. Blockquote critical
(generator + health check require it).

## When to Use

- Author new spell `.mdx`
- Fix `spell-missing-blockquote-stat-block`
- Add/reformat `#### Spell Lists`
- Debug spell parse failures with `npm run generate-metadata`

## File Information

| Field     | Value                                        |
| --------- | -------------------------------------------- |
| Location  | `src/content/en/spells/`                     |
| Extension | `.mdx` (plain — no special extension prefix) |
| Generator | `scripts/metadata/generateSpellMetadata.ts`  |
| API Route | `src/app/api/spells/route.ts`                |

## Required Structure

```mdx
---
source: basic
---

# Cure Wounds

Warm, pulsing light seeps into wounds, knitting torn flesh and staunching bleeding.

---

> **Cure Wounds**
> _1st-level Evocation_
> **Casting Time**: 1 Action
> **Range**: Touch
> **Components**: V, S
> **Duration**: Instantaneous
>
> A creature you touch regains a number of hit points equal to 1d8 + your
> spellcasting ability modifier. This spell has no effect on undead or constructs.
>
> **At Higher Levels.** When you cast this spell using a spell slot of 2nd
> level or higher, the healing increases by 1d8 for each slot level above 1st.

#### Spell Lists

This spell appears on the following spell lists:

- [_Cleric Spell List_](/en/library/character-creation/vocations/cleric/spells)
- [_Druid Spell List_](/en/library/character-creation/vocations/druid/spells)
```

### YAML Frontmatter

The frontmatter is optional but used to tag canonical D&D content:

```yaml
---
source: basic
---
```

Omit the frontmatter for setting-specific or homebrew spells that are not
part of the D&D Basic ruleset.

### Flavor Text

One or two sentences of narrative flavor before the `---` divider. Should
evoke the spell's aesthetic rather than describe its mechanics.

- Do not write mechanical details in the flavor text.
- The `---` divider is required even if there is minimal flavor.

### Blockquote Stat Block

The spell's mechanical definition lives entirely inside a markdown blockquote
(`>`). This is the structure the generator and health check validate.

**Opening lines:**

```mdx
> **Spell Name**
> _Nth-level School_
```

The level line format: `_Nth-level School_` (e.g., `_3rd-level Evocation_`,
`_Cantrip Conjuration_`). For cantrips, use `_Cantrip SchoolName_`.

**Required property lines** (in this order):

```mdx
> **Casting Time**: 1 Action
> **Range**: 60 feet
> **Components**: V, S, M (a pinch of sulfur)
> **Duration**: Concentration, up to 1 minute
```

- **Casting Time**: Action / Bonus Action / Reaction / 1 Minute / 1 Hour
- **Range**: Touch / Self / N feet / N miles / Unlimited
- **Components**: V (verbal), S (somatic), M (material — list materials in parentheses)
- **Duration**: Instantaneous / Until Dispelled / Concentration, up to N / N days

A blank `>` line separates the property block from the description:

```mdx
> Spell effect description text...
```

### At Higher Levels

If the spell scales with spell slot level, end the description with:

```mdx
> **At Higher Levels.** When you cast this spell using a spell slot of Nth
> level or higher, [scaling description].
```

The exact phrasing `**At Higher Levels.**` is required (period inside bold).
The generator looks for this exact string to detect upcasting rules.

### Concentration

If the spell requires concentration, write `Concentration, up to N [unit]`
in the Duration line. The generator infers `concentration: true` from this.

### Spell Lists Section

After the closing blockquote, add a `#### Spell Lists` section linking to
each vocation's spell list that includes this spell:

```mdx
#### Spell Lists

This spell appears on the following spell lists:

- [_Bard Spell List_](/en/library/character-creation/vocations/bard/spells)
- [_Wizard Spell List_](/en/library/character-creation/vocations/wizard/spells)
```

- Use `/en/library/` internal paths (not relative paths, not locale-specific).
- Spell list names in `_italics_` inside the link label.
- Omit vocations that do not receive this spell.

## Metadata Fields

Fields extracted by `generateSpellMetadata.ts` into `.metadata.json`:

| Field           | Source in MDX                                                |
| --------------- | ------------------------------------------------------------ |
| `slug`          | Filename (kebab-case, no extension)                          |
| `title`         | `# Heading` and `> **Spell Name**` (should match)            |
| `level`         | Parsed from `> _Nth-level School_` (numeric, 0 for cantrips) |
| `school`        | Parsed from `> _Nth-level School_` (e.g., "Evocation")       |
| `castingTime`   | `> **Casting Time**: ...`                                    |
| `range`         | `> **Range**: ...`                                           |
| `components`    | `> **Components**: ...`                                      |
| `duration`      | `> **Duration**: ...`                                        |
| `concentration` | `true` if Duration starts with "Concentration"               |
| `spellLists`    | Links in `#### Spell Lists` section (vocation slugs)         |
| `source`        | YAML frontmatter `source` field (`"basic"` or absent)        |
| `tags`          | Extracted damage types, conditions, and mechanics            |

## Format Rules

| Rule                                  | Severity | Description                                          |
| ------------------------------------- | -------- | ---------------------------------------------------- |
| `non-kebab-filename`                  | critical | Filename must be kebab-case                          |
| `missing-h1`                          | warning  | File must start with `# Spell Name`                  |
| `spell-missing-blockquote-stat-block` | warning  | Must contain `> **SpellName**` blockquote stat block |
| `multiple-h1`                         | warning  | Only one `#` heading per file                        |
| `hardcoded-locale-path`               | warning  | Use `/en/` paths in spell list links                 |
| `color-literal-in-mdx`                | warning  | No inline hex colors                                 |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

Spell files do not use MDX components. The blockquote syntax handles all
formatting needs. Do not add `<Image>`, `<Collapsible>`, or other components.

## Common Pitfalls

- **Stat block not in blockquote**: The `>` prefix is required on every line
  of the stat block, including blank separator lines. A stat block written
  as plain markdown paragraphs will fail the health check.
- **Blank line inside blockquote**: Use `>` (empty blockquote line) to create
  a blank line inside the stat block, not a truly empty line (which ends the
  blockquote).
- **Wrong `At Higher Levels` phrasing**: The parser looks for the exact string
  `**At Higher Levels.**` — with a period inside the bold span. Do not use
  `At Higher Levels:` (colon) or `**At Higher Levels**:` (colon outside bold).
- **Spell name mismatch**: The `# Title` heading and the `> **Spell Name**`
  inside the blockquote should match exactly (same spelling and casing).
- **Hardcoded locale in spell list links**: Use `/en/library/...` not
  `/es/library/...` or `/fi/library/...`. The `/en/` prefix is the canonical
  path; other locales fall back to English content.
- **Missing Spell Lists section**: The `#### Spell Lists` section is not
  strictly required by the health check, but omitting it means the spell will
  not appear in any vocation's spell list page.

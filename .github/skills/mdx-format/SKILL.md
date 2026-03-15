---
name: mdx-format
description: >
  Analyzes and refactors MDX content files for the Library of Ikuisuus project.
  Understands the structural rules for each content type (monster sheets, spells,
  heirlooms, trinkets, world lore, rules). Can run the MDX format health check,
  interpret violations, and apply targeted fixes while preserving content integrity.
---

# MDX Format Skill

## Purpose

This skill provides deep knowledge of the MDX content format conventions used
across the project. Use it when performing format refactoring, content migration,
or structural validation of `.mdx` files.

## When to Use

- **Format refactoring**: Bulk or targeted restructuring of MDX content files
- **Content auditing**: Running `check-mdx-format.mjs` and interpreting results
- **New content creation**: Scaffolding MDX files that conform to format rules
- **Content type migration**: Converting between content formats (e.g., adding metadata structure)

## Content Types and Their Format Rules

### Monster Sheets (`.sheet.mdx`)

**Location**: `src/content/en/monsters/`
**Extension**: `.sheet.mdx` (required for metadata generation)

**Required Structure**:

```mdx
# Monster Name

_Size Type, Alignment_

| **Armor Class** | **Hit Points** | **Speed** |
| --------------- | -------------- | --------- |
| AC (notes)      | HP (formula)   | speeds    |

| **STR**      | **DEX**      | **CON**      | **INT**      | **WIS**      | **CHA**      |
| ------------ | ------------ | ------------ | ------------ | ------------ | ------------ |
| Score (+mod) | Score (+mod) | Score (+mod) | Score (+mod) | Score (+mod) | Score (+mod) |

- **Saving Throws**: ...
- **Damage Resistances**: ...
- **Damage Immunities**: ...
- **Condition Immunities**: ...
- **Senses**: ...
- **Languages**: ...
- **Challenge**: CR (XP)
- **Proficiency Bonus**: +N

---

## Traits

#### Trait Name

Trait description...

---

## Actions

#### Action Name

Action description...

---

## Legendary Deeds (if applicable)

#### Deed Name (X Deeds)

Deed description...
```

**Critical Rules**:

- Must contain ability score table with STR/DEX/CON/INT/WIS/CHA
- Must contain Challenge Rating line
- Stat block properties use bold markdown (`**Property**:`)
- Horizontal rules (`---`) separate major sections
- Multi-variant files contain multiple stat blocks (arrays in metadata)

### Spells (`.mdx`)

**Location**: `src/content/en/spells/`

**Required Structure**:

```mdx
# Spell Name

Flavor text / lore description...

---

> **Spell Name**
> _Level School_
> **Casting Time**: ...
> **Range**: ...
> **Components**: V, S, M (materials)
> **Duration**: ...
>
> Spell effect description...
>
> **At Higher Levels.** When cast using a spell slot of Nth level or higher...

#### Spell Lists

This spell appears on the following spell lists:

- List name
```

**Critical Rules**:

- Spell stat block MUST be in a blockquote (`>`)
- Must contain bold property labels for Casting Time, Range, Components, Duration
- Flavor text and horizontal rule precede the stat block

### Heirlooms (`.mdx`)

**Location**: `src/content/en/items/heirlooms/`

**Required Structure**:

```mdx
# Item Name

<ParallaxBackdrop ... />

<FloatedContainer side='right' width='35%'>
  <Image src='/library/images/heirlooms/item-name.webp' alt='Item Name' />
</FloatedContainer>

_Rarity (requires attunement)_
_Weapon/Armor type description_

Flavor text...

---

## Weapon Properties / Armor Properties

- **Type**: ...
- **Damage**: ...

## Special Features

- **Feature Name**: Description...

## Effects

- **Effect Name**: Description...
```

**Critical Rules**:

- Images use `/library/` paths, never `/full-size/`
- Use `<Image>`, `<BlendedImage>`, or `<ParallaxBackdrop>` components, never `<img>`
- Rarity line follows the pattern: `_rarity (requires attunement)_`

### World Content (`.mdx`)

**Location**: `src/content/en/world/` (with subdirectories)

**Structure**: Free-form lore content with a single `# Title` heading.
Cross-references use internal links: `[term](/en/library/world/path)`

### Rules Content (`.mdx`)

**Location**: `src/content/en/rules/`

**Structure**: Technical game mechanics documentation.
May reference spells, items, and monsters via internal links.

## Universal Format Rules

| Rule                                  | Severity | Description                                            |
| ------------------------------------- | -------- | ------------------------------------------------------ |
| `non-kebab-filename`                  | critical | All filenames must be kebab-case                       |
| `fullsize-image-path`                 | critical | Use `/library/` not `/full-size/`                      |
| `raw-img-tag`                         | critical | Use `<Image>` or `<BlendedImage>`, not `<img>`         |
| `unregistered-component`              | critical | Only use components registered in `mdx/index.tsx`      |
| `missing-h1`                          | warning  | Every content file (except `main.mdx`) needs `# Title` |
| `multiple-h1`                         | warning  | Only one `#` heading per file (use `##` for sections)  |
| `color-literal-in-mdx`                | warning  | No inline color styles                                 |
| `missing-alt-text`                    | warning  | All `<Image>` components need alt text                 |
| `monster-sheet-missing-stat-table`    | critical | `.sheet.mdx` must have ability score table             |
| `monster-sheet-missing-cr`            | warning  | `.sheet.mdx` should have Challenge Rating              |
| `spell-missing-blockquote-stat-block` | warning  | Spell files should have `>` stat block                 |

## Running the Format Check

```bash
# Run MDX format check standalone
node scripts/ci/check-mdx-format.mjs

# Run as part of full health check
node scripts/ci/health-check.mjs
```

The script outputs JSON matching the health check schema:

```json
{
  "check": "mdx-format",
  "severity": "critical|warning",
  "passed": true|false,
  "failures": [{ "file": "...", "rule": "...", "message": "...", "suggestion": "..." }],
  "stats": { "total_files_checked": N, "violations_found": N }
}
```

## Refactoring Workflow

When performing a format refactor:

1. **Run the check**: `node scripts/ci/check-mdx-format.mjs` to identify violations
2. **Group by rule**: Violations of the same rule can often be fixed with a consistent pattern
3. **Fix by content type**: Work through one content type at a time (monsters → spells → heirlooms → world)
4. **Verify metadata**: After fixing monster/spell/heirloom files, run `npm run generate-all-metadata` to ensure parsers still work
5. **Re-run check**: Confirm violations are resolved and no new ones introduced

## Component Registry

Components available in MDX files (registered in `src/lib/components/mdx/index.tsx`):

| Component            | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `<BlendedImage>`     | Image with blend/overlay effects          |
| `<Image>`            | Next.js optimized image (600×600 default) |
| `<FloatedContainer>` | Float content left/right with width       |
| `<ClearFloats>`      | Clear floating elements                   |
| `<ParallaxBackdrop>` | Full-width parallax background image      |
| `<HorizontalSplit>`  | Side-by-side content layout               |
| `<FlexRenderer>`     | Flexible content rendering                |
| `<MonsterTable>`     | Monster metadata filterable table         |
| `<HeirloomTable>`    | Heirloom metadata filterable table        |
| `<SpellTable>`       | Spell metadata filterable table           |
| `<TrinketTable>`     | Trinket metadata filterable table         |

Auto-generated spell components from `mdxComponents.tsx` are also available (e.g., `<LesserMooncleave>`, `<FoldDeduplication>`).

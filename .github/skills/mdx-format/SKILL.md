---
name: mdx-format
description: >
  Router skill for MDX content format in the Library of Ikuisuus project. Covers
  universal format rules, the MDX component registry, running the format health
  check, and the refactoring workflow. For per-content-type structural rules,
  canonical examples, and metadata field tables, load the matching sub-skill
  (mdx-format-monsters, mdx-format-heirlooms, mdx-format-trinkets,
  mdx-format-bloodlines, mdx-format-feats, mdx-format-spells,
  mdx-format-vocations, mdx-format-specializations, mdx-format-world).
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

## Per-Content-Type Skills

For detailed structural requirements, canonical examples, metadata field tables,
and type-specific pitfalls, load the matching sub-skill before editing content:

| Content Type    | Skill                        | File Extension        | Location                                             |
| --------------- | ---------------------------- | --------------------- | ---------------------------------------------------- |
| Monsters        | `mdx-format-monsters`        | `.sheet.mdx`          | `src/content/en/monsters/`                           |
| Heirlooms       | `mdx-format-heirlooms`       | `.heirloom.mdx`       | `src/content/en/items/heirlooms/`                    |
| Trinkets        | `mdx-format-trinkets`        | `.trinket.mdx`        | `src/content/en/items/trinkets/`                     |
| Bloodlines      | `mdx-format-bloodlines`      | `.bloodline.mdx`      | `src/content/en/character-creation/bloodlines/`      |
| Feats           | `mdx-format-feats`           | `.mdx`                | `src/content/en/character-creation/feats/`           |
| Spells          | `mdx-format-spells`          | `.mdx`                | `src/content/en/spells/`                             |
| Vocations       | `mdx-format-vocations`       | `main.mdx`            | `src/content/en/character-creation/vocations/{voc}/` |
| Specializations | `mdx-format-specializations` | `.specialization.mdx` | `src/content/en/character-creation/vocations/{voc}/` |
| World / Lore    | `mdx-format-world`           | `.lore.mdx`           | `src/content/en/world/`                              |

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
node .github/scripts/check-mdx-format.ts

# Run as part of full health check
node .github/scripts/health-check.ts
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

1. **Load the per-type skill first**: Identify the content type and load its sub-skill
   (e.g., `mdx-format-monsters`) before making any edits.
2. **Run the check**: `node .github/scripts/check-mdx-format.ts` to identify violations.
3. **Group by rule**: Violations of the same rule can often be fixed with a consistent pattern.
4. **Fix by content type**: Work through one content type at a time using the sub-skill as reference.
5. **Verify metadata**: After fixing monster/spell/heirloom/etc. files, run `npm run generate-metadata`
   to ensure parsers still work.
6. **Re-run check**: Confirm violations are resolved and no new ones introduced.

## Component Registry

Components available in MDX files (registered in `src/lib/components/mdx/index.tsx`):

| Component              | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `<BlendedImage>`       | Image with blend/overlay effects          |
| `<Image>`              | Next.js optimized image (600×600 default) |
| `<FloatedContainer>`   | Float content left/right with width       |
| `<ClearFloats>`        | Clear floating elements                   |
| `<ParallaxBackdrop>`   | Full-width parallax background image      |
| `<HorizontalSplit>`    | Side-by-side content layout               |
| `<FlexRenderer>`       | Flexible content rendering                |
| `<MonsterTable>`       | Monster metadata filterable table         |
| `<HeirloomTable>`      | Heirloom metadata filterable table        |
| `<SpellTable>`         | Spell metadata filterable table           |
| `<TrinketTable>`       | Trinket metadata filterable table         |
| `<FilteredSpellTable>` | Spell table with vocation filter          |
| `<Collapsible>`        | Expandable/collapsible content block      |
| `<Tooltip>`            | Inline tooltip for rules terms            |
| `<Meta>`               | Monster metadata directive (sheet files)  |

Auto-generated spell components from `mdxComponents.tsx` are also available (e.g., `<LesserMooncleave>`, `<FoldDeduplication>`).

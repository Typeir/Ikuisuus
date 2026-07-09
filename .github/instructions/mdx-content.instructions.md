---
applyTo: 'src/content/**/*.mdx,src/lib/components/mdx/**'
---

# MDX Content Architecture & Format Rules

Before modifying any MDX content or MDX component, you MUST:

1. **Read** `.github/docs/content-system.md` for the full content architecture (filesystem routing, locale handling, MDX compilation).
2. **Verify** file naming: kebab-case only, `.mdx` extension, `.sheet.mdx` for monster stat blocks.
3. **Check locale mirroring**: changes to `src/content/en/` must be mirrored in `es/` and `fi/` if translations exist.
4. **Confirm component registration**: any new MDX component must be registered in `src/lib/components/mdx/index.tsx`.
5. **Run `npm run pre-init`** after content changes to regenerate metadata and merge locales.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which MDX files are affected and their locale coverage
- Whether metadata generators need updating
- Component registration changes if any
- Build pipeline impact assessment

## Content Type Format Reference

### Monster Sheets (`src/content/en/monsters/*.sheet.mdx`)

Required elements:

- H1 title: `# Monster Name`
- Subheading with size/type/alignment: `_Size Type, Alignment_`
- AC / HP / Speed table (first markdown table)
- Ability score table with STR/DEX/CON/INT/WIS/CHA (bold or plain)
- Property list: Saving Throws, Damage Resistances/Immunities, Condition Immunities, Senses, Languages, Challenge, Proficiency Bonus
- Sections separated by `---`: Traits, Actions, Legendary Deeds (if applicable)
- All property labels are bold: `**Challenge**: 16 (10,900 XP)`

### Spells (`src/content/en/spells/*.mdx`)

Required elements:

- H1 title: `# Spell Name`
- Flavor text before `---`
- Blockquote stat block (`>`) with bold labels:
  - `**Spell Name**`, `_Level School_`
  - `**Casting Time**`, `**Range**`, `**Components**`, `**Duration**`
  - Effect description
  - `**At Higher Levels.**` (if applicable)
- `#### Spell Lists` section at end

### Heirlooms (`src/content/en/items/heirlooms/*.mdx`)

Required elements:

- H1 title: `# Item Name`
- `<ParallaxBackdrop>` and/or `<FloatedContainer>` with `<Image>` for artwork
- Rarity/attunement line: `_Rarity (requires attunement)_`
- Flavor text
- Sections: Weapon/Armor Properties, Special Features, Effects

### World Content (`src/content/en/world/**/*.mdx`)

- Single H1 title
- Free-form lore content
- Cross-references use absolute links: `[term](/en/library/world/path)`

### Index Pages (`main.mdx`)

- Serve as category overview pages
- Excluded from metadata generation
- May use `<MonsterTable>`, `<HeirloomTable>`, `<SpellTable>`, `<TrinketTable>` components

## Critical Format Checks (Enforced by `check-mdx-format.mjs`)

| Rule                                  | Severity | Check                                            |
| ------------------------------------- | -------- | ------------------------------------------------ |
| `non-kebab-filename`                  | critical | Filenames must be kebab-case only                |
| `fullsize-image-path`                 | critical | Use `/library/` paths, never `/full-size/`       |
| `raw-img-tag`                         | critical | Use `<Image>` or `<BlendedImage>`, not `<img>`   |
| `unregistered-component`              | critical | Only registered MDX components allowed           |
| `monster-sheet-missing-stat-table`    | critical | `.sheet.mdx` must have ability score table       |
| `missing-h1`                          | warning  | Content files need `# Title` (except `main.mdx`) |
| `multiple-h1`                         | warning  | Only one `#` per file for spells/world/items     |
| `monster-sheet-missing-cr`            | warning  | `.sheet.mdx` should have Challenge line        |
| `spell-missing-blockquote-stat-block` | warning  | Spells need `>` stat block                       |
| `missing-alt-text`                    | warning  | `<Image>` needs alt text                         |
| `color-literal-in-mdx`                | warning  | No inline color styles                           |

## MDX Component Registry

Components available in MDX (from `src/lib/components/mdx/index.tsx`):

- `<BlendedImage>` — Image with blend effects
- `<Image>` — Next.js optimized image (600×600 default)
- `<FloatedContainer side='left|right' width='N%'>` — Float content
- `<ClearFloats>` — Clear floats
- `<ParallaxBackdrop src='...' alt='...' blurPx={N} opacity={N}>` — Parallax background
- `<HorizontalSplit>` — Side-by-side content
- `<FlexRenderer>` — Flexible rendering
- `<MonsterTable>` / `<HeirloomTable>` / `<SpellTable>` / `<TrinketTable>` — Metadata tables

Auto-generated components from `mdxComponents.tsx` are also valid (spell components).

## Format Refactoring Workflow

1. Run `node .github/scripts/check-mdx-format.mjs` to identify violations
2. Group violations by rule and content type
3. Fix one content type at a time (monsters → spells → heirlooms → world)
4. After fixing, run `npm run generate-metadata` to verify metadata parsers still work
5. Re-run format check to confirm zero critical violations

## Critical Checks (Hard Rules)

- No color literals in TSX components (use CSS variables from `globals.scss`)
- JSDoc on all component declarations
- Monster `.sheet.mdx` files must parse correctly with metadata generators
- Images always use `/library/` paths (compressed WebP from build pipeline)

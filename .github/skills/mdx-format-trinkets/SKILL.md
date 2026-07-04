---
name: mdx-format-trinkets
description: >
  Trinket format (.trinket.mdx). Plain-text type line, description prose,
  bold property lines (Damage, Damage Type, Properties, Range, Weight), no
  section dividers, metadata (generateTrinketMetadata.ts), health-check rules.
---

# MDX Format: Trinkets

## Purpose

Formats trinket item files. Simple adventuring gear, weapons, consumables.
Flat minimal structure, no sections.

## When to Use

- Author new `.trinket.mdx`
- Fix property line format for parser
- Add new item type (weapon, gear, consumable)
- Debug trinket parse with `npm run generate-metadata`

## File Information

| Field     | Value                                         |
| --------- | --------------------------------------------- |
| Location  | `src/content/en/items/trinkets/`              |
| Extension | `.trinket.mdx`                                |
| Generator | `scripts/metadata/generateTrinketMetadata.ts` |
| API Route | `src/app/api/trinkets/route.ts` (if exposed)  |

## Required Structure

```mdx
# Gore-Hook

Adventuring Gear

A hooked blade on a cord. The cord is 30 ft. long unless stated otherwise.
As a Major Action, you can use it as a melee or thrown weapon. On a hit, the target
takes slashing damage and must succeed on a DC 15 Strength saving throw or
become grappled.

**Damage**: 1d6
**Damage Type**: Slashing
**Properties**: Melee or Thrown, Special (grapple, pull)
**Range**: 10 (melee) / 20 (thrown)
**Weight**: 2 lb.
```

### Type Line

The line immediately after `# Title` is the **item type** — a plain text line
(no italic, no bold) describing the broad category:

```
Adventuring Gear
Simple Weapon
Martial Weapon
Thrown Weapon
Ammunition
Consumable
Pack (contains: ...)
```

This line is not wrapped in `_italics_` — that convention belongs to heirlooms.

### Description Prose

Between the type line and the property lines, write a plain markdown paragraph
describing what the item is, how it is used, and any special rules.

- Keep descriptions mechanical and direct; trinkets are not lore items.
- Special rules (grapple conditions, saving throws, activation costs) go here.
- Do **not** use an `---` divider before the property lines.
- Do **not** add section headers like `## Properties`.

### Property Lines

Properties appear at the end of the file as standalone bold lines. The
parser reads these as `**Key**: value` pairs.

**Standard properties** (include only those that apply):

```mdx
**Damage**: 1d6
**Damage Type**: Slashing
**Properties**: Simple, Light, Thrown
**Range**: 20 / 60
**Weight**: 1 lb.
**Cost**: 1 sp
```

**Do not** use `- **Key**: value` (bullet list format). Trinket properties
are standalone lines, not a list.

**Do not** place a `---` before property lines. The flat structure is intentional.

### Packs and Multi-Item Entries

For equipment packs that contain other items, list contents in the description:

```mdx
# Dungeoneer's Pack

Pack

Includes: backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox,
10 days of rations, waterskin (2 days), 50 ft. hempen rope.

**Weight**: 61.5 lb.
**Cost**: 12 gp
```

## Metadata Fields

Fields extracted by `generateTrinketMetadata.ts` into `.metadata.json`:

| Field         | Source in MDX                                       |
| ------------- | --------------------------------------------------- |
| `slug`        | Filename (kebab-case, no extension)                 |
| `title`       | `# Heading`                                         |
| `type`        | Second line of file (plain text, no markup)         |
| `damage`      | `**Damage**` standalone bold line                   |
| `damageType`  | `**Damage Type**` standalone bold line              |
| `properties`  | `**Properties**` standalone bold line               |
| `range`       | `**Range**` standalone bold line                    |
| `weight`      | `**Weight**` standalone bold line                   |
| `description` | Prose paragraph(s) between type line and properties |
| `tags`        | Extracted from damage type, properties, description |

## Format Rules

| Rule                     | Severity | Description                                    |
| ------------------------ | -------- | ---------------------------------------------- |
| `non-kebab-filename`     | critical | Filename must be kebab-case                    |
| `missing-h1`             | warning  | File must start with `# Title`                 |
| `raw-img-tag`            | critical | Use `<Image>` or `<BlendedImage>`, not `<img>` |
| `unregistered-component` | critical | Only use registered MDX components             |
| `color-literal-in-mdx`   | warning  | No inline hex color values in style attributes |

Trinket files rarely use images or components, so most violations are
filename, heading, or property format issues.

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

Trinket files normally contain **no MDX components**. If a visual aid is
needed (rare), `<Image>` and `<BlendedImage>` are registered. `<TrinketTable>`
is for index pages only.

## Common Pitfalls

- **Bullet list format for properties**: Properties must be standalone bold
  lines (`**Damage**: 1d6`), not a bullet list (`- **Damage**: 1d6`). The
  parser looks for standalone lines.
- **Italic type line**: The type line must be plain text. Do not wrap it in
  `_italics_` (that is the heirloom convention, not trinkets).
- **Section dividers**: Do **not** add `---` between the description and
  properties. Trinkets have no sections.
- **Damage and Damage Type on one line**: These must be on separate lines.
  The parser reads each `**Key**: value` independently.
- **Omitting Weight or Cost**: Include all properties that are meaningful
  for the item. A weapon without `**Range**` is fine; a weapon without
  `**Damage**` will produce incomplete metadata.

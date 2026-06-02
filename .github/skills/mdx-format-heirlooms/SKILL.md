---
name: mdx-format-heirlooms
description: >
  Heirloom format (.heirloom.mdx). Rarity + type lines, images, properties,
  effects, attunement, weapon mastery, metadata (generateHeirloomMetadata.ts),
  health-check rules.
---

# MDX Format: Heirlooms

## Purpose

Formats heirloom item files. Unique/legendary magic items with lore + complex
mechanics.

## When to Use

- Author new `.heirloom.mdx`
- Fix `fullsize-image-path` or `raw-img-tag` violations
- Add/restructure `## Effects` / `## Weapon Properties`
- Debug heirloom parse with `npm run generate-metadata`

## File Information

| Field     | Value                                          |
| --------- | ---------------------------------------------- |
| Location  | `src/content/en/items/heirlooms/`              |
| Extension | `.heirloom.mdx`                                |
| Generator | `scripts/metadata/generateHeirloomMetadata.ts` |
| API Route | `src/app/api/heirlooms/route.ts`               |

## Required Structure

```mdx
# Item Name

<ParallaxBackdrop
  src='/library/images/heirlooms/item-name-bg.webp'
  alt='Item Name background'
/>

<FloatedContainer side='right' width='35%'>
  <Image src='/library/images/heirlooms/item-name.webp' alt='Item Name' />
</FloatedContainer>

_Legendary (requires attunement)_
_Natural Weapon (Melee, Special)_

Flavor or lore text describing the item's history and significance.

> "Optional thematic quote."

---

## Attachment / Acquisition

Special requirements to obtain or attune to the item (if unusual).

---

## Weapon Properties

- **Type:** Natural Weapon (Martial, Melee, Special)
- **Damage:** 1d6 + Strength modifier (force)
- **Range:** Melee (5 ft.)

---

## Effects

- **Effect Name:**
  Description of the effect. May span multiple lines.

- **Second Effect:**
  Description.

---

## Weapon Mastery

- **Mastery Option (Condition):**
  Description of mastery effect.
```

### Rarity and Type Lines

The two italic lines immediately below the image components (or H1 if no image)
carry rarity and item type. Both lines are required for the metadata parser.

```mdx
_Rarity (attunement clause)_
_Item Type (sub-type, optional bonus)_
```

**Rarity values** (case-insensitive): Common, Uncommon, Rare, Very Rare,
Legendary, Artifact, Monstrous Graft, Major Monstrous Graft.

**Attunement clause** examples:

- `(requires attunement)`
- `(requires attunement by a Wizard)`
- `(requires attunement by a creature proficient in heavy armor)`
- _(no clause if the item does not require attunement)_

**Item type examples:**

- `_Wondrous Item_`
- `_Longsword (+2)_`
- `_Heavy Armor (Any, +3)_`
- `_Natural Weapon (Melee, Special)_`

### Image Components

Images are **optional** but encouraged for heirlooms. When present:

| Component            | Use case                                                |
| -------------------- | ------------------------------------------------------- |
| `<ParallaxBackdrop>` | Full-width decorative background (before floated image) |
| `<FloatedContainer>` | Float the main item image right or left                 |
| `<Image>`            | The item illustration inside `<FloatedContainer>`       |
| `<BlendedImage>`     | Alternative: full-width blended artwork                 |
| `<ClearFloats>`      | After floated content to restore normal flow            |

**Always use `/library/` paths, never `/full-size/`.**
**Always provide `alt` text on every image component.**

### Section Naming Conventions

Section headers vary by item type. Use the heading that matches the item:

| Item type     | Properties header      | Notes                           |
| ------------- | ---------------------- | ------------------------------- |
| Weapon        | `## Weapon Properties` | Damage, type, range             |
| Armor         | `## Armor Properties`  | Type, AC bonus, weight          |
| Wondrous item | `## Properties`        | Weight, charges, activation     |
| Graft         | `## Attachment`        | Surgical requirements and steps |

`## Effects` and `## Special Features` are used as needed. `## Weapon Mastery`
is only present when the item grants or modifies weapon mastery.

### Property List Format

Properties inside `##` sections use a **bold label followed by a colon and
value on the same line**. Use a double-space line break after each item when
the value is short, or wrap into a sub-list for complex values.

```mdx
- **Type:** Martial, Melee
- **Damage:** 2d6 + Strength modifier (slashing)
- **Range:** Melee (5 ft.)
- **Weight:** 6 lb.
```

### Effects Format

Each named effect in `## Effects` uses a **bold label on its own bullet**,
followed by a description that may span multiple lines:

```mdx
- **Titan Grip:**
  You can wield Large weapons in this hand without disadvantage.

- **Enhanced Load:**
  Your carrying capacity, lift, and shove limits are doubled.
```

## Metadata Fields

Fields extracted by `generateHeirloomMetadata.ts` into `.metadata.json`:

| Field         | Source in MDX                                        |
| ------------- | ---------------------------------------------------- |
| `slug`        | Filename (kebab-case, no extension)                  |
| `title`       | `# Heading`                                          |
| `rarity`      | First italic line (first word)                       |
| `type`        | Second italic line                                   |
| `attunement`  | Parenthesized clause in first italic line            |
| `weaponType`  | Parsed from type line (Melee/Ranged/Armor/Wondrous)  |
| `hitModifier` | `+N` in type line (e.g., `+3` from `Longsword (+3)`) |
| `properties`  | Bullet list inside `## Weapon Properties`            |
| `range`       | `**Range**` property line                            |
| `mastery`     | `## Weapon Mastery` section content                  |
| `damageTypes` | Parsed from `**Damage**` property line               |
| `charges`     | `**Charges**` property if present                    |
| `effects`     | Bold-labeled bullets in `## Effects`                 |
| `tags`        | Extracted damage types, conditions, and mechanics    |

## Format Rules

| Rule                     | Severity | Description                                        |
| ------------------------ | -------- | -------------------------------------------------- |
| `non-kebab-filename`     | critical | Filename must be kebab-case                        |
| `fullsize-image-path`    | critical | Use `/library/images/` not `/full-size/`           |
| `raw-img-tag`            | critical | Use `<Image>` or `<BlendedImage>`, not `<img>`     |
| `missing-alt-text`       | warning  | All image components need a descriptive `alt` prop |
| `unregistered-component` | critical | Only use registered MDX components                 |
| `missing-h1`             | warning  | File must begin with a `# Title` heading           |
| `color-literal-in-mdx`   | warning  | No inline hex color values in style attributes     |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component            | Usage in Heirloom Files                           |
| -------------------- | ------------------------------------------------- |
| `<BlendedImage>`     | Full-width blended artwork                        |
| `<Image>`            | Item illustration (inside `<FloatedContainer>`)   |
| `<FloatedContainer>` | Float image left or right with `side` and `width` |
| `<ClearFloats>`      | Clear floating layout after image block           |
| `<ParallaxBackdrop>` | Decorative full-width background image            |
| `<HeirloomTable>`    | Used on index pages only, not inside item files   |

## Common Pitfalls

- **Missing rarity line**: The generator reads the first italic line for
  rarity. If it is absent or uses a different format (e.g., `**Legendary**`
  bold instead of `_Legendary_` italic), the field will be missing from
  metadata.
- **Type line without italic**: Both the rarity and type lines must use
  `_italics_`. A plain-text type line will not be parsed.
- **`/full-size/` image path**: The health check flags this as a critical
  violation. Always use `/library/images/heirlooms/name.webp`.
- **Missing `alt` on `<Image>`**: Provide a descriptive alt string even for
  decorative images. Use the item name at minimum.
- **Effects formatted as a paragraph**: Effects should always use the
  `- **Name:** description` bullet format so the generator can extract them
  individually.
- **`<FloatedContainer>` without `<ClearFloats>`**: If you float an image,
  place `<ClearFloats />` after the floated block to prevent layout issues
  in the rendered page.

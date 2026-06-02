---
name: mdx-format-specializations
description: >
  Specialization format (.specialization.mdx). H1 name, optional italic
  subtitle, flavor intro, Collapsible blocks with level-prefixed H2 headings,
  two structural variants (explicit/direct), optional spellcasting + prepared
  lists, metadata (generateSpecializationMetadata.ts), format rules.
---

# MDX Format: Specializations

## Purpose

Formats vocation specialization (subclass) files. Same dir as parent vocation's
`main.mdx`. Separate generator pass.

## When to Use

- Author new `.specialization.mdx`
- Add feature level to existing specialization
- Restructure between "explicit header" / "direct Collapsible" variants
- Debug specialization parse with `npm run generate-metadata`

## File Information

| Field     | Value                                                            |
| --------- | ---------------------------------------------------------------- |
| Location  | `src/content/en/character-creation/vocations/{vocation}/`        |
| Extension | `.specialization.mdx` (required — distinguishes from `main.mdx`) |
| Filename  | `{specialization-slug}.specialization.mdx`                       |
| Generator | `scripts/metadata/generateSpecializationMetadata.ts`             |
| API Route | `src/app/api/specializations/route.ts`                           |

## Two Structural Variants

Both variants are valid. Choose the one that matches the specialization's
complexity and the existing conventions in the vocation directory.

### Variant A — Direct Collapsibles (no explicit section header)

Used for most standard specializations. Features start immediately after
the flavor intro with `<Collapsible>` blocks:

```mdx
# Abjurer

_Shield Companions and Banish Foes_

Your study of magic focuses on spells that block, banish, or protect—ending
harmful effects, banishing evil influences, and shielding allies. Abjurers
are sought when baleful spirits require exorcism.

<Collapsible>
## 3rd Level – Abjuration Savant

Choose two Wizard spells from the Abjuration school of level 2 or lower
and add them to your spellbook for free.

</Collapsible>

<Collapsible>
## 3rd Level – Arcane Ward

When you cast an Abjuration spell using a spell slot, you can weave part
of its magic into a protective ward. The ward lasts until you finish a
Long Rest.

- The ward has Hit Points equal to twice your Wizard level plus your
  Intelligence modifier.

</Collapsible>

<Collapsible>
## 6th Level – Projected Ward

When a creature within 30 feet of you takes damage, you can use your
Reaction to project your Arcane Ward onto them.

</Collapsible>
```

### Variant B — Explicit Section Header

Used when the specialization has a preamble sentence explaining when
features are gained. Includes a `---` divider and `## Specialization Features`:

```mdx
# Order of Incense

Wizards of the Order of Incense blend martial might with arcane power.

---

## Specialization Features

When you select the Order of Incense at 2nd level, you gain the following features.

<Collapsible>
### 2nd Level – Of Iron and Weave

You gain proficiency with hammers and warhammers.

</Collapsible>

<Collapsible>
### 6th Level – Clad in Magic

You can weave your magic into your armor.

</Collapsible>
```

Note that Variant B uses `###` (H3) inside Collapsibles, while Variant A
uses `##` (H2). Maintain whichever heading level the vocation directory uses.

### Choosing Between Variants

| Condition                                             | Use       |
| ----------------------------------------------------- | --------- |
| Standard specialization chosen at level 3+            | Variant A |
| Specialization chosen at an unusual level (e.g., 2nd) | Variant B |
| Existing files in the same directory use A            | Variant A |
| Existing files in the same directory use B            | Variant B |

When in doubt, default to Variant A — it is simpler and more common.

### H1 Title and Subtitle

```mdx
# Specialization Name

_Optional flavor subtitle_
```

The subtitle is an italic line immediately after the H1. It is optional but
common in magical specializations. It should be a short evocative phrase
(not a mechanical description).

### Flavor Intro

1–3 paragraphs of lore describing what makes this specialization distinct.
End before the first `<Collapsible>` (Variant A) or the `---` divider
(Variant B).

### Feature Headings

The heading inside each Collapsible includes the level and feature name:

```
## Nth Level – Feature Name      (Variant A)
### Nth Level – Feature Name     (Variant B)
```

Level prefix format: `Nth Level –` with en-dash (`–` U+2013), followed by
the feature name. Examples: `3rd Level – Abjuration Savant`, `10th Level –
Spell Breaker`, `14th Level – Spell Resistance`.

### Spellcasting Specializations

If the specialization grants spellcasting or an expanded spell list, add
a feature block for it:

```mdx
<Collapsible>
## 3rd Level – Spellcasting

**Spell Slots.** You gain spell slots as shown in the {Specialization} spell
slot table below.

| Level | 1st | 2nd | 3rd | 4th | 5th |
| ----- | --- | --- | --- | --- | --- |
| 3     | 2   | —   | —   | —   | —   |

</Collapsible>
```

### Always-Prepared Spells

If the specialization grants always-prepared spells, list them in a feature
block using internal links:

```mdx
<Collapsible>
## 3rd Level – Devotion Spells

You always have the following spells prepared:

| Level | Spells                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| 3rd   | [_Protection from Evil_](/en/library/spells/protection-from-evil), [_Sacred Flame_](/en/library/spells/sacred-flame) |
| 5th   | [_Aid_](/en/library/spells/aid), [_Spiritual Weapon_](/en/library/spells/spiritual-weapon)                           |

</Collapsible>
```

## Metadata Fields

Fields extracted by `generateSpecializationMetadata.ts` into `.metadata.json`:

| Field                  | Source in MDX                                                       |
| ---------------------- | ------------------------------------------------------------------- |
| `slug`                 | Filename prefix (e.g., `abjurer` from `abjurer.specialization.mdx`) |
| `title`                | `# Heading`                                                         |
| `flavor`               | Intro paragraphs before first `<Collapsible>` or `---`              |
| `vocation`             | Parent directory name (e.g., `wizard`)                              |
| `type`                 | Inferred from vocation or explicit if parseable                     |
| `features`             | Array of `{ level, name, description }` from Collapsibles           |
| `spellcasting`         | `true` if a Spellcasting feature block is present                   |
| `alwaysPreparedSpells` | Array from always-prepared spell table if present                   |
| `tags`                 | Gameplay tags extracted from feature descriptions                   |

## Format Rules

| Rule                     | Severity | Description                                              |
| ------------------------ | -------- | -------------------------------------------------------- |
| `non-kebab-filename`     | critical | Filename prefix must be kebab-case                       |
| `missing-h1`             | warning  | File must start with `# Specialization Name`             |
| `unregistered-component` | critical | Only `<Collapsible>` is expected in specialization files |
| `color-literal-in-mdx`   | warning  | No inline hex colors                                     |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component       | Usage in Specialization Files                        |
| --------------- | ---------------------------------------------------- |
| `<Collapsible>` | Wraps each feature block (required for all features) |

## Common Pitfalls

- **En-dash vs hyphen**: Feature headings require `–` (en-dash U+2013) not
  `-` (hyphen). Copy the en-dash character; do not substitute with `--`.
- **Heading level inconsistency**: Within a single specialization file,
  all feature headings inside Collapsibles must use the same level (`##` or
  `###`). Mixing levels within one file confuses the parser.
- **Flavor prose inside a Collapsible**: All intro/flavor text must be
  outside the Collapsible blocks. The generator uses position to split flavor
  from features.
- **Missing extension**: The file must end in `.specialization.mdx`. A file
  named `abjurer.mdx` in the vocation directory will be treated as content,
  not a specialization, and will not appear in `/api/specializations`.
- **Duplicating content from `main.mdx`**: Do not copy the specialization
  list table from `main.mdx` into the specialization file. Each file is parsed
  independently; duplication causes confusion without benefit.

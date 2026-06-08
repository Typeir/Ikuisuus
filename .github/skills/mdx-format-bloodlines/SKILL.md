---
name: mdx-format-bloodlines
description: >
  Bloodline format (.bloodline.mdx). Lore intro, Core Features tables (ability
  scores, speeds, senses, size, creature types, age), passive features, Boons
  section with Collapsible + BP-cost headings, Tooltip usage, metadata
  (generateBloodlineMetadata.ts), format rules.
---

# MDX Format: Bloodlines

## Purpose

Formats bloodline files. Ancestries/races. Two-part: mechanical Core Features +
purchasable Boons with BP budget.

## When to Use

- Author new `.bloodline.mdx`
- Add/restructure `<Collapsible>` boon blocks
- Fix BP-cost heading format (`###### Name <span>N BP</span>`)
- Debug bloodline parse with `npm run generate-metadata`
- Check Core Features tables render with `<Tooltip>`

## File Information

| Field     | Value                                           |
| --------- | ----------------------------------------------- |
| Location  | `src/content/en/character-creation/bloodlines/` |
| Extension | `.bloodline.mdx`                                |
| Generator | `scripts/metadata/generateBloodlineMetadata.ts` |
| API Route | `src/app/api/bloodlines/route.ts`               |

## Required Structure

```mdx
# Bloodline Name

Lore introduction paragraph(s). Describe the people, their history, and
their place in the world. Two to four paragraphs is typical. Do not include
mechanical information here.

---

## Core Features

| **Ability Scores**                                                    | **Movement Speeds**            | **Senses**                          |
| --------------------------------------------------------------------- | ------------------------------ | ----------------------------------- |
| <ul><li>STR +1</li><li>CON +1</li><li>INT +2</li><li>DEX -1</li></ul> | <ul><li>Walk: 25 ft.</li></ul> | <ul><li>Darkvision 60 ft.</li></ul> |

| **Size**                 | **Creature Types**                   | **Age**                                                                                            |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| <ul><li>Medium</li></ul> | <ul><li>Humanoid (_Pieni_)</li></ul> | <ul><li><Tooltip><span>Centuries</span><span>Full age description here.</span></Tooltip></li></ul> |

### Passive Feature Name

Description of an always-on feature granted by this bloodline.

- Bullet point for sub-rules.
- Another sub-rule.

### Languages

You can speak, read, and write **Common** and **one additional language of
your choice**.

---

## Boons

You have a budget of **10 Boon Points**.

<Collapsible>

###### Boon Name <span>6 BP</span>

Description of what this boon grants.

You gain the following benefits:

- First benefit.
- Second benefit.

_Notes._

> Optional lore quote or clarifying note.

</Collapsible>

<Collapsible>

###### Another Boon <span>4 BP</span>

Description of the second boon.

<Collapsible open>

###### Sub-Option <span>4 BP</span>

A nested option within the parent boon.

</Collapsible>

<Collapsible open>

###### Other Sub-Option <span>2 BP</span>

Another nested option.

</Collapsible>

</Collapsible>
```

### Lore Introduction

The intro section before the first `---` divider is **free-form prose**.

- Write 2–4 paragraphs.
- Describe culture, history, and appearance — not mechanics.
- Do not include game-mechanical text here (ability scores, speeds, etc.).

### Core Features Section

The `## Core Features` section contains exactly **two tables**:

**Table 1 — Ability Scores / Movement / Senses**

Three columns: Ability Scores, Movement Speeds, Senses. Each cell contains a
`<ul><li>` list for consistent rendering. Use `<Tooltip>` to wrap complex
senses with explanatory tooltips.

```mdx
| **Ability Scores** | **Movement Speeds** | **Senses** |
| .... | .... | .... |
| <ul><li>STR +1</li></ul> | <ul><li>Walk: 30 ft.</li></ul> | <ul><li>Normal Vision</li></ul> |
```

**Table 2 — Size / Creature Types / Age**

Three columns: Size, Creature Types, Age. Use `<Tooltip>` for the Age cell
to embed the full age description inside the tooltip:

```mdx
| **Size** | **Creature Types** | **Age** |
| .... | .... | .... |
| <ul><li>Medium</li></ul> | <ul><li>Humanoid</li></ul> | <ul><li><Tooltip><span>Short label</span><span>Full description.</span></Tooltip></li></ul> |
```

### Passive Features

After the two tables, list always-on bloodline features using `###` headings.
These are not boons and do not have BP costs.

Each feature:

- Uses `###` (H3) heading
- Has a plain description paragraph
- May include a bullet list for sub-rules
- Must end before the `---` separator that precedes `## Boons`

### Boons Section

The `## Boons` section always begins with the budget line:

```mdx
You have a budget of **N Boon Points**.
```

Then a series of `<Collapsible>` blocks, one per boon.

**Boon heading format** — always `######` (H6) with the BP cost in a `<span>`:

```mdx
###### Boon Name <span>N BP</span>
```

- The `<span>` must be a sibling text node inside the H6, not wrapped in a
  separate line or component.
- The number before `BP` is the integer cost (no decimal).

**Nested boons** — when a boon has mutually exclusive sub-options, use nested
`<Collapsible open>` blocks for the options:

```mdx
<Collapsible>

###### Parent Boon <span>Variable (choose one)</span>

Pick one of the following:

<Collapsible open>

###### Option A <span>7 BP</span>

...

</Collapsible>

<Collapsible open>

###### Option B <span>5 BP</span>

...

</Collapsible>

</Collapsible>
```

Use `open` on child `<Collapsible>` blocks so sub-options are visible by
default. The outer `<Collapsible>` (without `open`) is collapsed by default.

### Notes Blocks

Lore notes at the end of a boon use an italic `_Notes._` label followed by a
blockquote:

```mdx
_Notes._

> Historical or lore context for the boon.
```

## Metadata Fields

Fields extracted by `generateBloodlineMetadata.ts` into `.metadata.json`:

| Field           | Source in MDX                                                    |
| --------------- | ---------------------------------------------------------------- |
| `slug`          | Filename (kebab-case, no extension)                              |
| `title`         | `# Heading`                                                      |
| `description`   | Lore introduction (first paragraph before `---`)                 |
| `abilityScores` | Parsed from Table 1 Ability Scores `<ul>` list                   |
| `speeds`        | Parsed from Table 1 Movement Speeds `<ul>` list                  |
| `senses`        | Parsed from Table 1 Senses `<ul>` list                           |
| `size`          | Parsed from Table 2 Size `<ul>` list                             |
| `creatureTypes` | Parsed from Table 2 Creature Types `<ul>` list                   |
| `age`           | Parsed from Table 2 Age (tooltip span text)                      |
| `boons`         | Array of `{ name, bpLabel, bpValue, description, tags }` objects |
| `tags`          | Extracted gameplay tags from boon content                        |

## Format Rules

| Rule                     | Severity | Description                                            |
| ------------------------ | -------- | ------------------------------------------------------ |
| `non-kebab-filename`     | critical | Filename must be kebab-case                            |
| `missing-h1`             | warning  | File must start with `# Bloodline Name`                |
| `unregistered-component` | critical | Only `<Collapsible>` and `<Tooltip>` are expected here |
| `color-literal-in-mdx`   | warning  | No inline hex colors                                   |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component       | Usage in Bloodline Files                           |
| --------------- | -------------------------------------------------- |
| `<Collapsible>` | Wraps each boon (and sub-options with `open` prop) |
| `<Tooltip>`     | Wraps complex cell content in Core Features tables |

## Common Pitfalls

- **Wrong heading level for boons**: Boon headings must be `######` (H6).
  Using `###` or `####` will produce incorrect visual hierarchy and break the
  BP-cost parser.
- **Missing `<span>` for BP cost**: The BP cost must be inside a `<span>`
  sibling in the H6, e.g., `###### Name <span>5 BP</span>`. A bare number or
  parenthesized cost `(5 BP)` is not parsed.
- **Passive features inside `<Collapsible>`**: Passive features (always-on)
  must be outside the `## Boons` section. Only purchased options go in
  Collapsibles.
- **No `---` before `## Boons`**: The separator is required to correctly
  delimit the Core Features section from the Boons section in the parser.
- **Core Features tables out of order**: Table 1 (Ability Scores / Speeds /
  Senses) must come before Table 2 (Size / Creature Types / Age). The
  generator reads them positionally.
- **`<Tooltip>` used outside table cells**: Tooltips in Core Features tables
  are idiomatic but should not be sprinkled through boon descriptions. Boon
  prose is rendered in a Collapsible and is already expandable.

---
name: damocles-page-types
description: >
  Canonical MDX page templates for Damocles content types. Structural requirements,
  knowledge-tier formatting, type-specific editorial rules. Load alongside
  damocles-lore for drafting + refactoring.
---

# Damocles Page Type Templates

## Purpose

Canonical structure for each MDX type in Damocles. Use when drafting new pages
or refactoring to match structure.

## When to Use

- Draft new MDX page (any type)
- Refactor existing page to canonical structure
- Audit page structure during lore consistency checks

---

## World / Lore Pages

**Location**: `src/content/en/world/**/*.mdx`

### Structure: Knowledge Tiers (MANDATORY)

All world/lore pages MUST use four-tier structure:

```mdx
# Page Title

## _Common_

Public knowledge. NPC/traveler/commoner level.
Accessible facts, no deep truths revealed.

---

## _Advanced_

Scholar-level. Well-read historian, spy, specialist.
May contain ambiguity or partial truths.

---

## _Deep_

Hidden knowledge. Insiders, cultists, direct experience.
May contradict Common tier.

---

## _Truth_

Actual cosmic causality. Real mechanics, events, entities.
May overturn all previous tiers. Full cosmological precision.
```

### Optional Patterns

**Blockquote summary at top** (Binturia pattern):

```mdx
# Region Name

## _Knowledge tiers_

> ### _Common_
>
> - Bullet point summary of public knowledge
> - Another key fact
> - Cultural identity

---

> ### _Advanced_
>
> - Deeper political facts
> - Hidden affiliations

---

> ### _Deep_
>
> - Secret projects
> - Buried history

---

> ### _Truth_
>
> - The real power structure
> - Cosmological connections
```

After the tiered blockquotes, narrative prose sections expand on each topic:

```mdx
# 1. The Northern Federation of Binturia

Narrative expansion of Common-tier content...

---

## 1.1 Traditions

Detail section...

---

## 1.2 Governance

Detail section...
```

### World Page Rules

- Cross-refs: absolute links `[term](/en/library/world/path)`
- Tiers self-consistent internally
- Truth may contradict others (intentional)
- No filler; if tier empty, keep brief
- Ground in Damocles cosmology, not generic fantasy

---

## Character Pages

**Location**: `src/content/en/world/characters-and-actors/*.mdx`

### Structure

```mdx
# Character Name

_Epithet or title, if earned_

## _Common_

Public reputation and role. What people in the setting know or believe.

---

## _Advanced_

Political connections, hidden affiliations, actual capabilities.

---

## _Deep_

Secret history, true motivations, buried relationships.

---

## _Truth_

Cosmological role, fate-thread connections, actual nature.
```

### Character Page Rules

- Tiered structure matches secrecy level
- Bio grounded: motivations = cosmological/political/personal, never vague
- Flag tier contradictions explicitly (may be intentional)
- NO invented relationships/motivations/history
- Use established naming (Finnic, Gaelic, Hellenic, Romance)

---

## Creature Pages (World Lore)

**Location**: `src/content/en/world/the-creatures-of-damocles/**/*.mdx`

These are lore pages about creature types, NOT stat blocks.

### Structure

```mdx
# Creature Type Name

## _Common_

What travelers and commoners know: appearance, behavior, where they are found, basic dangers.

---

## _Advanced_

Scholar knowledge: origin theories, ecological role, known weaknesses or patterns.

---

## _Deep_

Insider knowledge: true nature, connections to other entities, hidden behaviors.

---

## _Truth_

Cosmological origin: which Age, which god or event created them, their actual metaphysical role.
```

### Creature Lore Page Rules

- NO stat blocks, AC, HP, mechanics (→ .sheet.mdx files)
- NO invented abilities/behaviors/ecology
- Ground origins in Ages sequence + specific events
- Distinguish: what IS vs what people BELIEVE

---

## Region / Location Pages

**Location**: `src/content/en/world/the-lands-of-damocles/**/*.mdx`

### Structure

```mdx
# Region Name

_Optional geographic or cultural descriptor_

## _Common_

Public knowledge: location, climate, what visitors would observe, dominant culture.

---

## _Advanced_

Political structure, hidden tensions, economic realities, less visible factions.

---

## _Deep_

Secret history, buried infrastructure, hidden alliances, suppressed events.

---

## _Truth_

Cosmological significance, true power structures, connections to Ages/gods/events.
```

### Subsections (after tiers, for expanded regions)

```mdx
## Geography

Physical description, notable landmarks, environmental hazards.

## Population and Factions

Who lives here, power groups, cultural divisions.

## History

Key events in chronological order, grounded in Ages.

## Current State

Present-day conditions, ongoing conflicts, recent changes.
```

### Region Page Rules

- Geography ≠ "rolling hills"; be specific, authored
- Reference Damocles: Everdark proximity, Clone World effects, tombsteel, Empyrean ruins
- Population: name cultures, factions, naming traditions
- History: reference Ages sequence

---

## Spell Pages

**Location**: `src/content/en/spells/*.mdx`

### Structure

Follow the existing `mdx-content.instructions.md` format, with Damocles overlay:

```mdx
# Spell Name

Flavor text describing the spell's manifestation, origin, and cost.
Must be grounded in Damocles cosmology — which power grants it,
what it looks like, what it costs. Magic is never casual.

---

> **Spell Name**
>
> _Level School_
>
> **Casting Time**: ...
> **Range**: ...
> **Components**: ...
> **Duration**: ...
>
> Effect description (mechanical, precise, dry).
>
> **At Higher Levels.** ...

#### Spell Lists

List of classes that can use this spell.
```

### Spell Page Rules

- Flavor: Damocles-grounded (force, manifestation, cost)
- Magic NEVER casual; draws from specific source (Arkhé, Väkis, Fold, tombsteel)
- Mechanical = dry + precise, no lore in stat block
- NO generic fantasy magic ("arcane energy flows")
- Name effects after Damocles phenomena

---

## Item / Heirloom Pages

**Location**: `src/content/en/items/heirlooms/*.mdx`

### Structure

Follow the existing `mdx-content.instructions.md` format, with Damocles overlay:

```mdx
# Item Name

<ParallaxBackdrop src='/library/images/item-art.webp' alt='Item Name' />

<FloatedContainer side='left' width='40%'>
  <Image src='/library/images/item-art.webp' alt='Item Name' />
</FloatedContainer>

_Rarity (requires attunement)_

Flavor text establishing origin, cosmological relationship, and cost.
No generic "+X blessed by gods" framing.

## Properties

Mechanical properties (dry, precise).

## Special Features

Named features with specific effects.
```

### Item Page Rules

- Origin specific: who, what, when, why
- Cosmology: power source, Age, entity
- NO generic "blessed by gods" or "ancient magic" — name force
- Mechanical = dry; flavor = controlled, evocative
- Features follow Damocles naming

---

## Mechanics / Rules Pages

**Location**: `src/content/en/rules/**/*.mdx`

### Structure

```mdx
# Rule or System Name

## Overview

Brief description of what this rule governs.

## Mechanics

Precise mechanical definitions. Tables, formulas, conditions.

## Interactions

How this rule interacts with other systems.
```

### Rules Page Rules

- **Dry format ONLY** — no lore in mechanical definitions
- Precision > style; every word meaningful
- Use tables for structured data
- NO flavor text unless clarifies mechanical interaction
- Lore implications → separate world/lore page

---

## Monster Stat Blocks

**Location**: `src/content/en/monsters/*.sheet.mdx`

### Structure

Handled by the existing `mdx-format` skill (`.github/skills/mdx-format/SKILL.md`). The Damocles overlay adds:

### Damocles-Specific Stat Block Rules

- Abilities/traits grounded in cosmology/ecology — no "it just does magic"
- Named abilities = linguistically rooted (not generic)
- Trait description hints at origin (no lore dumps)
- Hiisi abilities reflect primal obsession
- Tombsteel + Everdark effects = mechanically distinct
- Use existing components (`<BlendedImage>`, `<FloatedContainer>`)

---

## Validation Checklist

- [ ] Single H1 title top
- [ ] Knowledge tiers present + correctly formatted (world/character/creature/region)
- [ ] Tiers: `## _Common_` / `## _Advanced_` / `## _Deep_` / `## _Truth_` exact
- [ ] `---` separates major sections
- [ ] Cross-refs = absolute links
- [ ] No banned phrases (anti-generic filter)
- [ ] Proper nouns match naming conventions
- [ ] Lore claims sourced or flagged `[UNCERTAIN]` / `[NEEDS SOURCE]`
- [ ] Mechanical ≠ lore text (separated)
- [ ] File kebab-case `.mdx`

---
name: damocles-page-types
description: >
  Canonical MDX page templates for each Damocles content type. Defines structural
  requirements, knowledge-tier formatting, and type-specific editorial rules.
  Load alongside damocles-lore for drafting and refactoring work.
---

# Damocles Page Type Templates

## Purpose

This skill defines the canonical structure for each MDX content type in the Damocles project. Use it when drafting new pages or refactoring existing ones to ensure structural consistency.

## When to Use

- Drafting a new MDX page (any content type)
- Refactoring an existing page to match canonical structure
- Auditing page structure during lore consistency checks

---

## World / Lore Pages

**Location**: `src/content/en/world/**/*.mdx`

### Mandatory Structure: Knowledge Tiers

All world/lore pages MUST use the four-tier knowledge structure:

```mdx
# Page Title

## _Common_

Public knowledge. What any NPC, traveler, or commoner would know.
Write as accessible facts without revealing deeper truths.

---

## _Advanced_

Scholar-level knowledge. What a well-read historian, spy, or specialist would know.
May contain ambiguity or partial truths.

---

## _Deep_

Hidden knowledge. What only insiders, cult members, or those with direct experience know.
May contradict Common-tier understanding.

---

## _Truth_

Actual cosmic causality. The real mechanics behind events and entities.
May completely overturn all previous tiers. Written with full cosmological precision.
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

- Cross-reference via absolute links: `[term](/en/library/world/path/to/page)`
- Each tier should be self-consistent — a reader at the Common level should not encounter contradictions within that tier
- Truth tier may contradict all others; this is intentional and correct
- Do not pad tiers with filler — if a tier has nothing meaningful, keep it brief
- Ground all claims in Damocles cosmology, not generic fantasy

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

- Tiered structure matches the character's secrecy level
- Biography should be grounded: motivations are cosmological, political, or personal — never vague
- Flag contradictions between tiers explicitly (they may be intentional)
- Do NOT invent relationships, motivations, or history not present in source material
- Named characters must use established naming conventions (Finnic, Gaelic, Hellenic, etc.)

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

- Do NOT include stat blocks, AC, HP, or mechanical values — those live in `.sheet.mdx` files
- Do NOT invent abilities, behaviors, or ecological details not in source material
- Ground creature origins in the Ages sequence and specific cosmological events
- Distinguish between what a creature IS vs. what people BELIEVE it is

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

- Geography should feel specific and authored, not "rolling hills and ancient forests"
- Reference specific Damocles features: Everdark proximity, Clone World effects, tombsteel deposits, Empyrean ruins
- Population descriptions should name specific cultures, factions, and naming traditions
- History must reference the Ages sequence where relevant

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

- Flavor text must be Damocles-grounded: which cosmological force, what manifestation, what cost
- Magic is NEVER casual or "just a thing wizards do" — it draws from specific power sources (Arkhé, Väkis, Fold energy, tombsteel resonance, etc.)
- Mechanical effect text is dry and precise — no lore in the stat block
- Do not use generic fantasy magic language ("arcane energy flows", "mystical runes glow")
- Name spell effects after Damocles phenomena where possible

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

- Origin must be specific: who made it, from what, when, and why
- Cosmological relationship: what power source, what Age, what entity
- No generic "blessed by the gods" or "imbued with ancient magic" — name the specific force
- Mechanical text is dry; flavor text is controlled and evocative
- Named features should follow Damocles naming conventions

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

- **Dry format ONLY** — no lore prose in mechanical definitions
- Precision over style — every word must be mechanically meaningful
- Use tables for structured data
- Do NOT add flavor text unless it clarifies a mechanical interaction
- If a rule has lore implications, those belong on a separate world/lore page

---

## Monster Stat Blocks

**Location**: `src/content/en/monsters/*.sheet.mdx`

### Structure

Handled by the existing `mdx-format` skill (`.github/skills/mdx-format/SKILL.md`). The Damocles overlay adds:

### Damocles-Specific Stat Block Rules

- Abilities and traits must reflect cosmological or ecological grounding — no "it just does magic"
- Named abilities follow Damocles naming conventions (linguistically rooted, not generic)
- Trait descriptions should hint at the creature's origin without becoming lore dumps
- Hiisi abilities should reflect their primal obsession
- Tombsteel weapons and Everdark-adjacent effects should be mechanically distinct
- Use existing MDX components (`<BlendedImage>`, `<FloatedContainer>`) for artwork

---

## Structural Validation Checklist

When auditing any page, verify:

- [ ] Single H1 title at the top
- [ ] Knowledge tiers present and correctly formatted (world/character/creature/region pages)
- [ ] Tiers use `## _Common_` / `## _Advanced_` / `## _Deep_` / `## _Truth_` exactly
- [ ] Horizontal rules (`---`) separate major sections
- [ ] Cross-references use absolute links
- [ ] No banned phrases from the anti-generic filter
- [ ] All proper nouns match established naming conventions
- [ ] Lore claims are sourced or flagged with `[UNCERTAIN]` / `[NEEDS SOURCE]`
- [ ] Mechanical text is separated from lore text
- [ ] File is kebab-case with `.mdx` extension

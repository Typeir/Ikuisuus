---
name: mdx-format-world
description: >
  World lore format (.lore.mdx). Knowledge tiers (Common/Advanced/Deep/Truth),
  flat + blockquote variants, cross-links, no-hallucination, tone, padding rules.
  Load damocles-lore alongside for setting consistency.
---

# MDX Format: World Lore

## Purpose

Formats world lore files. Tiers layer info by accessibility. Setting consistency?
Load `damocles-lore` skill.

## When to Use

- Author new `.lore.mdx`
- Fix missing title or tier violations
- Add tiers to existing page
- Audit cross-reference links
- Run `npm run health:check` + fix world violations

## File Info

| Field | Value |
| --- | --- |
| Location | src/content/en/world/ (nested categories) |
| Ext | .lore.mdx |
| Generator | None (not processed to metadata) |
| Categories | the-lands/, characters/, gods/, creatures/, events/, ages/, structures/, artifacts/ |

## Knowledge Tier System

World lore files use a tiered information architecture. Each tier represents
a different level of in-world accessibility:

| Tier         | Who knows it                                              |
| ------------ | --------------------------------------------------------- |
| `_Common_`   | Any NPC, public record, street gossip                     |
| `_Advanced_` | Educated scholars, well-read adventurers                  |
| `_Deep_`     | Insiders, secret societies, classified records            |
| `_Truth_`    | Actual cosmological causality — may contradict all others |

**All four tiers are expected** for substantial lore pages. Stubs or
work-in-progress files may include fewer tiers with a PAW ignore comment.

### Tier Rules

- Each tier must be **self-contained**: a reader who only has Common-tier
  access should not encounter Advanced-tier facts in Common prose.
- The Truth tier **may and often should** contradict the other tiers. This
  is intentional — the Truth tier reveals what actually happened.
- **No padding**: Every sentence must carry information. Filler phrases
  ("It is worth noting that...", "Interestingly...") are forbidden.
- **No hallucination**: Do not invent named entities, places, or events not
  established elsewhere in the setting. Flag uncertain content with
  `{/* TODO: verify */}` comments.

## Two Structural Variants

### Variant A — Flat Tier Headers (most common)

```mdx
# Borossa

---

## _Common_

**Borossa** is a nation located in the ocean that separates
[Thule](/en/library/world/the-lands-of-damocles/thule) from Anthule.
Most of Borossa's inhabitants are Sunborn, granting them many Thulean enemies.

---

## _Advanced_

**Borossa** is mostly controlled by gangs and mafias playing the part of
peacekeepers. King **Boros the tenth** conceals an ongoing defensive war
against the Brumish Empire from the general populace.

---

## _Deep_

**Amon Grimalkin** is the true father of Cedos the first. **Galán**, the mafia
kingpin, holds immense political power over the king's symbolic position.

---

## _Truth_

**Borossa** was originally built by escapees from the belows, through tunnels
connecting to the Grand City of Thealas. **Joanna** was slain by Boros the
tenth in a mad rage.
```

The `---` before the first tier is optional when the H1 has no subtitle.
Use it for visual clarity.

### Variant B — Blockquote Summary + Expanded Sections

Used for complex regions with many sub-topics. Each tier opens with a
blockquote providing a bullet-point summary, followed by narrative expansion
sections:

```mdx
# Binturia

---

> ### _Common_
>
> - Binturia is a federation of city-states in the southern continent.
> - Known for its merchant guilds and academic institutions.
> - Governed by a rotating council of guild representatives.

---

> ### _Advanced_
>
> - The Archivists secretly control three of the five council seats.
> - The merchant guilds maintain a network of informants.

---

## 1. The Northern Federation

Narrative expansion of Common-tier content. Sub-headings use `##` or `###`
for named sub-topics.

## 1.1 Traditions

Further detail on a specific aspect.
```

### Choosing Between Variants

| Condition                                                  | Use       |
| ---------------------------------------------------------- | --------- |
| Simple entity (character, item, creature)                  | Variant A |
| Complex region with many named sub-locations               | Variant B |
| Page will have detailed narrative sections below the tiers | Variant B |

## Cross-Reference Links

Internal links to other lore pages and rules content use absolute paths:

```mdx
[the poisoned condition](/en/library/rules/steel-and-strife/conditions#poisoned)
[Brume Empire](/en/library/world/the-lands-of-damocles/brume-empire)
[Päivätär](/en/library/world/gods-and-demigods/paivatar)
```

**Rules:**

- Always use `/en/library/` prefix — never `/es/` or `/fi/` hardcoded locales.
- Use anchor fragments (`#slug`) for rules references to specific sections.
- Entity names in links should be in their canonical spelling.
- Use `_italics_` inside the link label for condition names and spell names:
  `[_poisoned_](/en/library/...)`

## Cosmological Content

For pages covering ages, gods, or cosmological events, the tier system maps
to a different axis:

| Tier         | For cosmological pages                        |
| ------------ | --------------------------------------------- |
| `_Common_`   | What mortals believe / myths and religion say |
| `_Advanced_` | What scholars and clerics know                |
| `_Deep_`     | What divine agents or seers know              |
| `_Truth_`    | The actual mechanistic reality of the event   |

Pages like [the-great-tale-of-everything.lore.mdx](src/content/en/world/the-great-tale-of-everything.lore.mdx)
that cover ages chronologically may omit the tier structure and use plain
`## N. Age Name` section headers instead — this is an exception for
canonical cosmological chronicles only.

## PAW Ignore Comments

WIP files that are not yet ready for the health check should include a PAW
ignore comment at the top:

```mdx
{/* paw:gate:content-format:missing-h1 ignore */}
WIP
```

Remove this comment when the file has a proper structure.

## Metadata Fields

World lore files have **no metadata generator**. They are not exposed via
any API route. Their only output is the rendered page.

For cross-referencing lore content programmatically, the `links.json` file
at `scripts/core/links.json` maps entity names to their lore page paths.

## Format Rules

| Rule                    | Severity | Description                                            |
| ----------------------- | -------- | ------------------------------------------------------ |
| `non-kebab-filename`    | critical | Filename must be kebab-case with `.lore.mdx` extension |
| `missing-h1`            | warning  | File must have `# Title` (unless PAW-ignored as WIP)   |
| `multiple-h1`           | warning  | Only one `#` heading per file                          |
| `hardcoded-locale-path` | warning  | Use `/en/` paths; do not hardcode `/es/` or `/fi/`     |
| `raw-img-tag`           | critical | Use `<BlendedImage>` or `<Image>`, not `<img>`         |
| `missing-alt-text`      | warning  | All image components need alt text                     |
| `color-literal-in-mdx`  | warning  | No inline hex color values                             |

See the `mdx-format` skill for the full universal rules table.

## Available MDX Components

| Component            | Usage in World Lore Files              |
| -------------------- | -------------------------------------- |
| `<BlendedImage>`     | Maps, portraits, region art            |
| `<Image>`            | Smaller illustrations                  |
| `<FloatedContainer>` | Float an image alongside lore text     |
| `<ClearFloats>`      | Clear floated layout after image block |

Do not use `<Collapsible>`, `<MonsterTable>`, or other mechanics-oriented
components in lore pages.

## Common Pitfalls

- **Truth tier filler**: The Truth tier is the most commonly padded section.
  Every Truth-tier sentence should reveal a concrete hidden fact — not
  speculate or restate Common knowledge with hedging language.
- **Contradicting Truth without intent**: When you update a lower tier, check
  that the Truth tier still intentionally contradicts it (or update both).
- **Mixing tier content**: Do not put Deep-tier information in the Common
  section "for flavor." Keep tiers strictly separated.
- **Relative links**: Links must use the full `/en/library/...` path. Relative
  links like `../gods-and-demigods/paivatar` will break in locale-prefixed
  routing.
- **Unnamed placeholder entities**: Do not write "a merchant guild" when you
  mean the Courier Guild. If the entity exists in the setting, use its name.
  If you need a new entity, name it — then verify with `damocles-lore` skill.
- **Images with `/full-size/` paths**: Always use `/library/images/` paths.
  The health check flags `/full-size/` references as critical violations.

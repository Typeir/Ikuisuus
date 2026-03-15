---
applyTo: 'src/content/**/*.mdx'
---

# Damocles Authoring Rules

These rules auto-inject when editing any MDX content file. They complement the structural format rules in `mdx-content.instructions.md` with Damocles-specific editorial requirements.

## Before Editing Content

Read `.github/skills/damocles-lore/SKILL.md` for the full cosmology, entity reference, and naming conventions. This is mandatory context for any content change.

## Anti-Generic Filter

Do NOT use these phrases (or close variants) in Damocles content:

- "ancient evil", "mystical realm", "legendary hero", "chosen one"
- "arcane runes" (as placeholder), "mystical energy", "dark lord" (generically)
- "the prophecy foretold", "a power beyond comprehension"
- "the forces of good/evil", "a realm of pure magic"

**Test**: If a sentence could appear unchanged in a Forgotten Realms sourcebook, rewrite it with Damocles-specific cosmology, entities, or geography.

## No-Hallucination Rule

Never silently invent lore. When uncertain:

- `[UNCERTAIN: description]`
- `[NEEDS SOURCE: what]`
- `[POSSIBLE CONTRADICTION: conflict]`

## Knowledge Tiers (World / Character / Creature / Region Pages)

Pages in `src/content/en/world/` MUST use the four-tier structure:

- `## _Common_` — public NPC knowledge
- `## _Advanced_` — scholar/specialist knowledge
- `## _Deep_` — insider/hidden knowledge
- `## _Truth_` — actual cosmic causality

See `.github/skills/damocles-page-types/SKILL.md` for full templates per content type.

## Text Register

- **Lore text**: controlled, evocative, specific. No filler, no vague fantasy language.
- **Mechanical text**: dry, precise, unambiguous. No flavor padding.
- **Never**: quippy, cozy, YA, Marvel-ized, anime-slop, or generic pop-fantasy.

## Structural Format

For MDX structural rules (components, headings, file naming, images), follow `.github/instructions/mdx-content.instructions.md`. The two instruction files are complementary — this one handles editorial tone/lore, the other handles technical format.

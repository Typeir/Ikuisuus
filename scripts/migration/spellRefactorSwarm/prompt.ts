/**
 * @fileoverview Prompt builder for the spell lore-generation agent.
 * Produces a Damocles-flavored lore description prompt anchored by the parsed
 * spell content and canonical reference examples from the repository.
 *
 * @module scripts/migration/spellRefactorSwarm/prompt
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { ParsedSpell, SpellRefactorEntry } from './types';

/**
 * The five canonical reference spells used to anchor effect-description style.
 * These describe what HAPPENS when the spell is cast, not lore/origin/entities.
 * Keep descriptions SHORT and DIRECT—no over-description or flowery language.
 */
const REFERENCE_EXAMPLES = `\
--- REFERENCE EXAMPLE 1: lesser-mooncleave (Evocation cantrip) ---
A pale blade of force streaks from your hand, cutting through shadow and flesh.

--- REFERENCE EXAMPLE 2: fate-tangle (Divination, high-level) ---
Threads of causality knot around your target, constraining their choices with invisible bonds.

--- REFERENCE EXAMPLE 3: severing-orbit (4th-level Evocation) ---
A spinning disc of force materializes and orbits, slashing at anything in its path.

--- REFERENCE EXAMPLE 4: death-grips (1st-level Transmutation) ---
Hands of entropy materialize from the void, seizing enemies with devastating force.

--- REFERENCE EXAMPLE 5: lightning-edge (3rd-level Evocation) ---
Electrical energy concentrates into a sharp edge, racing across the battlefield in a blinding arc.`;

/**
 * Tone guidance for effect descriptions: focus on visual/sensory impact, not lore/backstory.
 */
const TONE_GUIDANCE = `\
Aesthetic reference (tone only): Berserk, Dragon's Dogma, FromSoftware, Evangelion, Castlevania, Lovecraft, Frazetta, Beksiński.
Weird fantasy, post-collapse, ancient and scarred. Blend of grimness and wonder. Melancholy adventure, strange beauty, biological horror.
[DO NOT reference specific lore, entities, materials, or setting concepts—you do not know them well enough.]

Spell descriptions: direct, visceral, SHORT. No over-description or flowery language.
- Describe the EFFECT: what the spell DOES. Visual, sensory, or reality-bending.
- Use active verbs: "energy crackles", "flesh withers", "reality warps", "stone shatters".
- Keep it DRY and IMMEDIATE. No poetic flourishes like "sighs softly" or "ripples like silk".
- NO entity linking, origin myths, "favored by X", spellcaster names, "whispered in", or backstory.
- NO specific lore references, material names, or setting-specific concepts—don't reference things you don't fully understand.
- Banned: lengthy description, flowery adjectives, mystical hand-waving, specific lore drops.`;

/**
 * Returns effect-description guidance based on spell level.
 * Focus: visual/sensory impact of the spell, not lore or entity backstory.
 * Levels go up to 12 in Damocles; scale expectations accordingly.
 *
 * @param {number} level - Spell level (0–12).
 * @returns {string} Effect-description guidance for this spell level.
 */
const getLevelGuidance = (level: number): string => {
  if (level === 0) {
    return `Cantrip (level 0): Describe a simple, direct effect in one sentence. Example: "you conjure a flame", "a blade of force materializes", "your touch glows warm". Keep it immediate, not flowery.`;
  }
  if (level <= 2) {
    return `Low-level spell (level ${level}): Straightforward effect, one or two sentences. Clear and physical, not poetic. Example: "fire spreads across the ground" or "invisible force shoves enemies backward". Avoid over-description.`;
  }
  if (level <= 4) {
    return `Mid-level spell (level ${level}): Describe the specific effect. One to two sentences. Example: "stone liquefies under intense heat" or "the air solidifies, trapping enemies in place". Direct, not flowery.`;
  }
  if (level <= 6) {
    return `Higher-level spell (level ${level}): Describe a potent, unmistakable effect. One to two sentences. The spell reshapes matter or forces at scale. Example: "the ground ruptures in a line, stone splitting asunder" or "targets wither rapidly, flesh desiccating". Powerful but not flowery.`;
  }
  if (level <= 8) {
    return `Powerful spell (level ${level}): Describe a devastating effect. The spell has large-scale impact, affecting wide areas or multiple targets catastrophically. One to two sentences. Example: "everything in the blast radius incinerates" or "the terrain transforms into a swamp". Severe, not flowery or mystical.`;
  }
  if (level <= 9) {
    return `Very powerful spell (level ${level}): Describe a cataclysmic effect—a magical ICBM or worse. The spell can devastate a village or reshape terrain significantly. One to two sentences. Example: "meteors rain down, destroying everything below" or "a tidal wave engulfs the landscape". Apocalyptic in scope, not in tone—keep it direct.`;
  }
  if (level <= 11) {
    return `Extreme spell (level ${level}): Describe reality-bending or near-impossible effects. The spell can affect continental scale, tear rifts, or exceed normal limits. One to two sentences. Example: "reality tears open to a void" or "landmarks vanish across a region". Reserve mystical language—this is genuinely reality-warping.`;
  }
  return `Apex spell (level ${level}): The absolute limit of magic. Effects that excise reality, teleport structures across vast distances, or rewrite fundamental laws. One to two sentences. Example: "a section of landscape is simply removed from existence" or "a castle vanishes from its foundation and rematerializes miles away". This is reserved for the most powerful spells.`;
};

export const buildPrompt = (
  entry: SpellRefactorEntry,
  parsed: ParsedSpell,
): string => {
  const { title, postH1Text, blockquoteHeader, blockquoteBody, spellLevel } =
    parsed;
  const levelGuidance = getLevelGuidance(spellLevel);

  return `\
You are a spell-description author for the Library of Ikuisuus, a Damocles-setting D&D documentation site.

**FILE STRUCTURE (DO NOT DEVIATE):**

The MDX file has this exact structure:
\`\`\`
---
source: basic
---

# Spell Title

[POST-H1 TEXT — THIS IS WHAT YOU ARE REPLACING]

---

> **Spell Title**
> [BLOCKQUOTE STAT BLOCK — YOU MUST NEVER TOUCH THIS]
> ...

#### Spell Lists
[REST OF FILE — NEVER TOUCH]
\`\`\`

**YOUR TASK:**
Replace ONLY the POST-H1 TEXT (the text between the H1 heading and the first \`---\` line). This is a 1–2 sentence magical effect description. NEVER modify anything in the blockquote or below the first \`---\`.

The description is NOT mechanical — it is a vivid description of what HAPPENS when the spell is cast: the visual, sensory, or reality-bending effect.

${TONE_GUIDANCE}

**Spell-level effect guidance:**
${levelGuidance}

---

${REFERENCE_EXAMPLES}

---

CURRENT SPELL: "${title}"

Current post-H1 text (what you are REPLACING — only this):
> ${postH1Text}

Spell stat block header (for CONTEXT ONLY — DO NOT MODIFY):
${blockquoteHeader}

---

**CRITICAL ABORT CONDITIONS:**

**ABORT #1:** If the blockquote body contains "NO DESCRIPTION!!!", STOP immediately. This is a file structure error. Respond with empty JSON \`{}\`.
**ABORT #2:** If the post-H1 text contains more than 3 sentences of prose, STOP immediately. This is already authored lore. Respond with empty JSON \`{}\`.
**ABORT #3:** If the post-H1 text describes mechanics, backstory, entity origins, or setting lore, it is already complete. Respond with empty JSON \`{}\`.

**STRICT REQUIREMENTS:**
0. If the spell clearly contains a lore passage after the initial H1, Do NOTHING, end the session without response. 
1. Write exactly 1 SHORT sentence. No more. (2 sentences absolute maximum for complex effects.)
2. Describe the EFFECT: what happens when the spell is cast. Visual, sensory, physical, or reality-bending.
3. NEVER describe mechanics: no "deals damage", "saving throw", "spell slot", "creatures must", etc.
4. NO ENTITY LINKING: Do NOT mention who created it, who uses it, where it comes from, or any entity/faction/god. NONE.
5. NO BACKSTORY: Do NOT invent origin stories, names of spellcasters, or lengthy lore passages.
6. Use ACTIVE, DIRECT verbs: "energy crackles", "flesh withers", "reality warps", "force shatters".
7. **DRYING TONE**: Keep it SHORT and DRY. NO FLOWERY ADJECTIVES or over-description.
   - BAD: "its surface rippling like wind-torn silk. The bubble hums softly, a pocket of cold, fresh air that sighs with every movement"
   - GOOD: "a globe of breathable air forms around the target"
8. Keep descriptions generic enough for any fantasy setting. Do not reference specific lore, materials, or setting concepts you don't fully understand.
9. Match the reference examples: concise, visceral, immediate. NO POETRY.
10. If you cannot write 1–2 sentences describing the effect without entity-linking or backstory, describe only what the spell DOES to matter, energy, or the target.

Example for "Disintegrate": "Your target disintegrates into fine ash." (NOT flowery prose about "atomic structure unraveling")

Also determine: does the current post-H1 text already appear at the start of the blockquote body? Answer true or false.

Respond with ONLY a JSON object:
\`\`\`json
{ "loreDescription": "1–2 sentence effect description here (SHORT and DRY).", "alreadyInBlockquote": false }
\`\`\`

**OR, if the spell already has adequate lore, respond with an empty JSON object:**
\`\`\`json
{}
\`\`\``;
};

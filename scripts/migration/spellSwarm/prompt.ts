/**
 * @fileoverview Prompt builder for the spell reproduction agent.
 * Produces a verbatim-SRD reproduction prompt anchored by structured metadata.
 *
 * @module scripts/migration/spellSwarm/prompt
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    formatComponents,
    formatDuration,
    formatLevelSchool,
    formatSpellLists,
} from './formatters';
import type { SpellEntry } from './types';

/**
 * Builds the full reproduction prompt for a GPT-4.1 agent.
 *
 * The prompt instructs the agent to recall and reproduce the SRD 5.1 spell text
 * verbatim (OGL content). Damocles flavoring is explicitly forbidden.
 * The agent returns a single JSON object with an `mdxContent` field.
 *
 * @param {SpellEntry} entry - The spell entry to reproduce.
 * @returns {string} Complete prompt string.
 */
export const buildPrompt = (entry: SpellEntry): string => {
  const components = formatComponents(entry);
  const levelSchool = formatLevelSchool(entry);
  const duration = formatDuration(entry);
  const spellListsSection = formatSpellLists(entry);

  return `\
You are a content reproduction agent for the Library of Ikuisuus.

Your task is to reproduce the SRD 5.1 spell "${entry.title}" VERBATIM from the \
Systems Reference Document 5.1, published under the Open Game License (OGL) by \
Wizards of the Coast.

This is an OGL reproduction task. You MUST:
- Reproduce the spell description EXACTLY as it appears in the SRD 5.1.
- Reproduce the "At Higher Levels" clause EXACTLY if the spell has one.
- Use the exact wording, sentence structure, and mechanical language from the SRD.
- NOT adapt the flavor text to the Damocles setting. Do not replace any SRD language \
with Damocles-specific cosmology, entities, or geography.
- NOT paraphrase or summarize. This is a verbatim reproduction.

Spell metadata (use to verify your output):
- Title: ${entry.title}
- Level: ${entry.level === 0 ? 'Cantrip' : `${entry.level}`}
- School: ${entry.school}
- Casting Time: ${entry.castingTimeRaw}
- Range: ${entry.range}
- Components: ${components}
- Duration: ${duration}
- Ritual: ${entry.hasRitual ? 'Yes' : 'No'}
- Concentration: ${entry.concentration ? 'Yes' : 'No'}

Required MDX format:
\`\`\`
---
source: basic
---

# ${entry.title}

{First sentence or introductory description from the SRD — verbatim}

---

> **${entry.title}**
> ${levelSchool}
> **Casting Time**: ${entry.castingTimeRaw}
> **Range**: ${entry.range}
> **Components**: ${components}
> **Duration**: ${duration}
>
> {Full SRD spell body — verbatim, including all sub-paragraphs and tables}
>
> **At Higher Levels.** {Verbatim text} (omit entirely if not applicable)
\`\`\`${spellListsSection}

Respond with ONLY a JSON object. No prose before or after it.
\`\`\`json
{ "mdxContent": "full MDX content here" }
\`\`\``;
};

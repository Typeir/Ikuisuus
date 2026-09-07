/**
 * @fileoverview Vocation spellcasting and feature-range parsers.
 * @description Detects spellcasting ability and progression, reads
 * specialization slugs and archetypes, and locates feature heading blocks.
 *
 * @module scripts/metadata/vocationSpellcasting
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { CASTING, FEATURE, TABLE } from './vocationPatterns';

/**
 * Detects spellcasting ability from the Spellcasting feature collapsible block.
 *
 * @param {string} raw - Full MDX file content
 * @returns {string | null} Spellcasting ability name or null
 */
function parseSpellcastingAbility(raw: string): string | null {
  const abilityPatterns = [
    CASTING.abilityBold,
    CASTING.abilityIs,
    CASTING.abilityReversed,
    CASTING.modifierRef,
    CASTING.dcModifier,
  ];

  const spellcastingSection = raw.match(CASTING.section);
  const searchText = spellcastingSection ? spellcastingSection[0] : raw;

  for (const pattern of abilityPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const ability = match[1];
      const abilities = [
        'Strength',
        'Dexterity',
        'Constitution',
        'Intelligence',
        'Wisdom',
        'Charisma',
      ];
      const found = abilities.find(
        (a) => a.toLowerCase() === ability.toLowerCase(),
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Classifies spellcasting progression based on table headers.
 *
 * @param {string[]} headers - Feature table headers
 * @param {string} raw - Full MDX file content
 * @returns {string | null} Progression type: "Full" | "Half" | "Third" | "Pact" | null
 */
function classifyProgression(headers: string[], raw: string): string | null {
  if (CASTING.pactMagic.test(raw)) return 'Pact';

  const slotHeaders = headers.filter((h) => TABLE.spellSlotColumn.test(h));
  if (slotHeaders.length === 0) return null;

  const has9th = slotHeaders.some((h) => h.includes('9th'));
  const has5th = slotHeaders.some((h) => h.includes('5th'));

  if (has9th) return 'Full';
  if (has5th) return 'Half';
  return 'Third';
}

/**
 * Extracts specialization slugs from the specialization table links.
 *
 * @param {string} raw - Full MDX file content
 * @returns {string[]} Array of specialization slugs
 */
function parseSpecializations(raw: string): string[] {
  const slugs: string[] = [];
  const matches = raw.matchAll(new RegExp(FEATURE.specializationLink, 'g'));
  for (const match of matches) {
    slugs.push(match[1]);
  }
  return slugs;
}

/**
 * Determines the archetype from the spellcasting progression.
 *
 * @param {string | null} progression - Spellcasting progression or null
 * @returns {string} Archetype label
 */
function classifyArchetype(progression: string | null): string {
  if (!progression) return 'Martial';
  if (progression === 'Full') return 'Full Caster';
  if (progression === 'Half') return 'Half Caster';
  if (progression === 'Pact') return 'Pact Caster';
  return 'Third Caster';
}

/**
 * Scans MDX lines for a heading matching `featureName` and returns the 1-indexed
 * start and end lines of its heading block (up to the next equal-or-higher heading).
 *
 * @param {string[]} lines - MDX file split by newline
 * @param {string} featureName - Feature display name to search for
 * @returns {{ startLine: number; endLine: number; heading: string } | null} Line range and the raw heading text (level prefix kept, bold stripped), or null if not found
 */
function findFeatureLineRange(
  lines: string[],
  featureName: string,
): { startLine: number; endLine: number; heading: string } | null {
  const target = featureName.replace(/\*\*/g, '').trim().toLowerCase();
  let startIdx = -1;
  let headingLevel = 0;
  let heading = '';

  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (!m) continue;
    const headingText = m[2].replace(/\*\*/g, '').trim().toLowerCase();
    const stripped = headingText
      .replace(/^\d+(?:st|nd|rd|th)?\s+level\b\s*[-–—:]?\s*/i, '')
      .trim();
    if (headingText === target || stripped === target) {
      startIdx = i;
      headingLevel = m[1].length;
      heading = m[2].replace(/\*\*/g, '').trim();
      break;
    }
  }

  if (startIdx < 0) return null;

  let endIdx = lines.length - 1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const m = /^(#{1,6})\s+/.exec(lines[i]);
    if (m && m[1].length <= headingLevel) {
      endIdx = i - 1;
      break;
    }
  }

  while (endIdx > startIdx && lines[endIdx].trim() === '') {
    endIdx--;
  }

  return { startLine: startIdx + 1, endLine: endIdx + 1, heading };
}

export { classifyArchetype, classifyProgression, findFeatureLineRange, parseSpecializations, parseSpellcastingAbility };

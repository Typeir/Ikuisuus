/**
 * @fileoverview Specialization content parsers.
 * @description Parses level-heading features, always-prepared spell tables and
 * specialization spellcasting out of `.specialization.mdx` sources.
 *
 * @module scripts/metadata/specializationParsers
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { clean } from './textUtils';
import { LIST, TEXT, UTILITY } from './parsingPatterns';
import { CASTING, FEATURE, TABLE } from './vocationPatterns';

/**
 * Parses features from level-heading lines, capturing their 1-indexed start and
 * end line numbers within the MDX file.
 *
 * @param {string} raw - Full MDX file content
 * @returns {Array<{ level: number; name: string; heading: string; startLine: number; endLine: number }>} Feature entries with the raw heading text and line ranges
 */
export function parseFeatures(
  raw: string,
): Array<{ level: number; name: string; heading: string; startLine: number; endLine: number }> {
  const features: Array<{
    level: number;
    name: string;
    heading: string;
    startLine: number;
    endLine: number;
  }> = [];
  const lines = raw.split('\n');
  const pattern = new RegExp(FEATURE.levelHeading.source);

  for (let i = 0; i < lines.length; i++) {
    const match = pattern.exec(lines[i]);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const name = clean(match[2].trim());
    if (isNaN(level) || !name) continue;

    const headingLevel = (/^(#+)/.exec(lines[i]) ?? ['', '##'])[1].length;
    let endIdx = lines.length - 1;
    for (let j = i + 1; j < lines.length; j++) {
      const hm = /^(#{1,6})\s+/.exec(lines[j]);
      if (hm && hm[1].length <= headingLevel) {
        endIdx = j - 1;
        break;
      }
    }
    while (endIdx > i && !lines[endIdx]?.trim()) endIdx--;

    const heading = lines[i].replace(/^#+\s+/, '').replace(/\*\*/g, '').trim();
    features.push({ level, name, heading, startLine: i + 1, endLine: endIdx + 1 });
  }

  return features;
}

/**
 * Parses always-prepared spell tables (e.g. Domain spells, Oath spells).
 *
 * @param {string} raw - Full MDX file content
 * @returns {Array<{ level: number; spells: string[] }> | undefined} Spell entries or undefined
 */
export function parseAlwaysPreparedSpells(
  raw: string,
): Array<{ level: number; spells: string[] }> | undefined {
  if (!CASTING.alwaysPrepared.test(raw)) return undefined;

  const lines = raw.split(TEXT.lineSplit);
  const entries: Array<{ level: number; spells: string[] }> = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    if (!inTable) {
      if (
        TABLE.classLevelHeader.test(line) ||
        TABLE.levelSpellsHeader.test(line)
      ) {
        inTable = true;
        continue;
      }
    }

    if (inTable && TABLE.separator.test(line)) {
      headerSeen = true;
      continue;
    }

    if (inTable && headerSeen && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length >= 2) {
        const levelMatch = cells[0].match(UTILITY.numericExtract);
        if (!levelMatch) continue;
        const level = parseInt(levelMatch[1], 10);

        const spellCell = cells[1];
        const spells = spellCell
          .replace(TABLE.markdownLink, '$1')
          .split(LIST.commaSplit)
          .map((s) => s.trim())
          .filter(Boolean);

        if (spells.length > 0) {
          entries.push({ level, spells });
        }
      }
    } else if (inTable && headerSeen && !line.startsWith('|')) {
      break;
    }
  }

  return entries.length > 0 ? entries : undefined;
}

/**
 * Detects specialization-specific spellcasting from a dedicated table.
 *
 * @param {string} raw - Full MDX file content
 * @returns {{ ability: string; progression: string } | undefined}
 */
export function parseSpecializationSpellcasting(
  raw: string,
): { ability: string; progression: string } | undefined {
  if (!CASTING.specHeading.test(raw)) return undefined;

  const lines = raw.split(TEXT.lineSplit);
  let hasSlotTable = false;
  let maxSlotLevel = 0;

  for (const line of lines) {
    if (TABLE.classLevelHeader.test(line)) {
      const headers = line.split('|').map((c) => c.trim());
      for (const h of headers) {
        const match = h.match(TABLE.slotLevel);
        if (match) {
          hasSlotTable = true;
          const level = parseInt(match[1], 10);
          if (level > maxSlotLevel) maxSlotLevel = level;
        }
      }
    }
  }

  if (!hasSlotTable) return undefined;

  const abilityPatterns = [
    CASTING.abilityIs,
    CASTING.abilityReversed,
    CASTING.modifierRef,
  ];

  const abilities = [
    'Strength',
    'Dexterity',
    'Constitution',
    'Intelligence',
    'Wisdom',
    'Charisma',
  ];

  let ability = 'Intelligence';
  for (const pattern of abilityPatterns) {
    const match = raw.match(pattern);
    if (match) {
      const found = abilities.find(
        (a) => a.toLowerCase() === match[1].toLowerCase(),
      );
      if (found) {
        ability = found;
        break;
      }
    }
  }

  let progression = 'Third';
  if (maxSlotLevel >= 9) progression = 'Full';
  else if (maxSlotLevel >= 5) progression = 'Half';

  return { ability, progression };
}

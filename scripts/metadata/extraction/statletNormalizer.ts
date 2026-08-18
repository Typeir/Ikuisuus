/**
 * @fileoverview Normalize quoted statlets to heading-bullet grammar.
 * @description Rewrite three grammar styles to `## Section` + `- **Name.** body`; preserve line count.
 *
 * @module scripts/metadata/extraction/statletNormalizer
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Bold labels that are stat lines, never features.
 */
const STAT_LINE_LABELS = new Set(
  [
    'Size',
    'Material',
    'Resistances',
    'Vulnerabilities',
    'Immunities',
    'Damage Resistances',
    'Damage Immunities',
    'Damage Vulnerabilities',
    'Condition Immunities',
    'Senses',
    'Languages',
    'Saving Throws',
    'Skills',
    'Tier Bonus',
    'Challenge',
    'Speed',
    'Hit',
  ].map((l) => l.toLowerCase()),
);

/**
 * Group prefixes on a feature label that switch the open section.
 */
const GROUP_PREFIX =
  /^(Traits?|Actions?|Minor Actions?|Reactions?|Legendary Actions?)\s*[—–-]\s*/i;

const HEADING = /^(#{2,5})\s+\*{0,2}(.+?)\*{0,2}\s*$/;
const BULLET_LABEL = /^\s*[-*]\s+\*\*([^*]+?)\.?\*\*(:?)\s*(.*)$/;
const BARE_LABEL = /^\*\*([^*]+?)\.?\*\*(?!:)\s*(.*)$/;
const COLON_LABEL = /^\*\*([^*]+?)\*\*:\s*(.*)$/;

/**
 * Whether a bold label names a stat line rather than a feature.
 *
 * @param {string} label - Bold label text
 * @returns {boolean} True for stat lines
 */
function isStatLine(label: string): boolean {
  return STAT_LINE_LABELS.has(label.trim().replace(/:$/, '').toLowerCase());
}

/**
 * Section heading for a group prefix.
 *
 * @param {string} prefix - Matched group word
 * @returns {string} Heading text
 */
function sectionFor(prefix: string): string {
  const p = prefix.toLowerCase();
  if (p.startsWith('minor')) return 'Minor Actions';
  if (p.startsWith('reaction')) return 'Reactions';
  if (p.startsWith('legendary')) return 'Legendary Actions';
  if (p.startsWith('action')) return 'Actions';
  return 'Traits';
}

/**
 * Normalizes the statlet lines in `[start, end)` in place. Line count is
 * preserved: an implicit `## Traits` heading is written over the blank line
 * preceding the first feature; when no blank line exists the section is left
 * implicit and the caller's classifier ignores those features.
 *
 * @param {string[]} lines - De-quoted file lines (mutated)
 * @param {number} start - First statlet line
 * @param {number} end - Exclusive end
 */
export function normalizeStatlet(
  lines: string[],
  start: number,
  end: number,
): void {
  let sectionOpen = false;
  let lastBlank = -1;
  let titleSeen = false;

  for (let i = start; i < end; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      lastBlank = i;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      /* The first heading is the statlet's title (the record anchor), not a
         feature section; leave it at its level so the classifier ignores it. */
      if (!titleSeen) {
        titleSeen = true;
        lines[i] = '';
        continue;
      }
      lines[i] = `## ${heading[2]}`;
      sectionOpen = true;
      continue;
    }

    let label: string | null = null;
    let body = '';
    const bullet = line.match(BULLET_LABEL);
    const bare = !bullet ? line.match(BARE_LABEL) : null;
    const colon = !bullet && !bare ? line.match(COLON_LABEL) : null;

    if (bullet) {
      label = bullet[1];
      body = bullet[3];
    } else if (bare) {
      label = bare[1];
      body = bare[2];
    } else if (colon && sectionOpen) {
      label = colon[1];
      body = colon[2];
    }

    if (label === null || isStatLine(label)) continue;

    const group = label.match(GROUP_PREFIX);
    if (group) {
      label = label.slice(group[0].length);
      const heading = sectionFor(group[1]);
      if (lastBlank > start && lastBlank < i) {
        lines[lastBlank] = `## ${heading}`;
        sectionOpen = true;
      }
    } else if (!sectionOpen && lastBlank > start && lastBlank < i) {
      lines[lastBlank] = '## Traits';
      sectionOpen = true;
    }

    lines[i] = `- **${label.trim()}.** ${body}`.trimEnd();
    lastBlank = -1;
  }
}

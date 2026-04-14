/**
 * @fileoverview Monster Section Classifier
 * @description Classifies sections of monster `.sheet.mdx` files by heading
 * text into semantic categories. Heading-level-agnostic — matches on section
 * NAME patterns, not heading depth. Splits raw MDX lines into classified
 * Section objects for downstream extraction.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/monsterSectionClassifier
 */

import { TEXT } from '../parsingPatterns';
import { CLASSIFIER } from './featurePatterns';

/**
 * Semantic category for a monster stat block section.
 *
 * @typedef {'traits' | 'actions' | 'bonus_actions' | 'reactions' | 'deed_act' | 'deed_stratagem' | 'deed_lair' | 'deed_phase' | 'spellcasting' | 'condition' | 'bloodrage' | 'unknown'} SectionType
 */
export type SectionType =
  | 'traits'
  | 'actions'
  | 'bonus_actions'
  | 'reactions'
  | 'deed_act'
  | 'deed_stratagem'
  | 'deed_lair'
  | 'deed_phase'
  | 'spellcasting'
  | 'condition'
  | 'bloodrage'
  | 'unknown';

/**
 * A classified section of a monster stat block.
 *
 * @interface MonsterSection
 * @property {SectionType} type - Semantic category
 * @property {string} heading - Raw heading text
 * @property {number} startLine - 0-based start line index in source
 * @property {number} endLine - 0-based exclusive end line index
 * @property {string[]} lines - Content lines (excluding the heading itself)
 */
export interface MonsterSection {
  type: SectionType;
  heading: string;
  startLine: number;
  endLine: number;
  lines: string[];
}

/**
 * Ordered classification rules. First match wins. Patterns are tested against
 * the stripped heading text (markdown removed).
 */
const SECTION_RULES: { pattern: RegExp; type: SectionType }[] = [
  { pattern: CLASSIFIER.deedAct, type: 'deed_act' },
  { pattern: CLASSIFIER.deedStratagem, type: 'deed_stratagem' },
  { pattern: CLASSIFIER.deedLair, type: 'deed_lair' },
  { pattern: CLASSIFIER.deedPhase, type: 'deed_phase' },
  { pattern: CLASSIFIER.spellcasting, type: 'spellcasting' },
  { pattern: CLASSIFIER.condition, type: 'condition' },
  { pattern: CLASSIFIER.bloodrage, type: 'bloodrage' },
  { pattern: CLASSIFIER.bonusActions, type: 'bonus_actions' },
  { pattern: CLASSIFIER.reactions, type: 'reactions' },
  { pattern: CLASSIFIER.actions, type: 'actions' },
  { pattern: CLASSIFIER.traits, type: 'traits' },
];

const HEADING_REGEX = CLASSIFIER.heading;

/**
 * Strips bold/italic markdown from heading text.
 *
 * @param {string} raw - Raw heading text after `#` symbols
 * @returns {string} Cleaned heading text
 */
function stripHeadingMarkdown(raw: string): string {
  return raw.replace(TEXT.boldStrip, '').replace(TEXT.underscore, '').trim();
}

/**
 * Classifies a heading string into a SectionType.
 *
 * @param {string} heading - Cleaned heading text
 * @returns {SectionType} Classified section type
 */
export function classifyHeading(heading: string): SectionType {
  const clean = stripHeadingMarkdown(heading);
  for (const rule of SECTION_RULES) {
    if (rule.pattern.test(clean)) return rule.type;
  }
  return 'unknown';
}

/**
 * Determines whether a heading starts a top-level section boundary.
 * Only headings at level 2 or 3 (or bold-formatted equivalents) act as
 * section boundaries. Deeper headings (H4+) are sub-headings within sections.
 *
 * @param {string} line - Raw markdown line
 * @returns {{ level: number; text: string } | null} Heading info or null
 */
export function parseSectionHeading(
  line: string,
): { level: number; text: string } | null {
  const match = line.match(HEADING_REGEX);
  if (!match) return null;
  const level = match[1].length;
  if (level < 2 || level > 3) return null;
  return { level, text: match[2] };
}

/**
 * Splits raw MDX lines into classified MonsterSection objects.
 * Lines before the first section heading are discarded (stat header area).
 * Horizontal rules (`---`) within a section are preserved as content.
 *
 * @param {string[]} lines - All lines of the monster file
 * @param {number} [offset=0] - Line offset for multi-block files
 * @returns {MonsterSection[]} Ordered array of classified sections
 */
export function classifySections(
  lines: string[],
  offset = 0,
): MonsterSection[] {
  const sections: MonsterSection[] = [];
  let current: {
    type: SectionType;
    heading: string;
    startLine: number;
    lines: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const heading = parseSectionHeading(lines[i]);
    if (heading) {
      if (current) {
        sections.push({
          ...current,
          endLine: i + offset,
        });
      }
      current = {
        type: classifyHeading(heading.text),
        heading: heading.text,
        startLine: i + offset,
        lines: [],
      };
      continue;
    }
    if (current) {
      current.lines.push(lines[i]);
    }
  }

  if (current) {
    sections.push({
      ...current,
      endLine: lines.length + offset,
    });
  }

  return sections;
}

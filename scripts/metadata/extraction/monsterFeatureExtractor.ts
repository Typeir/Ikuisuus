/**
 * @fileoverview Monster Feature Extractor
 * @description Extracts MonsterFeature records from classified monster
 * sections.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/monsterFeatureExtractor
 */

import type { MonsterFeature } from '@/lib/types/feature';
import { plain } from '../textUtils';
import {
  DAMAGE_TYPES,
  DURATION,
  ENRICHMENT,
  MONSTER,
  SECTIONS,
  SPELLCASTING,
} from './featurePatterns';
import { recognizeRange, recognizeSave } from './featureTokens';
import { extractMultiattack } from './monsterMultiattackExtractor';
import type { MonsterSection } from './monsterSectionClassifier';
import {
  recognizeAttackLine,
  recognizeAutoFail,
  recognizeChargeRecharge,
  recognizeHitLine,
} from './monsterTokens';

/**
 * Matches the tag a heading carries at its end, which names what kind of block
 * it is rather than forming part of its own name.
 */
const HEADING_TAG = /\s*<span\b[^>]*>[\s\S]*?<\/span>\s*$/i;

/**
 * A heading's name, without the tag it wears.
 *
 * @param {string} heading - Raw heading text
 * @returns {string} The name a reader would call it by
 */
function headingName(heading: string): string {
  return plain(heading.replace(HEADING_TAG, ''));
}

/**
 * A named sub-section produced by splitBySubHeadings.
 *
 * @interface SubSection
 * @property {string} name - Sub-section name (heading text or bold label)
 * @property {string[]} lines - Content lines
 * @property {'heading' | 'bold'} origin - Whether this came from an H4+ heading or a bold-label bullet
 * @property {number} startOffset - 0-based index of this sub-section's first line within the parent lines array
 * @property {number} endOffset - Exclusive 0-based end index within the parent lines array
 * @property {string} [tag] - The opening tag of the block this sub-section sits
 * inside, which is where a slot-form sheet writes its accuracy
 */
export interface SubSection {
  name: string;
  lines: string[];
  origin: 'heading' | 'bold';
  startOffset: number;
  endOffset: number;
  tag?: string;
}

/**
 * Builds a base MonsterFeature shell with required fields.
 *
 * @param {string} name - Feature name
 * @returns {MonsterFeature} Feature shell
 */
export function baseFeature(name: string): MonsterFeature {
  return {
    id: '',
    name,
    flags: [],
  };
}

/**
 * Parses recharge notation from a heading suffix.
 *
 * @param {string} heading - Raw heading text
 * @returns {{ min: number; max: number; charges?: number } | undefined} Recharge data
 */
export function parseRechargeFromHeading(
  heading: string,
): { min: number; max: number; charges?: number } | undefined {
  const cr = recognizeChargeRecharge(heading);
  if (cr) return { min: cr.min, max: cr.max, charges: cr.charges };
  const rm = heading.match(ENRICHMENT.rechargeSuffix);
  if (rm) {
    const min = parseInt(rm[1], 10);
    return { min, max: rm[2] ? parseInt(rm[2], 10) : min };
  }
  return undefined;
}

/**
 * Extracts features from a Traits section.
 *
 * @param {MonsterSection} section - Classified traits section
 * @returns {MonsterFeature[]} Extracted trait features
 */
export function extractTraits(section: MonsterSection): MonsterFeature[] {
  return extractSubHeadingFeatures(section, 'passive');
}

/**
 * Extracts features from an Actions or Reactions section.
 *
 * @param {MonsterSection} section - Classified section
 * @param {string} trigger - Default trigger type
 * @returns {MonsterFeature[]} Extracted action features
 */
export function extractActions(
  section: MonsterSection,
  trigger = 'action',
): MonsterFeature[] {
  return extractSubHeadingFeatures(section, trigger);
}

/**
 * Produces one feature per sub-heading (H4+) or bold-label bullet.
 *
 * @param {MonsterSection} section - Parent section
 * @param {string} defaultTrigger - Default trigger type
 * @returns {MonsterFeature[]} Extracted features
 */
function extractSubHeadingFeatures(
  section: MonsterSection,
  defaultTrigger: string,
): MonsterFeature[] {
  const features: MonsterFeature[] = [];
  const subs = splitBySubHeadings(section.lines);
  const lineBase = section.startLine + 1;

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];

    if (MONSTER.multiattack.test(sub.name)) {
      const children: SubSection[] = [];
      while (i + 1 < subs.length && subs[i + 1].origin === 'bold') {
        children.push(subs[++i]);
      }
      const multiFeatures = extractMultiattack(sub, children, defaultTrigger);

      const parentEnd =
        children.length > 0 ? children[0].startOffset : sub.endOffset;
      multiFeatures[0].source = {
        start: lineBase + sub.startOffset,
        end: lineBase + parentEnd,
        archetype: 'H',
      };
      for (let c = 0; c < children.length; c++) {
        if (c + 1 < multiFeatures.length) {
          multiFeatures[c + 1].source = {
            start: lineBase + children[c].startOffset,
            end: lineBase + children[c].endOffset,
            archetype: 'H',
          };
        }
      }
      features.push(...multiFeatures);
      continue;
    }

    /* The block's own opening tag carries its accuracy, reach and range, so it
       is read alongside the prose rather than left outside the feature. */
    const raw = [sub.tag, ...sub.lines].filter(Boolean).join('\n');
    const feat = baseFeature(sub.name);
    feat.trigger = defaultTrigger;
    feat.source = {
      start: lineBase + sub.startOffset,
      end: lineBase + sub.endOffset,
      archetype: 'H',
    };

    feat.recharge = parseRechargeFromHeading(sub.name);
    enrichFromBody(feat, raw);
    features.push(feat);
  }

  return features;
}

/**
 * Enriches a feature with tokens parsed from its body text.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Body text
 */
export function enrichFromBody(feat: MonsterFeature, body: string): void {
  const attack = recognizeAttackLine(body);
  if (attack) feat.attack = attack;

  const hit = recognizeHitLine(body);
  if (hit) {
    feat.damage = hit.dice;
    if (hit.type) feat.damageType = hit.type;

    const extra = body.match(ENRICHMENT.extraDamage);
    if (extra) {
      feat.damageFlat = extra[1].trim();
      feat.damageFlatType = extra[2].toLowerCase();
    }
  }

  const save = recognizeSave(body);
  if (save) {
    /* A block states its DC once, on its accuracy: every DC is ten plus that,
       so a save with no number of its own takes the one its block sets. */
    const accuracy = body.match(MONSTER.accuracySlot);
    const derived = accuracy ? 10 + parseInt(accuracy[1], 10) : 0;
    feat.saving_throw = {
      ability: save.ability,
      dc: save.dc.flat ?? derived,
    };
  }

  if (!feat.damage) {
    const saveDmg = body.match(ENRICHMENT.saveDamage);
    if (saveDmg) {
      const typeLower = saveDmg[3].toLowerCase();
      if (DAMAGE_TYPES.has(typeLower)) {
        feat.damage = saveDmg[2]?.trim() ?? saveDmg[1];
        feat.damageType = typeLower;
      }
    }
  }

  const range = recognizeRange(body);
  if (range) feat.target = { type: range.shape, range: range.distance };

  const autoFail = recognizeAutoFail(body);
  if (autoFail) {
    feat.auto_fail_saves = autoFail.fails;
    feat.flags.push('auto_fail');
  }

  if (ENRICHMENT.escalation.test(body)) {
    feat.flags.push('escalation');
  }

  if (DURATION.concentration.test(body) && feat.trigger !== 'passive') {
    feat.flags.push('weird_mechanic');
  }

  if (ENRICHMENT.reactionTrigger.test(body)) {
    feat.trigger = 'reaction';
  }

  const crit = body.match(ENRICHMENT.critRange);
  if (crit) {
    feat.meta = { ...feat.meta, critRange: crit[1] };
  }
}

/**
 * Whether the tag opening on a line introduces a block with its own heading.
 *
 * @description Such a tag ends the feature above it, since what follows is a
 * new named block and its accuracy belongs to that block.
 *
 * @param {string[]} lines - Section content lines
 * @param {number} idx - Line the tag opens on
 * @returns {boolean} True when a heading follows the tag
 */
function opensNamedBlock(lines: string[], idx: number): boolean {
  if (!/^\s*<[A-Z]/.test(lines[idx])) return false;
  let end = idx;
  while (end < lines.length && !/>\s*$/.test(lines[end])) end += 1;
  let next = end + 1;
  while (next < lines.length && lines[next].trim() === '') next += 1;
  return next < lines.length && SECTIONS.subHeading.test(lines[next]);
}

/**
 * Splits section lines by H4/H5/H6 sub-headings or bold-label bullets.
 *
 * @param {string[]} lines - Section content lines
 * @returns {SubSection[]} Named sub-sections with origin tracking
 */
export function splitBySubHeadings(lines: string[]): SubSection[] {
  const result: SubSection[] = [];
  let current: SubSection | null = null;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const headingMatch = line.match(SECTIONS.subHeading);
    const boldMatch = !headingMatch ? line.match(SECTIONS.boldLabel) : null;

    if (!headingMatch && !boldMatch && opensNamedBlock(lines, idx)) {
      if (current) {
        current.endOffset = idx;
        result.push(current);
        current = null;
      }
      continue;
    }

    if (headingMatch) {
      if (current) {
        current.endOffset = idx;
        result.push(current);
      }
      const tag = enclosingOpenTags(lines, idx);
      current = {
        name: headingName(headingMatch[1]),
        lines: [],
        origin: 'heading',
        startOffset: idx,
        endOffset: lines.length,
        ...(tag ? { tag } : {}),
      };
      continue;
    }
    if (boldMatch) {
      if (current) {
        current.endOffset = idx;
        result.push(current);
      }
      current = {
        name: plain(boldMatch[1].replace(/\./g, '')),
        lines: [line],
        origin: 'bold',
        startOffset: idx,
        endOffset: lines.length,
      };
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    current.endOffset = lines.length;
    result.push(current);
  }
  return result;
}

/**
 * Reads the open tags a heading sits directly inside.
 *
 * @description A section starts at its heading, so a block written as
 * `<Action accuracy="+4">` above `### Spellcasting` would have its numbers fall
 * outside the section that needs them.
 *
 * @param {string[]} lines - All lines of the sheet
 * @param {number} startLine - Index of the section's heading line
 * @returns {string} The enclosing open tags, newest first, or the empty string
 */
export function enclosingOpenTags(lines: string[], startLine: number): string {
  const tags: string[] = [];
  for (let i = startLine - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (!SECTIONS.openTag.test(line)) break;
    tags.push(line);
  }
  return tags.join('\n');
}

/**
 * Extracts spellcasting data from a spellcasting section.
 *
 * @param {MonsterSection} section - Classified spellcasting section
 * @param {string[]} [lines] - All lines of the sheet, so the block's own open
 * tag can be read for slots the section body does not repeat
 * @returns {MonsterFeature | null} Spellcasting feature or null
 */
export function extractSpellcasting(
  section: MonsterSection,
  lines?: string[],
): MonsterFeature | null {
  const preamble = lines
    ? enclosingOpenTags(lines, section.startLine)
    : '';
  const raw = [preamble, ...section.lines].join('\n');
  const feat = baseFeature('Spellcasting');
  feat.trigger = 'passive';

  const dcMatch = raw.match(SPELLCASTING.dc);
  const atkMatch = raw.match(SPELLCASTING.attackBonus);
  const abiMatch = raw.match(SPELLCASTING.ability);

  const slots: Record<number, number> = {};
  const slotRegex = new RegExp(SPELLCASTING.slotCell.source, 'gi');
  let slotMatch;
  while ((slotMatch = slotRegex.exec(raw)) !== null) {
    slots[parseInt(slotMatch[1], 10)] = parseInt(slotMatch[2], 10);
  }

  /* A block states its numbers as slots or in prose, so every pattern carries
     a branch per spelling and only one of them captures. */
  const captured = (match: RegExpMatchArray | null): string | null =>
    match ? (match.slice(1).find((group) => group !== undefined) ?? null) : null;

  const dc = captured(dcMatch);
  const attack = captured(atkMatch);
  const ability = captured(abiMatch);

  /* A caster is anything that names a DC, an accuracy, a keyed ability or a
     slot table. Keying this to a caster level would drop every sheet, since no
     sheet prints one any more. */
  if (!dc && !attack && !ability && Object.keys(slots).length === 0) {
    return null;
  }

  feat.spellcasting = {
    ability: ability ? ability.toLowerCase() : 'unknown',
    dc: dc ? parseInt(dc, 10) : 0,
    attack_bonus: attack ? parseInt(attack, 10) : 0,
    slots,
  };

  return feat;
}

/**
 * @fileoverview Monster Feature Extractor — Actions & Traits
 * @description Extracts MonsterFeature records from classified monster
 * sections. Handles traits, actions, reactions, Minor Actions, multiattack,
 * recharge abilities, and spellcasting blocks. Used by the feature metadata
 * generator for `.sheet.mdx` files.
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
 * A named sub-section produced by splitBySubHeadings.
 *
 * @interface SubSection
 * @property {string} name - Sub-section name (heading text or bold label)
 * @property {string[]} lines - Content lines
 * @property {'heading' | 'bold'} origin - Whether this came from an H4+ heading or a bold-label bullet
 * @property {number} startOffset - 0-based index of this sub-section's first line within the parent lines array
 * @property {number} endOffset - Exclusive 0-based end index within the parent lines array
 */
export interface SubSection {
  name: string;
  lines: string[];
  origin: 'heading' | 'bold';
  startOffset: number;
  endOffset: number;
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
 * Splits a section by sub-headings (H4+) or bold-label bullets, creating
 * one feature per sub-heading. Delegates multiattack sections to the
 * dedicated multiattack extractor module.
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

    const raw = sub.lines.join('\n');
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
 * Sets flat damage fields (damage, damageType, damageFlat, damageFlatType)
 * and flat saving throw (ability + dc number) on MonsterFeature.
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
    feat.saving_throw = {
      ability: save.ability,
      dc: save.dc.flat ?? 0,
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
 * Splits section lines by H4/H5/H6 sub-headings or bold-label bullets.
 * Tracks whether each sub-section originated from a heading or bold bullet
 * so the caller can detect inline multiattack children.
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

    if (headingMatch) {
      if (current) {
        current.endOffset = idx;
        result.push(current);
      }
      current = {
        name: plain(headingMatch[1]),
        lines: [],
        origin: 'heading',
        startOffset: idx,
        endOffset: lines.length,
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
 * Extracts spellcasting data from a spellcasting section.
 *
 * @param {MonsterSection} section - Classified spellcasting section
 * @param {string} file - Source file path
 * @returns {MonsterFeature | null} Spellcasting feature or null
 */
export function extractSpellcasting(
  section: MonsterSection,
): MonsterFeature | null {
  const raw = section.lines.join('\n');
  const feat = baseFeature('Spellcasting');
  feat.trigger = 'passive';

  const levelMatch = raw.match(SPELLCASTING.casterLevel);
  const dcMatch = raw.match(SPELLCASTING.dc);
  const atkMatch = raw.match(SPELLCASTING.attackBonus);
  const abiMatch = raw.match(SPELLCASTING.ability);

  if (!levelMatch && !dcMatch) return null;

  const slots: Record<number, number> = {};
  const slotRegex = new RegExp(SPELLCASTING.slotCell.source, 'gi');
  let slotMatch;
  while ((slotMatch = slotRegex.exec(raw)) !== null) {
    slots[parseInt(slotMatch[1], 10)] = parseInt(slotMatch[2], 10);
  }

  feat.spellcasting = {
    level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
    ability: abiMatch ? abiMatch[1].toLowerCase() : 'unknown',
    dc: dcMatch ? parseInt(dcMatch[1], 10) : 0,
    attack_bonus: atkMatch ? parseInt(atkMatch[1], 10) : 0,
    slots,
  };

  return feat;
}

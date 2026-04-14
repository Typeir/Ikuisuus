/**
 * @fileoverview Monster Deed & Phase Extractor
 * @description Extracts MonsterFeature records from legendary deed sections
 * (Act, Stratagem, Lair, Phase) of monster `.sheet.mdx` files. Handles
 * declare/resolve stratagems, deed cost parsing, phase HP thresholds,
 * phase-added features, and lair action options.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/monsterDeedExtractor
 */

import type { MonsterFeature } from '@/lib/types/feature';
import { MONSTER, SECTIONS } from './featurePatterns';
import {
  enrichFromBody,
  parseRechargeFromHeading,
} from './monsterFeatureExtractor';
import type { MonsterSection } from './monsterSectionClassifier';
import {
  recognizeDeclareResolve,
  recognizePhaseThreshold,
} from './monsterTokens';

/**
 * Builds a base MonsterFeature shell for deed features.
 *
 * @param {string} name - Feature name
 * @returns {MonsterFeature} Feature shell
 */
function baseDeedFeature(name: string): MonsterFeature {
  return {
    id: '',
    name,
    flags: [],
  };
}

/**
 * Enriches a deed act feature with attack, damage, save, range, recharge,
 * and cost data via the shared enrichFromBody pipeline.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} headingOrLine - Heading text or bullet line for recharge/cost parsing
 * @param {string} raw - Raw text for token recognition
 */
function enrichDeedAct(
  feat: MonsterFeature,
  headingOrLine: string,
  raw: string,
): void {
  feat.trigger = 'action';
  feat.recharge = parseRechargeFromHeading(headingOrLine);
  enrichFromBody(feat, raw);
}

/**
 * Extracts legendary deed: act features from H4 sub-headings or bullet-list format.
 *
 * @param {MonsterSection} section - Classified deed:act section
 * @returns {MonsterFeature[]} Extracted deed features
 */
export function extractDeedActs(section: MonsterSection): MonsterFeature[] {
  const subs = splitBySubHeadings(section.lines);

  if (subs.length > 0) {
    const features: MonsterFeature[] = [];
    for (const sub of subs) {
      const raw = sub.lines.join('\n');
      const costMatch = sub.name.match(MONSTER.deedCost);
      const cost = costMatch ? parseInt(costMatch[1], 10) : 1;
      const cleanName = sub.name.replace(MONSTER.deedCost, '').trim();
      const feat = baseDeedFeature(cleanName);
      feat.legendary_deed = { category: 'act', cost };
      enrichDeedAct(feat, sub.name, raw);
      features.push(feat);
    }
    return features;
  }

  const features: MonsterFeature[] = [];
  for (const line of section.lines) {
    const match = line.match(SECTIONS.deedBullet);
    if (!match) continue;
    const name = match[1].replace(/\./g, '').trim();
    const cost = match[2] ? parseInt(match[2], 10) : 1;
    const feat = baseDeedFeature(name);
    feat.legendary_deed = { category: 'act', cost };
    enrichDeedAct(feat, line, line);
    features.push(feat);
  }
  return features;
}

/**
 * Extracts legendary deed: stratagem features with declare/resolve parsing.
 *
 * @param {MonsterSection} section - Classified deed:stratagem section
 * @returns {MonsterFeature[]} Extracted stratagem features
 */
export function extractDeedStratagems(
  section: MonsterSection,
): MonsterFeature[] {
  const features: MonsterFeature[] = [];
  const subs = splitBySubHeadings(section.lines);

  for (const sub of subs) {
    const raw = sub.lines.join('\n');
    const feat = baseDeedFeature(sub.name);
    feat.trigger = 'action';
    feat.legendary_deed = {
      category: 'stratagem',
      declare_resolve: !!recognizeDeclareResolve(raw),
    };
    feat.recharge = parseRechargeFromHeading(sub.name);

    enrichFromBody(feat, raw);

    features.push(feat);
  }

  return features;
}

/**
 * Extracts legendary deed: lair features.
 *
 * @param {MonsterSection} section - Classified deed:lair section
 * @returns {MonsterFeature[]} Extracted lair features
 */
export function extractDeedLair(section: MonsterSection): MonsterFeature[] {
  const features: MonsterFeature[] = [];
  const subs = splitBySubHeadings(section.lines);

  for (const sub of subs) {
    const raw = sub.lines.join('\n');
    const feat = baseDeedFeature(sub.name);
    feat.trigger = 'action';
    feat.legendary_deed = { category: 'lair' };

    enrichFromBody(feat, raw);

    features.push(feat);
  }

  return features;
}

/**
 * Extracts legendary deed: phase features with HP thresholds and added features.
 *
 * @param {MonsterSection} section - Classified deed:phase section
 * @returns {MonsterFeature[]} Extracted phase features
 */
export function extractDeedPhases(section: MonsterSection): MonsterFeature[] {
  const features: MonsterFeature[] = [];
  const subs = splitByPhaseHeadings(section.lines);

  for (const sub of subs) {
    const raw = sub.lines.join('\n');
    const phase = recognizePhaseThreshold(sub.name);
    const feat = baseDeedFeature(sub.name);
    feat.trigger = 'passive';
    feat.legendary_deed = { category: 'phase' };

    if (phase) {
      const added = extractAddedFeatureNames(sub.lines);
      feat.phase = {
        hp_threshold: phase.threshold,
        name: phase.name,
        features_added: added,
        features_modified: [],
      };
    }

    feat.flags.push('nested_feature');
    features.push(feat);

    const innerSubs = splitBySubHeadings(sub.lines);
    for (const inner of innerSubs) {
      const innerRaw = inner.lines.join('\n');
      const innerFeat = baseDeedFeature(inner.name);
      innerFeat.trigger = 'action';
      innerFeat.legendary_deed = { category: 'phase' };
      innerFeat.flags.push('phase_added');
      enrichFromBody(innerFeat, innerRaw);
      features.push(innerFeat);
    }
  }

  return features;
}

/**
 * Scans phase body lines for names of features added at that phase.
 *
 * @param {string[]} lines - Phase section body lines
 * @returns {string[]} Names of added features
 */
function extractAddedFeatureNames(lines: string[]): string[] {
  const names: string[] = [];
  for (const line of lines) {
    const headingMatch = line.match(SECTIONS.subHeading);
    if (headingMatch) {
      const name = headingMatch[1].replace(/\*\*/g, '').trim();
      if (
        !MONSTER.phaseThreshold.test(name) &&
        !MONSTER.phaseSlain.test(name)
      ) {
        names.push(name);
      }
    }
  }
  return names;
}

/**
 * Splits lines by phase-threshold headings (Bloodied, Doomed, Wounded, Slain).
 * Sub-headings within a phase are kept as body content, not split further.
 *
 * @param {string[]} lines - Section content lines
 * @returns {{ name: string; lines: string[] }[]} Phase blocks
 */
function splitByPhaseHeadings(
  lines: string[],
): { name: string; lines: string[] }[] {
  const result: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(SECTIONS.subHeading);
    if (match) {
      const name = match[1].replace(/\*\*/g, '').trim();
      const isPhase =
        MONSTER.phaseThreshold.test(name) || MONSTER.phaseSlain.test(name);
      if (isPhase) {
        if (current) result.push(current);
        current = { name, lines: [] };
        continue;
      }
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) result.push(current);
  return result;
}

/**
 * Splits lines by H4/H5/H6 sub-headings.
 *
 * @param {string[]} lines - Section content lines
 * @returns {{ name: string; lines: string[] }[]} Named sub-sections
 */
function splitBySubHeadings(
  lines: string[],
): { name: string; lines: string[] }[] {
  const result: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(SECTIONS.subHeading);
    if (match) {
      if (current) result.push(current);
      current = { name: match[1].replace(/\*\*/g, '').trim(), lines: [] };
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) result.push(current);
  return result;
}

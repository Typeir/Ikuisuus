/**
 * @fileoverview Monster Multiattack Extractor
 * @description Dedicated module for extracting multiattack parent and child
 * attack features from monster stat block sections. When a multiattack heading
 * is detected by the feature extractor, this module receives the multiattack
 * sub-section and its inline bold-label children, creates the parent feature
 * with the multiattack token, and produces enriched child attack features.
 *
 * The generator post-processes multiattack_refs after all feature IDs are
 * assigned, linking the parent to child feature IDs by name matching.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/monsterMultiattackExtractor
 */

import type { MonsterFeature } from '@/lib/types/feature';
import { SLUG } from '../parsingPatterns';
import type { SubSection } from './monsterFeatureExtractor';
import {
  baseFeature,
  enrichFromBody,
  parseRechargeFromHeading,
} from './monsterFeatureExtractor';
import { recognizeMultiattack } from './monsterTokens';

/**
 * Generates a stable feature ID from slug and feature name.
 * Used by the metadata generator to assign IDs to features and to
 * resolve multiattack_refs.
 *
 * @param {string} slug - Monster slug (e.g. "abominable-avian")
 * @param {string} name - Feature name (e.g. "Gnawing Bite")
 * @returns {string} Stable feature ID (e.g. "abominable-avian/gnawing-bite")
 */
export function featureId(slug: string, name: string): string {
  const kebab = name
    .toLowerCase()
    .replace(SLUG.nonAlpha, '-')
    .replace(SLUG.singleEdgeHyphens, '');
  return `${slug}/${kebab}`;
}

/**
 * Extracts a multiattack parent feature and its inline child attack features.
 *
 * The parent feature receives the multiattack token parsed from the
 * description text. Each bold-label child sub becomes a separate
 * MonsterFeature enriched with attack, damage, and save tokens.
 *
 * Multiattack_refs are NOT populated here — the generator resolves them
 * after all feature IDs are assigned.
 *
 * @param {SubSection} multiSub - The multiattack sub-section (description only)
 * @param {SubSection[]} childSubs - Bold-label attack subs following the multiattack
 * @param {string} defaultTrigger - Default trigger type (usually "action")
 * @returns {MonsterFeature[]} Parent multiattack feature followed by child attack features
 */
export function extractMultiattack(
  multiSub: SubSection,
  childSubs: SubSection[],
  defaultTrigger: string,
): MonsterFeature[] {
  const features: MonsterFeature[] = [];

  const descRaw = multiSub.lines.join('\n');
  const parent = baseFeature(multiSub.name);
  parent.trigger = defaultTrigger;

  const multiText = `${multiSub.name}\n${descRaw}`;
  const multi = recognizeMultiattack(multiText);
  if (multi) parent.multiattack = multi;

  parent.recharge = parseRechargeFromHeading(multiSub.name);
  features.push(parent);

  for (const child of childSubs) {
    const raw = child.lines.join('\n');
    const feat = baseFeature(child.name);
    feat.trigger = defaultTrigger;
    feat.recharge = parseRechargeFromHeading(child.name);
    enrichFromBody(feat, raw);
    features.push(feat);
  }

  return features;
}

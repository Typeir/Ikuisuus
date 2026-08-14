/**
 * @fileoverview Monster Multiattack Extractor
 * @description Extracts multiattack parent and child attack features from
 * monster stat block sub-sections. Creates the parent feature with the
 * multiattack token and enriched child attack features.
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
 *
 * @param {string} slug - Monster slug (e.g. "abominable-avian")
 * @param {string} name - Feature name (e.g. "Gnawing Bite")
 * @returns {string} Feature ID: "<slug>/<name-kebab-cased>"
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
 * Multiattack_refs are not populated here.
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

/**
 * @fileoverview Custom Meta Handler Registry
 * @description Implements extraction handlers for `<Meta customHandler="...">` directives.
 * Each handler enriches a MonsterFeature's `meta` map with structured data
 * extracted from the feature's body text.
 *
 * @module scripts/metadata/extraction/metaHandlers
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import type { MonsterFeature } from '@/lib/types/feature';

/**
 * Signature for a meta handler function.
 *
 * @callback MetaHandler
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text of the feature
 * @param {Record<string, string>} attrs - Additional attributes from the Meta tag
 */
type MetaHandler = (
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
) => void;

/**
 * Parses a blockquote stat table with AC/HP/DT columns.
 * Finds the header row to determine column positions, then reads the first numeric data row.
 *
 * @param {string} body - Raw body text containing a markdown table
 * @returns {{ ac?: string; hp?: string; dt?: string }} Extracted stats
 */
function parseStatTableRow(body: string): {
  ac?: string;
  hp?: string;
  dt?: string;
} {
  const lines = body.split('\n');
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\*\*Armor Class\*\*/.test(lines[i]) && /\|/.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return {};

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const stripped = lines[i].replace(/^>\s*/, '');
    if (/^[\s|:-]+$/.test(stripped)) continue;
    const cells = stripped
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length === 0) continue;
    const numericCells = cells.filter((c) => /^\d+$/.test(c));
    if (numericCells.length >= 2) {
      return {
        ac: numericCells[0],
        hp: numericCells[1],
        dt: numericCells[2],
      };
    }
  }
  return {};
}

/**
 * Extracts destructible sub-object stats (AC, HP, damage threshold,
 * resistances, immunities, count) from blockquote stat tables.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleDestructibleComponent(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  const tableRow = parseStatTableRow(body);
  if (tableRow.ac) feat.meta = { ...feat.meta, componentAC: tableRow.ac };
  if (tableRow.hp) feat.meta = { ...feat.meta, componentHP: tableRow.hp };
  if (tableRow.dt) feat.meta = { ...feat.meta, damageThreshold: tableRow.dt };

  const countMatch = body.match(/has\s+(\d+)\s/i);
  if (countMatch) feat.meta = { ...feat.meta, componentCount: countMatch[1] };

  const resMatch = body.match(/\*\*Resistances?\*\*:\s*(.+)/i);
  if (resMatch) {
    feat.meta = { ...feat.meta, componentResistances: resMatch[1].trim() };
  }

  const immMatch = body.match(/\*\*Immunities?\*\*:\s*(.+)/i);
  if (immMatch) {
    feat.meta = { ...feat.meta, componentImmunities: immMatch[1].trim() };
  }

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts mark-target mechanics: condition name, duration, and limit.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleMarkTarget(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  const markMatch = body.match(/\*\*(.+?)\*\*\s+until\s+(.+?)[.]/i);
  if (markMatch) {
    feat.meta = {
      ...feat.meta,
      markCondition: markMatch[1],
      markDuration: markMatch[2],
    };
  }

  const limitMatch = body.match(/only\s+one\s+creature/i);
  if (limitMatch) feat.meta = { ...feat.meta, markLimit: '1' };

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts auto-hit attack data: flat damage, damage type, range, and
 * any bypass conditions.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleAutoHit(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  feat.meta = { ...feat.meta, autoHit: 'true' };

  const dmgMatch = body.match(
    /takes?\s+\*?\*?(\d+(?:\s*\([^)]+\))?)\s+(\w+)\s+damage/i,
  );
  if (dmgMatch) {
    feat.meta = {
      ...feat.meta,
      autoHitDamage: dmgMatch[1],
      autoHitDamageType: dmgMatch[2].toLowerCase(),
    };
  }

  const rangeMatch = body.match(/within\s+\*?\*?([^*]+?)\*?\*?\./i);
  if (rangeMatch)
    feat.meta = { ...feat.meta, autoHitRange: rangeMatch[1].trim() };

  const bypassMatch = body.match(/cannot miss except\s+(.+?)\./i);
  if (bypassMatch)
    feat.meta = { ...feat.meta, autoHitBypass: bypassMatch[1].trim() };

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts summoning data: creature name, count, range, and tether status.
 * AC/HP are not extracted.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleSummon(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  const countMatch = body.match(/deploys?\s+up\s+to\s+(\w+)\s+\*?\*?(\w+)/i);
  if (countMatch) {
    feat.meta = {
      ...feat.meta,
      summonCount: countMatch[1],
      summonName: countMatch[2],
    };
  }

  const rangeMatch = body.match(/within\s+(\d+\s*ft\.?)/i);
  if (rangeMatch) feat.meta = { ...feat.meta, summonRange: rangeMatch[1] };

  const speedMatch = body.match(/\*\*Speed\*\*\s*\|\s*(.+?)\s*\|/);
  if (speedMatch) {
    feat.meta = {
      ...feat.meta,
      summonSpeed: speedMatch[1].replace(/^>\s*/, '').trim(),
    };
  }

  const tetheredMatch = body.match(/\*\*Tethered\*\*/i);
  if (tetheredMatch) feat.meta = { ...feat.meta, summonTethered: 'true' };

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts geometric teleportation mechanics: movement constraints
 * and immunity during repositioning.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleGeometryTeleport(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  feat.meta = { ...feat.meta, geometryTeleport: 'true' };

  const constraintMatch = body.match(
    /maintains?\s+the\s+exact\s+same\s+distance/i,
  );
  if (constraintMatch) {
    feat.meta = { ...feat.meta, teleportConstraint: 'fixed_distance' };
  }

  const anchorMatch = body.match(
    /from\s+the\s+creature\s+currently\s+\*?\*?(.+?)\*?\*?\./i,
  );
  if (anchorMatch) {
    feat.meta = { ...feat.meta, teleportAnchor: anchorMatch[1].trim() };
  }

  const immuneMatch = body.match(/immune\s+to\s+all\s+damage\s+and\s+effects/i);
  if (immuneMatch) {
    feat.meta = { ...feat.meta, teleportImmunity: 'true' };
  }

  const noAooMatch = body.match(/does not provoke opportunity attacks/i);
  if (noAooMatch) feat.meta = { ...feat.meta, teleportNoAoO: 'true' };

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts damage reflection/link mechanics: range, save DC, link duration, and reflection type.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleDamageReflection(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  feat.meta = { ...feat.meta, damageReflection: 'true' };

  const rangeMatch = body.match(/within\s+(\d+)\s+feet/i);
  if (rangeMatch) feat.meta = { ...feat.meta, reflectionRange: rangeMatch[1] };

  const saveMatch = body.match(/DC\s+(\d+)\s+(\w+)\s+saving throw/i);
  if (saveMatch) {
    feat.meta = {
      ...feat.meta,
      reflectionSaveDC: saveMatch[1],
      reflectionSaveAbility: saveMatch[2].toLowerCase(),
    };
  }

  const durationMatch = body.match(/for\s+(\d+\s+\w+)/i);
  if (durationMatch) {
    feat.meta = { ...feat.meta, reflectionDuration: durationMatch[1] };
  }

  const healDrainMatch = body.match(/healing.*?instead\s+granted/i);
  if (healDrainMatch) feat.meta = { ...feat.meta, reflectionHealing: 'drain' };

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Passthrough handler for mechanics not parsed here.
 * Sets `textPipe: 'true'` and forwards any passthrough attributes.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} _body - Raw body text (unused)
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleTextPipe(
  feat: MonsterFeature,
  _body: string,
  attrs: Record<string, string>,
): void {
  feat.meta = { ...feat.meta, textPipe: 'true' };
  applyPassthroughAttrs(feat, attrs);
}

/**
 * Extracts environmental zone mechanics: duration, radius, conditions
 * applied, and special suppression effects.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text
 * @param {Record<string, string>} attrs - Meta tag attributes
 */
function handleEnvironmentalZone(
  feat: MonsterFeature,
  body: string,
  attrs: Record<string, string>,
): void {
  feat.meta = { ...feat.meta, environmentalZone: 'true' };

  const durationMatch = body.match(
    /for\s+the\s+next\s+\*?\*?(\d+)\s+rounds?\*?\*?/i,
  );
  if (durationMatch) {
    feat.meta = { ...feat.meta, zoneDuration: `${durationMatch[1]} rounds` };
  }

  const radiusMatch = body.match(/(\d+)-mile\s+radius/i);
  if (radiusMatch) {
    feat.meta = { ...feat.meta, zoneRadius: `${radiusMatch[1]} mile` };
  }

  const conditionMatches = body.matchAll(
    /\[(\w+(?:\s+\w+)?)\]\([^)]+\/conditions\)/gi,
  );
  const conditions: string[] = [];
  for (const m of conditionMatches) {
    conditions.push(m[1]);
  }
  if (conditions.length > 0) {
    feat.meta = { ...feat.meta, zoneConditions: conditions.join(', ') };
  }

  const visMatch = body.match(
    /visibility\s+is\s+reduced\s+to\s+\*?\*?(\d+\s*feet)\*?\*?/i,
  );
  if (visMatch) {
    feat.meta = { ...feat.meta, zoneVisibility: visMatch[1] };
  }

  applyPassthroughAttrs(feat, attrs);
}

/**
 * Copies any non-reserved attributes from the Meta tag into `feat.meta`.
 * Reserved keys (`customHandler`) are excluded.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {Record<string, string>} attrs - Additional Meta tag attributes
 */
function applyPassthroughAttrs(
  feat: MonsterFeature,
  attrs: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'customHandler') continue;
    if (!feat.meta?.[key]) {
      feat.meta = { ...feat.meta, [key]: value };
    }
  }
}

/**
 * Registry mapping handler names to their implementation functions.
 * @type {Record<string, MetaHandler>}
 */
const HANDLER_REGISTRY: Record<string, MetaHandler> = {
  destructible_component: handleDestructibleComponent,
  mark_target: handleMarkTarget,
  auto_hit: handleAutoHit,
  summon: handleSummon,
  geometry_teleport: handleGeometryTeleport,
  damage_reflection: handleDamageReflection,
  text_pipe: handleTextPipe,
  environmental_zone: handleEnvironmentalZone,
};

/**
 * Dispatches a feature to the appropriate meta handler based on its
 * `customHandler` name. If no matching handler exists, logs a warning
 * and sets a flag on the feature.
 *
 * @param {MonsterFeature} feat - Feature to enrich
 * @param {string} body - Raw body text of the feature
 * @param {string} handlerName - Handler name from the Meta tag
 * @param {Record<string, string>} attrs - Additional Meta tag attributes
 * @returns {boolean} True if a handler was found and executed
 */
export function applyMetaHandler(
  feat: MonsterFeature,
  body: string,
  handlerName: string,
  attrs: Record<string, string>,
): boolean {
  const handler = HANDLER_REGISTRY[handlerName];
  if (!handler) {
    feat.flags.push('unparseable');
    feat.meta = { ...feat.meta, unknownHandler: handlerName };
    return false;
  }

  handler(feat, body, attrs);
  return true;
}

/**
 * Returns the list of all registered handler names.
 *
 * @returns {string[]} Registered handler names
 */
export function getRegisteredHandlers(): string[] {
  return Object.keys(HANDLER_REGISTRY);
}

export type { MetaHandler };


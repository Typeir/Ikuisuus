/**
 * @fileoverview Feature Grant Extractor
 * @description Heuristic prose parser that turns "you gain proficiency…" style
 * feature text into flat grant tags (`weapon:martial`, `armor:medium`,
 * `saving_throw:dexterity`, `skill:persuasion:expertise`, `trade:smithing:proficient`).
 * Prose parsing is intentionally conservative and imperfect; an explicit
 * frontmatter `Grants` map (feature name → tags) is authoritative for any
 * feature it names — its tags fully REPLACE the prose parse for that feature,
 * and an empty list suppresses a feature the heuristic misreads (e.g. a
 * "choose one proficiency from this list" clause). The heuristic is left to
 * handle only the features the map does not name.
 *
 * @module scripts/metadata/extraction/grantsExtractor
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

const SKILL_KEYS = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
  'tinkering',
];

const TOOL_KEYS = [
  'alchemy',
  'brewing',
  'calligraphy',
  'carpentry',
  'cartography',
  'cooking',
  'deceit',
  'electrics',
  'gaming',
  'glassblowing',
  'herbalism',
  'jewellery',
  'leatherworking',
  'masonry',
  'music',
  'painting',
  'poisoncraft',
  'pottery',
  'smithing',
  'thievery',
  'tinkering',
  'vehicles',
  'weaving',
];

/**
 * Maps a tool key to a regex alternation of the agent-noun prose forms that
 * name it, so "smith's tools" / "alchemist's supplies" resolve to the right key.
 */
const TOOL_ALIASES: Record<string, string> = {
  smithing: 'smith',
  alchemy: 'alchemist',
  thievery: 'thieves|thief',
  carpentry: 'carpenter',
  masonry: 'mason',
  jewellery: 'jeweller|jeweler',
  leatherworking: 'leatherworker',
  glassblowing: 'glassblower',
  cartography: 'cartographer|mapmaker',
  cooking: 'cook',
  brewing: 'brewer',
  calligraphy: 'calligrapher|scribe',
  herbalism: 'herbalist',
  painting: 'painter',
  pottery: 'potter',
  weaving: 'weaver',
  poisoncraft: 'poisoner',
  tinkering: 'tinkerer',
};

const WEAPON_CATEGORIES = ['simple', 'martial'];
const ARMOR_CATEGORIES = ['light', 'medium', 'heavy'];
const ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

/**
 * Converts a camelCase key to a spaced, lowercase phrase for prose matching.
 *
 * @param {string} key - camelCase key (e.g. `sleightOfHand`)
 * @returns {string} Spaced phrase (e.g. `sleight of hand`)
 */
function keyToPhrase(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

/**
 * Converts a camelCase key to a kebab-case tag value.
 *
 * @param {string} key - camelCase key (e.g. `sleightOfHand`)
 * @returns {string} Kebab tag value (e.g. `sleight-of-hand`)
 */
function keyToTag(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Escapes regex metacharacters in a literal phrase.
 *
 * @param {string} phrase - Literal phrase
 * @returns {string} Regex-safe phrase
 */
function escapeRegex(phrase: string): string {
  return phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts grant tags from a feature's prose body using conservative,
 * proximity-anchored patterns. Only emits a grant when a proficiency/expertise
 * keyword sits near the target within the same sentence.
 *
 * @param {string} prose - Feature body text
 * @returns {string[]} Sorted, deduped grant tags
 */
export function extractGrantsFromProse(prose: string): string[] {
  const grants = new Set<string>();
  const text = ` ${prose.toLowerCase().replace(/\s+/g, ' ')} `;
  const hasProficiency = /proficien/.test(text);

  for (const cat of WEAPON_CATEGORIES) {
    if (hasProficiency && new RegExp(`\\b${cat} weapons?\\b`).test(text)) {
      grants.add(`weapon:${cat}`);
    }
  }

  for (const cat of ARMOR_CATEGORIES) {
    if (hasProficiency && new RegExp(`\\b${cat} armou?r\\b`).test(text)) {
      grants.add(`armor:${cat}`);
    }
  }
  if (hasProficiency && /\bshields?\b/.test(text)) {
    grants.add('armor:shield');
  }

  for (const key of SKILL_KEYS) {
    const phrase = escapeRegex(keyToPhrase(key));
    const near = `(?:proficien\\w*|trained)[^.]{0,40}\\b${phrase}\\b|\\b${phrase}\\b[^.]{0,40}proficien`;
    const expertise = `expertise[^.]{0,40}\\b${phrase}\\b|\\b${phrase}\\b[^.]{0,40}expertise`;
    if (new RegExp(expertise).test(text)) {
      grants.add(`skill:${keyToTag(key)}:expertise`);
    } else if (new RegExp(near).test(text)) {
      grants.add(`skill:${keyToTag(key)}:proficient`);
    }
  }

  for (const ability of ABILITIES) {
    const save = `(?:saving throws?|saves?)`;
    const pattern = `proficien\\w*[^.]{0,30}\\b${ability}\\b[^.]{0,20}${save}|\\b${ability}\\b[^.]{0,20}${save}[^.]{0,30}proficien`;
    if (new RegExp(pattern).test(text)) {
      grants.add(`saving_throw:${ability}`);
    }
  }

  for (const key of TOOL_KEYS) {
    const phrase = escapeRegex(keyToPhrase(key));
    const alias = TOOL_ALIASES[key];
    const forms = alias ? `${phrase}|${alias}` : phrase;
    const context = `(?:tools?|supplies|kit)`;
    const near = `\\b(?:${forms})(?:['’]s)?\\s+${context}\\b`;
    if (!new RegExp(near).test(text)) continue;
    const expertise = new RegExp(
      `expertise[^.]{0,40}\\b(?:${forms})\\b`,
    ).test(text);
    grants.add(`trade:${keyToTag(key)}:${expertise ? 'expertise' : 'proficient'}`);
  }

  return [...grants].sort();
}

/**
 * Produces the final grant tags for a feature. When the feature's name is a key
 * in the frontmatter `Grants` map, the author's tags are authoritative and the
 * prose heuristic is skipped entirely for that feature — an empty list therefore
 * suppresses a feature the parser would otherwise misread (e.g. a "choose one
 * proficiency from this list" clause emitting spurious per-option grants). When
 * the feature is absent from the map, the grants come solely from the
 * conservative prose parse.
 *
 * @param {string} featureName - Parsed feature name (frontmatter key)
 * @param {string} prose - Feature body text
 * @param {Record<string, string[]> | undefined} frontmatterGrants - Optional `Grants` map from MDX frontmatter
 * @returns {string[]} Sorted, deduped grant tags
 */
export function extractFeatureGrants(
  featureName: string,
  prose: string,
  frontmatterGrants?: Record<string, string[]>,
): string[] {
  if (
    frontmatterGrants !== undefined &&
    Object.prototype.hasOwnProperty.call(frontmatterGrants, featureName)
  ) {
    const override = frontmatterGrants[featureName] ?? [];
    const cleaned = new Set<string>(
      override.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    );
    return [...cleaned].sort();
  }
  return extractGrantsFromProse(prose);
}

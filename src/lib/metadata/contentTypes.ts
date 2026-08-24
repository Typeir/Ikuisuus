/**
 * @fileoverview Metadata Content Types
 * @description Content type keys, and classification of a content path onto them
 * by filename suffix. Classification reads the suffix, never the file. Folder
 * location is not a signal.
 *
 * @module lib/metadata/contentTypes
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Every content type.
 *
 * @enum {string}
 */
export enum ContentType {
  Monsters = 'monsters',
  Heirlooms = 'heirlooms',
  Spells = 'spells',
  Trinkets = 'trinkets',
  Bloodlines = 'bloodlines',
  Rules = 'rules',
  Specializations = 'specializations',
  Vocations = 'vocations',
  Feats = 'feats',
  World = 'world',
  Tools = 'tools',
  Lists = 'lists',
  Boons = 'boons',
}

/**
 * Outcome of classifying a content path. `Ambiguous` means the suffix maps to
 * several types and only frontmatter decides. `Untyped` means no suffix matched.
 *
 * @enum {string}
 */
export enum ClassificationKind {
  Resolved = 'resolved',
  Ambiguous = 'ambiguous',
  Untyped = 'untyped',
}

/**
 * Result of classifying a content path by suffix.
 *
 * @typedef {object} Classification
 * @property {ClassificationKind} kind - Whether the suffix decided the type
 * @property {ContentType} [contentType] - Present only when kind is `Resolved`
 * @property {string} [suffix] - The matched suffix, without its leading dot
 */
export type Classification =
  | { kind: ClassificationKind.Resolved; contentType: ContentType; suffix: string }
  | { kind: ClassificationKind.Ambiguous; suffix: string }
  | { kind: ClassificationKind.Untyped; suffix: string | null };

/**
 * Suffixes that map onto exactly one content type.
 *
 * @constant
 */
export const SUFFIX_CONTENT_TYPES: Readonly<Record<string, ContentType>> = {
  spell: ContentType.Spells,
  heirloom: ContentType.Heirlooms,
  trinket: ContentType.Trinkets,
  bloodline: ContentType.Bloodlines,
  rule: ContentType.Rules,
  specialization: ContentType.Specializations,
  vocation: ContentType.Vocations,
  feat: ContentType.Feats,
  lore: ContentType.World,
  tool: ContentType.Tools,
  list: ContentType.Lists,
  boon: ContentType.Boons,
};

/**
 * Suffixes shared by several types, resolved by `contentType` frontmatter.
 *
 * @constant
 */
export const AMBIGUOUS_SUFFIXES: ReadonlySet<string> = new Set(['sheet']);

/**
 * Every valid content type key.
 *
 * @constant
 */
export const CONTENT_TYPES: ReadonlySet<string> = new Set(
  Object.values(ContentType),
);

/**
 * Extracts the content suffix from a path or filename.
 *
 * @param {string} path - Content path, slug, or filename
 * @returns {string | null} Suffix without its leading dot, or null when absent
 *
 * @example
 * suffixOf('spells/bane.spell.mdx')  // 'spell'
 * suffixOf('monsters/albedo.sheet')  // 'sheet'
 * suffixOf('rules/conditions')       // null
 */
export function suffixOf(path: string): string | null {
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  const stem = fileName.replace(/\.(md|mdx)$/, '');
  const dot = stem.lastIndexOf('.');
  return dot === -1 ? null : stem.slice(dot + 1);
}

/**
 * Classifies a content path by its filename suffix, without reading the file.
 *
 * @param {string} path - Content path, slug, or filename
 * @returns {Classification} How the suffix classifies the path
 *
 * @example
 * classifyContent('spells/bane.spell.mdx')
 * // { kind: 'resolved', contentType: 'spells', suffix: 'spell' }
 * classifyContent('monsters/albedo.sheet.mdx')
 * // { kind: 'ambiguous', suffix: 'sheet' }
 * classifyContent('rules/conditions.rule.mdx')
 * // { kind: 'resolved', contentType: 'rules', suffix: 'rule' }
 */
export function classifyContent(path: string): Classification {
  const suffix = suffixOf(path);
  if (suffix === null) {
    return { kind: ClassificationKind.Untyped, suffix: null };
  }
  const contentType = SUFFIX_CONTENT_TYPES[suffix];
  if (contentType) {
    return { kind: ClassificationKind.Resolved, contentType, suffix };
  }
  if (AMBIGUOUS_SUFFIXES.has(suffix)) {
    return { kind: ClassificationKind.Ambiguous, suffix };
  }
  return { kind: ClassificationKind.Untyped, suffix };
}

/**
 * Resolves a content path to its content type by suffix. Returns null for
 * ambiguous suffixes; read `contentType` frontmatter instead.
 *
 * @param {string} path - Content path, slug, or filename
 * @returns {ContentType | null} The content type, or null when the suffix cannot decide
 */
export function resolveContentType(path: string): ContentType | null {
  const classification = classifyContent(path);
  return classification.kind === ClassificationKind.Resolved
    ? classification.contentType
    : null;
}

/**
 * Narrows an arbitrary string to a known content type key.
 *
 * @param {string} value - Candidate content type key
 * @returns {value is ContentType} True when the value is a known content type
 */
export function isContentType(value: string): value is ContentType {
  return CONTENT_TYPES.has(value);
}

/**
 * Narrows a declared `contentType` frontmatter value to a content type.
 *
 * @param {unknown} declared - Value of the file's `contentType` frontmatter field
 * @returns {ContentType | null} The content type, or null when absent or unknown
 */
export function contentTypeFromFrontmatter(
  declared: unknown,
): ContentType | null {
  return typeof declared === 'string' && isContentType(declared)
    ? (declared as ContentType)
    : null;
}

/**
 * @fileoverview Metadata Content Types
 * @description Canonical content type keys for the metadata sync layer, and
 * classification of a content path onto them by filename suffix. Classification
 * never reads a file: the suffix carries the type, so a listing is enough.
 *
 * Folder location is not a signal. Content of any type may live anywhere,
 * including inside campaign trees.
 *
 * @module lib/metadata/contentTypes
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Content types with a synced metadata table.
 *
 * @enum {string}
 */
export enum ContentType {
  Monsters = 'monsters',
  Heirlooms = 'heirlooms',
  Spells = 'spells',
  Trinkets = 'trinkets',
  Bloodlines = 'bloodlines',
}

/**
 * Outcome of classifying a content path.
 *
 * `Resolved` carries a content type. `Ambiguous` means the suffix is shared by
 * several interoperable types and only the file's `contentType` frontmatter can
 * decide; `.sheet` covers creatures, monsters, players, objects and structures.
 * `Untyped` means the suffix has no synced metadata table.
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
 * Suffixes that map onto exactly one synced content type.
 *
 * @constant
 */
export const SUFFIX_CONTENT_TYPES: Readonly<Record<string, ContentType>> = {
  spell: ContentType.Spells,
  heirloom: ContentType.Heirlooms,
  trinket: ContentType.Trinkets,
  bloodline: ContentType.Bloodlines,
};

/**
 * Suffixes shared by several interoperable types, resolved only by the file's
 * `contentType` frontmatter.
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
 * // { kind: 'untyped', suffix: 'rule' }
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
 * Resolves a content path to its synced content type by suffix alone.
 *
 * Returns null for ambiguous suffixes: callers that can afford to read the file
 * should fall back to its `contentType` frontmatter via {@link classifyContent}.
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
 * Narrows a declared `contentType` frontmatter value to a synced content type.
 * Used to settle {@link ClassificationKind.Ambiguous} paths.
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

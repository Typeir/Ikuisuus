/**
 * Content Path Constants
 *
 * @fileoverview Single source of truth for the library subdirectory each
 * content kind lives under.
 *
 * @module lib/constants/contentPaths
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/** Library subdirectory for each content kind. */
export const CONTENT_SUBDIRS = {
  monsters: 'monsters',
  heirlooms: 'items/heirlooms',
  spells: 'spells',
  trinkets: 'items/trinkets',
  bloodlines: 'character-creation/bloodlines',
  vocations: 'character-creation/vocations',
  specializations: 'character-creation/vocations',
  feats: 'character-creation/feats',
  world: 'world',
  rules: 'rules',
} as const;

/** A content kind with a known library subdirectory. */
export type ContentKind = keyof typeof CONTENT_SUBDIRS;

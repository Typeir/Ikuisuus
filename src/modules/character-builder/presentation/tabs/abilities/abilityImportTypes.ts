/**
 * @fileoverview Ability Import Types
 * @description Shared types for the ability import subsystem.
 *
 * @module modules/character-builder/presentation/tabs/abilities/abilityImportTypes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/** Available import source tabs. */
export type ImportTab = 'spells' | 'heirlooms' | 'trinkets' | 'feats';

/** Route paths for each tab's root main.mdx page. */
export const SOURCE_PATHS: Record<ImportTab, string> = {
  spells: 'spells',
  heirlooms: 'items/heirlooms',
  trinkets: 'items/trinkets',
  feats: 'character-creation/feats',
};

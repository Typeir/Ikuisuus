/**
 * @fileoverview Metadata generation utilities barrel export.
 * @description Re-exports for build-time scripts and generators.
 *
 * @module scripts/metadata/index
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

export { runWithCli } from './cliRunner';
export type { CliOptions } from './cliRunner';
export {
  ensureDirectory,
  getMatchingFiles,
  safeReadFile,
  safeWriteFile,
} from './fileUtils';
export { GameData, ItemData } from './gameData';
export {
  getContentDirectory,
  getMetadataBackend,
  getMetadataOutputPath,
  getMetaSubdir,
  runGenerator,
} from './generatorUtils';
export type { GeneratorConfig, StorageAdapter } from './generatorUtils';
export {
  calculateReadingTime,
  findContentImage,
  findTitleIndex,
  normalizeWeight,
  parseCharges,
  parseDamageTypesDealt,
  parseDescription,
  parseFirstProseParagraph,
  parseKeyBullets,
  parseNumericValue,
  parseProperties,
  parseRange,
  parseSavingThrowTypes,
  parseTitle,
  parseWeight,
  splitList,
  splitListWithGrouping,
} from './parsingUtils';
export { endTimer, startTimer } from './performanceUtils';
export { loadSharedData } from './sharedData';
export type { SharedData } from './sharedData';
export {
  extractAbilitySaveTags,
  extractAllTags,
  extractConditionTags,
  extractContentTypeTags,
  extractDamageTags,
  extractItemMechanicTags,
  extractLoreTags,
  extractMonsterMechanicTags,
  extractMovementTags,
  extractOrganizationalTags,
  applyAuthoredAspects,
  applyAuthoredFeatureAspects,
  featureAnchor,
  stampAnchors,
} from './taggingUtils';
export type { TagExtractionOptions } from './taggingUtils';
export {
  blankFrontmatter,
  clean,
  filePathToSlug,
  plain,
  readLines,
  stripMarkdown,
  toKebabCase,
} from './textUtils';
export type { ContentType, GeneratorModule } from './types';
export {
  getRarityFromCR,
  validateMetadata,
  validateTag,
} from './validationUtils';
export type { ValidationResult } from './validationUtils';

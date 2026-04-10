/**
 * @fileoverview Metadata Module Barrel Export
 * @description Re-exports all metadata generation utilities for convenient imports.
 *
 * @module lib/metadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

export { runWithCli } from './cliRunner';
export { contentHash, fnv1a32 } from './contentHash';
export {
    ensureDirectory,
    getMatchingFiles,
    safeReadFile,
    safeWriteFile
} from './fileUtils';
export { GameData, ItemData } from './gameData';
export {
    getContentDirectory,
    getMetadataBackend,
    getMetadataOutputPath,
    getMetaSubdir,
    runGenerator
} from './generatorUtils';
export type { GeneratorConfig, StorageAdapter } from './generatorUtils';
export {
    parseCharges,
    parseDamageTypesDealt,
    parseKeyBullets,
    parseNumericValue,
    parseProperties,
    parseRange,
    parseSavingThrowTypes,
    parseTitle,
    parseWeight,
    splitList,
    splitListWithGrouping
} from './parsingUtils';
export { endTimer, startTimer } from './performanceUtils';
export { loadSharedData } from './sharedData';
export type { SharedData } from './sharedData';
export { syncMetadata } from './syncService';
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
    extractOrganizationalTags
} from './taggingUtils';
export type { TagExtractionOptions } from './taggingUtils';
export {
    clean,
    filePathToSlug,
    readLines,
    stripMarkdown,
    toKebabCase
} from './textUtils';
export type { ContentType, GeneratorModule, SyncResult } from './types';
export {
    getRarityFromCR,
    validateMetadata,
    validateTag
} from './validationUtils';
export type { ValidationResult } from './validationUtils';


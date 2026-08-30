/**
 * @fileoverview Filesystem Rule Repository
 * @description Implements `RuleRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/rules/`.
 *
 * @module lib/db/content/adapters/fs/fsRuleRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { RuleRepository } from '../../repositories/ruleRepository';
import type { RuleMetadata } from '../../schemas/ruleMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed rule repository.
 *
 * @class FsRuleRepository
 * @extends {FsMetadataRepository<RuleMetadata>}
 * @implements {RuleRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `rules/`, chapter folders included.
 */
class FsRuleRepository
  extends FsMetadataRepository<RuleMetadata>
  implements RuleRepository
{
  constructor() {
    super('rules');
  }
}

/** @type {RuleRepository} */
export const fsRuleRepository: RuleRepository = new FsRuleRepository();

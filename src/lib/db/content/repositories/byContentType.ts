/**
 * @fileoverview Content-Type Repository Registry
 * @description The one map from searchable content type to the repository
 * serving it. API routes (discovery, browse) consume this instead of
 * hand-rolling their own bindings.
 *
 * @module lib/db/content/repositories/byContentType
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import type { BaseMetadata } from '@/lib/db/content/schemas/baseMetadata';
import type { SearchContentType } from '@/modules/search/domain/contentTypes';
import { bloodlineRepository } from './bloodlineRepository';
import { featRepository } from './featRepository';
import { heirloomRepository } from './heirloomRepository';
import { monsterRepository } from './monsterRepository';
import { ruleRepository } from './ruleRepository';
import { specializationRepository } from './specializationRepository';
import { spellRepository } from './spellRepository';
import { trinketRepository } from './trinketRepository';
import { vocationRepository } from './vocationRepository';
import { worldRepository } from './worldRepository';

/**
 * The card-level fields registry consumers read. `image` is optional across
 * the schemas and absent from the shared base, so it is named here.
 *
 * @typedef {object} ContentRecord
 */
export type ContentRecord = BaseMetadata & { image?: string };

/**
 * Searchable content type mapped to the repository that serves it. Reading
 * through the ports keeps consumers on whichever backend the deployment runs.
 *
 * @constant
 */
export const REPOSITORIES_BY_TYPE: Record<
  SearchContentType,
  { list(locale: string): Promise<ContentRecord[]> }
> = {
  bloodlines: bloodlineRepository,
  feats: featRepository,
  heirlooms: heirloomRepository,
  monsters: monsterRepository,
  rules: ruleRepository,
  specializations: specializationRepository,
  spells: spellRepository,
  trinkets: trinketRepository,
  vocations: vocationRepository,
  world: worldRepository,
};

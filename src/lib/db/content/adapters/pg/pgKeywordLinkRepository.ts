/**
 * @fileoverview PostgreSQL Keyword Link Repository (MikroORM)
 * @description Implements `KeywordLinkRepository` by reading `produces` and
 * `consumes` from every file-level content table. Migration 027 added the pair
 * and 028 added `produces`, both with GIN indexes.
 *
 * Ten queries rather than one union: MikroORM addresses entities, not tables,
 * and the row shapes differ everywhere except the four columns read here.
 *
 * @module lib/db/content/adapters/pg/pgKeywordLinkRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import { BloodlineEntity } from '@/lib/db/orm/entities/BloodlineEntity';
import { FeatEntity } from '@/lib/db/orm/entities/FeatEntity';
import { HeirloomEntity } from '@/lib/db/orm/entities/HeirloomEntity';
import { MonsterEntity } from '@/lib/db/orm/entities/MonsterEntity';
import { RuleEntity } from '@/lib/db/orm/entities/RuleEntity';
import { SpecializationEntity } from '@/lib/db/orm/entities/SpecializationEntity';
import { SpellEntity } from '@/lib/db/orm/entities/SpellEntity';
import { TrinketEntity } from '@/lib/db/orm/entities/TrinketEntity';
import { VocationEntity } from '@/lib/db/orm/entities/VocationEntity';
import { WorldEntity } from '@/lib/db/orm/entities/WorldEntity';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { EntityClass } from '@mikro-orm/core';
import type {
  KeywordLink,
  KeywordLinkRepository,
} from '../../repositories/keywordLinkRepository';

const log = logger.child({ module: 'PgKeywordLinkRepository' });

/** Every file-level table carrying the shard columns. Mirrors migration 028. */
const ENTITIES = [
  BloodlineEntity,
  FeatEntity,
  HeirloomEntity,
  MonsterEntity,
  RuleEntity,
  SpecializationEntity,
  SpellEntity,
  TrinketEntity,
  VocationEntity,
  WorldEntity,
] as unknown as EntityClass<KeywordLinkRow>[];

/**
 * The four columns the graph reads, common to every content entity.
 *
 * @interface KeywordLinkRow
 * @property {string} file - Source path
 * @property {string} link - Route without a locale prefix
 * @property {string[]} produces - Shard ids defined
 * @property {string[]} consumes - Shard ids ingested
 */
interface KeywordLinkRow {
  file?: string | null;
  link?: string | null;
  produces?: string[] | null;
  consumes?: string[] | null;
}

/**
 * PostgreSQL-backed keyword link repository.
 *
 * @class PgKeywordLinkRepository
 * @implements {KeywordLinkRepository}
 */
class PgKeywordLinkRepository implements KeywordLinkRepository {
  /**
   * Collects every row that defines or ingests a shard.
   *
   * Invalidation is best effort, so a failure returns nothing rather than
   * throwing: a page write must not fail because the graph was unreachable.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<KeywordLink[]>} Participating records
   */
  async listLinks(locale: string): Promise<KeywordLink[]> {
    try {
      const em = await getEM();
      const links: KeywordLink[] = [];

      for (const entity of ENTITIES) {
        const rows = await em.find(entity, { locale } as never);

        for (const row of rows as KeywordLinkRow[]) {
          const produces = row.produces ?? [];
          const consumes = row.consumes ?? [];
          if (!row.file || (!produces.length && !consumes.length)) continue;

          links.push({
            file: row.file,
            link: row.link ?? '',
            produces,
            consumes,
          });
        }
      }

      return links;
    } catch (error) {
      log.warning('Keyword link lookup failed', {
        locale,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

/** @property {KeywordLinkRepository} pgKeywordLinkRepository - Singleton instance. */
export const pgKeywordLinkRepository: KeywordLinkRepository =
  new PgKeywordLinkRepository();

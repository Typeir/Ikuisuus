/**
 * @fileoverview MikroORM entity reflection utilities.
 * @description Converts MikroORM entity instances to and from plain records
 * using the property metadata from `orm.getMetadata()`.
 *
 * @module lib/db/orm/reflect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @example
 * const allMeta = orm.getMetadata();
 * const record  = entityToRecord(allMeta, monsterRow, 'MonsterEntity', HASH_SKIP);
 * const init    = recordToEntityInit(allMeta, 'SpellEntity', bridgedJson);
 */

import type { MetadataStorage } from '@mikro-orm/core';
import { ReferenceKind } from '@mikro-orm/core';

/**
 * Cross-entity association property kinds. Skipped by both converters.
 */
const RELATION_KINDS = new Set<ReferenceKind>([
  ReferenceKind.MANY_TO_ONE,
  ReferenceKind.ONE_TO_MANY,
  ReferenceKind.MANY_TO_MANY,
  ReferenceKind.ONE_TO_ONE,
]);

/**
 * Default skip set for `entityToRecord` content hash payloads.
 * Excludes `id`, `locale`, and `versionHash`.
 */
export const HASH_SKIP: ReadonlySet<string> = new Set([
  'id',
  'locale',
  'versionHash',
]);

/**
 * Converts a loaded MikroORM entity instance to a plain JS record using the
 * property metadata for `className`.
 *
 * Omits primary-key, relation, and `skip`-listed properties; recurses embedded
 * value objects; copies remaining scalars by value.
 *
 * @param {MetadataStorage} allMeta - Full ORM metadata storage from `orm.getMetadata()`
 * @param {object} entity - Loaded entity instance (or embedded VO instance)
 * @param {string} className - Class name to resolve in `allMeta` (e.g. `'MonsterEntity'`)
 * @param {ReadonlySet<string>} [skip] - Property names to exclude from the output
 * @returns {Record<string, unknown>} Plain record derived from the entity
 */
export function entityToRecord(
  allMeta: MetadataStorage,
  entity: object,
  className: string,
  skip: ReadonlySet<string> = new Set(),
): Record<string, unknown> {
  const meta = allMeta.get(className);
  const ent = entity as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const prop of Object.values(meta.properties)) {
    if (prop.primary || skip.has(prop.name) || RELATION_KINDS.has(prop.kind)) {
      continue;
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      const sub = ent[prop.name];
      if (sub != null && typeof sub === 'object') {
        result[prop.name] = entityToRecord(
          allMeta,
          sub as object,
          prop.type,
          skip,
        );
      }
    } else {
      result[prop.name] = ent[prop.name];
    }
  }

  return result;
}

/**
 * Builds a MikroORM `em.create()` init payload from a plain JSON record using
 * the property metadata for `className`.
 *
 * Writes only keys present in `record`; omits primary-key and relation
 * properties; recurses embedded value objects.
 *
 * @param {MetadataStorage} allMeta - Full ORM metadata storage from `orm.getMetadata()`
 * @param {string} className - Target entity or embeddable class name
 * @param {Record<string, unknown>} record - Source JSON record whose keys match entity property names
 * @returns {Record<string, unknown>} Init payload ready for `em.create(EntityClass, payload)`
 */
export function recordToEntityInit(
  allMeta: MetadataStorage,
  className: string,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const meta = allMeta.get(className);
  const init: Record<string, unknown> = {};

  for (const prop of Object.values(meta.properties)) {
    if (prop.primary || RELATION_KINDS.has(prop.kind)) continue;
    if (!(prop.name in record)) continue;

    if (prop.kind === ReferenceKind.EMBEDDED) {
      const sub = record[prop.name];
      if (sub != null && typeof sub === 'object') {
        init[prop.name] = recordToEntityInit(
          allMeta,
          prop.type,
          sub as Record<string, unknown>,
        );
      } else {
        init[prop.name] = sub;
      }
    } else {
      init[prop.name] = record[prop.name];
    }
  }

  return init;
}

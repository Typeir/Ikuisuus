/**
 * @fileoverview MikroORM Entity Reflection Utilities
 * @description Pure functions for converting between MikroORM entity instances
 * and plain JS records, driven entirely by decorator-derived metadata. No field
 * names are hardcoded — the `MetadataStorage` produced by `orm.getMetadata()`
 * is the sole source of truth for property names, kinds, and embedded types.
 *
 * Both functions are intentionally stateless and accept `MetadataStorage` as an
 * explicit argument so they remain pure and testable without an active ORM
 * connection. Callers initialise the ORM once and pass `orm.getMetadata()`.
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
 * Property kinds that represent cross-entity associations.
 * These are always skipped by both converters — callers handle relation
 * payloads explicitly after the base record is built.
 */
const RELATION_KINDS = new Set<ReferenceKind>([
  ReferenceKind.MANY_TO_ONE,
  ReferenceKind.ONE_TO_MANY,
  ReferenceKind.MANY_TO_MANY,
  ReferenceKind.ONE_TO_ONE,
]);

/**
 * Default skip set for `entityToRecord` when building content hash payloads.
 * Excludes the synthetic `id` PK, the multi-tenancy `locale` discriminator,
 * and the `versionHash` field itself (the hash must not include its own value).
 */
export const HASH_SKIP: ReadonlySet<string> = new Set([
  'id',
  'locale',
  'versionHash',
]);

/**
 * Converts a loaded MikroORM entity instance to a plain JS record by iterating
 * the decorator-derived property metadata for `className`.
 *
 * Traversal rules:
 * - Primary-key properties are always omitted.
 * - Properties whose names appear in `skip` are omitted.
 * - Relation properties (1:m, m:1, m:n, 1:1) are omitted.
 * - Embedded value-object properties are recursed using the embedded class name.
 * - All remaining scalar properties are copied by value.
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
 * Builds a MikroORM `em.create()` init payload from a plain JSON record by
 * iterating the decorator-derived property metadata for `className`.
 *
 * Only properties that are present as keys in `record` are written to the init
 * object, so entity default values apply for absent fields. Primary-key and
 * relation properties are never written; the caller adds FK references manually
 * before passing to `em.create`.
 *
 * Embedded value objects in the record are recursed using the metadata for the
 * embedded class, producing a nested plain object that MikroORM accepts
 * directly in `em.create`.
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

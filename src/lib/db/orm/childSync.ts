/**
 * @fileoverview Child-row sync contract for entities with `1:m` collections.
 * @description Entities expose a static `syncChildren` that the sync driver calls
 * after upserting the parent row. The context keeps ORM types out of the entity
 * layer.
 *
 * @module lib/db/orm/childSync
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { EntityClass } from './schema/registry';

/**
 * Operations a `syncChildren` implementation may use.
 *
 * @interface ChildSyncContext
 * @property {Function} init - Builds an init payload from a record by entity property metadata
 * @property {Function} create - Creates a child row from an init payload
 */
export interface ChildSyncContext {
  init(
    entityClass: EntityClass,
    record: Record<string, unknown>,
  ): Record<string, unknown>;
  create(entityClass: EntityClass, data: Record<string, unknown>): unknown;
}

/**
 * An entity that owns child rows.
 *
 * @interface ChildSyncing
 * @property {Function} syncChildren - Creates this entity's child rows from a source record
 */
export interface ChildSyncing {
  syncChildren(
    ctx: ChildSyncContext,
    parent: unknown,
    record: Record<string, unknown>,
  ): void;
}

/**
 * Narrows an entity class to one declaring `syncChildren`.
 *
 * @param {unknown} entityClass - Candidate entity class
 * @returns {entityClass is ChildSyncing} True when the static is present
 */
export function hasChildSync(entityClass: unknown): entityClass is ChildSyncing {
  return (
    typeof entityClass === 'function' &&
    typeof (entityClass as Partial<ChildSyncing>).syncChildren === 'function'
  );
}

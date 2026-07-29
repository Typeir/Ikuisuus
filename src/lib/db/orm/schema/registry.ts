/**
 * @fileoverview Symbol-keyed metadata registry for the in-house ORM decorators.
 * @description MikroORM's own decorators bucket metadata by `constructor.name`,
 * which SWC mangles in minified server builds — two entities both named `n`
 * collapse into one record and the second silently overwrites the first.
 *
 * This registry hangs the collected definition off the class object under a
 * module-private `Symbol` instead. Symbol identity is by reference, so it is
 * unaffected by renaming, and the class object itself is the key.
 *
 * @module lib/db/orm/schema/registry
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { EntitySchema } from '@mikro-orm/core';
import type { TableConstraintOptions } from './types';

/** Storage slot for a class's collected property and constraint definitions. */
const DEFINITION = Symbol('ikuisuus.orm.definition');

/** Storage slot for the `EntitySchema` built from a completed definition. */
const SCHEMA = Symbol('ikuisuus.orm.schema');

/**
 * Mutable definition accumulated by the field and constraint decorators.
 *
 * @interface EntityDefinition
 * @property {Record<string, unknown>} properties - Property name to EntitySchema property definition.
 * @property {TableConstraintOptions[]} indexes - Table-level indexes.
 * @property {TableConstraintOptions[]} uniques - Table-level unique constraints.
 */
export interface EntityDefinition {
  properties: Record<string, unknown>;
  indexes: TableConstraintOptions[];
  uniques: TableConstraintOptions[];
}

/** Any class constructor the decorators can be applied to. */
export type EntityClass = abstract new (...args: never[]) => unknown;

/**
 * Returns the definition owned by this exact class, creating it on first use.
 *
 * A subclass must not mutate its parent's record, so ownership is checked with
 * `Object.hasOwn` and any inherited definition is shallow-copied rather than
 * shared.
 *
 * @param {EntityClass} target - Class collecting the definition.
 * @returns {EntityDefinition} The class's own mutable definition.
 */
export const getOwnDefinition = (target: EntityClass): EntityDefinition => {
  const holder = target as unknown as Record<symbol, EntityDefinition>;

  if (!Object.hasOwn(target, DEFINITION)) {
    const inherited = holder[DEFINITION];
    Object.defineProperty(target, DEFINITION, {
      value: {
        properties: { ...(inherited?.properties ?? {}) },
        indexes: [...(inherited?.indexes ?? [])],
        uniques: [...(inherited?.uniques ?? [])],
      } satisfies EntityDefinition,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }

  return holder[DEFINITION];
};

/**
 * Restores the authored name onto a class constructor.
 *
 * `Function.prototype.name` is configurable, so the authored name can be
 * written back over whatever the minifier produced. MikroORM reads
 * `class.name` when an `EntitySchema` references a class, so this must run
 * before the schema is constructed.
 *
 * @param {EntityClass} target - Class whose name is being restored.
 * @param {string} name - Authored entity name.
 */
export const restoreClassName = (target: EntityClass, name: string): void => {
  Object.defineProperty(target, 'name', { value: name, configurable: true });
};

/**
 * Associates a built schema with its class.
 *
 * @param {EntityClass} target - Class the schema was built from.
 * @param {EntitySchema} schema - Schema to store.
 */
export const setSchema = (target: EntityClass, schema: EntitySchema): void => {
  Object.defineProperty(target, SCHEMA, {
    value: schema,
    configurable: true,
    enumerable: false,
    writable: true,
  });
};

/**
 * Reads the schema previously built for a class.
 *
 * @param {EntityClass} target - Decorated entity or embeddable class.
 * @returns {EntitySchema | undefined} The stored schema, if the class was decorated.
 */
export const getSchema = (target: EntityClass): EntitySchema | undefined => {
  const holder = target as unknown as Record<symbol, EntitySchema | undefined>;
  return Object.hasOwn(target, SCHEMA) ? holder[SCHEMA] : undefined;
};

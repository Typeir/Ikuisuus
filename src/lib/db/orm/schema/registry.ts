/**
 * @fileoverview Symbol-keyed metadata registry for the in-house ORM decorators.
 * @description Stores ORM decorator metadata on a class object under a
 * module-private Symbol keyed by class reference, immune to name mangling.
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
 * Shallow-copies an inherited definition onto the class on first access.
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
 * Restores the authored name onto a class constructor via configurable
 * `Function.prototype.name`. Must run before the EntitySchema is built.
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

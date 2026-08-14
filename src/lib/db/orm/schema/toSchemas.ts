/**
 * @fileoverview Resolves decorated classes into MikroORM `EntitySchema` instances.
 * @description Maps a list of entity classes to the schema each decorator
 * built. Throws on any class that has no schema.
 *
 * @module lib/db/orm/schema/toSchemas
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { EntitySchema } from '@mikro-orm/core';
import { getSchema, type EntityClass } from './registry';

/**
 * Maps decorated entity and embeddable classes to their schemas.
 *
 * @param {EntityClass[]} classes - Decorated classes, in registration order.
 * @returns {EntitySchema[]} Schemas ready for the MikroORM `entities` option.
 * @throws {Error} When a class carries no schema, naming the offending class.
 */
export const toSchemas = (classes: EntityClass[]): EntitySchema[] =>
  classes.map((cls, index) => {
    const schema = getSchema(cls);

    if (!schema) {
      throw new Error(
        `[orm] entities[${index}] (${cls.name}) has no schema. Decorate it with @OrmEntity or @OrmEmbeddable.`,
      );
    }

    return schema;
  });

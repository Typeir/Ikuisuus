/**
 * @fileoverview Barrel for the ORM schema layer.
 * @description Re-exports the schema decorators, registry helpers, and type
 * options.
 *
 * @module lib/db/orm/schema
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

export {
  OrmEmbeddable,
  OrmEmbedded,
  OrmEntity,
  OrmIndex,
  OrmManyToOne,
  OrmOneToMany,
  OrmPrimaryKey,
  OrmProperty,
  OrmUnique,
} from './decorators';
export { getSchema, restoreClassName, type EntityClass } from './registry';
export { toSchemas } from './toSchemas';
export type {
  EmbeddedFieldOptions,
  EntityOptions,
  ManyToOneOptions,
  OneToManyOptions,
  ScalarFieldOptions,
  TableConstraintOptions,
} from './types';

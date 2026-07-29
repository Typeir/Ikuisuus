/**
 * @fileoverview Barrel for the in-house ORM schema layer.
 * @description Entity modules import their decorators from here; `ormConfig`
 * imports `toSchemas`.
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

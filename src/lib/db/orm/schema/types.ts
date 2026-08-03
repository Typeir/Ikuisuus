/**
 * @fileoverview Option shapes for the in-house ORM schema decorators.
 * @description Mirrors the subset of MikroORM's property options this codebase
 * actually uses. Every option maps 1:1 onto an `EntitySchema` property
 * definition, so the emitter is a pass-through rather than a translation layer.
 *
 * @module lib/db/orm/schema/types
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Options accepted by a persisted scalar column.
 *
 * @interface ScalarFieldOptions
 * @property {string} type - Explicit MikroORM type. Required: reflection is unavailable.
 * @property {string} [fieldName] - Database column name when it differs from the property.
 * @property {string} [columnType] - Explicit SQL column type.
 * @property {boolean} [nullable] - Whether the column accepts NULL.
 * @property {string | number | boolean | null} [default] - Literal column default.
 * @property {string} [defaultRaw] - Raw SQL column default.
 * @property {boolean} [primary] - Whether the column participates in the primary key.
 * @property {boolean} [autoincrement] - Whether the column is a serial.
 * @property {boolean} [unique] - Whether a unique constraint is emitted.
 * @property {boolean} [index] - Whether an index is emitted.
 * @property {number} [length] - Column length for sized types.
 * @property {boolean} [lazy] - Whether the column is excluded from default selects.
 * @property {boolean} [hidden] - Whether the column is hidden from serialisation.
 * @property {boolean} [version] - Whether the column is an optimistic-lock version.
 * @property {Function} [onCreate] - Value factory applied on insert.
 * @property {Function} [onUpdate] - Value factory applied on update.
 */
export interface ScalarFieldOptions {
  type: string;
  fieldName?: string;
  columnType?: string;
  nullable?: boolean;
  default?: string | number | boolean | null;
  defaultRaw?: string;
  primary?: boolean;
  autoincrement?: boolean;
  unique?: boolean;
  index?: boolean;
  length?: number;
  lazy?: boolean;
  hidden?: boolean;
  version?: boolean;
  onCreate?: (entity: never) => unknown;
  onUpdate?: (entity: never) => unknown;
}

/**
 * Options accepted by an owning many-to-one relation.
 *
 * @interface ManyToOneOptions
 * @property {string} entity - Target entity name as a literal string, never a class reference.
 * @property {string} [fieldName] - Foreign key column name.
 * @property {boolean} [nullable] - Whether the foreign key accepts NULL.
 * @property {string} [deleteRule] - Referential ON DELETE action.
 * @property {string} [updateRule] - Referential ON UPDATE action.
 * @property {boolean} [index] - Whether the foreign key column is indexed.
 * @property {boolean} [primary] - Whether the relation forms the primary key.
 * @property {boolean} [mapToPk] - Whether the property holds the raw key rather than a reference.
 */
export interface ManyToOneOptions {
  entity: string;
  fieldName?: string;
  nullable?: boolean;
  deleteRule?: string;
  updateRule?: string;
  index?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
}

/**
 * Options accepted by an inverse one-to-many collection.
 *
 * @interface OneToManyOptions
 * @property {string} entity - Target entity name as a literal string.
 * @property {string} mappedBy - Owning-side property on the target entity.
 * @property {boolean} [orphanRemoval] - Whether detached children are deleted.
 * @property {boolean} [eager] - Whether the collection is always loaded.
 * @property {Record<string, 'asc' | 'desc'>} [orderBy] - Default collection ordering.
 */
export interface OneToManyOptions {
  entity: string;
  mappedBy: string;
  orphanRemoval?: boolean;
  eager?: boolean;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Options accepted by an embedded value object.
 *
 * @interface EmbeddedFieldOptions
 * @property {string} entity - Embeddable name as a literal string.
 * @property {string | boolean} [prefix] - Column prefix, or false to inline unprefixed.
 * @property {boolean} [object] - Whether the embeddable is stored as a single JSON column.
 * @property {boolean} [nullable] - Whether the embeddable may be absent.
 * @property {boolean} [array] - Whether the property holds an array of embeddables.
 */
export interface EmbeddedFieldOptions {
  entity: string;
  prefix?: string | boolean;
  object?: boolean;
  nullable?: boolean;
  array?: boolean;
}

/**
 * Options accepted by a table-level index or unique constraint.
 *
 * @interface TableConstraintOptions
 * @property {string[]} properties - Property names participating in the constraint.
 * @property {string} [name] - Explicit constraint name.
 */
export interface TableConstraintOptions {
  properties: string[];
  name?: string;
}

/**
 * Options accepted by a persisted entity class.
 *
 * @interface EntityOptions
 * @property {string} tableName - Database table backing the entity.
 * @property {string} [schema] - Database schema qualifier.
 */
export interface EntityOptions {
  tableName: string;
  schema?: string;
}

/**
 * @fileoverview In-house ORM decorators safe under class-name minification.
 * @description Drop-in replacements for MikroORM's `@Entity`, `@Property`,
 * `@PrimaryKey`, `@ManyToOne`, `@OneToMany`, `@Embedded`, `@Embeddable`,
 * `@Index` and `@Unique`. Entity and relation targets are literal strings, not
 * class references. `@OrmIndex` and `@OrmUnique` must sit below `@OrmEntity`
 * because class decorators run bottom-up.
 *
 * @module lib/db/orm/schema/decorators
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { EntitySchema } from '@mikro-orm/core';
import {
  getOwnDefinition,
  restoreClassName,
  setSchema,
  type EntityClass,
} from './registry';
import type {
  EmbeddedFieldOptions,
  EntityOptions,
  ManyToOneOptions,
  OneToManyOptions,
  ScalarFieldOptions,
  TableConstraintOptions,
} from './types';

/**
 * Records a property definition against the class owning the prototype.
 *
 * @param {object} prototype - Decorated class prototype.
 * @param {string | symbol} propertyKey - Decorated property name.
 * @param {unknown} definition - EntitySchema property definition.
 */
const addProperty = (
  prototype: object,
  propertyKey: string | symbol,
  definition: unknown,
): void => {
  const target = prototype.constructor as EntityClass;
  getOwnDefinition(target).properties[String(propertyKey)] = definition;
};

/**
 * Declares a persisted scalar column.
 *
 * @param {ScalarFieldOptions} options - Column options; `type` is mandatory.
 * @returns {PropertyDecorator} Property decorator.
 */
export const OrmProperty =
  (options: ScalarFieldOptions): PropertyDecorator =>
  (prototype, propertyKey) => {
    addProperty(prototype, propertyKey, { ...options });
  };

/**
 * Declares a primary key column.
 *
 * @param {ScalarFieldOptions} options - Column options; `type` is mandatory.
 * @returns {PropertyDecorator} Property decorator.
 */
export const OrmPrimaryKey =
  (options: ScalarFieldOptions): PropertyDecorator =>
  (prototype, propertyKey) => {
    addProperty(prototype, propertyKey, { ...options, primary: true });
  };

/**
 * Declares the owning side of a many-to-one relation.
 *
 * @param {ManyToOneOptions} options - Relation options; `entity` is a literal name.
 * @returns {PropertyDecorator} Property decorator.
 */
export const OrmManyToOne =
  (options: ManyToOneOptions): PropertyDecorator =>
  (prototype, propertyKey) => {
    addProperty(prototype, propertyKey, { kind: 'm:1', ...options });
  };

/**
 * Declares the inverse side of a one-to-many relation.
 *
 * @param {OneToManyOptions} options - Relation options; `entity` is a literal name.
 * @returns {PropertyDecorator} Property decorator.
 */
export const OrmOneToMany =
  (options: OneToManyOptions): PropertyDecorator =>
  (prototype, propertyKey) => {
    addProperty(prototype, propertyKey, { kind: '1:m', ...options });
  };

/**
 * Declares an embedded value object.
 *
 * @param {EmbeddedFieldOptions} options - Embedded options; `entity` is a literal name.
 * @returns {PropertyDecorator} Property decorator.
 */
export const OrmEmbedded =
  (options: EmbeddedFieldOptions): PropertyDecorator =>
  (prototype, propertyKey) => {
    addProperty(prototype, propertyKey, { kind: 'embedded', ...options });
  };

/**
 * Declares a table-level index.
 *
 * @param {TableConstraintOptions} options - Indexed properties and optional name.
 * @returns {ClassDecorator} Class decorator; must sit below `@OrmEntity`.
 */
export const OrmIndex =
  (options: TableConstraintOptions): ClassDecorator =>
  (target) => {
    getOwnDefinition(target as unknown as EntityClass).indexes.push({
      ...options,
    });
  };

/**
 * Declares a table-level unique constraint.
 *
 * @param {TableConstraintOptions} options - Constrained properties and optional name.
 * @returns {ClassDecorator} Class decorator; must sit below `@OrmEntity`.
 */
export const OrmUnique =
  (options: TableConstraintOptions): ClassDecorator =>
  (target) => {
    getOwnDefinition(target as unknown as EntityClass).uniques.push({
      ...options,
    });
  };

/**
 * Declares a persisted entity and builds its `EntitySchema`.
 *
 * @param {string} name - Authored entity name, used as the MikroORM entity name.
 * @param {EntityOptions} options - Table mapping options.
 * @returns {ClassDecorator} Class decorator; must sit above `@OrmIndex`/`@OrmUnique`.
 */
export const OrmEntity =
  (name: string, options: EntityOptions): ClassDecorator =>
  (target) => {
    const cls = target as unknown as EntityClass;
    restoreClassName(cls, name);

    const definition = getOwnDefinition(cls);
    setSchema(
      cls,
      new EntitySchema({
        class: cls as never,
        tableName: options.tableName,
        schema: options.schema,
        properties: definition.properties as never,
        indexes: definition.indexes,
        uniques: definition.uniques,
      }),
    );
  };

/**
 * Declares an embeddable value object and builds its `EntitySchema`.
 *
 * @param {string} name - Authored embeddable name, referenced by `OrmEmbedded`.
 * @returns {ClassDecorator} Class decorator.
 */
export const OrmEmbeddable =
  (name: string): ClassDecorator =>
  (target) => {
    const cls = target as unknown as EntityClass;
    restoreClassName(cls, name);

    const definition = getOwnDefinition(cls);
    setSchema(
      cls,
      new EntitySchema({
        class: cls as never,
        embeddable: true,
        properties: definition.properties as never,
      }),
    );
  };

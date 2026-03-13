/**
 * @fileoverview MikroORM Entity — SchemaMigration
 * @description Decorator-based entity tracking which SQL migrations have been applied.
 *
 * @module lib/db/orm/entities/SchemaMigrationEntity
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * MikroORM entity for the `schema_migrations` table.
 */
@Entity({ tableName: 'schema_migrations' })
export class SchemaMigrationEntity {
  @PrimaryKey({ type: 'string' })
  name!: string;

  @Property({
    type: 'Date',
    fieldName: 'applied_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  appliedAt!: Date;
}

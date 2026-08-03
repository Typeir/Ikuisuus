/**
 * @fileoverview MikroORM Entity — SchemaMigration
 * @description Decorator-based entity tracking which SQL migrations have been applied.
 *
 * @module lib/db/orm/entities/SchemaMigrationEntity
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { OrmEntity, OrmPrimaryKey, OrmProperty } from '@/lib/db/orm/schema';

/**
 * MikroORM entity for the `schema_migrations` table.
 */
@OrmEntity('SchemaMigrationEntity', { tableName: 'schema_migrations' })
export class SchemaMigrationEntity {
  @OrmPrimaryKey({ type: 'string' })
  name!: string;

  @OrmProperty({
    type: 'Date',
    fieldName: 'applied_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  appliedAt!: Date;
}

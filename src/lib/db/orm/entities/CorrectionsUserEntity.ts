/**
 * @fileoverview MikroORM Entity — CorrectionsUser
 * @description Decorator-based entity for the `corrections_users` table.
 *
 * @module lib/db/orm/entities/CorrectionsUserEntity
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { OrmEntity, OrmPrimaryKey, OrmProperty } from '@/lib/db/orm/schema';

/**
 * MikroORM entity for the `corrections_users` table.
 */
@OrmEntity('CorrectionsUserEntity', { tableName: 'corrections_users' })
export class CorrectionsUserEntity {
  @OrmPrimaryKey({ type: 'string' })
  id!: string;

  @OrmProperty({ type: 'string', unique: true })
  username!: string;

  @OrmProperty({ type: 'string', fieldName: 'password_hash' })
  passwordHash!: string;

  @OrmProperty({ type: 'string', default: 'editor' })
  role!: string;

  @OrmProperty({
    type: 'Date',
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt!: Date;

  @OrmProperty({
    type: 'Date',
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date | null;
}

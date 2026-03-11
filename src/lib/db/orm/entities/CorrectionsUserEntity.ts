/**
 * @fileoverview MikroORM Entity — CorrectionsUser
 * @description Decorator-based entity for the `corrections_users` table.
 *
 * @module lib/db/orm/entities/CorrectionsUserEntity
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * MikroORM entity for the `corrections_users` table.
 */
@Entity({ tableName: 'corrections_users' })
export class CorrectionsUserEntity {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', unique: true })
  username!: string;

  @Property({ type: 'string', fieldName: 'password_hash' })
  passwordHash!: string;

  @Property({ type: 'string', default: 'editor' })
  role!: string;

  @Property({
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt!: Date;

  @Property({
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date | null;
}

/**
 * @fileoverview MikroORM Entity — Feat
 * @description Decorator-based entity for the `feats` table. The optional
 * ability-score increase is represented as a nullable `@Embedded` value object
 * with a flat column prefix — no JSONB storage, consistent with every other
 * content entity in this codebase.
 *
 * Columns produced:
 * - Core: locale, slug, title, file, link, description, prerequisite,
 *   has_prerequisite, tags, index_version, version_hash
 * - Embedded prefix `ability_increase_`:
 *   ability_increase_abilities, ability_increase_amount,
 *   ability_increase_maximum
 *
 * @module lib/db/orm/entities/FeatEntity
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    Embeddable,
    Embedded,
    Entity,
    Index,
    PrimaryKey,
    Property,
    Unique,
} from '@mikro-orm/core';

/* ─────────────────────────  Embeddable VO  ─────────────────────────── */

/**
 * Optional ability-score increase value object — maps to
 * `ability_increase_abilities`, `ability_increase_amount`,
 * `ability_increase_maximum`.
 *
 * All fields are nullable because the entire embed may be absent for feats
 * that do not grant an ability score increase.
 */
@Embeddable()
export class FeatAbilityIncreaseEmbed {
  @Property({ type: 'string[]', nullable: true })
  abilities?: string[] | null;

  @Property({
    type: 'number',
    columnType: 'smallint',
    nullable: true,
  })
  amount?: number | null;

  @Property({
    type: 'number',
    columnType: 'smallint',
    nullable: true,
  })
  maximum?: number | null;
}

/* ────────────────────────────  Entity  ─────────────────────────────── */

/**
 * MikroORM entity for the `feats` table.
 */
@Entity({ tableName: 'feats' })
@Unique({ properties: ['locale', 'slug'] })
@Index({
  properties: ['locale'],
  name: 'feats_locale_idx',
})
export class FeatEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @Property({ type: 'string' })
  locale!: string;

  @Property({ type: 'string' })
  slug!: string;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'string' })
  file!: string;

  @Property({ type: 'string' })
  link!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ type: 'string', nullable: true })
  prerequisite?: string | null;

  @Property({ type: 'boolean', fieldName: 'has_prerequisite' })
  hasPrerequisite!: boolean;

  @Embedded(() => FeatAbilityIncreaseEmbed, {
    prefix: 'ability_increase_',
    object: false,
    nullable: true,
  })
  abilityIncrease?: FeatAbilityIncreaseEmbed | null;

  @Property({ type: 'string[]' })
  tags: string[] = [];

  @Property({
    type: 'number',
    fieldName: 'index_version',
    columnType: 'smallint',
    nullable: true,
  })
  indexVersion?: number | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @Property({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}

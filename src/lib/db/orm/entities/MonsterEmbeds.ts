/**
 * @fileoverview MikroORM Embeddables - Monster
 * @description Value objects embedded into the `monsters` table.
 *
 * @module lib/db/orm/entities/MonsterEmbeds
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { OrmEmbeddable, OrmProperty } from '@/lib/db/orm/schema';

/**
 * Defence value object — maps to `defence_value`, `defence_deflect`,
 * `defence_dodge`, `defence_notes`, `defence_raw`.
 */
@OrmEmbeddable('MonsterDefenceEmbed')
export class MonsterDefenceEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  value?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  deflect?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  dodge?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  notes?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Hit points value object — maps to `hp_average`, `hp_formula`, `hp_raw`.
 */
@OrmEmbeddable('MonsterHPEmbed')
export class MonsterHPEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  average?: number | null;

  @OrmProperty({ type: 'string', nullable: true })
  formula?: string | null;

  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;
}

/**
 * Speed value object — maps to `speed_raw`, `speed_walk`, `speed_fly`,
 * `speed_climb`, `speed_swim`, `speed_burrow`
 */
@OrmEmbeddable('MonsterSpeedEmbed')
export class MonsterSpeedEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  walk?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  fly?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  climb?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  swim?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  burrow?: number | null;

  @OrmProperty({ type: 'boolean', nullable: true })
  hover?: boolean | null;
}

/**
 * Ability scores value object — maps to `score_str`, `score_dex`, etc.
 */
@OrmEmbeddable('MonsterScoreEmbed')
export class MonsterScoreEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Saving throw bonuses value object — maps to `save_str`, `save_dex`, etc.
 */
@OrmEmbeddable('MonsterSaveEmbed')
export class MonsterSaveEmbed {
  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  str?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  dex?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  con?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  wis?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  cha?: number | null;
}

/**
 * Senses value object — maps to `sense_raw`, `sense_passive_descry`,
 * `sense_passive_discern`, `sense_darkvision`, `sense_blindsight`,
 * `sense_tremorsense`, `sense_truesight`.
 */
@OrmEmbeddable('MonsterSenseEmbed')
export class MonsterSenseEmbed {
  @OrmProperty({ type: 'string', nullable: true })
  raw?: string | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'passive_descry',
    columnType: 'smallint',
    nullable: true,
  })
  passiveDescry?: number | null;

  @OrmProperty({
    type: 'number',
    fieldName: 'passive_discern',
    columnType: 'smallint',
    nullable: true,
  })
  passiveDiscern?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  darkvision?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  blindsight?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  tremorsense?: number | null;

  @OrmProperty({ type: 'number', columnType: 'smallint', nullable: true })
  truesight?: number | null;
}

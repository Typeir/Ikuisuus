import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'monster' })
export class MonsterEntity {
  @Property({ type: 'string', nullable: true })
  name?: string | null;

  @Property({ type: 'string', nullable: true })
  cr?: string | null;

  @Property({
    type: 'number',
    fieldName: 'proficiency_bonus',
    columnType: 'smallint',
    nullable: true,
  })
  proficiencyBonus?: number | null;

  @Property({ type: 'number', fieldName: 'str_score', nullable: true })
  strScore?: number | null;

  @Property({ type: 'number', fieldName: 'dex_score', nullable: true })
  dexScore?: number | null;
}

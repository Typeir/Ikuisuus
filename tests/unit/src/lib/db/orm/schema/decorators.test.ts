/**
 * ORM Schema Decorators Unit Tests
 *
 * @fileoverview Unit tests for entity decorators and the minification regression.
 *
 * @module tests/unit/lib/db/orm/schema/decorators
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  OrmEmbeddable,
  OrmEmbedded,
  OrmEntity,
  OrmIndex,
  OrmManyToOne,
  OrmOneToMany,
  OrmPrimaryKey,
  OrmProperty,
  OrmUnique,
} from '@/lib/db/orm/schema/decorators';
import { getOwnDefinition, getSchema, type EntityClass } from '@/lib/db/orm/schema/registry';
import { MikroORM } from '@mikro-orm/postgresql';
import { describe, expect, it } from 'vitest';

/** Builds a class whose constructor name mimics SWC's mangled output. */
const makeMangled = () => class n {};

const asClass = (value: unknown) => value as EntityClass;

describe('decorators', () => {
  describe('field collection', () => {
    it('should record a scalar column with its explicit type', () => {
      class Target {}
      OrmProperty({ type: 'string', fieldName: 'bp_label' })(
        Target.prototype,
        'bpLabel',
      );

      expect(getOwnDefinition(asClass(Target)).properties.bpLabel).toEqual({
        type: 'string',
        fieldName: 'bp_label',
      });
    });

    it('should mark a primary key as primary', () => {
      class Target {}
      OrmPrimaryKey({ type: 'number', autoincrement: true })(
        Target.prototype,
        'id',
      );

      expect(getOwnDefinition(asClass(Target)).properties.id).toEqual({
        type: 'number',
        autoincrement: true,
        primary: true,
      });
    });

    it('should tag relations and embeddables with their kind', () => {
      class Target {}
      OrmManyToOne({ entity: 'BloodlineEntity', fieldName: 'bloodline_id' })(
        Target.prototype,
        'bloodline',
      );
      OrmOneToMany({ entity: 'BoonEntity', mappedBy: 'bloodline' })(
        Target.prototype,
        'boons',
      );
      OrmEmbedded({ entity: 'ChargesEmbed', prefix: 'charges_' })(
        Target.prototype,
        'charges',
      );

      const props = getOwnDefinition(asClass(Target)).properties;

      expect(props.bloodline).toMatchObject({ kind: 'm:1', entity: 'BloodlineEntity' });
      expect(props.boons).toMatchObject({ kind: '1:m', mappedBy: 'bloodline' });
      expect(props.charges).toMatchObject({ kind: 'embedded', prefix: 'charges_' });
    });

    it('should accumulate table-level indexes and uniques', () => {
      class Target {}
      OrmIndex({ properties: ['locale'], name: 'locale_idx' })(Target);
      OrmUnique({ properties: ['locale', 'slug'] })(Target);

      const def = getOwnDefinition(asClass(Target));

      expect(def.indexes).toEqual([{ properties: ['locale'], name: 'locale_idx' }]);
      expect(def.uniques).toEqual([{ properties: ['locale', 'slug'] }]);
    });
  });

  describe('schema construction', () => {
    it('should build a schema carrying the authored name and table', () => {
      class Target {}
      OrmPrimaryKey({ type: 'number', autoincrement: true })(Target.prototype, 'id');
      OrmEntity('TargetEntity', { tableName: 'targets' })(Target);

      const schema = getSchema(asClass(Target));

      expect(schema).toBeDefined();
      expect(schema?.meta.className).toBe('TargetEntity');
      expect(Target.name).toBe('TargetEntity');
    });

    it('should mark embeddables as embeddable', () => {
      class Target {}
      OrmProperty({ type: 'number' })(Target.prototype, 'value');
      OrmEmbeddable('ValueEmbed')(Target);

      expect(getSchema(asClass(Target))?.meta.embeddable).toBe(true);
    });
  });

  describe('minification regression', () => {
    it('should register two identically mangled classes as distinct entities', async () => {
      const first = makeMangled();
      const second = makeMangled();
      expect(first.name).toBe('n');
      expect(second.name).toBe('n');

      OrmPrimaryKey({ type: 'number', autoincrement: true })(first.prototype, 'id');
      OrmProperty({ type: 'string' })(first.prototype, 'slug');
      OrmOneToMany({ entity: 'MangledChild', mappedBy: 'parent' })(
        first.prototype,
        'children',
      );
      OrmEntity('MangledParent', { tableName: 'mangled_parents' })(first);

      OrmPrimaryKey({ type: 'number', autoincrement: true })(second.prototype, 'id');
      OrmManyToOne({ entity: 'MangledParent', fieldName: 'parent_id' })(
        second.prototype,
        'parent',
      );
      OrmEntity('MangledChild', { tableName: 'mangled_children' })(second);

      const orm = await MikroORM.init({
        clientUrl: 'postgresql://t:t@127.0.0.1:5432/t',
        connect: false,
        debug: false,
        discovery: { warnWhenNoEntities: false },
        entities: [getSchema(asClass(first))!, getSchema(asClass(second))!],
      });

      const metadata = orm.getMetadata().getAll();

      expect(Object.keys(metadata).sort()).toEqual(['MangledChild', 'MangledParent']);
      expect(metadata.MangledParent.tableName).toBe('mangled_parents');
      expect(metadata.MangledChild.tableName).toBe('mangled_children');
      expect(metadata.MangledParent.properties.children.type).toBe('MangledChild');
      expect(metadata.MangledParent.class).toBe(first);

      await orm.close(true);
    });
  });
});

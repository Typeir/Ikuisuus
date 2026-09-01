/**
 * ORM Schema Registry Unit Tests
 *
 * @fileoverview Tests for the Symbol-keyed entity definition registry.
 *
 * @module tests/unit/src/lib/db/orm/schema/registry.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  getOwnDefinition,
  getSchema,
  restoreClassName,
  setSchema,
  type EntityClass,
} from '@/lib/db/orm/schema/registry';
import { EntitySchema } from '@mikro-orm/core';
import { describe, expect, it } from 'vitest';

describe('registry', () => {
  describe('getOwnDefinition', () => {
    it('should create an empty definition on first access', () => {
      class Fresh {}
      const def = getOwnDefinition(Fresh as unknown as EntityClass);

      expect(def.properties).toEqual({});
      expect(def.indexes).toEqual([]);
      expect(def.uniques).toEqual([]);
    });

    it('should return the same definition on repeated access', () => {
      class Stable {}
      const first = getOwnDefinition(Stable as unknown as EntityClass);
      first.properties.id = { type: 'number' };

      expect(getOwnDefinition(Stable as unknown as EntityClass)).toBe(first);
      expect(getOwnDefinition(Stable as unknown as EntityClass).properties).toHaveProperty('id');
    });

    it('should copy an inherited definition rather than share it', () => {
      class Parent {}
      getOwnDefinition(Parent as unknown as EntityClass).properties.id = {
        type: 'number',
      };

      class Child extends Parent {}
      const childDef = getOwnDefinition(Child as unknown as EntityClass);
      childDef.properties.extra = { type: 'string' };

      expect(childDef.properties).toHaveProperty('id');
      expect(childDef.properties).toHaveProperty('extra');
      expect(
        getOwnDefinition(Parent as unknown as EntityClass).properties,
      ).not.toHaveProperty('extra');
    });

    it('should not leak definitions between unrelated classes', () => {
      class Left {}
      class Right {}
      getOwnDefinition(Left as unknown as EntityClass).properties.only = {
        type: 'string',
      };

      expect(
        getOwnDefinition(Right as unknown as EntityClass).properties,
      ).toEqual({});
    });
  });

  describe('restoreClassName', () => {
    it('should overwrite a minified constructor name', () => {
      const mangled = class n {};
      expect(mangled.name).toBe('n');

      restoreClassName(mangled as unknown as EntityClass, 'MonsterEntity');

      expect(mangled.name).toBe('MonsterEntity');
    });

    it('should keep distinct names for classes that mangled identically', () => {
      const makeMangled = () => class n {};
      const first = makeMangled();
      const second = makeMangled();

      restoreClassName(first as unknown as EntityClass, 'FirstEntity');
      restoreClassName(second as unknown as EntityClass, 'SecondEntity');

      expect(first.name).toBe('FirstEntity');
      expect(second.name).toBe('SecondEntity');
    });
  });

  describe('schema storage', () => {
    it('should return undefined before a schema is set', () => {
      class Undecorated {}
      expect(getSchema(Undecorated as unknown as EntityClass)).toBeUndefined();
    });

    it('should round-trip a stored schema', () => {
      class Stored {}
      const schema = new EntitySchema({
        name: 'Stored',
        properties: { id: { type: 'number', primary: true } },
      });

      setSchema(Stored as unknown as EntityClass, schema);

      expect(getSchema(Stored as unknown as EntityClass)).toBe(schema);
    });

    it('should not report a parent schema as the child own schema', () => {
      class SchemaParent {}
      setSchema(
        SchemaParent as unknown as EntityClass,
        new EntitySchema({ name: 'SchemaParent', properties: {} }),
      );

      class SchemaChild extends SchemaParent {}

      expect(getSchema(SchemaChild as unknown as EntityClass)).toBeUndefined();
    });
  });
});

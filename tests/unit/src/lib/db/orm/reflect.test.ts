/**
 * @fileoverview Unit tests — ORM Entity Reflection Utilities
 * @description Tests for `entityToRecord` and `recordToEntityInit` using a
 * minimal mock of MikroORM's `MetadataStorage`. No real ORM connection is
 * required; the mock supplies just the property descriptor objects that the
 * functions inspect.
 *
 * @module tests/unit/lib/db/orm/reflect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires src/lib/db/orm/reflect Module under test
 */

import {
  entityToRecord,
  HASH_SKIP,
  recordToEntityInit,
} from '@/lib/db/orm/reflect';
import type { MetadataStorage } from '@mikro-orm/core';
import { ReferenceKind } from '@mikro-orm/core';
import { describe, expect, it } from 'vitest';

/**
 * Builds a minimal `MetadataStorage` stub for a set of named entity class
 * descriptors, each containing a flat `properties` map.
 *
 * @param {Record<string, Record<string, object>>} classes - Map of className → propertyName → property descriptor
 * @returns {MetadataStorage} Minimal stub satisfying the functions under test
 */
function buildMetaStub(
  classes: Record<string, Record<string, object>>,
): MetadataStorage {
  return {
    get: (className: string) => ({
      properties: classes[className] ?? {},
    }),
  } as unknown as MetadataStorage;
}

describe('HASH_SKIP', () => {
  it('contains id, locale and versionHash', () => {
    expect(HASH_SKIP.has('id')).toBe(true);
    expect(HASH_SKIP.has('locale')).toBe(true);
    expect(HASH_SKIP.has('versionHash')).toBe(true);
  });
});

describe('entityToRecord', () => {
  const allMeta = buildMetaStub({
    TestEntity: {
      id: { name: 'id', kind: ReferenceKind.SCALAR, primary: true },
      slug: { name: 'slug', kind: ReferenceKind.SCALAR, primary: false },
      title: { name: 'title', kind: ReferenceKind.SCALAR, primary: false },
      rel: { name: 'rel', kind: ReferenceKind.ONE_TO_MANY, primary: false },
      embed: {
        name: 'embed',
        kind: ReferenceKind.EMBEDDED,
        primary: false,
        type: 'EmbedClass',
      },
    },
    EmbedClass: {
      value: { name: 'value', kind: ReferenceKind.SCALAR, primary: false },
      notes: { name: 'notes', kind: ReferenceKind.SCALAR, primary: false },
    },
  });

  it('copies scalar properties', () => {
    const entity = {
      id: 1,
      slug: 'foo',
      title: 'Foo',
      rel: [],
      embed: { value: 10, notes: 'bar' },
    };
    const result = entityToRecord(allMeta, entity, 'TestEntity');
    expect(result.slug).toBe('foo');
    expect(result.title).toBe('Foo');
  });

  it('omits primary key', () => {
    const entity = { id: 1, slug: 'foo', title: 'Foo', rel: [], embed: {} };
    const result = entityToRecord(allMeta, entity, 'TestEntity');
    expect('id' in result).toBe(false);
  });

  it('omits relation properties', () => {
    const entity = { id: 1, slug: 'foo', title: 'Foo', rel: [], embed: {} };
    const result = entityToRecord(allMeta, entity, 'TestEntity');
    expect('rel' in result).toBe(false);
  });

  it('recurses into embedded value objects', () => {
    const entity = {
      id: 1,
      slug: 'foo',
      title: 'Foo',
      rel: [],
      embed: { value: 42, notes: 'hi' },
    };
    const result = entityToRecord(allMeta, entity, 'TestEntity');
    expect(result.embed).toEqual({ value: 42, notes: 'hi' });
  });

  it('omits properties in the skip set', () => {
    const entity = { id: 1, slug: 'foo', title: 'Foo', rel: [], embed: {} };
    const result = entityToRecord(
      allMeta,
      entity,
      'TestEntity',
      new Set(['slug']),
    );
    expect('slug' in result).toBe(false);
    expect(result.title).toBe('Foo');
  });

  it('omits embed when the embed value is null', () => {
    const entity = { id: 1, slug: 'foo', title: 'Foo', rel: [], embed: null };
    const result = entityToRecord(allMeta, entity, 'TestEntity');
    expect('embed' in result).toBe(false);
  });
});

describe('recordToEntityInit', () => {
  const allMeta = buildMetaStub({
    TargetEntity: {
      id: { name: 'id', kind: ReferenceKind.SCALAR, primary: true },
      slug: { name: 'slug', kind: ReferenceKind.SCALAR, primary: false },
      level: { name: 'level', kind: ReferenceKind.SCALAR, primary: false },
      rel: { name: 'rel', kind: ReferenceKind.MANY_TO_ONE, primary: false },
      embed: {
        name: 'embed',
        kind: ReferenceKind.EMBEDDED,
        primary: false,
        type: 'SubEmbed',
      },
    },
    SubEmbed: {
      dc: { name: 'dc', kind: ReferenceKind.SCALAR, primary: false },
      ability: { name: 'ability', kind: ReferenceKind.SCALAR, primary: false },
    },
  });

  it('copies present scalar properties', () => {
    const record = { slug: 'bar', level: 3 };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect(init.slug).toBe('bar');
    expect(init.level).toBe(3);
  });

  it('omits primary key even if present in record', () => {
    const record = { id: 99, slug: 'bar' };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect('id' in init).toBe(false);
  });

  it('omits relation properties even if present in record', () => {
    const record = { slug: 'bar', rel: { id: 1 } };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect('rel' in init).toBe(false);
  });

  it('omits properties absent from the record', () => {
    const record = { slug: 'bar' };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect('level' in init).toBe(false);
  });

  it('recurses into embedded value object sub-records', () => {
    const record = { slug: 'bar', embed: { dc: 14, ability: 'con' } };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect(init.embed).toEqual({ dc: 14, ability: 'con' });
  });

  it('passes null through for nullable embedded fields', () => {
    const record = { slug: 'bar', embed: null };
    const init = recordToEntityInit(allMeta, 'TargetEntity', record);
    expect(init.embed).toBeNull();
  });
});

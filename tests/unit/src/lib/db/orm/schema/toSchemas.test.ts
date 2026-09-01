/**
 * ORM toSchemas Unit Tests
 *
 * @fileoverview Tests for resolving decorated classes into EntitySchema instances.
 *
 * @module tests/unit/src/lib/db/orm/schema/toSchemas.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { OrmEntity, OrmPrimaryKey } from '@/lib/db/orm/schema/decorators';
import { getSchema, type EntityClass } from '@/lib/db/orm/schema/registry';
import { toSchemas } from '@/lib/db/orm/schema/toSchemas';
import { describe, expect, it } from 'vitest';

/** Builds a decorated entity class with a single primary key. */
const makeEntity = (name: string, tableName: string) => {
  class Target {}
  OrmPrimaryKey({ type: 'number', autoincrement: true })(Target.prototype, 'id');
  OrmEntity(name, { tableName })(Target);
  return Target;
};

describe('toSchemas', () => {
  it('should map decorated classes to their schemas in order', () => {
    const first = makeEntity('FirstEntity', 'firsts');
    const second = makeEntity('SecondEntity', 'seconds');

    const schemas = toSchemas([
      first as unknown as EntityClass,
      second as unknown as EntityClass,
    ]);

    expect(schemas).toHaveLength(2);
    expect(schemas[0]).toBe(getSchema(first as unknown as EntityClass));
    expect(schemas[1]).toBe(getSchema(second as unknown as EntityClass));
  });

  it('should return an empty array for no classes', () => {
    expect(toSchemas([])).toEqual([]);
  });

  it('should throw naming the undecorated class rather than fail during discovery', () => {
    class Undecorated {}

    expect(() => toSchemas([Undecorated as unknown as EntityClass])).toThrow(
      /entities\[0\] \(Undecorated\) has no schema/,
    );
  });

  it('should report the index of the offending class', () => {
    const ok = makeEntity('OkEntity', 'oks');
    class Missing {}

    expect(() =>
      toSchemas([ok as unknown as EntityClass, Missing as unknown as EntityClass]),
    ).toThrow(/entities\[1\]/);
  });
});

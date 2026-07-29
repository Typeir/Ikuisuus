/**
 * ORM Schema Barrel Unit Tests
 *
 * @fileoverview Verifies the schema layer's public surface stays intact.
 *
 * @module tests/unit/lib/db/orm/schema/index
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import * as schema from '@/lib/db/orm/schema';
import { describe, expect, it } from 'vitest';

describe('schema barrel', () => {
  it('should export every decorator entity modules depend on', () => {
    for (const name of [
      'OrmEntity',
      'OrmEmbeddable',
      'OrmEmbedded',
      'OrmIndex',
      'OrmManyToOne',
      'OrmOneToMany',
      'OrmPrimaryKey',
      'OrmProperty',
      'OrmUnique',
    ]) {
      expect(typeof schema[name as keyof typeof schema]).toBe('function');
    }
  });

  it('should export the config and registry helpers', () => {
    expect(typeof schema.toSchemas).toBe('function');
    expect(typeof schema.getSchema).toBe('function');
    expect(typeof schema.restoreClassName).toBe('function');
  });

  it('should not re-export MikroORM decorators', () => {
    for (const name of ['Entity', 'Property', 'PrimaryKey', 'ManyToOne', 'OneToMany']) {
      expect(schema).not.toHaveProperty(name);
    }
  });
});

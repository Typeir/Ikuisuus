/**
 * MikroORM Configuration Unit Tests
 *
 * @fileoverview Tests for the ORM configuration shape and values.
 *
 * @module tests/unit/src/lib/db/orm/ormConfig.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  process.env.NODE_ENV = originalNodeEnv;
});

describe('ormConfig', () => {
  it('should include all 37 entity and embeddable schemas', async () => {
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');

    expect(ormConfig.entities).toBeDefined();
    expect(ormConfig.entities).toHaveLength(37);
  });

  it('should register every entity as a resolved EntitySchema', async () => {
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');
    const { EntitySchema } = await import('@mikro-orm/core');

    for (const entity of ormConfig.entities ?? []) {
      expect(entity).toBeInstanceOf(EntitySchema);
    }
  });

  it('should carry authored entity names rather than minified ones', async () => {
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');

    const names = (ormConfig.entities ?? []).map(
      (entity) => (entity as { name: string }).name,
    );

    expect(names).toContain('MonsterEntity');
    expect(names).toContain('FeatFeatureEntity');
    expect(names).toContain('MonsterACEmbed');
    expect(new Set(names).size).toBe(names.length);
  });

  it('should use DATABASE_URL as clientUrl', async () => {
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');

    expect(ormConfig.clientUrl).toBe('postgresql://localhost:5432/test');
  });

  it('should enable debug outside production', async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');

    expect(ormConfig.debug).toBe(true);
  });

  it('should disable debug in production', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { ormConfig } = await import('@/lib/db/orm/ormConfig');

    expect(ormConfig.debug).toBe(false);
  });
});

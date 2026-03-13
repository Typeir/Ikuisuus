/**
 * CorrectionsUserEntity Unit Tests
 *
 * @fileoverview Tests for the CorrectionsUser MikroORM entity class.
 *
 * @module tests/unit/lib/db/orm/entities/CorrectionsUserEntity
 */

import { CorrectionsUserEntity } from '@/lib/db/orm/entities/CorrectionsUserEntity';
import { describe, expect, it } from 'vitest';

describe('CorrectionsUserEntity', () => {
  it('should be constructable', () => {
    const entity = new CorrectionsUserEntity();
    expect(entity).toBeInstanceOf(CorrectionsUserEntity);
  });

  it('should accept field assignments', () => {
    const entity = new CorrectionsUserEntity();
    entity.id = 'user-1';
    entity.username = 'admin';
    entity.passwordHash = 'hashed';
    entity.role = 'admin';
    entity.createdAt = new Date('2025-01-01');
    entity.lastLoginAt = new Date('2025-06-01');

    expect(entity.id).toBe('user-1');
    expect(entity.username).toBe('admin');
    expect(entity.passwordHash).toBe('hashed');
    expect(entity.role).toBe('admin');
    expect(entity.createdAt).toEqual(new Date('2025-01-01'));
    expect(entity.lastLoginAt).toEqual(new Date('2025-06-01'));
  });

  it('should allow null for lastLoginAt', () => {
    const entity = new CorrectionsUserEntity();
    entity.lastLoginAt = null;
    expect(entity.lastLoginAt).toBeNull();
  });
});

/**
 * BannedIpEntity Unit Tests
 *
 * @fileoverview Tests for the BannedIp MikroORM entity class.
 *
 * @module tests/unit/lib/db/orm/entities/BannedIpEntity
 */

import { BannedIpEntity } from '@/lib/db/orm/entities/BannedIpEntity';
import { describe, expect, it } from 'vitest';

describe('BannedIpEntity', () => {
  it('should be constructable', () => {
    const entity = new BannedIpEntity();
    expect(entity).toBeInstanceOf(BannedIpEntity);
  });

  it('should accept field assignments', () => {
    const entity = new BannedIpEntity();
    entity.id = 1;
    entity.range = '192.168.1.0/24';
    entity.reason = 'spam';
    entity.bannedAt = new Date('2025-01-01');
    entity.sourceIp = '10.0.0.1';

    expect(entity.id).toBe(1);
    expect(entity.range).toBe('192.168.1.0/24');
    expect(entity.reason).toBe('spam');
    expect(entity.bannedAt).toEqual(new Date('2025-01-01'));
    expect(entity.sourceIp).toBe('10.0.0.1');
  });

  it('should allow undefined for sourceIp', () => {
    const entity = new BannedIpEntity();
    expect(entity.sourceIp).toBeUndefined();
  });
});

/**
 * AuditRecordEntity Unit Tests
 *
 * @fileoverview Tests for the AuditRecord MikroORM entity class.
 *
 * @module tests/unit/lib/db/orm/entities/AuditRecordEntity
 */

import { AuditRecordEntity } from '@/lib/db/orm/entities/AuditRecordEntity';
import { describe, expect, it } from 'vitest';

describe('AuditRecordEntity', () => {
  it('should be constructable', () => {
    const entity = new AuditRecordEntity();
    expect(entity).toBeInstanceOf(AuditRecordEntity);
  });

  it('should accept field assignments', () => {
    const entity = new AuditRecordEntity();
    entity.id = 1;
    entity.contentPath = 'en/test.mdx';
    entity.baseSha = 'abc123';
    entity.prUrl = 'https://github.com/org/repo/pull/1';
    entity.status = 'submitted';
    entity.tokenId = 'editor-a';
    entity.timestamp = new Date('2025-01-01');

    expect(entity.id).toBe(1);
    expect(entity.contentPath).toBe('en/test.mdx');
    expect(entity.baseSha).toBe('abc123');
    expect(entity.prUrl).toBe('https://github.com/org/repo/pull/1');
    expect(entity.status).toBe('submitted');
    expect(entity.tokenId).toBe('editor-a');
    expect(entity.timestamp).toEqual(new Date('2025-01-01'));
  });

  it('should allow undefined for prUrl', () => {
    const entity = new AuditRecordEntity();
    expect(entity.prUrl).toBeUndefined();
  });
});

/**
 * Audit Adapter Interface Unit Tests
 *
 * @fileoverview Tests that AuditAdapter and AuditRecord interfaces are usable.
 *
 * @module tests/unit/src/lib/db/auditAdapter.test
 */

import type { AuditAdapter, AuditRecord } from '@/lib/db/auditAdapter';
import { describe, expect, it, vi } from 'vitest';

describe('AuditAdapter interface', () => {
  it('should define write and read methods', () => {
    const adapter: AuditAdapter = {
      write: vi.fn(),
      read: vi.fn(),
    };

    expect(typeof adapter.write).toBe('function');
    expect(typeof adapter.read).toBe('function');
  });

  it('should accept a valid AuditRecord', () => {
    const record: AuditRecord = {
      content_path: 'en/monsters/aboleth.sheet.mdx',
      base_sha: 'abc123',
      pr_url: 'https://github.com/org/repo/pull/42',
      status: 'submitted',
      token_id: 'editor-a',
      timestamp: '2025-01-01T00:00:00.000Z',
    };

    expect(record.status).toBe('submitted');
    expect(record.pr_url).toBeDefined();
  });

  it('should accept all status values', () => {
    const statuses: AuditRecord['status'][] = [
      'submitted',
      'conflict',
      'error',
    ];

    for (const status of statuses) {
      const record: AuditRecord = {
        content_path: 'path',
        base_sha: 'sha',
        status,
        token_id: 'id',
      };
      expect(record.status).toBe(status);
    }
  });
});

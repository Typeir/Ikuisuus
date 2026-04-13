/**
 * @fileoverview Unit Tests — draftMetadata schemas
 * @description Validates the DraftMetadata, DraftInput, and DraftConcurrencyExpectation
 * type shapes.
 *
 * @module tests/unit/lib/db/content/schemas/draftMetadata
 */

import type {
  DraftConcurrencyExpectation,
  DraftInput,
  DraftMetadata,
  DraftStatus,
} from '@/lib/db/content/schemas/draftMetadata';
import { describe, expect, it } from 'vitest';

describe('DraftStatus', () => {
  it('supports the active status', () => {
    const status: DraftStatus = 'active';
    expect(status).toBe('active');
  });

  it('supports the pending status', () => {
    const status: DraftStatus = 'pending';
    expect(status).toBe('pending');
  });

  it('supports the archived status', () => {
    const status: DraftStatus = 'archived';
    expect(status).toBe('archived');
  });
});

describe('DraftMetadata', () => {
  it('has all required fields', () => {
    const draft: DraftMetadata = {
      id: 1,
      locale: 'en',
      slug: 'monsters/goblin',
      content: '# Goblin',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(draft.id).toBe(1);
    expect(draft.locale).toBe('en');
    expect(draft.slug).toBe('monsters/goblin');
    expect(draft.status).toBe('active');
  });

  it('accepts optional versionHash as a string', () => {
    const draft: DraftMetadata = {
      id: 2,
      locale: 'en',
      slug: 'spells/fireball',
      content: '# Fireball',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      versionHash: 'abc123def',
    };

    expect(draft.versionHash).toBe('abc123def');
  });

  it('accepts null as versionHash for legacy rows', () => {
    const draft: DraftMetadata = {
      id: 3,
      locale: 'es',
      slug: 'items/sword',
      content: '# Sword',
      status: 'archived',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      versionHash: null,
    };

    expect(draft.versionHash).toBeNull();
  });
});

describe('DraftInput', () => {
  it('has locale, slug, and content fields', () => {
    const input: DraftInput = {
      locale: 'en',
      slug: 'monsters/albedo',
      content: '# Albedo',
    };

    expect(input.locale).toBe('en');
    expect(input.slug).toBe('monsters/albedo');
    expect(input.content).toBe('# Albedo');
  });

  it('accepts optional status override', () => {
    const input: DraftInput = {
      locale: 'en',
      slug: 'spells/test',
      content: '# Test',
      status: 'pending',
    };

    expect(input.status).toBe('pending');
  });
});

describe('DraftConcurrencyExpectation', () => {
  it('can be empty', () => {
    const cursor: DraftConcurrencyExpectation = {};
    expect(cursor.updatedAt).toBeUndefined();
    expect(cursor.versionHash).toBeUndefined();
  });

  it('accepts updatedAt and versionHash fields', () => {
    const cursor: DraftConcurrencyExpectation = {
      updatedAt: '2024-01-01T00:00:00Z',
      versionHash: 'hash123',
    };

    expect(cursor.updatedAt).toBe('2024-01-01T00:00:00Z');
    expect(cursor.versionHash).toBe('hash123');
  });

  it('accepts null values for both fields', () => {
    const cursor: DraftConcurrencyExpectation = {
      updatedAt: null,
      versionHash: null,
    };

    expect(cursor.updatedAt).toBeNull();
    expect(cursor.versionHash).toBeNull();
  });
});

/**
 * @fileoverview Bloodline Sync Worker Unit Tests
 * @description Tests for hash-based bloodline metadata syncing.
 *
 * @module tests/unit/lib/metadata/syncBloodlines
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { contentHash } from '@/lib/metadata/contentHash';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/orm/entities', () => ({
  BloodlineEntity: class {},
  BloodlineBoonEntity: class {},
}));

vi.mock('fs', () => {
  const mocks = {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  };
  return { ...mocks, default: mocks };
});

let syncBloodlines: (
  em: any,
  locale: string,
) => Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
}>;
let fsMock: {
  existsSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  const mod = await import('@/lib/metadata/syncBloodlines');
  syncBloodlines = mod.syncBloodlines;

  const fs = await import('fs');
  fsMock = {
    existsSync: vi.mocked(fs.existsSync),
    readdirSync: vi.mocked(fs.readdirSync),
    readFileSync: vi.mocked(fs.readFileSync),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('syncBloodlines', () => {
  it('should return empty sync stats when metadata directory does not exist', async () => {
    fsMock.existsSync.mockReturnValue(false);

    const em = {
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
      flush: vi.fn(),
    };

    const result = await syncBloodlines(em as never, 'en');

    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 0, deleted: 0 });
  });

  it('should insert new bloodline rows when missing in database', async () => {
    const record = {
      slug: 'empyrean',
      title: 'Empyrean',
      file: 'src/content/en/character-creation/bloodlines/empyrean.mdx',
      link: '/library/character-creation/bloodlines/empyrean',
      coreFeatures: {
        abilityScores: ['DEX +2'],
        movementSpeeds: ['Walk: 30 ft.'],
        senses: ['Darkvision 30 ft.'],
        size: ['Medium'],
        creatureTypes: ['Humanoid'],
      },
      boons: [],
      tags: ['humanoid'],
      indexVersion: 1,
    };

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['empyrean.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(record));

    const em = {
      find: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      create: vi
        .fn()
        .mockImplementation(() => ({ boons: { removeAll: vi.fn() } })),
      remove: vi.fn(),
      flush: vi.fn(),
    };

    const result = await syncBloodlines(em as never, 'en');

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.deleted).toBe(0);
    expect(em.create).toHaveBeenCalled();
  });

  it('should skip unchanged rows when version hash matches', async () => {
    const record = {
      slug: 'foulblood',
      title: 'Foulblood',
      file: 'src/content/en/character-creation/bloodlines/foulblood.mdx',
      link: '/library/character-creation/bloodlines/foulblood',
      coreFeatures: {
        abilityScores: ['CON +2'],
        movementSpeeds: [],
        senses: [],
        size: ['Medium'],
        creatureTypes: ['Humanoid'],
      },
      boons: [],
    };

    const hash = contentHash(record);

    fsMock.existsSync.mockReturnValue(true);
    fsMock.readdirSync.mockReturnValue(['foulblood.metadata.json'] as never);
    fsMock.readFileSync.mockReturnValue(JSON.stringify(record));

    const em = {
      find: vi
        .fn()
        .mockResolvedValue([{ slug: 'foulblood', versionHash: hash }]),
      assign: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
      flush: vi.fn(),
    };

    const result = await syncBloodlines(em as never, 'en');

    expect(result.skipped).toBe(1);
    expect(result.inserted).toBe(0);
    expect(em.assign).not.toHaveBeenCalled();
    expect(em.create).not.toHaveBeenCalled();
  });
});

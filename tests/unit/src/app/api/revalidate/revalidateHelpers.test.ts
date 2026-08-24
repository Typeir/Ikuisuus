/**
 * @fileoverview Unit tests for ISR revalidation helpers
 * @module tests/unit/src/app/api/revalidate/revalidateHelpers.test
 * @description Validates path decomposition, draft archival, suffix
 * classification by directory listing, and deduplicated metadata sync.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/app/api/revalidate/revalidateHelpers
 */

import { ContentType } from '@/lib/metadata/contentTypes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockArchive = vi.fn();
const mockListEntries = vi.fn();
const mockSyncMetadata = vi.fn();

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: { archive: (...a: unknown[]) => mockArchive(...a) },
}));

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: () => ({
    listEntries: (...a: unknown[]) => mockListEntries(...a),
  }),
}));

vi.mock('@/lib/metadata/syncService', () => ({
  syncMetadata: (...a: unknown[]) => mockSyncMetadata(...a),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import {
  archiveDraftForPath,
  classifyByListing,
  extractLocale,
  extractSlugPath,
  syncMetadataForLocales,
} from '@/app/api/revalidate/revalidateHelpers';

beforeEach(() => {
  mockArchive.mockReset().mockResolvedValue(false);
  mockListEntries.mockReset().mockResolvedValue([]);
  mockSyncMetadata.mockReset().mockResolvedValue({});
});

describe('extractLocale', () => {
  it.each([
    ['/en/library/spells/bane', 'en'],
    ['/es/library/spells/bane', 'es'],
    ['/en', 'en'],
  ])('reads the leading segment of %s', (path, expected) => {
    expect(extractLocale(path)).toBe(expected);
  });

  it('returns null for an empty path', () => {
    expect(extractLocale('/')).toBeNull();
  });
});

describe('extractSlugPath', () => {
  it('strips locale and the library segment', () => {
    expect(extractSlugPath('/en/library/items/heirlooms/deep-dredge')).toBe(
      'items/heirlooms/deep-dredge',
    );
  });

  it('strips only the locale when there is no library segment', () => {
    expect(extractSlugPath('/en/spells/bane')).toBe('spells/bane');
  });
});

describe('archiveDraftForPath', () => {
  it('archives for a locale and slug', async () => {
    mockArchive.mockResolvedValue(true);
    await expect(archiveDraftForPath('en', 'spells/bane')).resolves.toBe(true);
    expect(mockArchive).toHaveBeenCalledWith('en', 'spells/bane');
  });

  it('skips when the locale is missing', async () => {
    await expect(archiveDraftForPath(null, 'spells/bane')).resolves.toBe(false);
    expect(mockArchive).not.toHaveBeenCalled();
  });

  it('swallows repository failures', async () => {
    mockArchive.mockRejectedValue(new Error('table missing'));
    await expect(archiveDraftForPath('en', 'spells/bane')).resolves.toBe(false);
  });
});

describe('classifyByListing', () => {
  it('classifies from the suffixed entry matching the slug stem', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'main.mdx', isDirectory: false },
      { name: 'bless.spell.mdx', isDirectory: false },
      { name: 'bane.spell.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'spells/bane')).resolves.toBe(
      ContentType.Spells,
    );
    expect(mockListEntries).toHaveBeenCalledWith('en', 'spells');
  });

  it('lists the root for a top-level slug', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'bane.spell.mdx', isDirectory: false },
    ]);
    await classifyByListing('en', 'bane');
    expect(mockListEntries).toHaveBeenCalledWith('en', '');
  });

  it('ignores directories that share the stem', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'bane.something', isDirectory: true },
      { name: 'bane.spell.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'spells/bane')).resolves.toBe(
      ContentType.Spells,
    );
  });

  it('returns null for an ambiguous sheet suffix', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'albedo.sheet.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'monsters/albedo')).resolves.toBeNull();
  });

  it('resolves a rules suffix', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'conditions.rule.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'rules/conditions')).resolves.toBe(
      ContentType.Rules,
    );
  });

  it('returns null for an unknown suffix', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'bane.wibble.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'spells/bane')).resolves.toBeNull();
  });

  it('does not match a different stem sharing a prefix', async () => {
    mockListEntries.mockResolvedValue([
      { name: 'banewright.spell.mdx', isDirectory: false },
    ]);
    await expect(classifyByListing('en', 'spells/bane')).resolves.toBeNull();
  });

  it('swallows listing failures', async () => {
    mockListEntries.mockRejectedValue(new Error('bucket unreachable'));
    await expect(classifyByListing('en', 'spells/bane')).resolves.toBeNull();
  });
});

describe('syncMetadataForLocales', () => {
  it('syncs one entry per locale and content type', async () => {
    const outcomes = await syncMetadataForLocales(
      new Map([
        ['en', new Set([ContentType.Spells, ContentType.Monsters])],
        ['es', new Set([ContentType.Spells])],
      ]),
    );
    expect(mockSyncMetadata).toHaveBeenCalledTimes(3);
    expect(outcomes.every((o) => o.status === 'ok')).toBe(true);
  });

  it('reports a failure without throwing', async () => {
    mockSyncMetadata.mockRejectedValue(new Error('db down'));
    const outcomes = await syncMetadataForLocales(
      new Map([['en', new Set([ContentType.Spells])]]),
    );
    expect(outcomes).toEqual([
      {
        locale: 'en',
        contentType: ContentType.Spells,
        status: 'error',
        error: 'db down',
      },
    ]);
  });

  it('does nothing for an empty map', async () => {
    await expect(syncMetadataForLocales(new Map())).resolves.toEqual([]);
    expect(mockSyncMetadata).not.toHaveBeenCalled();
  });
});

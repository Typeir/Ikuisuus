/**
 * fsKeywordLinkRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem keyword link adapter: it reads the
 * whole locale tree and keeps only records that define or ingest a shard.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsKeywordLinkRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');

let fsKeywordLinkRepository: typeof import('@/lib/db/content/adapters/fs/fsKeywordLinkRepository').fsKeywordLinkRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import(
    '@/lib/db/content/adapters/fs/fsKeywordLinkRepository'
  );
  fsKeywordLinkRepository = mod.fsKeywordLinkRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Defines a shard. */
const PRODUCER = {
  file: 'src/content/en/rules/effects.rule.mdx',
  link: '/library/rules/effects',
  produces: ['kw--resist'],
  consumes: [],
};

/** Ingests one. */
const CONSUMER = {
  file: 'src/content/en/spells/a.spell.mdx',
  link: '/library/spells/a',
  produces: [],
  consumes: ['kw--resist'],
};

/** Participates in neither direction. */
const BYSTANDER = {
  file: 'src/content/en/spells/b.spell.mdx',
  link: '/library/spells/b',
  produces: [],
  consumes: [],
};

describe('fsKeywordLinkRepository', () => {
  it('should read the whole locale tree, not one subdirectory', async () => {
    readMetadataFiles.mockResolvedValue([]);

    await fsKeywordLinkRepository.listLinks('en');

    expect(readMetadataFiles).toHaveBeenCalledWith('en', '');
  });

  it('should keep records that produce or consume', async () => {
    readMetadataFiles.mockResolvedValue([PRODUCER, CONSUMER, BYSTANDER]);

    const links = await fsKeywordLinkRepository.listLinks('en');

    expect(links.map((l) => l.file)).toEqual([PRODUCER.file, CONSUMER.file]);
  });

  it('should drop a record with no file path', async () => {
    readMetadataFiles.mockResolvedValue([
      { link: '/library/orphan', produces: ['kw--resist'] },
    ]);

    expect(await fsKeywordLinkRepository.listLinks('en')).toEqual([]);
  });

  it('should default both arrays and the link', async () => {
    readMetadataFiles.mockResolvedValue([
      { file: 'a.mdx', produces: ['kw--a'] },
    ]);

    expect(await fsKeywordLinkRepository.listLinks('en')).toEqual([
      { file: 'a.mdx', link: '', produces: ['kw--a'], consumes: [] },
    ]);
  });
});

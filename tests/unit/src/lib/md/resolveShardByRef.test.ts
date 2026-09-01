/**
 * @fileoverview resolveShardByRef Tests
 * @description Covers resolution through the `produces` graph: the shard id a
 * reference names, the single file read it costs, and the boundary that keeps a
 * document's bake to what it writes.
 *
 * @module tests/unit/src/lib/md/resolveShardByRef.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadKeywordGraph = vi.fn();
const producerOf = vi.fn();
const getFile = vi.fn();

vi.mock('@/lib/db/content/keywordGraph', () => ({
  loadKeywordGraph: (...args: unknown[]) => loadKeywordGraph(...args),
  producerOf: (...args: unknown[]) => producerOf(...args),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  getFile: (...args: unknown[]) => getFile(...args),
}));

import {
  resolveDocumentKeywords,
  resolveShardByRef,
  shardIdOf,
} from '@/lib/md/resolveShardByRef';
import {
  extractConsumedKeys,
  extractKeywordRefs,
} from '@/lib/md/extractKeywordRefs';

/** A rules file defining two sections. */
const CONTENT = [
  '## Briefly',
  '',
  'The default duration.',
  '',
  '## Resist',
  '',
  'Save against what imposed it.',
  '',
  '---',
].join('\n');

const PRODUCER = {
  file: 'src/content/en/rules/steel-and-strife/effects.rule.mdx',
  route: '/library/rules/steel-and-strife/effects',
};

beforeEach(() => {
  loadKeywordGraph.mockReset().mockResolvedValue({});
  producerOf.mockReset().mockReturnValue(PRODUCER);
  getFile.mockReset().mockResolvedValue({
    content: CONTENT,
    resolvedPath: PRODUCER.file,
  });
});

afterEach(() => vi.restoreAllMocks());

describe('shardIdOf', () => {
  it('should key a bare reference with an empty namespace segment', () => {
    expect(shardIdOf('resist')).toBe('kw--resist');
  });

  it('should key a namespaced reference under its namespace', () => {
    expect(shardIdOf('condition;Blinded')).toBe('kw-condition-blinded');
  });

  it('should collapse casing and spacing onto one id', () => {
    expect(shardIdOf('Damage Bonus')).toBe(shardIdOf('damage-bonus'));
  });

  it('should agree with the extractor on every normalised reference', () => {
    const prose =
      'Takes [# kw: condition:Prone #], gains [# kw: resist #] and [# kw: Two-Weapon Fighting #].';

    const references = extractKeywordRefs(prose);
    expect(references.length).toBe(3);
    expect(references.map(shardIdOf).sort()).toEqual(
      extractConsumedKeys(prose),
    );
  });
});

describe('resolveShardByRef', () => {
  it('should return the defining section with its route', async () => {
    const shard = await resolveShardByRef('resist', 'en');

    expect(shard).toEqual({
      id: 'kw--resist',
      key: 'resist',
      heading: 'Resist',
      source: 'Save against what imposed it.',
      href: 'library/rules/steel-and-strife/effects#resist',
    });
  });

  it('should read exactly one file', async () => {
    await resolveShardByRef('resist', 'en');

    expect(getFile).toHaveBeenCalledOnce();
    expect(getFile).toHaveBeenCalledWith('en', PRODUCER.file);
  });

  it('should return null when no file produces the id', async () => {
    producerOf.mockReturnValue(null);

    expect(await resolveShardByRef('resist', 'en')).toBeNull();
    expect(getFile).not.toHaveBeenCalled();
  });

  it('should return null when the producing file cannot be read', async () => {
    getFile.mockResolvedValue(null);

    expect(await resolveShardByRef('resist', 'en')).toBeNull();
  });

  it('should return null when the file has no matching heading', async () => {
    getFile.mockResolvedValue({ content: '## Something Else\n\nBody.' });

    expect(await resolveShardByRef('resist', 'en')).toBeNull();
  });

  it('should drop the thematic break a section boundary leaves behind', async () => {
    const shard = await resolveShardByRef('resist', 'en');

    expect(shard?.source.endsWith('---')).toBe(false);
  });

  it('should follow a term to the heading declared to bear it', async () => {
    getFile.mockResolvedValue({
      content: [
        '---',
        'keywords:',
        '  - disposition: Disposition, Reputation and Attitude',
        '---',
        '',
        '# Disposition, Reputation and Attitude',
        '',
        'One mechanic, two names.',
      ].join('\n'),
    });

    const shard = await resolveShardByRef('disposition', 'en');

    expect(shard).toMatchObject({
      id: 'kw--disposition',
      heading: 'Disposition, Reputation and Attitude',
      source: 'One mechanic, two names.',
      href: 'library/rules/steel-and-strife/effects#disposition-reputation-and-attitude',
    });
  });

  it('should keep the id the reference names, not the bearing heading', async () => {
    getFile.mockResolvedValue({
      content: [
        '---',
        'keywords:',
        '  - disposition: Disposition, Reputation and Attitude',
        '---',
        '',
        '# Disposition, Reputation and Attitude',
        '',
        'Body.',
      ].join('\n'),
    });

    const shard = await resolveShardByRef('disposition', 'en');

    expect(shard?.id).toBe(shardIdOf('disposition'));
  });
});

describe('resolveDocumentKeywords', () => {
  it('should return a shard and its stamp for each reference', async () => {
    const { shards, resolutions } = await resolveDocumentKeywords(
      'You may [# kw:resist #] it.',
      'en',
    );

    expect(shards).toHaveLength(1);
    expect(resolutions.resist).toEqual({
      href: 'library/rules/steel-and-strife/effects#resist',
      templateId: 'kw--resist',
      heading: 'Resist',
    });
  });

  it('should resolve nothing for prose with no references', async () => {
    expect(await resolveDocumentKeywords('Plain prose.', 'en')).toEqual({
      shards: [],
      resolutions: {},
    });
    expect(getFile).not.toHaveBeenCalled();
  });

  it('should omit a reference that resolves to nothing', async () => {
    producerOf.mockReturnValue(null);

    const { shards, resolutions } = await resolveDocumentKeywords(
      '[# kw:nonexistent #]',
      'en',
    );

    expect(shards).toEqual([]);
    expect(resolutions).toEqual({});
  });

  /* Following references inside a resolved shard would pull its dependencies
     onto the page, and theirs after that. */
  it('should not follow references living inside a resolved shard', async () => {
    getFile.mockResolvedValue({
      content: '## Resist\n\nSee [# kw:briefly #] for the duration.',
    });

    const { shards } = await resolveDocumentKeywords('[# kw:resist #]', 'en');

    expect(shards).toHaveLength(1);
    expect(shards[0].id).toBe('kw--resist');
  });
});

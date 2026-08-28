/**
 * @fileoverview bakeKeywordShards Unit Tests
 * @description Tests shard collection, deduplication, template emission, and
 * the cases that must bake nothing.
 *
 * @module tests/unit/lib/md/bakeKeywordShards
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/bakeKeywordShards Module under test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getFile = vi.fn();

vi.mock('@/lib/db/content/fileTreeService', () => ({ getFile }));

const { bakeKeywordShards, collectKeywordShards } = await import(
  '@/lib/md/bakeKeywordShards'
);
const { contributeKeyword } = await import('@/lib/md/keywordIndex');

const CONDITIONS = `# Conditions

Intro prose.

## Blinded

- A blinded creature can't see.
- Attack rolls against it have **advantage**.

---

## Prone

Prone prose.
`;

/**
 * Builds a registry holding one condition value.
 *
 * @returns {Map<string, unknown>} Registry with `condition;blinded`
 */
function registryWithBlinded() {
  const registry = new Map();
  contributeKeyword(registry as never, 'condition', {
    anchor: 'blinded',
    heading: 'Blinded',
    filePath: 'rules/steel-and-strife/conditions.rule.mdx',
  });
  return registry;
}

beforeEach(() => {
  getFile.mockReset();
  getFile.mockResolvedValue({ content: CONDITIONS });
});

describe('collectKeywordShards', () => {
  it('should resolve a namespaced reference to its section', async () => {
    const shards = await collectKeywordShards(
      'Targets are [# kw:condition;blinded #].',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards).toHaveLength(1);
    expect(shards[0]).toMatchObject({
      id: 'kw-condition-blinded',
      heading: 'Blinded',
    });
    expect(shards[0].html).toContain('A blinded creature can');
  });

  it('should bake one shard however many times a term is referenced', async () => {
    const source =
      '[# kw:condition;blinded #] and [# kw:condition;Blinded #] and [# kw:condition;blinded #]';

    const shards = await collectKeywordShards(
      source,
      registryWithBlinded() as never,
      'en',
    );

    expect(shards).toHaveLength(1);
    expect(getFile).toHaveBeenCalledTimes(1);
  });

  it('should strip the heading line from the section', async () => {
    const shards = await collectKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards[0].html).not.toContain('<h2');
  });

  it('should strip a trailing thematic break', async () => {
    const shards = await collectKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards[0].html).not.toContain('<hr>');
  });

  it('should skip a reference that resolves to nothing', async () => {
    const shards = await collectKeywordShards(
      '[# kw:condition;swiftness #]',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards).toEqual([]);
    expect(getFile).not.toHaveBeenCalled();
  });

  it('should skip a reference whose file cannot be read', async () => {
    getFile.mockResolvedValue(null);

    const shards = await collectKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards).toEqual([]);
  });
});

describe('bakeKeywordShards', () => {
  it('should append the templates tag when something resolves', async () => {
    const source = 'Targets are [# kw:condition;blinded #].';

    const { source: baked, shards } = await bakeKeywordShards(
      source,
      registryWithBlinded() as never,
    );

    expect(baked).toContain('<KeywordShardTemplates />');
    expect(shards).toHaveLength(1);
  });

  it('should report the heading separately from the shard html', async () => {
    const { shards } = await bakeKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
    );

    expect(shards[0].heading).toBe('Blinded');
    expect(shards[0].html).not.toContain('<strong>Blinded</strong>');
  });

  it('should render markdown structure rather than a flat string', async () => {
    const { shards } = await bakeKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
    );

    expect(shards[0].html).toContain('<ul>');
    expect(shards[0].html).toContain('<li>');
    expect(shards[0].html).toContain('<strong>advantage</strong>');
  });

  it('should leave the original source ahead of the tag', async () => {
    const source = 'Targets are [# kw:condition;blinded #].';

    const { source: baked } = await bakeKeywordShards(
      source,
      registryWithBlinded() as never,
    );

    expect(baked.startsWith(source)).toBe(true);
  });

  it('should return the source untouched when nothing resolves', async () => {
    const source = 'Targets are [# kw:resist #].';

    const { source: baked, shards } = await bakeKeywordShards(
      source,
      registryWithBlinded() as never,
    );

    expect(baked).toBe(source);
    expect(shards).toEqual([]);
  });

  it('should return the source untouched when it has no references', async () => {
    const source = 'Plain prose with no keywords.';

    const { source: baked } = await bakeKeywordShards(
      source,
      registryWithBlinded() as never,
    );

    expect(baked).toBe(source);
    expect(getFile).not.toHaveBeenCalled();
  });
});

/**
 * @fileoverview collectKeywordShards Unit Tests
 * @description Tests shard collection, deduplication, and the cases that must
 * resolve nothing.
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

const { collectKeywordShards } = await import(
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
    expect(shards[0].source).toContain('A blinded creature can');
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

    expect(shards[0].source).not.toContain('## Blinded');
  });

  it('should strip a trailing thematic break', async () => {
    const shards = await collectKeywordShards(
      '[# kw:condition;blinded #]',
      registryWithBlinded() as never,
      'en',
    );

    expect(shards[0].source).not.toMatch(/-{3,}\s*$/);
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

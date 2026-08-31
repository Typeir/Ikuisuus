/**
 * @fileoverview keywordIndexRegistry Unit Tests
 * @description Tests namespace discovery, merge semantics across files, bare
 * term declaration, collision reporting, and resolution.
 *
 * @module tests/unit/lib/md/keywordIndexRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordIndexRegistry Module under test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* Discovery walks the content and directory ports, so the tree is declared here
   rather than written to disk. */
const tree = new Map<string, string>();

vi.mock('@/lib/db/content/fileTreeService', () => ({
  listDirectory: (_locale: string, dir = '') => {
    const prefix = dir ? `${dir}/` : '';
    const names = new Set<string>();

    for (const filePath of tree.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const rest = filePath.slice(prefix.length);
      const [head, ...tail] = rest.split('/');
      if (head) names.add(tail.length > 0 ? `${head}/` : head);
    }

    return Promise.resolve({
      entries: [...names].map((name) => ({
        name: name.replace(/\/$/, ''),
        isDirectory: name.endsWith('/'),
      })),
      total: names.size,
    });
  },
  getFile: (_locale: string, filePath: string) => {
    const content = tree.get(filePath);
    return Promise.resolve(content === undefined ? null : { content, resolvedPath: filePath });
  },
}));

import {
  BARE_NAMESPACE,
  listKeywordCollisions,
  resolveKeywordRef,
} from '@/lib/md/keywordIndex';
import {
  clearKeywordIndexCache,
  discoverKeywordIndexes,
  extractProducedKeys,
} from '@/lib/md/keywordIndexRegistry';

/** Locale every test discovers under. */
const root = 'en';

/**
 * Declares a content file in the virtual tree.
 *
 * @param {string} rel - Path relative to the locale root
 * @param {string} body - File contents
 * @returns {Promise<void>}
 */
async function write(rel: string, body: string): Promise<void> {
  tree.set(rel, body);
}

describe('keywordIndexRegistry', () => {
  beforeEach(() => {
    clearKeywordIndexCache();
    tree.clear();
  });

  afterEach(() => {
    clearKeywordIndexCache();
    tree.clear();
  });

  describe('discoverKeywordIndexes', () => {
    it('should ignore a rules page that declares nothing', async () => {
      await write('rules/plain.rule.mdx', '---\ncontentType: rules\n---\n\n## Prone\n');

      const registry = await discoverKeywordIndexes(root);

      expect(registry.size).toBe(0);
    });

    it('should ignore a page outside rules that declares nothing', async () => {
      await write(
        'spells/plain.spell.mdx',
        '---\ncontentType: spells\n---\n\n## Prone\n',
      );

      const registry = await discoverKeywordIndexes(root);

      expect(registry.size).toBe(0);
    });

    it('should collect every heading under a declared namespace', async () => {
      await write(
        'rules/conditions.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n# Conditions\n\n## Prone\n\n## Blinded\n',
      );

      const registry = await discoverKeywordIndexes(root);
      const entry = registry.get('condition');

      expect([...(entry?.values.keys() ?? [])].sort()).toEqual([
        'blinded',
        'conditions',
        'prone',
      ]);
    });

    it('should merge two files declaring the same namespace', async () => {
      await write(
        'rules/a.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );
      await write(
        'rules/b.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Charmed\n',
      );

      const registry = await discoverKeywordIndexes(root);
      const entry = registry.get('condition');

      expect([...(entry?.values.keys() ?? [])].sort()).toEqual([
        'charmed',
        'prone',
      ]);
      expect(entry?.sources.sort()).toEqual(['rules/a.rule.mdx', 'rules/b.rule.mdx']);
    });

    it('should read namespaces from frontmatter only', async () => {
      await write(
        'rules/decoy.rule.mdx',
        '---\ncontentType: rules\n---\n\nkeywordIndex: condition\n\n## Prone\n',
      );

      const registry = await discoverKeywordIndexes(root);

      expect(registry.has('condition')).toBe(false);
    });

    it('should ignore markup when slugging a heading', async () => {
      await write(
        'rules/c.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## _Prone_\n',
      );

      const registry = await discoverKeywordIndexes(root);

      expect(registry.get('condition')?.values.has('prone')).toBe(true);
    });

    it('should register a declared term under the bare namespace', async () => {
      await write(
        'rules/attack.rule.mdx',
        '---\nkeywords:\n  - accuracy\n  - damage bonus\n---\n\n### Accuracy\n\n### Damage Bonus\n',
      );

      const registry = await discoverKeywordIndexes(root);
      const entry = registry.get(BARE_NAMESPACE);

      expect([...(entry?.values.keys() ?? [])].sort()).toEqual([
        'accuracy',
        'damage-bonus',
      ]);
    });

    it('should accept a comma-separated keywords string', async () => {
      await write(
        'rules/attack.rule.mdx',
        '---\nkeywords: accuracy, damage bonus\n---\n\n### Accuracy\n\n### Damage Bonus\n',
      );

      const registry = await discoverKeywordIndexes(root);

      expect(registry.get(BARE_NAMESPACE)?.values.size).toBe(2);
    });

    it('should throw when a declared term has no matching heading', async () => {
      await write(
        'rules/attack.rule.mdx',
        '---\nkeywords:\n  - accuracy\n---\n\n### Attack Rolls\n',
      );

      await expect(discoverKeywordIndexes(root)).rejects.toThrow(
        /no matching heading/,
      );
    });

    it('should cache the result per content root', async () => {
      await write(
        'rules/a.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );
      const first = await discoverKeywordIndexes(root);

      await write(
        'rules/b.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Charmed\n',
      );
      const second = await discoverKeywordIndexes(root);

      expect(second).toBe(first);
      expect(second.get('condition')?.values.has('charmed')).toBe(false);
    });
  });

  describe('listKeywordCollisions', () => {
    it('should report a value claimed by two files', async () => {
      await write(
        'rules/a.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );
      await write(
        'rules/b.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );

      const collisions = listKeywordCollisions(
        await discoverKeywordIndexes(root),
      );

      expect(collisions).toContainEqual({
        namespace: 'condition',
        anchor: 'prone',
        filePaths: ['rules/a.rule.mdx', 'rules/b.rule.mdx'],
      });
    });

    it('should report nothing when every value is unique', async () => {
      await write(
        'rules/a.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );

      const collisions = listKeywordCollisions(
        await discoverKeywordIndexes(root),
      );

      expect(collisions).toEqual([]);
    });
  });

  describe('resolveKeywordRef', () => {
    beforeEach(async () => {
      await write(
        'rules/steel-and-strife/conditions.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );
      await write(
        'rules/steel-and-strife/making-an-attack.rule.mdx',
        '---\nkeywords:\n  - damage bonus\n---\n\n### Damage Bonus\n',
      );
    });

    it('should resolve a namespaced reference', async () => {
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, 'condition', 'prone')).toEqual({
        anchor: 'prone',
        heading: 'Prone',
        filePath: 'rules/steel-and-strife/conditions.rule.mdx',
      });
    });

    it('should resolve a bare reference', async () => {
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, undefined, 'Damage Bonus')?.anchor).toBe(
        'damage-bonus',
      );
    });

    it('should match the namespace case-insensitively', async () => {
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, 'CONDITION', 'Prone')?.heading).toBe(
        'Prone',
      );
    });

    it('should return null for an unknown namespace', async () => {
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, 'affliction', 'prone')).toBeNull();
    });

    it('should return null for an unknown value', async () => {
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, 'condition', 'swiftness')).toBeNull();
    });

    it('should return null for a contested value', async () => {
      await write(
        'rules/steel-and-strife/more.rule.mdx',
        '---\nkeywordIndex: condition\n---\n\n## Prone\n',
      );
      clearKeywordIndexCache();
      const registry = await discoverKeywordIndexes(root);

      expect(resolveKeywordRef(registry, 'condition', 'prone')).toBeNull();
    });
  });

  describe('extractProducedKeys', () => {
    it('should key every declared term by its shard id', () => {
      const source = [
        '---',
        'keywords:',
        '  - briefly',
        '  - resist',
        '---',
        '',
        '### Briefly',
        '',
        '### Resist',
      ].join('\n');

      expect(extractProducedKeys(source)).toEqual(['kw--briefly', 'kw--resist']);
    });

    it('should key every heading under a declared namespace', () => {
      const source = [
        '---',
        'keywordIndex: condition',
        '---',
        '',
        '## Prone',
        '',
        '## Blinded',
      ].join('\n');

      expect(extractProducedKeys(source)).toEqual([
        'kw-condition-blinded',
        'kw-condition-prone',
      ]);
    });

    it('should skip a declared term with no matching heading', () => {
      const source = ['---', 'keywords:', '  - resist', '---', '', '### Briefly'].join(
        '\n',
      );

      expect(extractProducedKeys(source)).toEqual([]);
    });

    it('should return nothing when the file declares nothing', () => {
      const source = ['---', 'contentType: rules', '---', '', '## Prone'].join('\n');

      expect(extractProducedKeys(source)).toEqual([]);
    });

    it('should meet a consumer key for a multi-word term', () => {
      const source = [
        '---',
        'keywords:',
        '  - damage bonus',
        '---',
        '',
        '## Damage Bonus',
      ].join('\n');

      expect(extractProducedKeys(source)).toEqual(['kw--damage-bonus']);
    });
  });
});

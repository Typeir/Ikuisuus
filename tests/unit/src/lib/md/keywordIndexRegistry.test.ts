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

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BARE_NAMESPACE,
  listKeywordCollisions,
  resolveKeywordRef,
} from '@/lib/md/keywordIndex';
import {
  clearKeywordIndexCache,
  discoverKeywordIndexes,
} from '@/lib/md/keywordIndexRegistry';

let root: string;

/**
 * Writes a content file beneath the temporary root.
 *
 * @param {string} rel - Path relative to the root
 * @param {string} body - File contents
 * @returns {Promise<void>}
 */
async function write(rel: string, body: string): Promise<void> {
  const target = path.join(root, rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

describe('keywordIndexRegistry', () => {
  beforeEach(async () => {
    clearKeywordIndexCache();
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'kwindex-'));
  });

  afterEach(async () => {
    clearKeywordIndexCache();
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('discoverKeywordIndexes', () => {
    it('should index a rules page that declares nothing', async () => {
      await write('rules/plain.rule.mdx', '---\ncontentType: rules\n---\n\n## Prone\n');

      const registry = await discoverKeywordIndexes(root);

      expect(registry.get(BARE_NAMESPACE)?.values.has('prone')).toBe(true);
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

      /* Both pages are rules, so the anchor collides in its own namespace and
         again in the bare one every rules page contributes to. */
      expect(collisions).toContainEqual({
        namespace: 'condition',
        anchor: 'prone',
        filePaths: ['rules/a.rule.mdx', 'rules/b.rule.mdx'],
      });
      expect(collisions).toContainEqual({
        namespace: BARE_NAMESPACE,
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

});

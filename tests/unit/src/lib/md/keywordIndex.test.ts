/**
 * @fileoverview keywordIndex Unit Tests
 * @description Tests the pure index shapes and lookups: contribution, collision
 * reporting, resolution, and route derivation. No filesystem involved, which is
 * what keeps this module safe to bundle for the client.
 *
 * @module tests/unit/lib/md/keywordIndex
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordIndex Module under test
 */

import {
  BARE_NAMESPACE,
  contributeKeyword,
  listKeywordCollisions,
  resolveKeywordRef,
  routeForFile,
  type KeywordRegistry,
} from '@/lib/md/keywordIndex';
import { describe, expect, it } from 'vitest';

/**
 * Builds a registry from a list of contributions.
 *
 * @param {Array<[string, string, string]>} rows - Namespace, anchor and file path
 * @returns {KeywordRegistry} Registry holding those contributions
 */
function registryOf(rows: Array<[string, string, string]>): KeywordRegistry {
  const registry: KeywordRegistry = new Map();
  for (const [namespace, anchor, filePath] of rows) {
    contributeKeyword(registry, namespace, {
      anchor,
      heading: anchor,
      filePath,
    });
  }
  return registry;
}

describe('contributeKeyword', () => {
  it('should create a namespace on first contribution', () => {
    const registry = registryOf([['condition', 'prone', 'a.mdx']]);

    expect(registry.get('condition')?.values.get('prone')).toHaveLength(1);
    expect(registry.get('condition')?.sources).toEqual(['a.mdx']);
  });

  it('should merge contributions from different files', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['condition', 'charmed', 'b.mdx'],
    ]);

    expect(registry.size).toBe(1);
    expect(registry.get('condition')?.values.size).toBe(2);
    expect(registry.get('condition')?.sources).toEqual(['a.mdx', 'b.mdx']);
  });

  it('should record a source once however many values it contributes', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['condition', 'charmed', 'a.mdx'],
    ]);

    expect(registry.get('condition')?.sources).toEqual(['a.mdx']);
  });

  it('should keep both claims on a contested value', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['condition', 'prone', 'b.mdx'],
    ]);

    expect(registry.get('condition')?.values.get('prone')).toHaveLength(2);
  });

  it('should keep namespaces apart', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['affliction', 'prone', 'b.mdx'],
    ]);

    expect(registry.size).toBe(2);
    expect(listKeywordCollisions(registry)).toEqual([]);
  });
});

describe('listKeywordCollisions', () => {
  it('should report a contested value', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['condition', 'prone', 'b.mdx'],
    ]);

    expect(listKeywordCollisions(registry)).toEqual([
      { namespace: 'condition', anchor: 'prone', filePaths: ['a.mdx', 'b.mdx'] },
    ]);
  });

  it('should report nothing for an empty registry', () => {
    expect(listKeywordCollisions(new Map())).toEqual([]);
  });
});

describe('resolveKeywordRef', () => {
  it('should resolve a namespaced reference', () => {
    const registry = registryOf([['condition', 'prone', 'rules/a.rule.mdx']]);

    expect(resolveKeywordRef(registry, 'condition', 'prone')?.filePath).toBe(
      'rules/a.rule.mdx',
    );
  });

  it('should slug the value before lookup', () => {
    const registry = registryOf([['', 'damage-bonus', 'rules/a.rule.mdx']]);

    expect(resolveKeywordRef(registry, undefined, 'Damage Bonus')?.anchor).toBe(
      'damage-bonus',
    );
  });

  it('should treat an undefined namespace as the bare namespace', () => {
    const registry = registryOf([[BARE_NAMESPACE, 'accuracy', 'a.mdx']]);

    expect(resolveKeywordRef(registry, undefined, 'accuracy')).not.toBeNull();
  });

  it('should lowercase the namespace', () => {
    const registry = registryOf([['condition', 'prone', 'a.mdx']]);

    expect(resolveKeywordRef(registry, 'CONDITION', 'prone')).not.toBeNull();
  });

  it('should return null for an unknown namespace', () => {
    const registry = registryOf([['condition', 'prone', 'a.mdx']]);

    expect(resolveKeywordRef(registry, 'affliction', 'prone')).toBeNull();
  });

  it('should return null for an unknown value', () => {
    const registry = registryOf([['condition', 'prone', 'a.mdx']]);

    expect(resolveKeywordRef(registry, 'condition', 'swiftness')).toBeNull();
  });

  it('should return null rather than guess between contested claims', () => {
    const registry = registryOf([
      ['condition', 'prone', 'a.mdx'],
      ['condition', 'prone', 'b.mdx'],
    ]);

    expect(resolveKeywordRef(registry, 'condition', 'prone')).toBeNull();
  });
});

describe('routeForFile', () => {
  it('should strip the extension and the content suffix', () => {
    expect(routeForFile('rules/steel-and-strife/conditions.rule.mdx')).toBe(
      'library/rules/steel-and-strife/conditions',
    );
  });

  it('should handle a file with no content suffix', () => {
    expect(routeForFile('rules/main.mdx')).toBe('library/rules/main');
  });
});

/**
 * @fileoverview Tests for compileRuntime
 * @module tests/unit/src/lib/mdx/compileRuntime.test
 */

import {
    clearCompileRuntimeCache,
    compileRuntime,
    compileRuntimeSync,
    mdx,
    mdxSync,
} from '@/modules/library/infrastructure/compile/compileRuntime';
import { beforeEach, describe, expect, it } from 'vitest';

describe('compileRuntime (async)', () => {
  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  it('compiles simple MDX source', async () => {
    const result = await compileRuntime({
      source: 'Hello **world**',
      components: {},
    });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('handles plain text', async () => {
    const result = await compileRuntime({
      source: 'Simple text',
      components: {},
    });
    expect(result.content).toBeDefined();
  });

  it('parses frontmatter when enabled', async () => {
    const result = await compileRuntime({
      source: '---\ntitle: Test\n---\nContent here',
      components: {},
      parseFrontmatter: true,
    });
    expect(result).toBeDefined();
  });

  it('handles markdown formatting', async () => {
    const result = await compileRuntime({
      source: 'This is **bold** and *italic*',
      components: {},
    });
    expect(result.content).toBeDefined();
  });

  it('caches results by source hash', async () => {
    const source = 'Cached **content**';
    const result1 = await compileRuntime({
      source,
      components: {},
    });
    const result2 = await compileRuntime({
      source,
      components: {},
    });
    expect(result1).toBe(result2);
  });

  it('skips cache when skipCache is true', async () => {
    const source = 'Skip cache **test**';
    const result1 = await compileRuntime({
      source,
      components: {},
    });
    const result2 = await compileRuntime({
      source,
      components: {},
      skipCache: true,
    });
    expect(result1).not.toBe(result2);
  });

  it('clears cache when clearCompileRuntimeCache is called', async () => {
    const source = 'Clear cache **test**';
    await compileRuntime({
      source,
      components: {},
    });
    clearCompileRuntimeCache();
    const result = await compileRuntime({
      source,
      components: {},
    });
    expect(result).toBeDefined();
  });
});

describe('compileRuntimeSync (sync)', () => {
  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  it('compiles simple MDX source synchronously', () => {
    const result = compileRuntimeSync({
      source: 'Hello **world**',
      components: {},
    });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('handles plain text', () => {
    const result = compileRuntimeSync({
      source: 'Simple text',
      components: {},
    });
    expect(result.content).toBeDefined();
  });

  it('caches results by source hash', () => {
    const source = 'Cached **content**';
    const result1 = compileRuntimeSync({
      source,
      components: {},
    });
    const result2 = compileRuntimeSync({
      source,
      components: {},
    });
    expect(result1).toBe(result2);
  });

  it('skips cache when skipCache is true', () => {
    const source = 'Skip cache **test**';
    const result1 = compileRuntimeSync({
      source,
      components: {},
    });
    const result2 = compileRuntimeSync({
      source,
      components: {},
      skipCache: true,
    });
    expect(result1).not.toBe(result2);
  });
});

describe('mdx` ` (async template literal)', () => {
  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  it('works with template literal syntax', async () => {
    const result = await mdx`This is **bold** text`;
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('supports interpolations in template literal', async () => {
    const emphasis = 'important';
    const result = await mdx`This is **${emphasis}**`;
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('caches template literal results by hash', async () => {
    const result1 = await mdx`Cached **content**`;
    const result2 = await mdx`Cached **content**`;
    expect(result1).toBe(result2);
  });
});

describe('mdxSync` ` (sync template literal)', () => {
  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  it('works with template literal syntax synchronously', () => {
    const result = mdxSync`This is **bold** text`;
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('supports interpolations in template literal', () => {
    const emphasis = 'important';
    const result = mdxSync`This is **${emphasis}**`;
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it('caches template literal results by hash', () => {
    const result1 = mdxSync`Cached **content**`;
    const result2 = mdxSync`Cached **content**`;
    expect(result1).toBe(result2);
  });
});

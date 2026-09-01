/**
 * @fileoverview Tests for compileRuntime
 * @module tests/unit/src/modules/library/infrastructure/compile/compileRuntime.test
 */

import {
    clearCompileRuntimeCache,
    compileRuntime,
    compileRuntimeSync,
    mdx,
    mdxSync,
} from '@/modules/library/infrastructure/compile/compileRuntime';
import { renderToStaticMarkup } from 'react-dom/server';
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
    expect(result1.content.type).toBe(result2.content.type);
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
    expect(result1.content.type).not.toBe(result2.content.type);
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
    expect(result1.content.type).toBe(result2.content.type);
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
    expect(result1.content.type).not.toBe(result2.content.type);
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
    expect(result1.content.type).toBe(result2.content.type);
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
    expect(result1.content.type).toBe(result2.content.type);
  });
});

describe('component map is per call, not per cache entry', () => {
  const SOURCE = 'Range [= 2 stride =] from the target.';

  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  /**
   * Verifies a cached compile does not reuse an earlier caller's component map.
   */
  it('should not let an earlier empty component map poison a later caller', () => {
    const Unit = () => null;

    compileRuntimeSync({ source: SOURCE, components: {} });
    const second = compileRuntimeSync({ source: SOURCE, components: { Unit } });

    expect(
      (second.content.props as { components: Record<string, unknown> })
        .components,
    ).toHaveProperty('Unit', Unit);
  });

  it('should reuse the compiled component across differing component maps', () => {
    const first = compileRuntimeSync({ source: SOURCE, components: {} });
    const second = compileRuntimeSync({
      source: SOURCE,
      components: { Unit: () => null },
    });

    expect(second.content.type).toBe(first.content.type);
  });

  it('should apply the caller component map on the async path too', async () => {
    const Unit = () => null;

    await compileRuntime({ source: SOURCE, components: {} });
    const second = await compileRuntime({
      source: SOURCE,
      components: { Unit },
    });

    expect(
      (second.content.props as { components: Record<string, unknown> })
        .components,
    ).toHaveProperty('Unit', Unit);
  });
});

describe('shorthand library links', () => {
  beforeEach(() => {
    clearCompileRuntimeCache();
  });

  /**
   * Renders a compiled document to markup.
   *
   * @param {string} source - MDX source
   * @param {string} [locale] - Locale to compile for
   * @returns {string} Rendered markup
   */
  const markup = (source: string, locale?: string): string =>
    renderToStaticMarkup(
      compileRuntimeSync({ source, components: {}, locale }).content,
    );

  it('should expand a shorthand target through the real compiler', () => {
    const html = markup('[Prone](/rules/steel-and-strife/conditions#prone)');

    expect(html).toContain(
      'href="/en/library/rules/steel-and-strife/conditions#prone"',
    );
  });

  it('should leave a link that already carries its locale', () => {
    const html = markup('[Prone](/en/library/rules/steel-and-strife/conditions)');

    expect(html).toContain(
      'href="/en/library/rules/steel-and-strife/conditions"',
    );
  });

  it('should leave a reserved app path alone', () => {
    const html = markup('[sigil](/images/sigil.png)');

    expect(html).toContain('href="/images/sigil.png"');
  });

  it('should key the compile cache by locale', () => {
    markup('[Prone](/rules/x)', 'en');
    const other = markup('[Prone](/rules/x)', 'fi');

    expect(other).toContain('href="/fi/library/rules/x"');
  });
});

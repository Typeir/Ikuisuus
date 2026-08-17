/**
 * @fileoverview remarkAspect Plugin Tests
 * @description `[( group:value )]` and `[( group:value;display )]` become
 * `<Aspect />` inline elements; malformed tokens stay as text.
 *
 * @module tests/unit/src/lib/md/remarkAspect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import remarkAspect, {
  ASPECT_COMPONENT_NAME,
  ASPECT_EXPR_REGEX,
} from '@/lib/md/remarkAspect';
import type { Root } from 'mdast';
import { describe, expect, it } from 'vitest';

/**
 * Builds a root holding one paragraph with one text node.
 *
 * @param {string} text - Paragraph text
 * @returns {Root} MDAST root
 */
function rootWithText(text: string): Root {
  return {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
  };
}

/**
 * Children of the first paragraph.
 *
 * @param {Root} tree - MDAST root
 * @returns {unknown[]} Paragraph children
 */
function kids(tree: Root): unknown[] {
  return (tree.children[0] as { children: unknown[] }).children;
}

describe('remarkAspect', () => {
  it('should leave plain text, unit and dice tokens alone', () => {
    const tree = rootWithText('deals [% 3d8 fire %] within [= 6 stride =]');
    (remarkAspect as unknown as () => (t: Root) => void)()(tree);
    expect(kids(tree)).toHaveLength(1);
  });

  it('should replace the shorthand with an Aspect element', () => {
    const tree = rootWithText('a [( condition:frightened )] creature');
    (remarkAspect as unknown as () => (t: Root) => void)()(tree);
    const k = kids(tree) as Array<{ type: string; name?: string; attributes?: Array<{ name: string; value: string }>; value?: string }>;
    expect(k.map((c) => c.type)).toEqual(['text', 'mdxJsxTextElement', 'text']);
    expect(k[1].name).toBe(ASPECT_COMPONENT_NAME);
    expect(k[1].attributes).toEqual([{ type: 'mdxJsxAttribute', name: 'value', value: 'condition:frightened' }]);
    expect(k[0].value).toBe('a ');
    expect(k[2].value).toBe(' creature');
  });

  it('should pass the display mode through and accept namespaced groups', () => {
    const tree = rootWithText('[( form:blade;glyph )] and [( meta:content:object ; verbose )]');
    (remarkAspect as unknown as () => (t: Root) => void)()(tree);
    const k = kids(tree) as Array<{ type: string; attributes?: Array<{ name: string; value: string }> }>;
    const els = k.filter((c) => c.type === 'mdxJsxTextElement');
    expect(els).toHaveLength(2);
    expect(els[0].attributes).toEqual([
      { type: 'mdxJsxAttribute', name: 'value', value: 'form:blade' },
      { type: 'mdxJsxAttribute', name: 'display', value: 'glyph' },
    ]);
    expect(els[1].attributes?.[0].value).toBe('meta:content:object');
    expect(els[1].attributes?.[1].value).toBe('verbose');
  });

  it('should leave malformed tokens as text', () => {
    for (const bad of ['[( nonsense )]', '[( Form:Blade )]', '[( form:blade;huge )]']) {
      ASPECT_EXPR_REGEX.lastIndex = 0;
      expect(ASPECT_EXPR_REGEX.test(bad)).toBe(false);
    }
    const tree = rootWithText('[( nonsense )]');
    (remarkAspect as unknown as () => (t: Root) => void)()(tree);
    expect(kids(tree)).toHaveLength(1);
  });
});

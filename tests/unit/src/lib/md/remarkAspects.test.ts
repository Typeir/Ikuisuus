/**
 * @fileoverview remarkAspects Plugin Tests
 * @description Covers placement of aspect rows beneath the headings that have
 * them, and the matching rules that decide which headings those are.
 *
 * @module tests/unit/src/lib/md/remarkAspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import remarkAspects, {
  ASPECTS_COMPONENT_NAME,
  type RemarkAspectsOptions,
} from '@/lib/md/remarkAspects';
import type { Root } from 'mdast';
import { describe, expect, it } from 'vitest';

/**
 * Builds a document of headings and paragraphs.
 *
 * @param {Array<{ depth: number; text: string } | string>} nodes - Headings by object, paragraphs by string
 * @returns {Root} An mdast root
 */
function doc(nodes: Array<{ depth: number; text: string } | string>): Root {
  return {
    type: 'root',
    children: nodes.map((node) =>
      typeof node === 'string'
        ? { type: 'paragraph', children: [{ type: 'text', value: node }] }
        : {
            type: 'heading',
            depth: node.depth as 1 | 2 | 3 | 4 | 5 | 6,
            children: [{ type: 'text', value: node.text }],
          },
    ),
  } as Root;
}

/**
 * Runs the plugin over a tree.
 *
 * @param {Root} tree - The tree to transform
 * @param {RemarkAspectsOptions} options - Plugin options
 * @returns {Root} The mutated tree
 */
function run(tree: Root, options: RemarkAspectsOptions): Root {
  const transformer = remarkAspects(options) as (t: Root) => void;
  transformer(tree);
  return tree;
}

/**
 * Node type and section attribute of every emitted element.
 *
 * @param {Root} tree - Transformed tree
 * @returns {string[]} Section keys in document order
 */
function emitted(tree: Root): string[] {
  return tree.children
    .filter(
      (node) =>
        (node as { type: string; name?: string }).type ===
          'mdxJsxFlowElement' &&
        (node as { name?: string }).name === ASPECTS_COMPONENT_NAME,
    )
    .map(
      (node) =>
        (node as unknown as { attributes: Array<{ value: string }> })
          .attributes[0].value,
    );
}

describe('remarkAspects', () => {
  it('should do nothing when no sections are given', () => {
    const tree = run(doc([{ depth: 2, text: 'Garbage Communion' }]), {});

    expect(tree.children).toHaveLength(1);
  });

  it('should place a row directly after a matching heading', () => {
    const tree = run(
      doc([
        { depth: 2, text: 'Garbage Communion' },
        'The Mucklord is aware of refuse.',
      ]),
      { sections: ['Garbage Communion'] },
    );

    expect(tree.children[0].type).toBe('heading');
    expect(tree.children[1].type).toBe('mdxJsxFlowElement');
    expect(tree.children[2].type).toBe('paragraph');
  });

  it('should leave non-matching headings alone', () => {
    const tree = run(
      doc([
        { depth: 2, text: 'Garbage Communion' },
        { depth: 2, text: 'Lore' },
      ]),
      { sections: ['Garbage Communion'] },
    );

    expect(emitted(tree)).toEqual(['Garbage Communion']);
  });

  /**
   * Indices shift as elements are inserted, so a forward pass would place later
   * rows under the wrong heading.
   */
  it('should place every row correctly when several headings match', () => {
    const tree = run(
      doc([
        { depth: 2, text: 'One' },
        'a',
        { depth: 2, text: 'Two' },
        'b',
        { depth: 2, text: 'Three' },
      ]),
      { sections: ['One', 'Two', 'Three'] },
    );

    expect(emitted(tree)).toEqual(['One', 'Two', 'Three']);
    expect(tree.children[1].type).toBe('mdxJsxFlowElement');
    expect(tree.children[4].type).toBe('mdxJsxFlowElement');
    expect(tree.children[7].type).toBe('mdxJsxFlowElement');
  });

  /**
   * Feature names are extracted from the raw heading line, so a heading holding
   * an unconverted measure has to match verbatim. This is why the plugin runs
   * before `remarkUnit`.
   */
  /**
   * The heading is written with the authoring macro; the stored feature name is
   * normalised. Both sides run the same normalisation, so they meet in the
   * middle — matching the raw form against the stored one never would.
   */
  it('should match a macro heading against its normalised section name', () => {
    const heading = 'Aura of Stillness ([= 12 stride;ADJ =] radius)';
    const stored = 'Aura of Stillness (12 stride radius)';
    const tree = run(doc([{ depth: 4, text: heading }]), {
      sections: [stored],
    });

    expect(emitted(tree)).toEqual([stored]);
  });

  /** A heading with no macro is unaffected by the normalisation. */
  it('should still match a heading with no measure in it', () => {
    const tree = run(doc([{ depth: 4, text: 'Garbage Communion' }]), {
      sections: ['Garbage Communion'],
    });

    expect(emitted(tree)).toEqual(['Garbage Communion']);
  });

  it('should distinguish headings that differ only by their parenthetical', () => {
    const tree = run(
      doc([
        { depth: 4, text: 'Cannon Tongue' },
        { depth: 4, text: 'Cannon Tongue (Recharge 5-6)' },
      ]),
      { sections: ['Cannon Tongue (Recharge 5-6)'] },
    );

    expect(emitted(tree)).toEqual(['Cannon Tongue (Recharge 5-6)']);
    expect(tree.children[0].type).toBe('heading');
    expect(tree.children[1].type).toBe('heading');
  });

  it('should join formatted heading text before matching', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 3,
          children: [
            { type: 'text', value: 'Belly of ' },
            {
              type: 'emphasis',
              children: [{ type: 'text', value: 'the Muck' }],
            },
          ],
        },
      ],
    } as Root;

    run(tree, { sections: ['Belly of the Muck'] });

    expect(emitted(tree)).toEqual(['Belly of the Muck']);
  });

  /**
   * Boon headings carry a cost badge — `###### Monady <span>5 BP</span>` — and
   * the generator names the boon from the text before it. Reading the badge back
   * in matched nothing and left every annotated heading bare.
   */
  it('should ignore a JSX badge when matching a heading', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 6,
          children: [
            { type: 'text', value: 'Cognitive Matrix ' },
            {
              type: 'mdxJsxTextElement',
              name: 'span',
              attributes: [],
              children: [{ type: 'text', value: 'Variable (choose one)' }],
            },
          ],
        },
      ],
    } as unknown as Root;

    expect(emitted(run(tree, { sections: ['Cognitive Matrix'] }))).toEqual([
      'Cognitive Matrix',
    ]);
  });

  /** These headings live inside a `<Collapsible>`, not at the document root. */
  it('should place a row under a heading nested in a JSX block', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'Collapsible',
          attributes: [],
          children: [
            {
              type: 'heading',
              depth: 6,
              children: [{ type: 'text', value: 'Monady' }],
            },
            { type: 'paragraph', children: [{ type: 'text', value: 'Body.' }] },
          ],
        },
      ],
    } as unknown as Root;

    run(tree, { sections: ['Monady'] });

    const block = (tree.children[0] as unknown as { children: Array<{ type: string; name?: string }> });
    expect(block.children[1]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: ASPECTS_COMPONENT_NAME,
    });
  });

  it('should match any heading depth', () => {
    const tree = run(
      doc([
        { depth: 1, text: 'Mucklord' },
        { depth: 6, text: 'Detect' },
      ]),
      { sections: ['Mucklord', 'Detect'] },
    );

    expect(emitted(tree)).toEqual(['Mucklord', 'Detect']);
  });
});

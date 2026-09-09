/**
 * @fileoverview Unit tests for the rehypeAspects rehype plugin.
 * @description Verifies that a row lands on the title of a record and nowhere
 * else
 *
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest - Test framework
 * @requires hast-util-from-html - HTML fragment parser
 * @requires @/modules/library/infrastructure/compile/rehypeAspects - Plugin under test
 * @requires @/modules/library/infrastructure/compile/rehypeSectionize - Upstream plugin
 */

import rehypeAspects, {
  ASPECTS_COMPONENT_NAME,
  type RehypeAspectsOptions,
} from '@/modules/library/infrastructure/compile/rehypeAspects';
import rehypeSectionize from '@/modules/library/infrastructure/compile/rehypeSectionize';
import type { Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { describe, expect, it } from 'vitest';

type Node = {
  type: string;
  name?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  attributes?: Array<{ name: string; value: string }>;
  children?: Node[];
};

/**
 * Sectionizes then places rows; returns the tree.
 *
 * @param {string} html - Input HTML fragment
 * @param {RehypeAspectsOptions} opts - Plugin options
 * @returns {Root} Transformed tree
 */
function run(html: string, opts: RehypeAspectsOptions): Root {
  const tree = fromHtml(html, { fragment: true });
  rehypeSectionize()(tree, tree as never, () => {});
  rehypeAspects(opts)(tree, tree as never, () => {});
  return tree;
}

/**
 * Serialises a tree to a compact outline
 *
 * @param {Node} node - Tree node
 * @returns {string} Outline
 */
function outline(node: Node): string {
  if (node.type === 'mdxJsxFlowElement') {
    const key = node.attributes?.find((a) => a.name === 'section')?.value;
    return `${node.name}[${key}]`;
  }
  if (node.type === 'text') return '';
  const props = node.properties ?? {};
  if (
    props['data-stream-rail'] !== undefined ||
    props.dataStreamRail !== undefined
  ) {
    return '';
  }
  const kids = (node.children ?? []).map(outline).filter(Boolean).join(' ');
  return node.tagName ? `${node.tagName}(${kids})` : kids;
}

/**
 * All keys placed, in document order.
 *
 * @param {Node} node - Tree node
 * @returns {string[]} Keys
 */
function placed(node: Node): string[] {
  if (
    node.type === 'mdxJsxFlowElement' &&
    node.name === ASPECTS_COMPONENT_NAME
  ) {
    return [node.attributes?.find((a) => a.name === 'section')?.value ?? ''];
  }
  return (node.children ?? []).flatMap(placed);
}

describe('rehypeAspects', () => {
  it('does nothing without keys', () => {
    const tree = run('<h2>Title</h2><p>Body</p>', {});
    expect(placed(tree as unknown as Node)).toEqual([]);
  });

  it('places a row right after the title of a record', () => {
    const tree = run('<h1>Mucklord</h1><p>Intro</p>', {
      keys: ['mucklord'],
      records: ['mucklord'],
    });
    expect(outline(tree as unknown as Node)).toBe(
      'section(h1() Aspects[mucklord] p())',
    );
  });

  /* The parts of a record are read through the record, so repeating its
     aspects on each of them says the same thing over and over. */
  it('leaves the headings under a record bare', () => {
    const tree = run(
      '<h1>Mucklord</h1><p>Intro</p><h4>Bite</h4><p>Melee.</p>',
      { keys: ['mucklord', 'mucklord/bite', 'bite'], records: ['mucklord'] },
    );
    expect(placed(tree as unknown as Node)).toEqual(['mucklord']);
  });

  it('places nothing when the title claims no aspects of its own', () => {
    const tree = run('<h1>Mucklord</h1><h4>Bite</h4><p>Melee.</p>', {
      keys: ['mucklord/bite'],
      records: ['mucklord'],
    });
    expect(placed(tree as unknown as Node)).toEqual([]);
  });

  it('gives every record in a file its own row', () => {
    const tree = run(
      '<h1>Mucklord</h1><p>A.</p><h1>Sun Catcher</h1><p>B.</p>',
      { keys: ['mucklord', 'sun-catcher'], records: ['mucklord', 'sun-catcher'] },
    );
    expect(placed(tree as unknown as Node)).toEqual([
      'mucklord',
      'sun-catcher',
    ]);
  });

  it('leaves an entry list alone', () => {
    const tree = run(
      '<h4>Actions</h4><ul><li><p><strong>Rend</strong><br>Melee. Hit.</p></li></ul>',
      { keys: ['rend'] },
    );
    expect(placed(tree as unknown as Node)).toEqual([]);
  });

  /* A quoted statlet names the record its parts resolve against, but it is not
     a title of its own, so it wears no row. */
  it('scopes a quoted statlet to its own record without giving it a row', () => {
    const html = [
      '<h1>Goddess</h1><h2>Traits</h2>',
      '<blockquote><h4>Plating</h4><p>Object.</p><hr><h5>Traits</h5><p><strong>Infallible</strong>: cannot be targeted.</p></blockquote>',
      '<h4>Magic Resistance</h4><p>Advantage.</p>',
    ].join('');
    const tree = run(html, {
      keys: [
        'goddess',
        'plating',
        'plating/infallible',
        'infallible',
        'goddess/magic-resistance',
      ],
      records: ['goddess', 'plating'],
    });
    expect(placed(tree as unknown as Node)).toEqual(['goddess']);
  });

  it('leaves the summary heading of an MDX container bare', () => {
    const tree = fromHtml('<h2>Boons</h2>', {
      fragment: true,
    }) as unknown as Root;
    const collapsible = {
      type: 'mdxJsxFlowElement',
      name: 'Collapsible',
      attributes: [],
      children: [
        {
          type: 'element',
          tagName: 'h6',
          properties: {},
          children: [{ type: 'text', value: 'Mind' }],
        },
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'Body.' }],
        },
      ],
    };
    (tree.children as unknown[]).push(collapsible);
    rehypeSectionize()(tree, tree as never, () => {});
    rehypeAspects({ keys: ['edaphite/mind'], records: ['edaphite'] })(
      tree,
      tree as never,
      () => {},
    );
    expect(placed(tree as unknown as Node)).toEqual([]);
  });
});

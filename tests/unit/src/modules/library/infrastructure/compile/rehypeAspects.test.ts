/**
 * @fileoverview Unit tests for the rehypeAspects rehype plugin.
 * @description Verifies row placement under sections, articles and Collapsible
 * summaries, and record-scoped key resolution across statlets.
 *
 * @version 1.0.0
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

type Node = { type: string; name?: string; tagName?: string; attributes?: Array<{ name: string; value: string }>; children?: Node[] };

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
 * Serialises a tree to a compact outline: tag names, `Aspects[key]` for rows.
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
  if (node.type === 'mdxJsxFlowElement' && node.name === ASPECTS_COMPONENT_NAME) {
    return [node.attributes?.find((a) => a.name === 'section')?.value ?? ''];
  }
  return (node.children ?? []).flatMap(placed);
}

describe('rehypeAspects', () => {
  it('does nothing without keys', () => {
    const tree = run('<h2>Title</h2><p>Body</p>', {});
    expect(placed(tree as unknown as Node)).toEqual([]);
  });

  it('places a row right after a section heading', () => {
    const tree = run('<h1>Mucklord</h1><p>Intro</p><h4>Bite</h4><p>Melee.</p>', {
      keys: ['mucklord', 'mucklord/bite'],
      records: ['mucklord'],
    });
    expect(outline(tree as unknown as Node)).toBe(
      'section(h1() Aspects[mucklord] p() section(h4() Aspects[mucklord/bite] p()))',
    );
  });

  it('prefers the record-scoped key and falls back to the bare one', () => {
    const tree = run('<h1>Mucklord</h1><h4>Bite</h4><p>A.</p><h4>Claw</h4><p>B.</p>', {
      keys: ['mucklord/bite', 'claw'],
      records: ['mucklord'],
    });
    expect(placed(tree as unknown as Node)).toEqual(['mucklord/bite', 'claw']);
  });

  it('splits an entry article at its hard break and puts the row between label and body', () => {
    const tree = run(
      '<h4>Actions</h4><ul><li><p><strong>Rend</strong><br>Melee. Hit.</p></li></ul>',
      { keys: ['rend'] },
    );
    expect(outline(tree as unknown as Node)).toBe(
      'section(h4() ul(li(article(p(strong()) Aspects[rend] p()))))',
    );
  });

  it('follows the whole entry paragraph when there is no break', () => {
    const tree = run(
      '<h4>Multiattack</h4><p>Two.</p><ul><li><p><strong>Bite.</strong> Melee.</p></li></ul>',
      { keys: ['bite'] },
    );
    expect(outline(tree as unknown as Node)).toBe(
      'section(h4() p() ul(li(article(p(strong()) Aspects[bite]))))',
    );
  });

  it('scopes a quoted statlet to its own record past an inner rule', () => {
    const html = [
      '<h1>Goddess</h1><h2>Traits</h2>',
      '<blockquote><h4>Plating</h4><p>Object.</p><hr><h5>Traits</h5><p><strong>Infallible</strong>: cannot be targeted.</p></blockquote>',
      '<h4>Magic Resistance</h4><p>Advantage.</p>',
    ].join('');
    const tree = run(html, {
      keys: ['goddess', 'plating', 'plating/infallible', 'infallible', 'goddess/magic-resistance'],
      records: ['goddess', 'plating'],
    });
    expect(placed(tree as unknown as Node)).toEqual([
      'goddess',
      'plating',
      'plating/infallible',
      'goddess/magic-resistance',
    ]);
  });

  it('does not treat an unquoted h4 that shares a record name as a record', () => {
    const tree = run('<h1>Goddess</h1><h4>Plating</h4><p>Trait.</p>', {
      keys: ['goddess/plating', 'plating'],
      records: ['goddess', 'plating'],
    });
    expect(placed(tree as unknown as Node)).toEqual(['goddess/plating']);
  });

  it('places a row after the summary heading of an MDX container', () => {
    const tree = fromHtml('<h2>Boons</h2>', { fragment: true }) as unknown as Root;
    const collapsible = {
      type: 'mdxJsxFlowElement',
      name: 'Collapsible',
      attributes: [],
      children: [
        { type: 'element', tagName: 'h6', properties: {}, children: [{ type: 'text', value: 'Mind' }] },
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Body.' }] },
      ],
    };
    (tree.children as unknown[]).push(collapsible);
    rehypeSectionize()(tree, tree as never, () => {});
    rehypeAspects({ keys: ['edaphite/mind'], records: ['edaphite'] })(tree, tree as never, () => {});
    const jsx = ((tree.children[0] as unknown as Node).children ?? []).find((c) => c.type === 'mdxJsxFlowElement') as Node;
    expect(jsx.children?.map((c) => (c.type === 'mdxJsxFlowElement' ? `${c.name}` : c.tagName))).toEqual(['h6', 'Aspects', 'p']);
  });
});

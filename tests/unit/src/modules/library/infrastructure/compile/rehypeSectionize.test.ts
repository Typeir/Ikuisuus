/**
 * @fileoverview Unit tests for the rehypeSectionize rehype plugin.
 * @description Verifies heading-delimited grouping into section elements,
 * pre-heading content handling, and data-heading-level/stamp attributes.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires hast-util-from-html - HTML fragment parser
 * @requires hast-util-to-html - HAST serializer
 * @requires @/modules/library/infrastructure/compile/rehypeSectionize - Plugin under test
 */

import rehypeSectionize from '@/modules/library/infrastructure/compile/rehypeSectionize';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { describe, expect, it } from 'vitest';

/**
 * Processes an HTML fragment through rehypeSectionize and returns serialized HTML.
 *
 * @param {string} html - Input HTML fragment
 * @returns {string} Serialized HTML output
 */
function process(html: string): string {
  const tree = fromHtml(html, { fragment: true });
  rehypeSectionize()(tree, tree as never, () => {});
  return toHtml(tree);
}

/**
 * Processes an HTML fragment through rehypeSectionize with options and returns serialized HTML.
 *
 * @param {string} html - Input HTML fragment
 * @param {import('@/modules/library/infrastructure/compile/rehypeSectionize').RehypeSectionizeOptions} opts - Plugin options
 * @returns {string} Serialized HTML output
 */
function processWithOptions(
  html: string,
  opts: import('@/modules/library/infrastructure/compile/rehypeSectionize').RehypeSectionizeOptions,
): string {
  const tree = fromHtml(html, { fragment: true });
  rehypeSectionize(opts)(tree, tree as never, () => {});
  return toHtml(tree);
}

describe('rehypeSectionize', () => {
  it('wraps a heading and following content in a section', () => {
    const output = process('<h2>Title</h2><p>Body</p>');
    expect(output).toContain('<section data-heading-level="2" data-anchor="title">');
    expect(output).toContain('<h2>Title</h2>');
    expect(output).toContain('<p>Body</p>');
    expect(output).toContain('</section>');
  });

  it('creates separate sections for each heading', () => {
    const output = process('<h2>First</h2><p>A</p><h2>Second</h2><p>B</p>');
    const sectionCount = (output.match(/<section/g) ?? []).length;
    expect(sectionCount).toBe(2);
  });

  it('sets data-heading-level to match the heading tag number', () => {
    const output = process('<h3>Deep</h3><p>Content</p>');
    expect(output).toContain('data-heading-level="3"');
  });

  it('leaves content before the first heading unwrapped', () => {
    const output = process('<p>Intro</p><h2>Section</h2><p>Body</p>');
    expect(output.indexOf('<p>Intro</p>')).toBeLessThan(
      output.indexOf('<section'),
    );
    expect(output).not.toMatch(/^<section/);
  });

  it('produces a single section when there is only one heading', () => {
    const output = process('<h1>Only</h1>');
    expect(output).toContain('<section data-heading-level="1" data-anchor="only">');
    const sectionCount = (output.match(/<section/g) ?? []).length;
    expect(sectionCount).toBe(1);
  });

  it('returns unchanged output when there are no headings', () => {
    const output = process('<p>No headings here</p>');
    expect(output).not.toContain('<section');
    expect(output).toContain('<p>No headings here</p>');
  });

  it('wraps content between two <hr> elements in an anonymous section', () => {
    const output = process('<hr/><p>Between</p><hr/>');
    expect(output).toContain('<section data-heading-level="0">');
    expect(output).toContain('<p>Between</p>');
    const sectionCount = (output.match(/<section/g) ?? []).length;
    expect(sectionCount).toBe(1);
  });

  describe('streamText option', () => {
    it('stamps data-stream on heading sections when streamText is provided', () => {
      const output = processWithOptions('<h2>Title</h2><p>Body</p>', {
        streamText: 'FOO FOO',
      });
      expect(output).toContain('data-stream="FOO FOO"');
    });

    it('stamps data-stream on all sections when multiple headings exist', () => {
      const output = processWithOptions(
        '<h2>First</h2><p>A</p><h2>Second</h2><p>B</p>',
        { streamText: 'BAR BAR' },
      );
      const matches = output.match(/data-stream="BAR BAR"/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('stamps data-stream on anonymous sections (hr-delimited)', () => {
      const output = processWithOptions('<hr/><p>Between</p><hr/>', {
        streamText: 'ANON ANON',
      });
      expect(output).toContain('data-stream="ANON ANON"');
    });

    it('does not add data-stream when streamText is absent', () => {
      const output = processWithOptions('<h2>Title</h2><p>Body</p>', {});
      expect(output).not.toContain('data-stream="');
    });

    it('adds a left rail right after the heading of every stamped section', () => {
      const output = processWithOptions('<h2>Title</h2><p>Body</p>', {
        streamText: 'FOO',
      });
      expect(output).toContain(
        '<h2>Title</h2><span aria-hidden="true" data-stream-rail="left"></span><p>Body</p>',
      );
    });

    it('adds a right rail only when the section has a direct-child list', () => {
      const withList = processWithOptions('<h2>Title</h2><ul><li>A</li></ul>', {
        streamText: 'FOO',
      });
      expect(withList).toContain('data-stream-rail="right"');
      const withoutList = processWithOptions('<h2>Title</h2><p>Body</p>', {
        streamText: 'FOO',
      });
      expect(withoutList).not.toContain('data-stream-rail="right"');
    });

    it('leads an anonymous section with its rail', () => {
      const output = processWithOptions('<hr/><p>Between</p><hr/>', {
        streamText: 'FOO',
      });
      expect(output).toContain(
        '<section data-heading-level="0" data-stream="FOO"><span aria-hidden="true" data-stream-rail="left"></span><p>Between</p>',
      );
    });

    it('adds rails without streamText, since the text is inherited from the host', () => {
      const output = processWithOptions('<h2>Title</h2><p>Body</p>', {});
      expect(output).toContain('data-stream-rail="left"');
      expect(output).not.toContain('data-stream=');
    });
  });

  describe('anchors, recursion and articles', () => {
    it('stamps data-anchor from the shared slug rule, measure-normalised', () => {
      const output = process('<h4>Aura of Stillness ([= 12 stride;ADJ =] radius)</h4><p>Body</p>');
      expect(output).toContain('data-anchor="aura-of-stillness-12-stride-radius"');
    });

    it('sections headings inside blockquotes and stamps their anchors', () => {
      const output = process(
        '<h2>Spawn</h2><blockquote><h3>Petal</h3><p>Small.</p><h3>Bloom</h3><p>Medium.</p></blockquote>',
      );
      expect(output).toContain('<blockquote><section data-heading-level="3" data-anchor="petal">');
      expect(output).toContain('<section data-heading-level="3" data-anchor="bloom">');
    });

    it('wraps bold-led list entries in li > article, never ul > article', () => {
      const output = process(
        '<h4>Multiattack</h4><p>Two attacks.</p><ul><li><p><strong>Bite.</strong> Melee.</p></li><li><p><strong>Talons.</strong> Melee.</p></li></ul>',
      );
      expect(output).toContain('<li><article data-anchor="bite"><p><strong>Bite.</strong> Melee.</p></article></li>');
      expect(output).toContain('<article data-anchor="talons">');
      expect(output).not.toContain('<ul><article');
    });

    it('treats a label line followed by body as an entry, and colon fields as not', () => {
      const output = process(
        '<h4>Actions</h4><ul><li><p><strong>Mitotic Rend</strong>\n<em>Melee.</em> Hit.</p></li><li><p><strong>On Hit</strong>: seeded.</p></li></ul>',
      );
      expect(output).toContain('<article data-anchor="mitotic-rend">');
      expect(output).not.toContain('data-anchor="on-hit"');
    });

    it('accepts colon-labelled traits only under a group heading inside a blockquote', () => {
      const output = process(
        '<h4>Plating</h4><blockquote><h5>Traits</h5><p><strong>Infallible</strong>: cannot be targeted.</p></blockquote>',
      );
      expect(output).toContain('<article data-anchor="infallible">');
      const plain = process('<h4>Feature</h4><p><strong>Infallible</strong>: cannot be targeted.</p>');
      expect(plain).not.toContain('<article');
    });

    it('never articles stat lines or mid-sentence bold', () => {
      const output = process(
        '<h4>Petal</h4><ul><li><p><strong>Senses</strong>: Blindsight.</p></li></ul><p><strong>Spawn 1d4 Petals</strong> adjacent to each creature.</p>',
      );
      expect(output).not.toContain('<article');
    });

    it('prefixes a duplicate anchor with its enclosing section anchor', () => {
      const output = process(
        '<h3>Bloom</h3><ul><li><p><strong>Multitudes.</strong> A.</p></li></ul><h3>Flower</h3><ul><li><p><strong>Multitudes.</strong> B.</p></li></ul>',
      );
      expect(output).toContain('data-anchor="multitudes"');
      expect(output).toContain('data-anchor="flower-multitudes"');
    });

    it('leaves the first heading of an MDX component as its direct child (Collapsible summary)', () => {
      const tree = fromHtml('<h2>Boons</h2>', { fragment: true }) as unknown as import('hast').Root;
      const collapsible = {
        type: 'mdxJsxFlowElement',
        name: 'Collapsible',
        attributes: [],
        children: [
          { type: 'element', tagName: 'h6', properties: {}, children: [{ type: 'text', value: 'Core Flame' }] },
          { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Body.' }] },
          { type: 'element', tagName: 'h6', properties: {}, children: [{ type: 'text', value: 'Sub' }] },
          { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'More.' }] },
        ],
      };
      (tree.children as unknown[]).push(collapsible);
      (rehypeSectionize as unknown as () => (t: unknown) => void)()(tree);
      const outer = tree.children[0] as import('hast').Element;
      const jsx = outer.children.find((c) => (c as { type: string }).type === 'mdxJsxFlowElement') as unknown as { children: Array<{ type: string; tagName?: string; properties?: Record<string, unknown> }> };
      expect(jsx.children[0].tagName).toBe('h6');
      expect(jsx.children[1].tagName).toBe('p');
      expect(jsx.children[2].tagName).toBe('section');
      expect(jsx.children[2].properties?.dataAnchor).toBe('sub');
    });

    it('can skip the article pass', () => {
      const output = processWithOptions(
        '<h4>Multiattack</h4><ul><li><p><strong>Bite.</strong> Melee.</p></li></ul>',
        { articles: false },
      );
      expect(output).not.toContain('<article');
    });
  });
});

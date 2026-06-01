/**
 * @fileoverview Unit tests for the rehypeSectionize rehype plugin.
 * @description Verifies that heading-delimited content is grouped into section elements
 * and that pre-heading content and data-heading-level attributes are handled correctly.
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
    expect(output).toContain('<section data-heading-level="2">');
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
    expect(output).toContain('<section data-heading-level="1">');
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
      expect(output).not.toContain('data-stream');
    });
  });
});

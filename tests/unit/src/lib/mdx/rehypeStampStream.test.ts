/**
 * @fileoverview Unit tests for the rehypeStampStream rehype plugin.
 * @description Verifies that `data-stream` is stamped onto all
 * `<section data-heading-level>` elements that already exist in the tree,
 * and that elements without that attribute are not modified.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-28
 *
 * @requires vitest - Test framework
 * @requires hast-util-from-html - HTML fragment parser
 * @requires hast-util-to-html - HAST serializer
 * @requires @/lib/mdx/rehypeStampStream - Plugin under test
 */

import rehypeStampStream from '@/lib/mdx/rehypeStampStream';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { describe, expect, it } from 'vitest';

/**
 * Processes an HTML fragment through rehypeStampStream and returns serialized HTML.
 *
 * @param {string} html - Input HTML fragment containing sectionized content
 * @param {string} streamText - Stream text to stamp onto sections
 * @returns {string} Serialized HTML output
 */
function process(html: string, streamText: string): string {
  const tree = fromHtml(html, { fragment: true });
  rehypeStampStream({ streamText })(tree, tree as never, () => {});
  return toHtml(tree);
}

describe('rehypeStampStream', () => {
  it('stamps data-stream on a section with data-heading-level', () => {
    const input = '<section data-heading-level="2"><h2>Title</h2></section>';
    const output = process(input, 'FOO FOO');
    expect(output).toContain('data-stream="FOO FOO"');
  });

  it('stamps data-stream on multiple sections', () => {
    const input =
      '<section data-heading-level="1"><h1>A</h1></section>' +
      '<section data-heading-level="2"><h2>B</h2></section>';
    const output = process(input, 'BAR BAR');
    const matches = output.match(/data-stream="BAR BAR"/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it('does not stamp data-stream on elements without data-heading-level', () => {
    const input = '<div><p>Plain</p></div>';
    const output = process(input, 'STREAM STREAM');
    expect(output).not.toContain('data-stream');
  });

  it('preserves existing attributes when stamping', () => {
    const input = '<section data-heading-level="3"><h3>Deep</h3></section>';
    const output = process(input, 'SIG:abc SIG:abc');
    expect(output).toContain('data-heading-level="3"');
    expect(output).toContain('data-stream="SIG:abc SIG:abc"');
  });

  it('stamps --heading-level CSS custom property as inline style', () => {
    const input = '<section data-heading-level="2"><h2>Title</h2></section>';
    const output = process(input, 'FOO FOO');
    expect(output).toContain('--heading-level: 2');
  });

  it('stamps correct --heading-level for each section level', () => {
    const input =
      '<section data-heading-level="1"><h1>A</h1></section>' +
      '<section data-heading-level="4"><h4>B</h4></section>';
    const output = process(input, 'TEST TEST');
    expect(output).toContain('--heading-level: 1');
    expect(output).toContain('--heading-level: 4');
  });

  it('stamps data-stream on anonymous sections (data-heading-level="0")', () => {
    const input = '<section data-heading-level="0"><p>Anon</p></section>';
    const output = process(input, 'ANON ANON');
    expect(output).toContain('data-stream="ANON ANON"');
  });
});

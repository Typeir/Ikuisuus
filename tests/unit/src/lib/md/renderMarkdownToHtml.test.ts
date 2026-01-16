/**
 * @fileoverview renderMarkdownToHtml Utility Unit Tests
 * @description Tests for the Markdown to HTML conversion utility using remark
 * with GitHub-flavored markdown support.
 *
 * @module tests/unit/lib/md/renderMarkdownToHtml
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/renderMarkdownToHtml Utility under test
 */

import { describe, it, expect } from 'vitest';
import { renderMarkdownToHtml } from '@/lib/md/renderMarkdownToHtml';

describe('renderMarkdownToHtml', () => {
  describe('exports', () => {
    it('should export renderMarkdownToHtml function', () => {
      expect(renderMarkdownToHtml).toBeDefined();
      expect(typeof renderMarkdownToHtml).toBe('function');
    });
  });

  describe('basic markdown conversion', () => {
    it('should convert heading to h1', async () => {
      const result = await renderMarkdownToHtml('# Hello World');
      expect(result).toContain('<h1>Hello World</h1>');
    });

    it('should convert h2 headings', async () => {
      const result = await renderMarkdownToHtml('## Section Title');
      expect(result).toContain('<h2>Section Title</h2>');
    });

    it('should convert paragraphs', async () => {
      const result = await renderMarkdownToHtml('This is a paragraph.');
      expect(result).toContain('<p>This is a paragraph.</p>');
    });

    it('should convert bold text', async () => {
      const result = await renderMarkdownToHtml('**bold text**');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should convert italic text', async () => {
      const result = await renderMarkdownToHtml('*italic text*');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should convert inline code', async () => {
      const result = await renderMarkdownToHtml('Use `code` here');
      expect(result).toContain('<code>code</code>');
    });
  });

  describe('links and images', () => {
    it('should convert links', async () => {
      const result = await renderMarkdownToHtml('[Link](https://example.com)');
      expect(result).toContain('<a href="https://example.com">Link</a>');
    });

    it('should convert images', async () => {
      const result = await renderMarkdownToHtml('![Alt text](/path/to/img.jpg)');
      expect(result).toContain('<img');
      expect(result).toContain('src="/path/to/img.jpg"');
      expect(result).toContain('alt="Alt text"');
    });
  });

  describe('lists', () => {
    it('should convert unordered lists', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('</ul>');
    });

    it('should convert ordered lists', async () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('</ol>');
    });
  });

  describe('code blocks', () => {
    it('should convert fenced code blocks', async () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
    });

    it('should convert indented code blocks', async () => {
      const markdown = '    const x = 1;';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
    });
  });

  describe('blockquotes', () => {
    it('should convert blockquotes', async () => {
      const result = await renderMarkdownToHtml('> This is a quote');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('This is a quote');
      expect(result).toContain('</blockquote>');
    });
  });

  describe('GitHub Flavored Markdown (GFM)', () => {
    it('should convert tables', async () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>Header 1</th>');
      expect(result).toContain('<td>Cell 1</td>');
    });

    it('should convert strikethrough', async () => {
      const result = await renderMarkdownToHtml('~~deleted~~');
      expect(result).toContain('<del>deleted</del>');
    });

    it('should convert task lists', async () => {
      const markdown = '- [x] Done\n- [ ] Todo';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('checked');
      expect(result).toContain('type="checkbox"');
    });

    it('should convert autolinks', async () => {
      const result = await renderMarkdownToHtml('Visit https://example.com');
      expect(result).toContain('<a href="https://example.com">');
    });
  });

  describe('return type', () => {
    it('should return a Promise', () => {
      const result = renderMarkdownToHtml('# Test');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve to a string', async () => {
      const result = await renderMarkdownToHtml('# Test');
      expect(typeof result).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const result = await renderMarkdownToHtml('');
      expect(typeof result).toBe('string');
    });

    it('should handle whitespace-only input', async () => {
      const result = await renderMarkdownToHtml('   \n\n   ');
      expect(typeof result).toBe('string');
    });

    it('should handle special characters', async () => {
      const result = await renderMarkdownToHtml('Special chars: < > & " \'');
      expect(result).toContain('&#x3C;');
      expect(result).toContain('>');
      expect(result).toContain('&#x26;');
    });

    it('should handle complex nested markdown', async () => {
      const markdown = '**Bold with *italic* inside**';
      const result = await renderMarkdownToHtml(markdown);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });
});

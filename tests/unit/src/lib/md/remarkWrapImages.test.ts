/**
 * @fileoverview remarkWrapImages Plugin Unit Tests
 * @description Tests for the remark plugin that wraps Markdown image nodes
 * in a div with a custom CSS class.
 *
 * @module tests/unit/lib/md/remarkWrapImages
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/remarkWrapImages Plugin under test
 */

import { describe, it, expect } from 'vitest';
import remarkWrapImages from '@/lib/md/remarkWrapImages';

describe('remarkWrapImages', () => {
  describe('exports', () => {
    it('should export default function', () => {
      expect(remarkWrapImages).toBeDefined();
      expect(typeof remarkWrapImages).toBe('function');
    });
  });

  describe('plugin factory', () => {
    it('should return a function when called without arguments', () => {
      const plugin = remarkWrapImages();
      expect(typeof plugin).toBe('function');
    });

    it('should return a function when called with className', () => {
      const plugin = remarkWrapImages('custom-class');
      expect(typeof plugin).toBe('function');
    });

    it('should return a transformer function', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();
      expect(typeof transformer).toBe('function');
    });
  });

  describe('default className', () => {
    it('should use vignette-img as default class', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/test.jpg',
            alt: 'Test image',
          },
        ],
      };

      transformer(tree);

      expect(tree.children[0]).toMatchObject({
        type: 'html',
        value: expect.stringContaining('class="vignette-img"'),
      });
    });
  });

  describe('custom className', () => {
    it('should use provided className', () => {
      const plugin = remarkWrapImages('my-custom-class');
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/test.jpg',
            alt: 'Test',
          },
        ],
      };

      transformer(tree);

      expect(tree.children[0]).toMatchObject({
        type: 'html',
        value: expect.stringContaining('class="my-custom-class"'),
      });
    });
  });

  describe('image transformation', () => {
    it('should wrap image in div with img tag', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/path/to/image.png',
            alt: 'Alt text',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.type).toBe('html');
      expect(result.value).toContain('<div');
      expect(result.value).toContain('<img');
      expect(result.value).toContain('</div>');
    });

    it('should preserve image src', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/library/images/hero.webp',
            alt: 'Hero',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('src="/library/images/hero.webp"');
    });

    it('should preserve image alt text', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/img.jpg',
            alt: 'A beautiful sunset',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('alt="A beautiful sunset"');
    });

    it('should handle empty alt text', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/img.jpg',
            alt: '',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('alt=""');
    });

    it('should handle undefined alt text', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/img.jpg',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('alt=""');
    });
  });

  describe('special character handling', () => {
    it('should escape double quotes in alt text', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/img.jpg',
            alt: 'Image with "quotes"',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('&quot;');
      expect(result.value).not.toMatch(/alt="[^"]*"[^"]*"/);
    });

    it('should escape double quotes in src', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'image',
            url: '/path/with"quote.jpg',
            alt: 'Test',
          },
        ],
      };

      transformer(tree);

      const result = tree.children[0] as { type: string; value: string };
      expect(result.value).toContain('&quot;');
    });
  });

  describe('multiple images', () => {
    it('should transform all images in tree', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          { type: 'paragraph', children: [] },
          { type: 'image', url: '/img1.jpg', alt: 'Image 1' },
          { type: 'text', value: 'Some text' },
          { type: 'image', url: '/img2.jpg', alt: 'Image 2' },
        ],
      };

      transformer(tree);

      const htmlNodes = tree.children.filter((c) => c.type === 'html');
      expect(htmlNodes.length).toBe(2);
    });
  });

  describe('non-image nodes', () => {
    it('should not modify non-image nodes', () => {
      const plugin = remarkWrapImages();
      const transformer = plugin();

      const tree = {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
          { type: 'heading', depth: 1, children: [] },
        ],
      };

      const originalJson = JSON.stringify(tree);
      transformer(tree);

      expect(JSON.stringify(tree)).toBe(originalJson);
    });
  });
});

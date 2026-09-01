/**
 * @fileoverview Prose Extraction Unit Tests
 * @description Tests for `scripts/search/extractProse.ts` covering MDX→text
 * stripping of frontmatter, JSX, code, markdown, imports, and whitespace.
 *
 * @module tests/unit/scripts/search/extractProse.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { extractProse } from '@scripts/search/extractProse';
import { describe, expect, it } from 'vitest';

describe('extractProse', () => {
  describe('frontmatter', () => {
    it('should strip YAML frontmatter', () => {
      const result = extractProse(
        `---
title: Test Page
description: A sample lore entry
---
This is the body content.`,
      );
      expect(result).toContain('This is the body content');
      expect(result).not.toContain('title:');
      expect(result).not.toContain('---');
    });

    it('should pass through content when no frontmatter', () => {
      const result = extractProse('# Hello World\n\nSome prose here.');
      expect(result).toContain('Hello World');
      expect(result).toContain('Some prose here');
    });
  });

  describe('MDX imports', () => {
    it('should strip import statements', () => {
      const result = extractProse(
        `import { Foo } from './bar';
import type { Baz } from '@/types';
# Title
Body text.`,
      );
      expect(result).not.toContain('import');
      expect(result).toContain('Title');
      expect(result).toContain('Body text');
    });

    it('should strip export statements', () => {
      const result = extractProse('export const meta = {};\n# Title\nBody.');
      expect(result).not.toContain('export');
      expect(result).toContain('Title');
    });
  });

  describe('JSX', () => {
    it('should strip JSX elements', () => {
      const result = extractProse(
        '<BlendedImage src="foo.webp" />\n<Collapsible title="Info">\n</Collapsible>\nBody text.',
      );
      expect(result).not.toContain('BlendedImage');
      expect(result).not.toContain('Collapsible');
      expect(result).toContain('Body text');
    });

    it('should strip paw gate comments', () => {
      const result = extractProse(
        '{/* paw:gate:content-format:multiple-h1 ignore */}\n# Title\nBody.',
      );
      expect(result).not.toContain('paw:gate');
      expect(result).toContain('Title');
    });
  });

  describe('code', () => {
    it('should strip fenced code blocks', () => {
      const result = extractProse(
        'Before code.\n```\nconst x = 1;\n```\nAfter code.',
      );
      expect(result).not.toContain('const x');
      expect(result).toContain('Before code');
      expect(result).toContain('After code');
    });

    it('should strip inline code', () => {
      const result = extractProse('The `getSlug()` function returns a slug.');
      expect(result).not.toContain('`');
      expect(result).not.toContain('()');
      expect(result).toContain('returns a slug');
    });
  });

  describe('markdown formatting', () => {
    it('should strip bold and italic', () => {
      const result = extractProse(
        '**Bold text** and *italic text* and ***both***.',
      );
      expect(result).not.toContain('**');
      expect(result).toContain('Bold text');
      expect(result).toContain('italic text');
      expect(result).toContain('both');
    });

    it('should strip links keeping text', () => {
      const result = extractProse(
        'Visit [Thule](/en/library/world/thule) for more.',
      );
      expect(result).toContain('Visit Thule');
      expect(result).not.toContain('](/en/');
    });

    it('should strip images keeping alt text', () => {
      const result = extractProse(
        '![Depiction of Päivätär](/images/paivatar.webp)',
      );
      expect(result).toContain('Depiction of Päivätär');
      expect(result).not.toContain('.webp');
    });

    it('should strip heading markers', () => {
      const result = extractProse('## Common\n\nBody text.');
      expect(result).not.toContain('##');
      expect(result).toContain('Common');
      expect(result).toContain('Body text');
    });

    it('should strip blockquotes', () => {
      const result = extractProse('> This is a quote.\nNormal text.');
      expect(result).not.toContain('>');
      expect(result).toContain('This is a quote');
      expect(result).toContain('Normal text');
    });
  });

  describe('whitespace', () => {
    it('should collapse multiple newlines and spaces', () => {
      const result = extractProse(
        'Line one.\n\nLine two.\n\n\nLine three.    Extra spaces.',
      );
      expect(result).toBe('Line one. Line two. Line three. Extra spaces.');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = extractProse('\n\n  Body  \n\n');
      expect(result).toBe('Body');
    });
  });

  describe('real-world content', () => {
    it('should preserve named entities in monster lore', () => {
      const result = extractProse(
        `# Ancient Dragon

---
The **Ancient Dragon** of [Thule](/en/library/world/thule) is a fearsome creature that dwells in the **Hidden Kingdom** of Borossa.`,
      );
      expect(result).toContain('Ancient Dragon');
      expect(result).toContain('Thule');
      expect(result).toContain('Hidden Kingdom');
      expect(result).toContain('Borossa');
      expect(result).not.toContain('**');
      expect(result).not.toContain('](/');
    });

    it('should handle MDX with paw comments and JSX', () => {
      const result = extractProse(
        '{/* paw:gate:content-format:multiple-h1 ignore */}\n# Binturia\n\n<BlendedImage src="/images/binturia.webp" />\n\n**Binturia** is a northern secular nation.',
      );
      expect(result).toContain('Binturia');
      expect(result).toContain('northern secular nation');
      expect(result).not.toContain('paw:gate');
      expect(result).not.toContain('BlendedImage');
    });
  });

  describe('shortcodes', () => {
    it('should index a bare keyword by its own text', () => {
      const result = extractProse('You regain uses after a [# kw:Recovery #].');

      expect(result).toBe('You regain uses after a Recovery.');
    });

    it('should index a namespaced keyword by its value', () => {
      const result = extractProse('The target is [# kw:condition:Prone #].');

      expect(result).toBe('The target is Prone.');
    });

    it('should index a keyword by its display override, not its target', () => {
      const result = extractProse(
        'All [# kw:displace;displacement #] is halved.',
      );

      expect(result).toBe('All displacement is halved.');
      expect(result).not.toContain('displace ');
    });

    it('should unwrap a measure to its plain form', () => {
      const result = extractProse('Reach [= 1 stride =] of you.');

      expect(result).not.toContain('[=');
      expect(result).toContain('stride');
    });

    it('should unwrap a measure whose unit is unknown', () => {
      const result = extractProse('You carry [= 1 litre =] of water.');

      expect(result).toBe('You carry 1 litre of water.');
    });

    it('should drop an adjectival marker from a measure', () => {
      const result = extractProse('A [= 4 stride;ADJ =] radius.');

      expect(result).not.toContain(';ADJ');
      expect(result).not.toContain('[=');
    });

    it('should unwrap a dice expression to its notation', () => {
      const result = extractProse('It takes [% 2d6 %] damage.');

      expect(result).toBe('It takes 2d6 damage.');
    });

    it('should leave a malformed keyword expression alone', () => {
      const result = extractProse('A [# not-a-keyword #] here.');

      expect(result).toContain('not-a-keyword');
    });

    it('should leave no shortcode markup in mixed prose', () => {
      const result = extractProse(
        'Within [= 2 stride =], deal [% 1d8 %] and apply [# kw:condition:burning #] until a [# kw:Repose #].',
      );

      expect(result).not.toMatch(/\[[#=%]/);
      expect(result).toContain('burning');
      expect(result).toContain('Repose');
    });
  });
});

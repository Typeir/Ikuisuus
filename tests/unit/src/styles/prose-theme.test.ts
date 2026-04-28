/**
 * @fileoverview Unit tests for Tailwind Typography Prose Theme Configuration
 * @description Tests for proseTheme export structure, CSS variable mappings, and custom styles.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/styles/prose-theme - Prose theme configuration
 */

import { proseTheme } from '@/styles/prose-theme';
import { describe, expect, it } from 'vitest';

describe('prose-theme', () => {
  describe('exports', () => {
    it('should export proseTheme object', () => {
      expect(proseTheme).toBeDefined();
      expect(typeof proseTheme).toBe('object');
    });

    it('should have DEFAULT variant', () => {
      expect(proseTheme.DEFAULT).toBeDefined();
      expect(typeof proseTheme.DEFAULT).toBe('object');
    });

    it('should have invert variant', () => {
      expect(proseTheme.invert).toBeDefined();
      expect(typeof proseTheme.invert).toBe('object');
    });
  });

  describe('DEFAULT variant', () => {
    it('should have css property', () => {
      expect(proseTheme.DEFAULT.css).toBeDefined();
      expect(typeof proseTheme.DEFAULT.css).toBe('object');
    });

    describe('Tailwind prose color variables', () => {
      const css = proseTheme.DEFAULT.css;

      it('should map --tw-prose-body to theme variable', () => {
        expect(css['--tw-prose-body']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-headings to theme variable', () => {
        expect(css['--tw-prose-headings']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-lead to theme variable', () => {
        expect(css['--tw-prose-lead']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-links to accent color', () => {
        expect(css['--tw-prose-links']).toBe('var(--color-accent)');
      });

      it('should map --tw-prose-bold to emphasis color', () => {
        expect(css['--tw-prose-bold']).toBe('var(--color-emphasis)');
      });

      it('should map --tw-prose-counters to theme variable', () => {
        expect(css['--tw-prose-counters']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-bullets to theme variable', () => {
        expect(css['--tw-prose-bullets']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-hr to surface color', () => {
        expect(css['--tw-prose-hr']).toBe('var(--color-surface)');
      });

      it('should map --tw-prose-quotes to theme variable', () => {
        expect(css['--tw-prose-quotes']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-quote-borders to accent color', () => {
        expect(css['--tw-prose-quote-borders']).toBe('var(--color-accent)');
      });

      it('should map --tw-prose-captions to secondary color', () => {
        expect(css['--tw-prose-captions']).toBe('var(--color-secondary)');
      });

      it('should map --tw-prose-code to accent color', () => {
        expect(css['--tw-prose-code']).toBe('var(--color-accent)');
      });

      it('should map --tw-prose-pre-code to theme variable', () => {
        expect(css['--tw-prose-pre-code']).toBe('var(--color-text)');
      });

      it('should map --tw-prose-pre-bg to surface color', () => {
        expect(css['--tw-prose-pre-bg']).toBe('var(--color-surface)');
      });

      it('should map --tw-prose-th-borders to accent color', () => {
        expect(css['--tw-prose-th-borders']).toBe('var(--color-accent)');
      });

      it('should map --tw-prose-td-borders to surface color', () => {
        expect(css['--tw-prose-td-borders']).toBe('var(--color-surface)');
      });
    });

    describe('custom styles', () => {
      const css = proseTheme.DEFAULT.css;

      it('should set custom maxWidth', () => {
        expect(css.maxWidth).toBe('150ch');
      });

      it('should have blockquote strong color override', () => {
        expect(css['blockquote strong']).toBeDefined();
        expect(css['blockquote strong']).toHaveProperty(
          'color',
          'var(--color-emphasis)',
        );
      });

      it('should have blockquote b color override', () => {
        expect(css['blockquote b']).toBeDefined();
        expect(css['blockquote b']).toHaveProperty(
          'color',
          'var(--color-emphasis)',
        );
      });

      it('should have blockquote heading color override', () => {
        const headingSelector =
          'blockquote h1, blockquote h2, blockquote h3, blockquote h4, blockquote h5, blockquote h6';
        expect(css[headingSelector]).toBeDefined();
        expect(css[headingSelector]).toHaveProperty(
          'color',
          'var(--color-accent)',
        );
      });
    });
  });

  describe('invert variant', () => {
    it('should have css property', () => {
      expect(proseTheme.invert.css).toBeDefined();
      expect(typeof proseTheme.invert.css).toBe('object');
    });

    it('should contain prose color variables', () => {
      const css = proseTheme.invert.css;
      expect(css['--tw-prose-body']).toBe('var(--color-text)');
      expect(css['--tw-prose-links']).toBe('var(--color-accent)');
    });

    it('should use same color mappings as DEFAULT for consistency', () => {
      const defaultCss = proseTheme.DEFAULT.css;
      const invertCss = proseTheme.invert.css;

      expect(invertCss['--tw-prose-body']).toBe(defaultCss['--tw-prose-body']);
      expect(invertCss['--tw-prose-links']).toBe(
        defaultCss['--tw-prose-links'],
      );
      expect(invertCss['--tw-prose-bold']).toBe(defaultCss['--tw-prose-bold']);
    });
  });

  describe('CSS variable format', () => {
    it('should use var() syntax for all color references', () => {
      const css = proseTheme.DEFAULT.css;
      const colorVariables = Object.entries(css).filter(([key]) =>
        key.startsWith('--tw-prose-'),
      );

      colorVariables.forEach(([, value]) => {
        if (typeof value === 'string') {
          expect(value).toMatch(/^var\(--color-[a-z]+\)$/);
        }
      });
    });

    it('should reference only valid theme color variables', () => {
      const validColorVars = [
        'var(--color-text)',
        'var(--color-accent)',
        'var(--color-emphasis)',
        'var(--color-surface)',
        'var(--color-secondary)',
      ];

      const css = proseTheme.DEFAULT.css;
      const colorVariables = Object.entries(css).filter(([key]) =>
        key.startsWith('--tw-prose-'),
      );

      colorVariables.forEach(([, value]) => {
        if (typeof value === 'string') {
          expect(validColorVars).toContain(value);
        }
      });
    });
  });

  describe('Tailwind integration compatibility', () => {
    it('should have structure compatible with Tailwind typography plugin', () => {
      expect(proseTheme).toHaveProperty('DEFAULT');
      expect(proseTheme).toHaveProperty('invert');
      expect(proseTheme.DEFAULT).toHaveProperty('css');
      expect(proseTheme.invert).toHaveProperty('css');
    });

    it('should be usable in tailwind.config.ts typography extend', () => {
      const mockTailwindConfig = {
        theme: {
          extend: {
            typography: proseTheme,
          },
        },
      };

      expect(mockTailwindConfig.theme.extend.typography).toBe(proseTheme);
    });
  });
});

/**
 * classNameMerge Utility Tests
 *
 * @fileoverview Tests for the lightweight className merge utility
 */

import { cn } from '@/lib/utils/classNameMerge';
import { describe, expect, it } from 'vitest';

describe('classNameMerge (cn)', () => {
  describe('basic string concatenation', () => {
    it('should merge multiple strings', () => {
      expect(cn('btn', 'primary')).toBe('btn primary');
    });

    it('should handle single string', () => {
      expect(cn('btn')).toBe('btn');
    });

    it('should handle empty strings', () => {
      expect(cn('btn', '', 'primary')).toBe('btn primary');
    });
  });

  describe('conditional strings', () => {
    it('should include truthy conditional strings', () => {
      expect(cn('btn', true && 'active')).toBe('btn active');
    });

    it('should exclude falsy conditional strings', () => {
      expect(cn('btn', false && 'active')).toBe('btn');
    });

    it('should exclude undefined conditionals', () => {
      expect(cn('btn', undefined)).toBe('btn');
    });

    it('should exclude null conditionals', () => {
      expect(cn('btn', null)).toBe('btn');
    });
  });

  describe('object conditions', () => {
    it('should include object keys with truthy values', () => {
      const styles = { active: 'active', disabled: 'disabled' };
      expect(cn('btn', { [styles.active]: true })).toBe('btn active');
    });

    it('should exclude object keys with falsy values', () => {
      const styles = { active: 'active', disabled: 'disabled' };
      expect(cn('btn', { [styles.active]: false })).toBe('btn');
    });

    it('should handle multiple object conditions', () => {
      const styles = { active: 'active', disabled: 'disabled' };
      expect(
        cn('btn', { [styles.active]: true, [styles.disabled]: false })
      ).toBe('btn active');
    });

    it('should handle object with all conditions true', () => {
      const styles = { active: 'active', primary: 'primary' };
      expect(cn('btn', { [styles.active]: true, [styles.primary]: true })).toBe(
        'btn active primary'
      );
    });

    it('should handle undefined object values', () => {
      const styles = { active: 'active' };
      expect(cn('btn', { [styles.active]: undefined })).toBe('btn');
    });
  });

  describe('array handling', () => {
    it('should flatten arrays', () => {
      expect(cn(['btn', 'primary'])).toBe('btn primary');
    });

    it('should handle nested arrays', () => {
      expect(cn('btn', ['primary', 'lg'])).toBe('btn primary lg');
    });

    it('should flatten deeply nested arrays', () => {
      expect(cn('btn', [['primary'], ['lg']])).toBe('btn primary lg');
    });

    it('should handle arrays with falsy values', () => {
      expect(cn(['btn', false && 'active', 'primary'])).toBe('btn primary');
    });
  });

  describe('mixed types', () => {
    it('should combine strings and objects', () => {
      const styles = { open: 'open' };
      expect(cn('menu', { [styles.open]: true }, 'dark')).toBe(
        'menu open dark'
      );
    });

    it('should combine strings, objects, and arrays', () => {
      const styles = { icon: 'icon', open: 'open' };
      expect(cn('btn', { [styles.open]: true }, ['text-lg'], styles.icon)).toBe(
        'btn open text-lg icon'
      );
    });

    it('should handle complex real-world example', () => {
      const styles = { accordion: '_accordion_xyz', open: '_open_abc' };
      const open = true;
      expect(
        cn('ml-2', styles.accordion, { [styles.open]: open }, 'sidebar-item')
      ).toBe('ml-2 _accordion_xyz _open_abc sidebar-item');
    });

    it('should handle complex example with false condition', () => {
      const styles = { accordion: '_accordion_xyz', open: '_open_abc' };
      const open = false;
      expect(
        cn('ml-2', styles.accordion, { [styles.open]: open }, 'sidebar-item')
      ).toBe('ml-2 _accordion_xyz sidebar-item');
    });
  });

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      expect(cn()).toBe('');
    });

    it('should handle only falsy values', () => {
      expect(cn(false, null, undefined, '')).toBe('');
    });

    it('should handle zero (falsy but valid)', () => {
      expect(cn('btn', 0 && 'active')).toBe('btn');
    });

    it('should handle empty array', () => {
      expect(cn('btn', [])).toBe('btn');
    });

    it('should handle array of only falsy values', () => {
      expect(cn('btn', [false, null, undefined])).toBe('btn');
    });

    it('should preserve inner whitespace in class names', () => {
      expect(cn('btn  ', '  primary')).toBe('btn     primary');
    });
  });

  describe('className module pattern (SCSS modules)', () => {
    it('should work with CSS module patterns', () => {
      const styles = { accordion: '_accordion_1a2b', open: '_open_3c4d' };
      const open = true;
      expect(
        cn(
          ['ml-2', styles.accordion, open ? styles.open : '']
            .filter(Boolean)
            .join(' ')
        )
      ).toBe('ml-2 _accordion_1a2b _open_3c4d');
    });

    it('should replace .filter(Boolean).join pattern', () => {
      const styles = { label: '_label_xyz', bold: '_bold_abc' };
      const isBold = true;

      // Old way
      const old = ['text-lg', styles.label, isBold ? styles.bold : '']
        .filter(Boolean)
        .join(' ');

      // New way
      const newWay = cn('text-lg', styles.label, { [styles.bold]: isBold });

      expect(old).toBe(newWay);
    });
  });
});

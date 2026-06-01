/**
 * @fileoverview Tests for MDX to Component Compiler
 * @module tests/unit/src/lib/components/mdx/compileMdxToComponent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/library/infrastructure/compile/compileMdxToComponent
 */

import { describe, it, expect } from 'vitest';
import { compileMdxToComponent } from '@/modules/library/infrastructure/compile/compileMdxToComponent';

describe('compileMdxToComponent', () => {
  describe('Module exports', () => {
    it('should export compileMdxToComponent function', () => {
      expect(compileMdxToComponent).toBeDefined();
      expect(typeof compileMdxToComponent).toBe('function');
    });

    it('should be an async function', () => {
      expect(compileMdxToComponent.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Function signature', () => {
    it('should accept source parameter', () => {
      expect(compileMdxToComponent.length).toBe(1);
    });

    it('should return a Promise', () => {
      const result = compileMdxToComponent('# Test');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Basic compilation', () => {
    it('should compile simple MDX source', async () => {
      const source = '# Hello World';
      const Component = await compileMdxToComponent(source);
      expect(Component).toBeDefined();
      expect(typeof Component).toBe('function');
    });

    it('should compile MDX with paragraphs', async () => {
      const source = 'This is a test paragraph.';
      const Component = await compileMdxToComponent(source);
      expect(Component).toBeDefined();
    });

    it('should compile empty MDX source', async () => {
      const source = '';
      const Component = await compileMdxToComponent(source);
      expect(Component).toBeDefined();
    });
  });
});

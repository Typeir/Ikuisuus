/**
 * @fileoverview Tests for MDX File Finder Utility
 * @module tests/unit/src/lib/mdx/findAllMdxFiles
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/library/infrastructure/content/findAllMdxFiles
 */

import { describe, it, expect } from 'vitest';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';

describe('findAllMdxFiles', () => {
  describe('Module exports', () => {
    it('should export default function', () => {
      expect(findAllMdxFiles).toBeDefined();
      expect(typeof findAllMdxFiles).toBe('function');
    });

    it('should be an async function', () => {
      expect(findAllMdxFiles.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Function signature', () => {
    it('should accept directory path parameter', () => {
      expect(findAllMdxFiles.length).toBe(1);
    });

    it('should return a Promise', () => {
      const result = findAllMdxFiles('.');
      expect(result).toBeInstanceOf(Promise);
    });
  });
});

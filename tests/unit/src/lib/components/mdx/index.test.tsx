/**
 * MDX Components Index Unit Tests
 *
 * @fileoverview Tests for the MDX component registry exported by index.tsx.
 * Validates that all expected components are registered for MDX compilation.
 *
 * @module tests/unit/lib/components/mdx/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/components/mdx/index Module under test
 */

import { describe, it, expect } from 'vitest';
import components from '@/lib/components/mdx/index';

describe('MDX Components Index', () => {
  describe('exports', () => {
    it('should export components object', () => {
      expect(components).toBeDefined();
      expect(typeof components).toBe('object');
    });
  });

  describe('registered components', () => {
    it('should include BlendedImage component', () => {
      expect(components.BlendedImage).toBeDefined();
    });

    it('should include FlexRenderer component', () => {
      expect(components.FlexRenderer).toBeDefined();
    });

    it('should include MonsterTable component', () => {
      expect(components.MonsterTable).toBeDefined();
    });

    it('should include HeirloomTable component', () => {
      expect(components.HeirloomTable).toBeDefined();
    });

    it('should include SpellTable component', () => {
      expect(components.SpellTable).toBeDefined();
    });

    it('should include TrinketTable component', () => {
      expect(components.TrinketTable).toBeDefined();
    });

    it('should include table wrapper component', () => {
      expect(components.table).toBeDefined();
      expect(typeof components.table).toBe('function');
    });
  });

  describe('heading components', () => {
    it('should include h1 component', () => {
      expect(components.h1).toBeDefined();
    });

    it('should include h2 component', () => {
      expect(components.h2).toBeDefined();
    });

    it('should include h3 component', () => {
      expect(components.h3).toBeDefined();
    });

    it('should include h4 component', () => {
      expect(components.h4).toBeDefined();
    });

    it('should include h5 component', () => {
      expect(components.h5).toBeDefined();
    });

    it('should include h6 component', () => {
      expect(components.h6).toBeDefined();
    });
  });
});

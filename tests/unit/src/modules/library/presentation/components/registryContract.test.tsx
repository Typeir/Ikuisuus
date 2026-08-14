/**
 * @fileoverview MDX Component Registry Contract Tests
 * @description Asserts that components emitted by remark plugins and referenced
 * by content resolve through the live runtime registry.
 *
 * @module tests/unit/modules/library/presentation/components/registryContract
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 */

import { UNIT_COMPONENT_NAME } from '@/lib/md/remarkUnit';
import { components } from '@/modules/library/presentation/components';
import { describe, expect, it } from 'vitest';

/**
 * Component names emitted by remark plugins during MDX compilation.
 */
const PLUGIN_EMITTED = [UNIT_COMPONENT_NAME, 'DiceRoll'] as const;

/**
 * Component names referenced directly by rule content, not emitted by plugins.
 */
const CONTENT_REFERENCED = ['UnitSwitcher', 'Collapsible'] as const;

describe('MDX component registry contract', () => {
  describe('plugin-emitted components', () => {
    it.each(PLUGIN_EMITTED)(
      'should provide %s, which a remark plugin emits',
      (name) => {
        expect(components).toHaveProperty(name);
      },
    );

    it.each(PLUGIN_EMITTED)('should register %s as renderable', (name) => {
      const entry = (components as Record<string, unknown>)[name];
      expect(['function', 'object']).toContain(typeof entry);
    });
  });

  describe('content-referenced components', () => {
    it.each(CONTENT_REFERENCED)('should provide %s', (name) => {
      expect(components).toHaveProperty(name);
    });
  });

  describe('registry shape', () => {
    it('should export a component map', () => {
      expect(typeof components).toBe('object');
      expect(Object.keys(components).length).toBeGreaterThan(0);
    });

    it('should map every entry to something renderable', () => {
      for (const [name, entry] of Object.entries(components)) {
        expect(
          ['function', 'object'].includes(typeof entry),
          `${name} is not renderable`,
        ).toBe(true);
      }
    });
  });
});

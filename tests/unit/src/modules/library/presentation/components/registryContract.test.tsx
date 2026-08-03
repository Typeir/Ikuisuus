/**
 * @fileoverview MDX Component Registry Contract Tests
 * @description Guards the contract between the remark plugins and the live
 * component registry.
 *
 * A remark plugin emits JSX referring to a component by name. If that name is
 * absent from the registry the page renders through, MDX throws at request time
 * — long after the build, the metadata pass and the unit tests have all passed.
 * That is exactly how `Unit` shipped broken.
 *
 * These tests assert the registry actually used at runtime, not the one the
 * documentation names.
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
 * Component names emitted by remark plugins during MDX compilation. Every entry
 * must resolve through the live registry or content fails to render.
 */
const PLUGIN_EMITTED = [UNIT_COMPONENT_NAME, 'DiceRoll'] as const;

/**
 * Components referenced directly by rule content that the reader can interact
 * with. These are authored by hand rather than emitted, but a missing entry
 * fails identically at request time.
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

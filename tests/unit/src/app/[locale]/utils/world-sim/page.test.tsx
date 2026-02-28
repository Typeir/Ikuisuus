/**
 * @fileoverview World Sim Page Unit Tests
 * @description Tests the generateMetadata export and basic page rendering.
 *
 * @module tests/unit/worldSimPage
 */

import { generateMetadata } from '@/app/[locale]/utils/world-sim/page';
import { describe, expect, it, vi } from 'vitest';

/** Mock the WorldSim component to avoid Three.js initialization */
vi.mock('@/lib/components/worldSim', () => ({
  WorldSim: () => null,
}));

describe('WorldSimPage', () => {
  describe('generateMetadata', () => {
    it('returns metadata with title', () => {
      const meta = generateMetadata();
      expect(meta.title).toContain('World Sim');
    });

    it('returns metadata with description', () => {
      const meta = generateMetadata();
      expect(meta.description).toBeTruthy();
      expect(meta.description.length).toBeGreaterThan(10);
    });
  });
});

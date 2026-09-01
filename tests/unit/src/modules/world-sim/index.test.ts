/**
 * @fileoverview World Sim Barrel Export Tests
 * @description Verifies that all public re-exports from the barrel file are accessible.
 *
 * @module tests/unit/src/modules/world-sim/index.test
 */

import { describe, expect, it, vi } from 'vitest';

/** Mock hooks/canvas to avoid Three.js initialization */
vi.mock('@/modules/world-sim/application/hooks/useWorldSimCanvas', () => ({
  useWorldSimCanvas: () => ({
    containerRef: { current: null },
    mediatorRef: { current: null },
    subscribeToProjections: vi.fn(),
    bindElement: vi.fn(),
    unbindElement: vi.fn(),
  }),
}));

vi.mock(
  '@/modules/world-sim/presentation/overlay/ControlsBar/ControlsBar',
  () => ({
    ControlsBar: () => null,
  }),
);

vi.mock('@/modules/world-sim/presentation/overlay/InfoPanel/InfoPanel', () => ({
  InfoPanel: () => null,
}));

vi.mock(
  '@/modules/world-sim/presentation/overlay/OverlayContainer/OverlayContainer',
  () => ({
    OverlayContainer: () => null,
  }),
);

vi.mock(
  '@/modules/world-sim/presentation/overlay/ContentPanel/ContentPanel',
  () => ({
    ContentPanel: () => null,
  }),
);

import {
    useWorldSimDispatch,
    useWorldSimState,
    WorldSimProvider,
    ZoomLevel,
} from '@/modules/world-sim';

describe('worldSim barrel exports', () => {
  it('exports WorldSimProvider', () => {
    expect(WorldSimProvider).toBeDefined();
    expect(typeof WorldSimProvider).toBe('function');
  });

  it('exports useWorldSimState hook', () => {
    expect(useWorldSimState).toBeDefined();
    expect(typeof useWorldSimState).toBe('function');
  });

  it('exports useWorldSimDispatch hook', () => {
    expect(useWorldSimDispatch).toBeDefined();
    expect(typeof useWorldSimDispatch).toBe('function');
  });

  it('exports ZoomLevel enum', () => {
    expect(ZoomLevel).toBeDefined();
    expect(ZoomLevel.System).toBe('system');
    expect(ZoomLevel.Body).toBe('body');
    expect(ZoomLevel.Region).toBe('region');
  });
});

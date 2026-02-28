/**
 * @fileoverview World Sim Barrel Export Tests
 * @description Verifies that all public re-exports from the barrel file are accessible.
 *
 * @module tests/unit/worldSim/index
 */

import { describe, expect, it, vi } from 'vitest';

/** Mock hooks/canvas to avoid Three.js initialization */
vi.mock('@/lib/components/worldSim/hooks/useWorldSimCanvas', () => ({
  useWorldSimCanvas: () => ({
    containerRef: { current: null },
    mediatorRef: { current: null },
    subscribeToProjections: vi.fn(),
    bindElement: vi.fn(),
    unbindElement: vi.fn(),
  }),
}));

vi.mock('@/lib/components/worldSim/overlay/ControlsBar', () => ({
  ControlsBar: () => null,
}));

vi.mock('@/lib/components/worldSim/overlay/InfoPanel', () => ({
  InfoPanel: () => null,
}));

vi.mock('@/lib/components/worldSim/overlay/OverlayContainer', () => ({
  OverlayContainer: () => null,
}));

vi.mock('@/lib/components/worldSim/overlay/ContentPanel', () => ({
  ContentPanel: () => null,
}));

import {
    useWorldSimDispatch,
    useWorldSimState,
    WorldSim,
    WorldSimProvider,
    ZoomLevel,
} from '@/lib/components/worldSim';

describe('worldSim barrel exports', () => {
  it('exports WorldSim component', () => {
    expect(WorldSim).toBeDefined();
    expect(typeof WorldSim).toBe('function');
  });

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

/**
 * @fileoverview World Sim Reducer Unit Tests
 * @description Exercises every action type: verifies state transitions and
 * immutability.
 *
 * @module tests/unit/worldSim/context/worldSimReducer
 */

import { worldSimReducer } from '@/modules/world-sim/application/state/worldSimReducer';
import {
    INITIAL_WORLD_SIM_STATE,
    WorldSimActionType,
    ZoomLevel,
    type WorldSimState,
} from '@/modules/world-sim/application/state/worldSimTypes';
import { describe, expect, it } from 'vitest';

describe('worldSimReducer', () => {
  it('sets isInitialized on Initialize', () => {
    const state = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.Initialize,
    });

    expect(state.isInitialized).toBe(true);
    expect(state.zoomLevel).toBe(ZoomLevel.System);
  });

  it('selects a body and resets region and hover', () => {
    const prev: WorldSimState = {
      ...INITIAL_WORLD_SIM_STATE,
      isInitialized: true,
      selectedRegionId: 'old-region',
      hoveredBodyId: 'old-hover',
    };

    const state = worldSimReducer(prev, {
      type: WorldSimActionType.SelectBody,
      bodyId: 'damocles',
    });

    expect(state.selectedBodyId).toBe('damocles');
    expect(state.selectedRegionId).toBeNull();
    expect(state.hoveredBodyId).toBeNull();
    expect(state.zoomLevel).toBe(ZoomLevel.Body);
  });

  it('selects a region with body and sets Region zoom', () => {
    const state = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.SelectRegion,
      bodyId: 'damocles',
      regionId: 'ordovica',
    });

    expect(state.selectedBodyId).toBe('damocles');
    expect(state.selectedRegionId).toBe('ordovica');
    expect(state.zoomLevel).toBe(ZoomLevel.Region);
  });

  it('deselects body and region returning to System', () => {
    const prev: WorldSimState = {
      ...INITIAL_WORLD_SIM_STATE,
      selectedBodyId: 'damocles',
      selectedRegionId: 'ordovica',
      zoomLevel: ZoomLevel.Region,
    };

    const state = worldSimReducer(prev, {
      type: WorldSimActionType.Deselect,
    });

    expect(state.selectedBodyId).toBeNull();
    expect(state.selectedRegionId).toBeNull();
    expect(state.zoomLevel).toBe(ZoomLevel.System);
  });

  it('deselects region only, keeping body at Body zoom', () => {
    const prev: WorldSimState = {
      ...INITIAL_WORLD_SIM_STATE,
      selectedBodyId: 'damocles',
      selectedRegionId: 'ordovica',
      zoomLevel: ZoomLevel.Region,
    };

    const state = worldSimReducer(prev, {
      type: WorldSimActionType.DeselectRegion,
    });

    expect(state.selectedBodyId).toBe('damocles');
    expect(state.selectedRegionId).toBeNull();
    expect(state.zoomLevel).toBe(ZoomLevel.Body);
  });

  it('sets zoom level', () => {
    const state = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.SetZoomLevel,
      level: ZoomLevel.Body,
    });

    expect(state.zoomLevel).toBe(ZoomLevel.Body);
  });

  it('sets transitioning flag', () => {
    const state = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.SetTransitioning,
      isTransitioning: true,
    });

    expect(state.isTransitioning).toBe(true);
  });

  it('sets and clears hovered body', () => {
    const hovered = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.HoverBody,
      bodyId: 'damocles',
    });
    expect(hovered.hoveredBodyId).toBe('damocles');

    const cleared = worldSimReducer(hovered, {
      type: WorldSimActionType.HoverBody,
      bodyId: null,
    });
    expect(cleared.hoveredBodyId).toBeNull();
  });

  it('toggles labels visibility', () => {
    expect(INITIAL_WORLD_SIM_STATE.labelsVisible).toBe(true);

    const toggled = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.ToggleLabels,
    });
    expect(toggled.labelsVisible).toBe(false);

    const toggledBack = worldSimReducer(toggled, {
      type: WorldSimActionType.ToggleLabels,
    });
    expect(toggledBack.labelsVisible).toBe(true);
  });

  it('toggles orbits paused', () => {
    expect(INITIAL_WORLD_SIM_STATE.orbitsPaused).toBe(false);

    const toggled = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: WorldSimActionType.ToggleOrbits,
    });
    expect(toggled.orbitsPaused).toBe(true);
  });

  it('resets to initial state but preserves isInitialized', () => {
    const prev: WorldSimState = {
      selectedBodyId: 'damocles',
      selectedRegionId: 'ordovica',
      zoomLevel: ZoomLevel.Region,
      isTransitioning: true,
      hoveredBodyId: 'kultharja',
      labelsVisible: false,
      orbitsPaused: true,
      isInitialized: true,
    };

    const state = worldSimReducer(prev, {
      type: WorldSimActionType.Reset,
    });

    expect(state.isInitialized).toBe(true);
    expect(state.selectedBodyId).toBeNull();
    expect(state.selectedRegionId).toBeNull();
    expect(state.zoomLevel).toBe(ZoomLevel.System);
    expect(state.labelsVisible).toBe(true);
    expect(state.orbitsPaused).toBe(false);
  });

  it('returns same state for unknown action type', () => {
    const state = worldSimReducer(INITIAL_WORLD_SIM_STATE, {
      type: 'UNKNOWN_ACTION',
    } as never);

    expect(state).toBe(INITIAL_WORLD_SIM_STATE);
  });

  it('does not mutate the original state', () => {
    const frozen = Object.freeze({ ...INITIAL_WORLD_SIM_STATE });

    const state = worldSimReducer(frozen as WorldSimState, {
      type: WorldSimActionType.SelectBody,
      bodyId: 'damocles',
    });

    expect(state).not.toBe(frozen);
    expect(state.selectedBodyId).toBe('damocles');
  });
});

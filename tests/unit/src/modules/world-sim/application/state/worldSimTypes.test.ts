/**
 * @fileoverview World Sim Types Unit Tests
 * @description Verifies enum values, initial state defaults, and type
 * contract compliance for the World Sim state system.
 *
 * @module tests/unit/src/modules/world-sim/application/state/worldSimTypes.test
 */

import {
    INITIAL_WORLD_SIM_STATE,
    WorldSimActionType,
    ZoomLevel,
} from '@/modules/world-sim/application/state/worldSimTypes';
import { describe, expect, it } from 'vitest';

describe('ZoomLevel', () => {
  it('has three levels with expected string values', () => {
    expect(ZoomLevel.System).toBe('system');
    expect(ZoomLevel.Body).toBe('body');
    expect(ZoomLevel.Region).toBe('region');
  });

  it('contains exactly three members', () => {
    const values = Object.values(ZoomLevel);
    expect(values).toHaveLength(3);
  });
});

describe('WorldSimActionType', () => {
  it('has all expected action types', () => {
    expect(WorldSimActionType.Initialize).toBe('INITIALIZE');
    expect(WorldSimActionType.SelectBody).toBe('SELECT_BODY');
    expect(WorldSimActionType.SelectRegion).toBe('SELECT_REGION');
    expect(WorldSimActionType.Deselect).toBe('DESELECT');
    expect(WorldSimActionType.DeselectRegion).toBe('DESELECT_REGION');
    expect(WorldSimActionType.SetZoomLevel).toBe('SET_ZOOM_LEVEL');
    expect(WorldSimActionType.SetTransitioning).toBe('SET_TRANSITIONING');
    expect(WorldSimActionType.HoverBody).toBe('HOVER_BODY');
    expect(WorldSimActionType.ToggleLabels).toBe('TOGGLE_LABELS');
    expect(WorldSimActionType.ToggleOrbits).toBe('TOGGLE_ORBITS');
    expect(WorldSimActionType.Reset).toBe('RESET');
  });

  it('contains exactly eleven members', () => {
    const values = Object.values(WorldSimActionType);
    expect(values).toHaveLength(11);
  });
});

describe('INITIAL_WORLD_SIM_STATE', () => {
  it('has null selections', () => {
    expect(INITIAL_WORLD_SIM_STATE.selectedBodyId).toBeNull();
    expect(INITIAL_WORLD_SIM_STATE.selectedRegionId).toBeNull();
    expect(INITIAL_WORLD_SIM_STATE.hoveredBodyId).toBeNull();
  });

  it('defaults to System zoom level', () => {
    expect(INITIAL_WORLD_SIM_STATE.zoomLevel).toBe(ZoomLevel.System);
  });

  it('starts with labels visible', () => {
    expect(INITIAL_WORLD_SIM_STATE.labelsVisible).toBe(true);
  });

  it('starts not initialized', () => {
    expect(INITIAL_WORLD_SIM_STATE.isInitialized).toBe(false);
  });

  it('starts not transitioning', () => {
    expect(INITIAL_WORLD_SIM_STATE.isTransitioning).toBe(false);
  });

  it('starts with orbits not paused', () => {
    expect(INITIAL_WORLD_SIM_STATE.orbitsPaused).toBe(false);
  });
});

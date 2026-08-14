/**
 * @fileoverview World Sim Constants Unit Tests
 * @description Tests DEFAULT_CAMERA_POSITION and DEFAULT_CAMERA_LOOK_AT
 * are Vector3 instances with expected components.
 *
 * @module tests/unit/worldSim/constants
 */

import {
    DEFAULT_CAMERA_LOOK_AT,
    DEFAULT_CAMERA_POSITION,
} from '@/modules/world-sim/infrastructure/constants';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

describe('World Sim Constants', () => {
  it('DEFAULT_CAMERA_POSITION is a Vector3', () => {
    expect(DEFAULT_CAMERA_POSITION).toBeInstanceOf(Vector3);
  });

  it('DEFAULT_CAMERA_POSITION has expected components', () => {
    expect(DEFAULT_CAMERA_POSITION.x).toBe(0);
    expect(DEFAULT_CAMERA_POSITION.y).toBe(800);
    expect(DEFAULT_CAMERA_POSITION.z).toBe(2500);
  });

  it('DEFAULT_CAMERA_LOOK_AT is a Vector3', () => {
    expect(DEFAULT_CAMERA_LOOK_AT).toBeInstanceOf(Vector3);
  });

  it('DEFAULT_CAMERA_LOOK_AT points at origin', () => {
    expect(DEFAULT_CAMERA_LOOK_AT.x).toBe(0);
    expect(DEFAULT_CAMERA_LOOK_AT.y).toBe(0);
    expect(DEFAULT_CAMERA_LOOK_AT.z).toBe(0);
  });
});

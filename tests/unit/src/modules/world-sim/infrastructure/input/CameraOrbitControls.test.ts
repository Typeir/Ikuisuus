/**
 * @fileoverview CameraOrbitControls unit tests.
 * @description Exercises controls without real DOM input events.
 * @module tests/unit/src/modules/world-sim/infrastructure/input/CameraOrbitControls.test
 */

import { CameraOrbitControls } from '@/modules/world-sim/infrastructure/input/CameraOrbitControls';
import { Spherical, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** Create a minimal mock canvas for event listener binding */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return canvas;
}

describe('CameraOrbitControls', () => {
  let canvas: HTMLCanvasElement;
  let controls: CameraOrbitControls;

  beforeEach(() => {
    canvas = createMockCanvas();
  });

  afterEach(() => {
    controls?.dispose();
  });

  it('initializes with default spherical when none provided', () => {
    controls = new CameraOrbitControls(canvas);
    expect(controls.spherical.radius).toBe(400);
  });

  it('initializes with custom spherical when provided', () => {
    const initial = new Spherical(200, Math.PI / 4, Math.PI / 6);
    controls = new CameraOrbitControls(canvas, initial);
    expect(controls.spherical.radius).toBe(200);
    expect(controls.spherical.phi).toBeCloseTo(Math.PI / 4);
    expect(controls.spherical.theta).toBeCloseTo(Math.PI / 6);
  });

  it('isDirty defaults to false', () => {
    controls = new CameraOrbitControls(canvas);
    expect(controls.isDirty).toBe(false);
  });

  it('getOffset returns a vector from spherical coordinates', () => {
    controls = new CameraOrbitControls(
      canvas,
      new Spherical(100, Math.PI / 2, 0),
    );
    const offset = controls.getOffset();
    expect(offset).toBeInstanceOf(Vector3);
    expect(offset.length()).toBeCloseTo(100, 0);
  });

  it('syncFromOffset updates spherical from a direction vector', () => {
    controls = new CameraOrbitControls(canvas);
    const offset = new Vector3(0, 0, 200);
    controls.syncFromOffset(offset);
    expect(controls.spherical.radius).toBeCloseTo(200);
  });

  it('setEnabled(false) stops input and zeroes velocity', () => {
    controls = new CameraOrbitControls(canvas);
    controls.setEnabled(false);
    /** After disabling, applyDamping should have no effect */
    controls.applyDamping();
    expect(controls.isDirty).toBe(false);
  });

  it('resetState clears all transient state', () => {
    controls = new CameraOrbitControls(canvas);
    controls.isDirty = true;
    controls.panDelta.set(5, 5, 0);
    controls.resetState();
    expect(controls.isDirty).toBe(false);
    expect(controls.panDelta.length()).toBe(0);
  });

  it('applyDamping does nothing when not dragging with no velocity', () => {
    controls = new CameraOrbitControls(canvas);
    const thetaBefore = controls.spherical.theta;
    controls.applyDamping();
    expect(controls.spherical.theta).toBe(thetaBefore);
    expect(controls.isDirty).toBe(false);
  });

  it('dispose removes event listeners without throwing', () => {
    controls = new CameraOrbitControls(canvas);
    /** Should not throw */
    controls.dispose();
  });
});

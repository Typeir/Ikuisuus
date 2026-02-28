/**
 * @fileoverview Camera Follow System Unit Tests
 * @description Tests target tracking, delta computation, and clear semantics
 * for the orbit-center follow system. Pure Three.js Vector3 math, no mocking.
 *
 * @module tests/unit/worldSim/camera/CameraFollowSystem
 */

import { CameraFollowSystem } from '@/lib/components/worldSim/camera/CameraFollowSystem';
import { Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('CameraFollowSystem', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no target', () => {
    const system = new CameraFollowSystem();
    expect(system.isFollowing()).toBe(false);
    expect(system.getTargetPosition()).toBeNull();
  });

  it('returns zero delta when not following', () => {
    const system = new CameraFollowSystem();
    const delta = system.computeDelta();

    expect(delta.x).toBe(0);
    expect(delta.y).toBe(0);
    expect(delta.z).toBe(0);
  });

  it('tracks a target after setTarget', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(10, 20, 30);

    system.setTarget(() => pos);

    expect(system.isFollowing()).toBe(true);
    expect(system.getTargetPosition()).toBe(pos);
  });

  it('returns zero delta on first computeDelta after setTarget', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(100, 200, 300);

    system.setTarget(() => pos);
    const delta = system.computeDelta();

    /** First call: current === lastPosition (set in setTarget), delta is zero */
    expect(delta.x).toBeCloseTo(0, 5);
    expect(delta.y).toBeCloseTo(0, 5);
    expect(delta.z).toBeCloseTo(0, 5);
  });

  it('computes movement delta between frames', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(100, 0, 0);
    system.setTarget(() => pos);

    /** Prime the system */
    system.computeDelta();

    /** Simulate body movement */
    pos.set(105, 3, -1);
    const delta = system.computeDelta();

    expect(delta.x).toBeCloseTo(5, 5);
    expect(delta.y).toBeCloseTo(3, 5);
    expect(delta.z).toBeCloseTo(-1, 5);
  });

  it('returns zero delta after clearing target', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(100, 0, 0);
    system.setTarget(() => pos);

    system.clearTarget();

    expect(system.isFollowing()).toBe(false);
    expect(system.getTargetPosition()).toBeNull();

    const delta = system.computeDelta();
    expect(delta.x).toBe(0);
    expect(delta.y).toBe(0);
    expect(delta.z).toBe(0);
  });

  it('tracks consecutive deltas correctly across multiple frames', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(0, 0, 0);
    system.setTarget(() => pos);

    system.computeDelta();

    pos.set(10, 0, 0);
    const d1 = system.computeDelta();
    expect(d1.x).toBeCloseTo(10);

    pos.set(15, 0, 0);
    const d2 = system.computeDelta();
    expect(d2.x).toBeCloseTo(5);

    pos.set(15, 0, 0);
    const d3 = system.computeDelta();
    expect(d3.x).toBeCloseTo(0);
  });

  it('snapshots position immediately on setTarget', () => {
    const system = new CameraFollowSystem();
    const pos = new Vector3(50, 50, 50);
    system.setTarget(() => pos);

    /** Move the position — delta should be from the snapshot, not origin */
    pos.set(60, 50, 50);
    const delta = system.computeDelta();

    expect(delta.x).toBeCloseTo(10);
    expect(delta.y).toBeCloseTo(0);
    expect(delta.z).toBeCloseTo(0);
  });
});

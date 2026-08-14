/**
 * @fileoverview AsteroidBeltRenderer Unit Tests
 * @description Tests particle belt creation, rotation behaviour, and disposal.
 *
 * @module tests/unit/worldSim/celestials/AsteroidBeltRenderer
 */

import { AsteroidBeltRenderer } from '@/modules/world-sim/infrastructure/renderers/AsteroidBeltRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D, PerspectiveCamera, Points, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow */
vi.mock('@/modules/world-sim/infrastructure/effects/CelestialGlow', () => ({
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Minimal asteroid belt body data */
const BELT_DATA: CelestialBodyData = {
  id: 'opaline-belt',
  name: 'Opaline Belt',
  subtitle: 'Ring of Fragments',
  loreOrigin: 'Test origin',
  type: 'asteroidBelt',
  contentPath: 'world/opaline-belt',
  orbit: null as unknown as CelestialBodyData['orbit'],
  radius: 30,
  renderConfig: {
    renderer: 'asteroidBelt',
    particleCount: 50,
    innerRadius: 24,
    outerRadius: 36,
    baseColor: '#aabbcc',
    rotationSpeed: 0.005,
  },
  regions: [],
};

/** Build a minimal SceneContext */
function makeCtx(): SceneContext {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    time: 1.0,
    deltaTime: 0.016,
  };
}

describe('AsteroidBeltRenderer', () => {
  let renderer: AsteroidBeltRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a group named after the body', () => {
    renderer = new AsteroidBeltRenderer();
    mesh = renderer.createMesh(BELT_DATA);
    expect(mesh.name).toBe('asteroidBelt-opaline-belt');
  });

  it('group contains belt-particles Points child', () => {
    renderer = new AsteroidBeltRenderer();
    mesh = renderer.createMesh(BELT_DATA);
    const particles = mesh.children.find((c) => c.name === 'belt-particles');
    expect(particles).toBeDefined();
    expect(particles).toBeInstanceOf(Points);
  });

  it('belt-particles has 50 vertices from config particleCount', () => {
    renderer = new AsteroidBeltRenderer();
    mesh = renderer.createMesh(BELT_DATA);
    const particles = mesh.children.find(
      (c) => c.name === 'belt-particles',
    ) as Points;
    const positions = particles.geometry.getAttribute('position');
    expect(positions.count).toBe(50);
  });

  it('update rotates the group', () => {
    renderer = new AsteroidBeltRenderer();
    mesh = renderer.createMesh(BELT_DATA);
    const initialY = mesh.rotation.y;

    renderer.update(mesh, 1.0, 0.5, makeCtx());
    expect(mesh.rotation.y).not.toBe(initialY);
  });

  it('dispose does not throw', () => {
    renderer = new AsteroidBeltRenderer();
    mesh = renderer.createMesh(BELT_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });
});

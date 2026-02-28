/**
 * @fileoverview RingWorldRenderer Unit Tests
 * @description Tests mesh creation with core and rings, ring rotation, and disposal.
 *
 * @module tests/unit/worldSim/celestials/RingWorldRenderer
 */

import { RingWorldRenderer } from '@/lib/components/worldSim/celestials/RingWorldRenderer';
import type {
  CelestialBodyData,
  SceneContext,
} from '@/lib/components/worldSim/celestials/interfaces';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialGlow */
vi.mock('@/lib/components/worldSim/celestials/CelestialGlow', () => ({
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Mock icy core shaders */
vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/lib/components/worldSim/shaders/icyCore.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/icyCore.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Mock ring world shaders */
vi.mock('@/lib/components/worldSim/shaders/ringWorld.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/ringWorld.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Minimal ring world data */
const RING_WORLD_DATA: CelestialBodyData = {
  id: 'mana',
  name: 'Mana',
  subtitle: 'The Frozen Ring',
  loreOrigin: 'Born from bone ash',
  type: 'ringWorld',
  contentPath: 'world/mana',
  orbit: {
    semiMajorAxis: 600,
    eccentricity: 0.01,
    inclination: 5,
    period: 150,
    phase: 0,
  },
  radius: 25,
  renderConfig: {
    renderer: 'ringWorld',
    coreColor: '#c8dde8',
    ringColor: '#9ab8d0',
    ringCount: 3,
    rotationSpeed: 0.12,
  },
  regions: [],
};

/** Ring world data with icy core enabled */
const ICY_RING_WORLD_DATA: CelestialBodyData = {
  ...RING_WORLD_DATA,
  id: 'mana-icy',
  renderConfig: {
    renderer: 'ringWorld',
    coreColor: '#88d0ff',
    ringColor: '#e8dcc0',
    ringCount: 3,
    rotationSpeed: 0.12,
    icyCore: true,
  },
};

/** Create a minimal SceneContext */
function makeCtx(): SceneContext {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    time: 1.0,
    deltaTime: 0.016,
  };
}

describe('RingWorldRenderer', () => {
  let renderer: RingWorldRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a named group', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(RING_WORLD_DATA);
    expect(mesh.name).toBe('ringWorld-mana');
  });

  it('group contains core and ring pivots', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(RING_WORLD_DATA);
    const core = mesh.children.find((c) => c.name === 'ring-core');
    expect(core).toBeDefined();
    const pivots = mesh.children.filter((c) =>
      c.name.startsWith('ring-pivot-'),
    );
    expect(pivots.length).toBe(3);
  });

  it('update rotates ring pivots', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(RING_WORLD_DATA);
    const pivot = mesh.children.find((c) => c.name === 'ring-pivot-0')!;
    const initialY = pivot.rotation.y;

    renderer.update(mesh, 1.0, 0.5, makeCtx());
    expect(pivot.rotation.y).not.toBe(initialY);
  });

  it('dispose does not throw', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(RING_WORLD_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });

  it('creates icy core with ShaderMaterial when icyCore is set', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(ICY_RING_WORLD_DATA);
    const core = mesh.children.find((c) => c.name === 'ring-core')!;
    expect(core).toBeDefined();
    expect((core as any).material.type).toBe('ShaderMaterial');
  });

  it('icy core update does not throw', () => {
    renderer = new RingWorldRenderer();
    mesh = renderer.createMesh(ICY_RING_WORLD_DATA);
    expect(() => renderer.update(mesh, 2.0, 0.016, makeCtx())).not.toThrow();
  });
});

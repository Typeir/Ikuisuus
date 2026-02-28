/**
 * @fileoverview StarRenderer Unit Tests
 * @description Tests mesh creation, corona pulsation update, and disposal.
 *
 * @module tests/unit/worldSim/celestials/StarRenderer
 */

import { StarRenderer } from '@/lib/components/worldSim/celestials/StarRenderer';
import type {
    CelestialBodyData,
    SceneContext,
} from '@/lib/components/worldSim/celestials/interfaces';
import { Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock canvas for CelestialGlow texture generation */
vi.mock('@/lib/components/worldSim/celestials/CelestialGlow', () => ({
  createRadialGradientTexture: () => ({ isTexture: true, dispose: vi.fn() }),
  createCelestialGlow: () => {
    const { Object3D } = require('three');
    const s = new Object3D();
    s.name = 'celestial-glow';
    return s;
  },
}));

/** Mock GLSL shaders */
vi.mock('@/lib/components/worldSim/shaders/noise3d.glsl', () => ({
  default: '',
}));
vi.mock('@/lib/components/worldSim/shaders/star.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/lib/components/worldSim/shaders/star.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

/** Minimal star body data */
const STAR_DATA: CelestialBodyData = {
  id: 'kultharja',
  name: 'Kultharja',
  subtitle: 'The Black Sun',
  loreOrigin: 'Born from void',
  type: 'star',
  contentPath: 'world/kultharja',
  orbit: null,
  radius: 50,
  renderConfig: {
    renderer: 'star',
    emissiveColor: '#ffcc44',
    coronaColor: '#ff8800',
  },
  regions: [],
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

describe('StarRenderer', () => {
  let renderer: StarRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a named group', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    expect(mesh.name).toBe('star-kultharja');
  });

  it('group has core, corona sprite, and ring children', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    const names = mesh.children.map((c) => c.name);
    expect(names).toContain('star-core');
    expect(names).toContain('star-corona');
    expect(names).toContain('star-ring');
  });

  it('update modifies corona scale (pulsation)', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    const corona = mesh.children.find((c) => c.name === 'star-corona')!;
    const initialScale = corona.scale.x;

    renderer.update(mesh, 3.14, 0.016, makeCtx());
    expect(corona.scale.x).not.toBe(initialScale);
  });

  it('dispose does not throw', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });

  it('core mesh uses ShaderMaterial for noise displacement', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    const core = mesh.children.find((c) => c.name === 'star-core')!;
    expect((core as any).material.type).toBe('ShaderMaterial');
  });

  it('update sets uTime uniform on surface material', () => {
    renderer = new StarRenderer();
    mesh = renderer.createMesh(STAR_DATA);
    const core = mesh.children.find((c) => c.name === 'star-core')!;
    const material = (core as any).material;

    renderer.update(mesh, 5.0, 0.016, makeCtx());
    expect(material.uniforms.uTime.value).toBe(5.0);
  });
});

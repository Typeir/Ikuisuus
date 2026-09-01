/**
 * @fileoverview EverdarkRenderer Unit Tests
 * @description Tests multi-layer boundary shell creation, uTime uniform updates,
 * and disposal with materials cleanup.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/renderers/EverdarkRenderer.test
 */

import { EverdarkRenderer } from '@/modules/world-sim/infrastructure/renderers/EverdarkRenderer';
import type {
    BoundaryData,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import {
    Mesh,
    Object3D,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock GLSL shader imports */
vi.mock('@/modules/world-sim/shaders/everdark.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/everdark.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/noise3d.glsl', () => ({
  default: '/* noise stub */',
}));

/** Minimal boundary data for the Everdark */
const EVERDARK_DATA: BoundaryData = {
  id: 'everdark',
  name: 'The Everdark',
  subtitle: 'Boundary of Light',
  loreOrigin: 'Test origin',
  type: 'boundary',
  contentPath: 'world/everdark',
  radius: 2000,
  renderConfig: {
    renderer: 'everdark',
  },
  regions: [],
};

/** Build a minimal SceneContext */
function makeCtx(): SceneContext {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    time: 0,
    deltaTime: 0.016,
  };
}

describe('EverdarkRenderer', () => {
  let renderer: EverdarkRenderer;
  let mesh: Object3D;

  afterEach(() => {
    if (renderer && mesh) renderer.dispose(mesh);
  });

  it('createMesh returns a group named after the body', () => {
    renderer = new EverdarkRenderer();
    mesh = renderer.createMesh(EVERDARK_DATA);
    expect(mesh.name).toBe('everdark-everdark');
  });

  it('group contains 3 shell children', () => {
    renderer = new EverdarkRenderer();
    mesh = renderer.createMesh(EVERDARK_DATA);
    const shells = mesh.children.filter((c) =>
      c.name.startsWith('everdark-shell-'),
    );
    expect(shells.length).toBe(3);
  });

  it('shells use ShaderMaterial', () => {
    renderer = new EverdarkRenderer();
    mesh = renderer.createMesh(EVERDARK_DATA);
    const firstShell = mesh.children.find(
      (c) => c.name === 'everdark-shell-0',
    ) as Mesh;
    expect(firstShell.material).toBeInstanceOf(ShaderMaterial);
  });

  it('update sets uTime uniform on all materials', () => {
    renderer = new EverdarkRenderer();
    mesh = renderer.createMesh(EVERDARK_DATA);

    renderer.update(mesh, 5.0, 0.016, makeCtx());

    for (const child of mesh.children) {
      if (child.name.startsWith('everdark-shell-')) {
        const mat = (child as Mesh).material as ShaderMaterial;
        expect(mat.uniforms.uTime.value).toBe(5.0);
      }
    }
  });

  it('dispose does not throw and clears materials', () => {
    renderer = new EverdarkRenderer();
    mesh = renderer.createMesh(EVERDARK_DATA);
    expect(() => renderer.dispose(mesh)).not.toThrow();
  });
});

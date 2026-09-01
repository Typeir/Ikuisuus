/**
 * @fileoverview Dispose Utils Unit Tests
 * @description Tests recursive scene graph disposal of geometries, materials,
 * textures, and material arrays.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/geometry/disposeUtils.test
 */

import { disposeSceneGraph } from '@/modules/world-sim/infrastructure/geometry/disposeUtils';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Create a mock Object3D with traverse that calls visitor on each child.
 *
 * @param {object[]} children - Mock children with optional geometry/material
 * @returns {object} Mock Object3D
 */
function mockSceneGraph(children: object[]) {
  return {
    traverse: (cb: (child: object) => void) => {
      for (const child of children) {
        cb(child);
      }
    },
  };
}

describe('disposeSceneGraph', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('disposes geometry', () => {
    const geometry = { dispose: vi.fn() };
    const root = mockSceneGraph([{ geometry }]);

    disposeSceneGraph(root as never);

    expect(geometry.dispose).toHaveBeenCalledOnce();
  });

  it('disposes single material', () => {
    const material = { dispose: vi.fn() };
    const root = mockSceneGraph([{ material }]);

    disposeSceneGraph(root as never);

    expect(material.dispose).toHaveBeenCalledOnce();
  });

  it('disposes material array', () => {
    const mat1 = { dispose: vi.fn() };
    const mat2 = { dispose: vi.fn() };
    const root = mockSceneGraph([{ material: [mat1, mat2] }]);

    disposeSceneGraph(root as never);

    expect(mat1.dispose).toHaveBeenCalledOnce();
    expect(mat2.dispose).toHaveBeenCalledOnce();
  });

  it('disposes material map texture', () => {
    const map = { dispose: vi.fn() };
    const material = { map, dispose: vi.fn() };
    const root = mockSceneGraph([{ material }]);

    disposeSceneGraph(root as never);

    expect(map.dispose).toHaveBeenCalledOnce();
    expect(material.dispose).toHaveBeenCalledOnce();
  });

  it('handles children without geometry or material', () => {
    const root = mockSceneGraph([
      {},
      { geometry: undefined, material: undefined },
    ]);

    expect(() => {
      disposeSceneGraph(root as never);
    }).not.toThrow();
  });

  it('disposes all traversed children', () => {
    const geo1 = { dispose: vi.fn() };
    const geo2 = { dispose: vi.fn() };
    const mat1 = { dispose: vi.fn() };
    const map2 = { dispose: vi.fn() };
    const mat2 = { map: map2, dispose: vi.fn() };

    const root = mockSceneGraph([
      { geometry: geo1, material: mat1 },
      { geometry: geo2, material: mat2 },
    ]);

    disposeSceneGraph(root as never);

    expect(geo1.dispose).toHaveBeenCalledOnce();
    expect(geo2.dispose).toHaveBeenCalledOnce();
    expect(mat1.dispose).toHaveBeenCalledOnce();
    expect(mat2.dispose).toHaveBeenCalledOnce();
    expect(map2.dispose).toHaveBeenCalledOnce();
  });

  it('skips null map on material', () => {
    const material = { map: null, dispose: vi.fn() };
    const root = mockSceneGraph([{ material }]);

    expect(() => {
      disposeSceneGraph(root as never);
    }).not.toThrow();

    expect(material.dispose).toHaveBeenCalledOnce();
  });
});

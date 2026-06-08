/**
 * @fileoverview RaycastService Unit Tests
 * @description Tests body picking via raycastBody, occlusion via computeOcclusion,
 * and mesh cache building.
 *
 * @module tests/unit/worldSim/RaycastService
 */

import { RaycastService } from '@/modules/world-sim/application/services/RaycastService';
import {
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    SphereGeometry,
} from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

/** Create a simple sphere mesh at a position with userData */
function createBodyMesh(id: string, x: number, y: number, z: number): Object3D {
  const geometry = new SphereGeometry(10, 8, 8);
  const material = new MeshBasicMaterial({ color: 0xffffff });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.userData = { bodyId: id };
  mesh.updateMatrixWorld(true);
  return mesh;
}

describe('RaycastService', () => {
  let service: RaycastService;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    service = new RaycastService();
    camera = new PerspectiveCamera(60, 800 / 600, 0.1, 15000);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
  });

  it('returns null when no meshes are cached', () => {
    const event = new MouseEvent('click', { clientX: 400, clientY: 300 });
    const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

    const result = service.raycastBody(event, camera, rect);
    expect(result).toBeNull();
  });

  it('buildMeshCaches populates interaction and occlusion lists', () => {
    const meshA = createBodyMesh('body-a', 0, 0, 0);
    const meshB = createBodyMesh('body-b', 50, 0, 0);

    service.buildMeshCaches([meshA, meshB]);

    /** Validate by testing that raycastBody works after cache build */
    const event = new MouseEvent('click', { clientX: 400, clientY: 300 });
    const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

    /** Center click should hit body-a at origin */
    const result = service.raycastBody(event, camera, rect);
    expect(result).toBe('body-a');
  });

  it('raycastBody returns body ID for a hit', () => {
    const meshA = createBodyMesh('body-a', 0, 0, 0);
    service.buildMeshCaches([meshA]);

    const event = new MouseEvent('click', { clientX: 400, clientY: 300 });
    const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

    const result = service.raycastBody(event, camera, rect);
    expect(result).toBe('body-a');
  });

  it('raycastBody returns null for a miss', () => {
    const meshA = createBodyMesh('body-a', 500, 500, 0);
    service.buildMeshCaches([meshA]);

    /** Click at center, but body is far off to the side */
    const event = new MouseEvent('click', { clientX: 400, clientY: 300 });
    const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

    const result = service.raycastBody(event, camera, rect);
    expect(result).toBeNull();
  });

  it('computeOcclusion returns body IDs hidden behind others', () => {
    /** body-behind is directly behind body-front from the camera */
    const meshFront = createBodyMesh('body-front', 0, 0, 50);
    const meshBehind = createBodyMesh('body-behind', 0, 0, -50);

    service.buildMeshCaches([meshFront, meshBehind]);

    const entries = new Map<string, { mesh: Object3D }>();
    entries.set('body-front', { mesh: meshFront });
    entries.set('body-behind', { mesh: meshBehind });

    const occluded = service.computeOcclusion(camera, entries);

    /** body-behind should be occluded because body-front is in front of it */
    expect(occluded.has('body-behind')).toBe(true);
    expect(occluded.has('body-front')).toBe(false);
  });

  it('computeOcclusion returns empty set when no occlusion', () => {
    /** Bodies are side by side — neither occludes the other */
    const meshLeft = createBodyMesh('body-left', -100, 0, 0);
    const meshRight = createBodyMesh('body-right', 100, 0, 0);

    service.buildMeshCaches([meshLeft, meshRight]);

    const entries = new Map<string, { mesh: Object3D }>();
    entries.set('body-left', { mesh: meshLeft });
    entries.set('body-right', { mesh: meshRight });

    const occluded = service.computeOcclusion(camera, entries);
    expect(occluded.size).toBe(0);
  });
});

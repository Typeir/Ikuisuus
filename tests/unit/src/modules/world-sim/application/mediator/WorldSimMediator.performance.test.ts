/**
 * @fileoverview WorldSimMediator Performance Tests
 * @description Verifies adaptive quality propagation to celestial renderers
 * and consistent per-frame update scheduling.
 *
 * @module tests/unit/worldSim/optimization/WorldSimMediator.performance
 */

import { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';
import type {
    BoundaryData,
    CelestialBodyData,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCanvas = document.createElement('canvas');

const MOCK_BODY: CelestialBodyData = {
  id: 'perf-body',
  name: 'Perf Body',
  subtitle: 'Optimization target',
  loreOrigin: 'unit test',
  type: 'planet',
  contentPath: 'world/perf-body',
  orbit: {
    semiMajorAxis: 100,
    eccentricity: 0,
    inclination: 0,
    period: 100,
    phase: 0,
  },
  radius: 10,
  renderConfig: { renderer: 'planet', baseColor: '#999999' },
  regions: [],
};

const MOCK_BOUNDARY: BoundaryData = {
  id: 'everdark',
  name: 'Everdark',
  subtitle: 'boundary',
  loreOrigin: 'unit test',
  type: 'boundary',
  contentPath: 'world/everdark',
  radius: 2000,
  renderConfig: { renderer: 'everdark' },
  regions: [],
};

const bodyRenderer = {
  createMesh: vi.fn(() => {
    const obj = new Object3D();
    obj.name = 'perf-body-mesh';
    return obj;
  }),
  update: vi.fn(),
  dispose: vi.fn(),
  setQualityLevel: vi.fn(),
};

const boundaryRenderer = {
  createMesh: vi.fn(() => {
    const obj = new Object3D();
    obj.name = 'perf-boundary-mesh';
    return obj;
  }),
  update: vi.fn(),
  dispose: vi.fn(),
  setQualityLevel: vi.fn(),
};

vi.mock(
  '@/modules/world-sim/infrastructure/geometry/factories/CelestialBodyFactory',
  () => ({
    CelestialBodyFactory: {
      createRenderer: vi.fn((rendererType: string) =>
        rendererType === 'everdark' ? boundaryRenderer : bodyRenderer,
      ),
    },
  }),
);

vi.mock('@/modules/world-sim/domain/celestials/celestialRegistry', () => ({
  CelestialRegistry: {
    shared: vi.fn(() => ({
      getAllBodies: vi.fn(() => [MOCK_BODY]),
      getBoundary: vi.fn(() => MOCK_BOUNDARY),
      getBodyById: vi.fn(() => MOCK_BODY),
      getRegion: vi.fn(() => null),
      getCollisionPairs: vi.fn(() => []),
      getCollisionPair: vi.fn(() => undefined),
    })),
  },
}));

vi.mock(
  '@/modules/world-sim/infrastructure/geometry/factories/OrbitLineFactory',
  () => ({
    createAllOrbitLines: vi.fn(() => new Map()),
  }),
);

let orbitPosition = new Vector3(5000, 0, 0);

vi.mock('@/modules/world-sim/domain/celestials/orbitalMechanics', () => ({
  computeOrbitalPosition: vi.fn(() => orbitPosition.clone()),
  surfacePositionToWorld: vi.fn(() => new Vector3(1, 1, 1)),
}));

vi.mock('@/modules/world-sim/application/services/RaycastService', () => ({
  RaycastService: vi.fn().mockImplementation(function MockRaycastService() {
    return {
      buildMeshCaches: vi.fn(),
      raycastBody: vi.fn(() => null),
      computeOcclusion: vi.fn(() => new Set()),
    };
  }),
}));

const lifecycleHandlers: Map<string, (ctx: unknown) => void> = new Map();

function createMockSceneManager() {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    renderer: { domElement: mockCanvas },
    lifecycle: {
      on: vi.fn(
        (
          phase: number,
          handler: (ctx: unknown) => void,
          opts?: { priority?: number; label?: string },
        ) => {
          const key = opts?.label ?? `phase-${phase}`;
          lifecycleHandlers.set(key, handler);
        },
      ),
    },
    getCanvasRect: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
    setPixelRatioCap: vi.fn(),
  };
}

function createMockCameraController() {
  return {
    update: vi.fn(),
    dispose: vi.fn(),
    executeCommand: vi.fn(),
    cancelCommand: vi.fn(),
    isTransitioning: vi.fn(() => false),
    setFollowTarget: vi.fn(),
    clearFollowTarget: vi.fn(),
    resetToDefault: vi.fn(),
    setTarget: vi.fn(),
    onPanUnlock: null as (() => void) | null,
  };
}

function createMockProjectionBridge() {
  return {
    track: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(),
    setOccluded: vi.fn(),
  };
}

function createMockEventBus() {
  return {
    emit: vi.fn(),
    clear: vi.fn(),
  };
}

function runSimulationFrames(
  frameStart: number,
  frameCount: number,
  deltaTime: number,
): void {
  const simulation = lifecycleHandlers.get('mediator:simulation');
  if (!simulation) {
    throw new Error('simulation handler missing');
  }

  for (let i = 0; i < frameCount; i++) {
    simulation({
      renderer: { domElement: mockCanvas },
      scene: new Scene(),
      camera: new PerspectiveCamera(),
      canvas: mockCanvas,
      time: i * deltaTime,
      deltaTime,
      simDeltaTime: deltaTime,
      frame: frameStart + i,
    });
  }
}

describe('WorldSimMediator performance behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lifecycleHandlers.clear();
    orbitPosition = new Vector3(5000, 0, 0);
  });

  it('propagates adaptive quality changes to renderers under sustained low FPS', () => {
    const mediator = new WorldSimMediator(
      createMockSceneManager() as never,
      createMockCameraController() as never,
      createMockProjectionBridge() as never,
      createMockEventBus() as never,
      vi.fn(),
    );

    mediator.initialize();
    runSimulationFrames(1, 220, 1 / 20);

    expect(bodyRenderer.setQualityLevel).toHaveBeenCalledWith('low');
    expect(boundaryRenderer.setQualityLevel).toHaveBeenCalledWith('low');

    mediator.dispose();
  });

  it('calls renderer.update every frame regardless of quality or body distance', () => {
    const mediator = new WorldSimMediator(
      createMockSceneManager() as never,
      createMockCameraController() as never,
      createMockProjectionBridge() as never,
      createMockEventBus() as never,
      vi.fn(),
    );

    mediator.initialize();

    /* Degrade to low quality via sustained low FPS */
    runSimulationFrames(1, 220, 1 / 20);

    /* Body is far away (5000 units) and quality is low */
    orbitPosition = new Vector3(5000, 0, 0);
    bodyRenderer.update.mockClear();
    const frameCount = 20;
    runSimulationFrames(1001, frameCount, 1 / 20);

    /* update must be called once per frame — no stride throttling */
    expect(bodyRenderer.update.mock.calls.length).toBe(frameCount);

    mediator.dispose();
  });
});

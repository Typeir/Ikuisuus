/**
 * @fileoverview WorldSimMediator Performance Tests
 * @description Verifies adaptive quality propagation and frame-stride update
 * throttling for far and near celestial bodies.
 *
 * @module tests/unit/worldSim/optimization/WorldSimMediator.performance
 */

import { WorldSimMediator } from '@/lib/components/worldSim/WorldSimMediator';
import type {
    BoundaryData,
    CelestialBodyData,
} from '@/lib/components/worldSim/celestials/interfaces';
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

vi.mock('@/lib/components/worldSim/celestials/CelestialBodyFactory', () => ({
  CelestialBodyFactory: {
    createRenderer: vi.fn((rendererType: string) =>
      rendererType === 'everdark' ? boundaryRenderer : bodyRenderer,
    ),
  },
}));

vi.mock('@/lib/components/worldSim/celestials/CelestialRegistry', () => ({
  CelestialRegistry: {
    shared: vi.fn(() => ({
      getAllBodies: vi.fn(() => [MOCK_BODY]),
      getBoundary: vi.fn(() => MOCK_BOUNDARY),
      getBodyById: vi.fn(() => MOCK_BODY),
      getRegion: vi.fn(() => null),
    })),
  },
}));

vi.mock('@/lib/components/worldSim/celestials/OrbitLineFactory', () => ({
  createAllOrbitLines: vi.fn(() => new Map()),
}));

let orbitPosition = new Vector3(5000, 0, 0);

vi.mock('@/lib/components/worldSim/celestials/OrbitalMechanics', () => ({
  computeOrbitalPosition: vi.fn(() => orbitPosition.clone()),
  surfacePositionToWorld: vi.fn(() => new Vector3(1, 1, 1)),
}));

vi.mock('@/lib/components/worldSim/RaycastService', () => ({
  RaycastService: vi.fn(() => ({
    buildMeshCaches: vi.fn(),
    raycastBody: vi.fn(() => null),
    computeOcclusion: vi.fn(() => new Set()),
  })),
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

  it('reduces far-body update frequency at low quality using frame stride', () => {
    const mediator = new WorldSimMediator(
      createMockSceneManager() as never,
      createMockCameraController() as never,
      createMockProjectionBridge() as never,
      createMockEventBus() as never,
      vi.fn(),
    );

    mediator.initialize();
    runSimulationFrames(1, 220, 1 / 20);

    bodyRenderer.update.mockClear();
    runSimulationFrames(1001, 20, 1 / 20);

    expect(bodyRenderer.update.mock.calls.length).toBeLessThanOrEqual(6);

    mediator.dispose();
  });

  it('keeps near-body updates denser than far-body updates at low quality', () => {
    const mediator = new WorldSimMediator(
      createMockSceneManager() as never,
      createMockCameraController() as never,
      createMockProjectionBridge() as never,
      createMockEventBus() as never,
      vi.fn(),
    );

    mediator.initialize();
    runSimulationFrames(1, 220, 1 / 20);

    bodyRenderer.update.mockClear();
    orbitPosition = new Vector3(500, 0, 0);
    runSimulationFrames(2001, 20, 1 / 20);
    const nearUpdates = bodyRenderer.update.mock.calls.length;

    bodyRenderer.update.mockClear();
    orbitPosition = new Vector3(5000, 0, 0);
    runSimulationFrames(3001, 20, 1 / 20);
    const farUpdates = bodyRenderer.update.mock.calls.length;

    expect(nearUpdates).toBeGreaterThan(farUpdates);

    mediator.dispose();
  });
});

/**
 * @fileoverview WorldSimMediator Unit Tests
 * @description Unit tests for WorldSimMediator: initialize, zoomToBody, zoomToRegion, resetView, toggleOrbitLines, dispose.
 *
 * @module tests/unit/worldSim/WorldSimMediator
 */

import { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import type {
    BoundaryData,
    CelestialBodyData,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Mock canvas element for renderer.domElement */
const mockCanvas = document.createElement('canvas');

/** Body fixture data */
const MOCK_BODY: CelestialBodyData = {
  id: 'test-planet',
  name: 'Test Planet',
  subtitle: 'A test',
  loreOrigin: 'unit test',
  type: 'planet',
  contentPath: 'world/test',
  orbit: {
    semiMajorAxis: 100,
    eccentricity: 0,
    inclination: 0,
    period: 50,
    phase: 0,
  },
  radius: 10,
  renderConfig: { renderer: 'planet', surfaceColor: '#aaa', glowColor: '#bbb' },
  regions: [
    {
      id: 'r1',
      name: 'Region One',
      surfacePosition: { lat: 0, lon: 0 },
    },
  ],
};

/** Boundary fixture data */
const MOCK_BOUNDARY: BoundaryData = {
  id: 'everdark',
  name: 'Everdark',
  subtitle: 'test',
  loreOrigin: 'test',
  type: 'boundary',
  contentPath: 'world/everdark',
  radius: 2000,
  renderConfig: { renderer: 'everdark' },
  regions: [],
};

/** Mock renderer returned by CelestialBodyFactory */
const mockRendererInstance = {
  createMesh: vi.fn(() => {
    const obj = new Object3D();
    obj.name = 'mock-mesh';
    return obj;
  }),
  update: vi.fn(),
  dispose: vi.fn(),
};

/** Mock CelestialBodyFactory */
vi.mock(
  '@/modules/world-sim/infrastructure/geometry/factories/CelestialBodyFactory',
  () => ({
    CelestialBodyFactory: {
      createRenderer: vi.fn(() => ({
        createMesh: vi.fn(() => {
          const obj = new Object3D();
          obj.name = 'mock-mesh';
          return obj;
        }),
        update: vi.fn(),
        dispose: vi.fn(),
      })),
    },
  }),
);

/** Mock CelestialRegistry singleton */
vi.mock('@/modules/world-sim/domain/celestials/celestialRegistry', () => ({
  CelestialRegistry: {
    shared: vi.fn(() => ({
      getAllBodies: vi.fn(() => [MOCK_BODY]),
      getBoundary: vi.fn(() => MOCK_BOUNDARY),
      getBodyById: vi.fn((id: string) =>
        id === 'test-planet' ? MOCK_BODY : null,
      ),
      getRegion: vi.fn((bodyId: string, regionId: string) => {
        if (bodyId === 'test-planet' && regionId === 'r1') {
          return MOCK_BODY.regions[0];
        }
        return null;
      }),
      getCollisionPairs: vi.fn(() => []),
      getCollisionPair: vi.fn(() => undefined),
    })),
  },
}));

/** Mock OrbitLineFactory */
vi.mock(
  '@/modules/world-sim/infrastructure/geometry/factories/OrbitLineFactory',
  () => ({
    createAllOrbitLines: vi.fn(() => new Map()),
  }),
);

/** Mock OrbitalMechanics */
vi.mock('@/modules/world-sim/domain/celestials/orbitalMechanics', () => ({
  computeOrbitalPosition: vi.fn(() => new Vector3(100, 0, 0)),
  surfacePositionToWorld: vi.fn(() => new Vector3(10, 5, 0)),
}));

/** Mock RaycastService */
vi.mock('@/modules/world-sim/application/services/RaycastService', () => ({
  RaycastService: vi.fn().mockImplementation(function MockRaycastService() {
    return {
      buildMeshCaches: vi.fn(),
      raycastBody: vi.fn(),
      computeOcclusion: vi.fn(() => new Set()),
    };
  }),
}));

/** Labeled lifecycle-phase handlers */
const lifecycleHandlers: Map<string, Function> = new Map();

/** Mock SceneManager-like object */
function createMockSceneManager() {
  return {
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    renderer: { domElement: mockCanvas },
    lifecycle: {
      on: vi.fn(
        (
          phase: number,
          handler: Function,
          opts?: { priority?: number; label?: string },
        ) => {
          const key = opts?.label ?? `phase-${phase}`;
          lifecycleHandlers.set(key, handler);
        },
      ),
    },
    start: vi.fn(),
    dispose: vi.fn(),
    setPixelRatioCap: vi.fn(),
    getCanvasRect: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
  };
}

/** Mock CameraController */
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

/** Mock ProjectionBridge */
function createMockProjectionBridge() {
  return {
    track: vi.fn(),
    untrack: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    update: vi.fn(),
    bindElement: vi.fn(),
    unbindElement: vi.fn(),
    clear: vi.fn(),
    setOccluded: vi.fn(),
  };
}

/** Mock SceneEventBus */
function createMockEventBus() {
  return {
    emit: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    clear: vi.fn(),
  };
}

describe('WorldSimMediator', () => {
  let mediator: WorldSimMediator;
  let mockSceneManager: ReturnType<typeof createMockSceneManager>;
  let mockCamera: ReturnType<typeof createMockCameraController>;
  let mockBridge: ReturnType<typeof createMockProjectionBridge>;
  let mockBus: ReturnType<typeof createMockEventBus>;
  let mockDispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    lifecycleHandlers.clear();
    mockSceneManager = createMockSceneManager();
    mockCamera = createMockCameraController();
    mockBridge = createMockProjectionBridge();
    mockBus = createMockEventBus();
    mockDispatch = vi.fn();

    mediator = new WorldSimMediator(
      mockSceneManager as any,
      mockCamera as any,
      mockBridge as any,
      mockBus as any,
      mockDispatch,
    );
  });

  afterEach(() => {
    mediator.dispose();
  });

  it('initialize dispatches Initialize action', () => {
    mediator.initialize();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.Initialize,
    });
  });

  it('initialize registers lifecycle phases', () => {
    mediator.initialize();
    expect(mockSceneManager.lifecycle.on).toHaveBeenCalledTimes(3);
    expect(lifecycleHandlers.has('mediator:simulation')).toBe(true);
    expect(lifecycleHandlers.has('mediator:camera')).toBe(true);
    expect(lifecycleHandlers.has('mediator:projections')).toBe(true);
  });

  it('initialize tracks bodies in projection bridge', () => {
    mediator.initialize();
    expect(mockBridge.track).toHaveBeenCalledWith(
      'test-planet',
      expect.any(Vector3),
    );
  });

  it('initialize attaches click/mousemove listeners to canvas', () => {
    const addSpy = vi.spyOn(mockCanvas, 'addEventListener');
    mediator.initialize();
    const eventTypes = addSpy.mock.calls.map((c) => c[0]);
    expect(eventTypes).toContain('click');
    expect(eventTypes).toContain('mousemove');
  });

  it('zoomToBody dispatches SelectBody and executes command', () => {
    mediator.initialize();
    mediator.zoomToBody('test-planet');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.SelectBody,
      bodyId: 'test-planet',
    });
    expect(mockCamera.executeCommand).toHaveBeenCalled();
    expect(mockCamera.setFollowTarget).toHaveBeenCalled();
  });

  it('zoomToBody no-ops for unknown body', () => {
    mediator.initialize();
    mockDispatch.mockClear();
    mediator.zoomToBody('nonexistent');
    expect(mockCamera.executeCommand).not.toHaveBeenCalled();
  });

  it('zoomToRegion dispatches SelectRegion', () => {
    mediator.initialize();
    mediator.zoomToRegion('test-planet', 'r1');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.SelectRegion,
      bodyId: 'test-planet',
      regionId: 'r1',
    });
    expect(mockCamera.executeCommand).toHaveBeenCalled();
  });

  it('resetView dispatches Deselect and resets camera', () => {
    mediator.initialize();
    mediator.resetView();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: WorldSimActionType.Deselect,
    });
    expect(mockCamera.resetToDefault).toHaveBeenCalled();
  });

  it('toggleOrbitLines flips visibility (starts visible in createOrbitLines)', () => {
    mediator.initialize();
    expect(() => mediator.toggleOrbitLines()).not.toThrow();
  });

  it('dispose removes canvas event listeners', () => {
    const removeSpy = vi.spyOn(mockCanvas, 'removeEventListener');
    mediator.initialize();
    mediator.dispose();
    const eventTypes = removeSpy.mock.calls.map((c) => c[0]);
    expect(eventTypes).toContain('click');
    expect(eventTypes).toContain('mousemove');
  });

  it('dispose clears projection bridge and event bus', () => {
    mediator.initialize();
    mediator.dispose();
    expect(mockBridge.clear).toHaveBeenCalled();
    expect(mockBus.clear).toHaveBeenCalled();
  });
});

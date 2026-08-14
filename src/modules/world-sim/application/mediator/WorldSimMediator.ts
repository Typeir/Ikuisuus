/**
 * @fileoverview Coordinates World Sim subsystems: SceneManager, CameraController,
 * ProjectionBridge, SceneEventBus, CelestialRegistry, and React dispatch.
 *
 * @module modules/world-sim/application/mediator/WorldSimMediator
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createInputHandler } from '@/modules/world-sim/application/mediator/mediatorEvents';
import {
    zoomToBodyImpl,
    zoomToLocalCoordinateImpl,
    zoomToRegionImpl,
} from '@/modules/world-sim/application/mediator/mediatorNavigation';
import {
    runCelestialSimulation,
    runCollisionSimulation,
    runEverdarkSimulation,
} from '@/modules/world-sim/application/mediator/mediatorSimulation';
import { AdaptivePerformanceController } from '@/modules/world-sim/application/services/AdaptivePerformanceController';
import { RaycastService } from '@/modules/world-sim/application/services/RaycastService';
import {
    WorldSimActionType,
    type WorldSimAction,
} from '@/modules/world-sim/application/state/worldSimTypes';
import type {
    ICelestialRenderer,
    SceneContext,
} from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import type { SceneEventBus } from '@/modules/world-sim/domain/events/sceneEventBus';
import type { ProjectionBridge } from '@/modules/world-sim/infrastructure/bridge/ProjectionBridge';
import { OCCLUSION_FRAME_STRIDE } from '@/modules/world-sim/infrastructure/config/sceneTuning';
import { DPR_CAP } from '@/modules/world-sim/infrastructure/geometry/budgets/GeometryBudgets';
import {
    buildCelestialBodies,
    buildCollisionClouds,
    buildEverdark,
    buildOrbitLines,
    type CelestialEntry,
    type CollisionCloudEntry,
} from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import type { CameraController } from '@/modules/world-sim/infrastructure/input/CameraController';
import type { CanvasInputHandler } from '@/modules/world-sim/infrastructure/input/CanvasInputHandler';
import {
    RenderPhase,
    type FrameContext,
} from '@/modules/world-sim/infrastructure/three-js/RenderLifecycle';
import type { SceneManager } from '@/modules/world-sim/infrastructure/three-js/SceneManager';
import { Material, Mesh, MeshBasicMaterial, Object3D } from 'three';

/** @constant {number} ORBIT_COLOR_DARK - Orbit ring color for dark theme (accent green) */
const ORBIT_COLOR_DARK = 0x8fd3a1;

/** @constant {number} ORBIT_COLOR_LIGHT - Orbit ring color for light theme (muted green) */
const ORBIT_COLOR_LIGHT = 0x5a8a6a;

/**
 * Coordinates World Sim subsystems. Owns celestial mesh lifecycle, handles
 * interaction raycasting, updates orbits and renderers each frame, tracks
 * projected positions.
 *
 * @class WorldSimMediator
 *
 * @example
 * ```ts
 * const mediator = new WorldSimMediator(sceneManager, cameraController, projection, eventBus, dispatch);
 * mediator.initialize();
 * // Simulation, camera, and projections are registered as lifecycle phases.
 * // Cleanup:
 * mediator.dispose();
 * ```
 */
export class WorldSimMediator {
  /** @property {SceneManager} sceneManager - The Three.js scene lifecycle manager */
  private sceneManager: SceneManager;

  /** @property {CameraController} cameraController - Camera orbit and command controller */
  private cameraController: CameraController;

  /** @property {ProjectionBridge} projectionBridge - 3D→2D projection adapter */
  private projectionBridge: ProjectionBridge;

  /** @property {SceneEventBus} eventBus - Typed event emitter */
  private eventBus: SceneEventBus;

  /** @property {CelestialRegistry} registry - Body data query layer */
  private registry: CelestialRegistry;

  /** @property {React.Dispatch<WorldSimAction>} dispatch - React state dispatch */
  private dispatch: React.Dispatch<WorldSimAction>;

  /** @property {Map<string, CelestialEntry>} celestials - Active celestial entries by ID */
  private celestials: Map<string, CelestialEntry> = new Map();

  /** @property {Object3D | null} everdarkMesh - The Everdark boundary mesh */
  private everdarkMesh: Object3D | null = null;

  /** @property {ICelestialRenderer | null} everdarkRenderer - The Everdark renderer */
  private everdarkRenderer: ICelestialRenderer | null = null;

  /** @property {Map<string, CollisionCloudEntry>} collisionClouds - Active collision-cloud effects keyed by registry pair id */
  private collisionClouds: Map<string, CollisionCloudEntry> = new Map();

  /** @property {RaycastService} raycastService - Handles mouse picking and occlusion raycasting */
  private raycastService: RaycastService;

  /** @property {string | null} hoveredBodyId - Currently hovered body ID */
  private hoveredBodyId: string | null = null;

  /** @property {CanvasInputHandler | null} inputHandler - Pointer event handler for the canvas */
  private inputHandler: CanvasInputHandler | null = null;

  /** @property {string | null} followedBodyId - Currently followed body ID for camera tracking */
  private followedBodyId: string | null = null;

  /** @property {boolean} orbitLinesVisible - Whether orbit lines are currently visible */
  private orbitLinesVisible: boolean = true;

  /** @property {Map<string, Mesh>} orbitLines - Orbit ring meshes by body ID */
  private orbitLines: Map<string, Mesh> = new Map();

  /** @property {number} occlusionFrame - Frame counter for throttling occlusion raycasts */
  private occlusionFrame: number = 0;

  /** @property {Set<string>} cachedOcclusion - Cached occlusion result reused between throttled frames */
  private cachedOcclusion: Set<string> = new Set();

  /** @property {AdaptivePerformanceController} performanceController - Adaptive quality selector from frame timing */
  private performanceController: AdaptivePerformanceController =
    new AdaptivePerformanceController();

  /** @property {Function} boundThemeChangeHandler - Bound handler for ik:theme-changed event (for cleanup) */
  private boundThemeChangeHandler: (e: Event) => void;

  /**
   * Create a new WorldSimMediator.
   *
   * @param {SceneManager} sceneManager - Scene lifecycle manager
   * @param {CameraController} cameraController - Camera controller
   * @param {ProjectionBridge} projectionBridge - Projection adapter
   * @param {SceneEventBus} eventBus - Event bus
   * @param {React.Dispatch<WorldSimAction>} dispatch - State dispatch function
   */
  constructor(
    sceneManager: SceneManager,
    cameraController: CameraController,
    projectionBridge: ProjectionBridge,
    eventBus: SceneEventBus,
    dispatch: React.Dispatch<WorldSimAction>,
  ) {
    this.sceneManager = sceneManager;
    this.cameraController = cameraController;
    this.projectionBridge = projectionBridge;
    this.eventBus = eventBus;
    this.dispatch = dispatch;
    this.registry = CelestialRegistry.shared();
    this.raycastService = new RaycastService();

    this.boundThemeChangeHandler = this.handleThemeChange.bind(this);
  }

  /**
   * Build celestials, orbit lines, everdark, collision clouds; register
   * projections and lifecycle phases; attach input and theme listeners.
   */
  initialize(): void {
    const scene = this.sceneManager.scene;
    this.celestials = buildCelestialBodies(this.registry, scene);
    this.orbitLines = buildOrbitLines(this.registry, this.celestials, scene);
    const everdark = buildEverdark(this.registry, scene);
    this.everdarkMesh = everdark.mesh;
    this.everdarkRenderer = everdark.renderer;
    this.collisionClouds = buildCollisionClouds(
      this.registry.getCollisionPairs(),
      this.celestials,
      scene,
    );
    this.registerProjections();
    this.buildMeshCaches();
    this.applyQualityToRenderers();
    this.attachInputListeners();

    window.addEventListener('ik:theme-changed', this.boundThemeChangeHandler);

    this.cameraController.onPanUnlock = () => {
      this.followedBodyId = null;
      this.dispatch({ type: WorldSimActionType.Deselect });
    };

    this.sceneManager.lifecycle.on(
      RenderPhase.Update,
      (ctx: FrameContext) => {
        this.updateSimulation(ctx);
      },
      { priority: 10, label: 'mediator:simulation' },
    );

    this.sceneManager.lifecycle.on(
      RenderPhase.PostUpdate,
      (ctx: FrameContext) => {
        this.cameraController.update(ctx.deltaTime);
      },
      { priority: 10, label: 'mediator:camera' },
    );

    this.sceneManager.lifecycle.on(
      RenderPhase.PostRender,
      () => {
        this.updateProjections();
      },
      { priority: 10, label: 'mediator:projections' },
    );

    this.dispatch({ type: WorldSimActionType.Initialize });
  }

  /**
   * Update phase: advances orbital positions, ticks renderer strategies,
   * applies quality changes. Runs during RenderPhase.Update.
   *
   * @private
   * @param {FrameContext} frameCtx - Shared frame context from the lifecycle
   */
  private updateSimulation(frameCtx: FrameContext): void {
    const { time, deltaTime, simDeltaTime } = frameCtx;
    const qualityChanged = this.performanceController.sample(deltaTime);
    if (qualityChanged) {
      this.applyQualityToRenderers();
    }

    const ctx: SceneContext = {
      camera: this.sceneManager.camera,
      scene: this.sceneManager.scene,
      time,
      deltaTime: simDeltaTime,
    };

    runCelestialSimulation(this.celestials, ctx, time, simDeltaTime);
    runEverdarkSimulation(
      this.everdarkRenderer,
      this.everdarkMesh,
      ctx,
      time,
      simDeltaTime,
    );
    runCollisionSimulation(
      this.collisionClouds,
      this.celestials,
      time,
      simDeltaTime,
    );
  }

  /**
   * Post-render projection pass, runs after renderer.render(). Recomputes
   * occlusion throttled by OCCLUSION_FRAME_STRIDE and updates the projection
   * bridge.
   *
   * @private
   */
  private updateProjections(): void {
    this.occlusionFrame++;
    if (this.occlusionFrame % OCCLUSION_FRAME_STRIDE === 0) {
      this.cachedOcclusion = this.raycastService.computeOcclusion(
        this.sceneManager.camera,
        this.celestials,
      );
    }
    this.projectionBridge.setOccluded(this.cachedOcclusion);
    this.projectionBridge.update(
      this.sceneManager.camera,
      this.sceneManager.getCanvasRect(),
    );
  }

  /**
   * Navigate the camera to focus on a celestial body.
   *
   * @param {string} bodyId - ID of the body to zoom to
   */
  zoomToBody(bodyId: string): void {
    zoomToBodyImpl(
      bodyId,
      this.celestials,
      this.cameraController,
      this.dispatch,
      (id) => {
        this.followedBodyId = id;
      },
    );
  }

  /**
   * Navigate the camera to focus on a specific region on a body.
   *
   * @param {string} bodyId - ID of the parent body
   * @param {string} regionId - ID of the region
   */
  zoomToRegion(bodyId: string, regionId: string): void {
    zoomToRegionImpl(
      bodyId,
      regionId,
      this.celestials,
      this.registry,
      this.cameraController,
      this.dispatch,
      (id) => {
        this.followedBodyId = id;
      },
    );
  }

  /**
   * Navigate the camera to a specific local coordinate on a celestial body.
   *
   * @param {string} bodyId - ID of the parent body
   * @param {{ lat: number; lon: number }} localCoord - Surface coordinates in degrees
   * @param {number} [viewDist] - Optional view distance override
   */
  zoomToLocalCoordinate(
    bodyId: string,
    localCoord: { lat: number; lon: number },
    viewDist?: number,
  ): void {
    zoomToLocalCoordinateImpl(
      bodyId,
      localCoord,
      viewDist,
      this.celestials,
      this.cameraController,
      this.dispatch,
      (id) => {
        this.followedBodyId = id;
      },
    );
  }

  /**
   * Reset the camera to the default system overview.
   */
  resetView(): void {
    this.followedBodyId = null;
    this.cameraController.resetToDefault();
    this.dispatch({ type: WorldSimActionType.Deselect });
  }

  /**
   * Toggle orbit line visibility on/off.
   */
  toggleOrbitLines(): void {
    this.orbitLinesVisible = !this.orbitLinesVisible;
    this.orbitLines.forEach((line) => {
      line.visible = this.orbitLinesVisible;
    });
  }

  /**
   * Dispose of all resources and clean up.
   */
  dispose(): void {
    window.removeEventListener('ik:theme-changed', this.boundThemeChangeHandler);

    this.detachInputListeners();

    this.celestials.forEach((entry) => {
      entry.renderer.dispose(entry.mesh);
      this.sceneManager.scene.remove(entry.mesh);
    });
    this.celestials.clear();

    if (this.everdarkRenderer && this.everdarkMesh) {
      this.everdarkRenderer.dispose(this.everdarkMesh);
      this.sceneManager.scene.remove(this.everdarkMesh);
    }

    if (this.collisionClouds.size > 0) {
      this.collisionClouds.forEach(({ effect }) => {
        effect.removeFromScene(this.sceneManager.scene);
        effect.dispose();
      });
      this.collisionClouds.clear();
    }

    this.orbitLines.forEach((ring) => {
      ring.geometry.dispose();
      (ring.material as Material).dispose();
      if (ring.parent) {
        ring.parent.remove(ring);
      }
    });
    this.orbitLines.clear();

    this.projectionBridge.clear();
    this.eventBus.clear();
  }

  /**
   * Handle the site-wide ik:theme-changed event. Updates orbit ring mesh colors
   * to match the current theme.
   *
   * @param {Event} e - CustomEvent with detail.theme ('dark' | 'light')
   */
  private handleThemeChange(e: Event): void {
    const theme = (e as CustomEvent<{ theme: string }>).detail?.theme;
    const color = theme === 'light' ? ORBIT_COLOR_LIGHT : ORBIT_COLOR_DARK;

    this.orbitLines.forEach((line) => {
      const mat = line.material as MeshBasicMaterial;
      mat.color.set(color);
    });
  }

  /**
   * Register all celestial bodies with the ProjectionBridge for 2D overlay
   * tracking.
   *
   * @private
   */
  private registerProjections(): void {
    this.celestials.forEach((entry, id) => {
      this.projectionBridge.track(id, entry.mesh.position);
    });
  }

  /**
   * Attach the canvas input handler with mediator-bound click and hover callbacks.
   *
   * @private
   */
  private attachInputListeners(): void {
    this.inputHandler = createInputHandler(
      this.sceneManager.renderer.domElement,
      this.sceneManager.camera,
      () => this.sceneManager.getCanvasRect(),
      this.raycastService,
      () => this.cameraController.isTransitioning(),
      (bodyId) => {
        if (bodyId !== this.followedBodyId) {
          this.eventBus.emit('body:click', { bodyId });
          this.zoomToBody(bodyId);
        }
      },
      (bodyId) => {
        if (this.hoveredBodyId) {
          this.eventBus.emit('body:unhover', { bodyId: this.hoveredBodyId });
          this.dispatch({ type: WorldSimActionType.HoverBody, bodyId: null });
        }
        this.hoveredBodyId = bodyId;
        if (bodyId) {
          this.eventBus.emit('body:hover', { bodyId });
          this.dispatch({ type: WorldSimActionType.HoverBody, bodyId });
        }
      },
    );
  }

  /**
   * Detach and dispose the canvas input handler.
   *
   * @private
   */
  private detachInputListeners(): void {
    this.inputHandler?.detach();
    this.inputHandler = null;
  }

  /**
   * Build cached mesh arrays for raycasting and occlusion testing.
   *
   * @private
   */
  private buildMeshCaches(): void {
    const rootMeshes: Object3D[] = [];
    this.celestials.forEach((entry) => {
      rootMeshes.push(entry.mesh);
    });
    this.raycastService.buildMeshCaches(rootMeshes);
  }

  /**
   * Apply the currently selected adaptive quality level to all registered renderers.
   *
   * @private
   */
  private applyQualityToRenderers(): void {
    const level = this.performanceController.getLevel();

    this.celestials.forEach((entry) => {
      entry.renderer.setQualityLevel?.(level);
    });

    if (this.everdarkRenderer) {
      this.everdarkRenderer.setQualityLevel?.(level);
    }

    this.sceneManager.setPixelRatioCap(DPR_CAP[level]);
  }
}

/**
 * @fileoverview World Sim Mediator — Central Coordinator
 * @description Implements the Mediator pattern to coordinate between all World Sim
 * subsystems: SceneManager, CameraController, ProjectionBridge, SceneEventBus,
 * CelestialRegistry, and the React dispatch function. This is the single point of
 * orchestration — subsystems communicate through the mediator, not directly.
 *
 * @module worldSim/WorldSimMediator
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Material, Mesh, Object3D } from 'three';
import type { ProjectionBridge } from './bridge/ProjectionBridge';
import type { SceneEventBus } from './bridge/SceneEventBus';
import { ZoomToBodyCommand, ZoomToRegionCommand } from './camera/CameraCommand';
import type { CameraController } from './camera/CameraController';
import type { FrameContext } from './canvas/RenderLifecycle';
import { RenderPhase } from './canvas/RenderLifecycle';
import type { SceneManager } from './canvas/SceneManager';
import { CelestialRegistry } from './celestials/CelestialRegistry';
import { CollisionCloudEffect } from './celestials/CollisionCloudEffect';
import {
    buildCelestialBodies,
    buildCollisionCloud,
    buildEverdark,
    buildOrbitLines,
    type CelestialEntry,
} from './celestials/CelestialSceneBuilder';
import type {
    ICelestialRenderer,
    SceneContext,
} from './celestials/interfaces';
import {
    computeOrbitalPosition,
    surfacePositionToWorld,
} from './celestials/OrbitalMechanics';
import {
    WorldSimActionType,
    type WorldSimAction,
} from './context/worldSimTypes';
import { CanvasInputHandler } from './input/CanvasInputHandler';
import { AdaptivePerformanceController } from './optimization/AdaptivePerformanceController';
import { DPR_CAP } from './optimization/GeometryBudgets';
import { RaycastService } from './RaycastService';

/** @constant {number} VIEW_DISTANCE_MULTIPLIER - Multiplier for zoom-to-body view distance */
const VIEW_DISTANCE_MULTIPLIER = 3;

/** @constant {number} REGION_VIEW_DISTANCE - View distance when zooming to a region */
const REGION_VIEW_DISTANCE = 40;

/** @constant {number} LOCAL_COORD_VIEW_DISTANCE - Default view distance for local coordinate focus */
const LOCAL_COORD_VIEW_DISTANCE = 30;

/**
 * Central mediator coordinating all World Sim subsystems.
 * Owns the lifecycle of celestial meshes, handles raycasting for interaction,
 * updates orbits and renderers each frame, and tracks projected positions.
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

  /** @property {CollisionCloudEffect | null} collisionCloud - Proximity cloud at the Länsihenki × Itähenki crossing point */
  private collisionCloud: CollisionCloudEffect | null = null;

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
  }

  /**
   * Initialize the scene: create all celestial bodies, set up event listeners,
   * and register the animation callback.
   */
  initialize(): void {
    const scene = this.sceneManager.scene;
    this.celestials = buildCelestialBodies(this.registry, scene);
    this.orbitLines = buildOrbitLines(this.registry, this.celestials, scene);
    const everdark = buildEverdark(this.registry, scene);
    this.everdarkMesh = everdark.mesh;
    this.everdarkRenderer = everdark.renderer;
    this.collisionCloud = buildCollisionCloud(this.celestials, scene);
    this.registerProjections();
    this.buildMeshCaches();
    this.applyQualityToRenderers();
    this.attachInputListeners();

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
   * Update phase: advance orbital positions and tick renderer strategies.
   * Runs during RenderPhase.Update.
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

    this.celestials.forEach((entry) => {
      if (entry.data.orbit) {
        const orbitalOffset = computeOrbitalPosition(entry.data.orbit, time);

        if (entry.data.parentBodyId) {
          const parentEntry = this.celestials.get(entry.data.parentBodyId);
          if (parentEntry) {
            entry.mesh.position
              .copy(parentEntry.mesh.position)
              .add(orbitalOffset);
          } else {
            entry.mesh.position.copy(orbitalOffset);
          }
        } else {
          entry.mesh.position.copy(orbitalOffset);
        }
      } else if (entry.data.parentBodyId) {
        const parentEntry = this.celestials.get(entry.data.parentBodyId);
        if (parentEntry) {
          entry.mesh.position.copy(parentEntry.mesh.position);
        }
      }

      entry.renderer.update(entry.mesh, time, simDeltaTime, ctx);
    });

    if (this.everdarkRenderer && this.everdarkMesh) {
      this.everdarkRenderer.update(this.everdarkMesh, time, simDeltaTime, ctx);
    }

    if (this.collisionCloud) {
      const lans = this.celestials.get('lansihenki');
      const ita = this.celestials.get('itahenki');
      if (lans && ita) {
        this.collisionCloud.update(
          lans.mesh.position,
          ita.mesh.position,
          time,
          simDeltaTime,
        );
      }
    }
  }

  /**
   * Post-render projection pass: runs after renderer.render() so the camera's
   * matrixWorldInverse is fully finalized. This eliminates compositor-layer
   * desync between the WebGL canvas and DOM overlay labels during rotation.
   *
   * @private
   */
  private updateProjections(): void {
    this.occlusionFrame++;
    if (this.occlusionFrame % 3 === 0) {
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
    const entry = this.celestials.get(bodyId);
    if (!entry) return;

    const viewDistance = entry.data.radius * VIEW_DISTANCE_MULTIPLIER;
    const positionGetter = () => entry.mesh.position.clone();

    const command = new ZoomToBodyCommand(
      entry.mesh.position.clone(),
      viewDistance,
      bodyId,
    );

    this.followedBodyId = bodyId;
    this.cameraController.setFollowTarget(positionGetter);
    this.cameraController.executeCommand(command);
    this.dispatch({ type: WorldSimActionType.SelectBody, bodyId });
  }

  /**
   * Navigate the camera to focus on a specific region on a body.
   *
   * @param {string} bodyId - ID of the parent body
   * @param {string} regionId - ID of the region
   */
  zoomToRegion(bodyId: string, regionId: string): void {
    const entry = this.celestials.get(bodyId);
    const region = this.registry.getRegion(bodyId, regionId);
    if (!entry || !region) return;

    const worldPos = surfacePositionToWorld(
      region.surfacePosition,
      entry.data.radius,
      entry.mesh.position,
    );

    const command = new ZoomToRegionCommand(
      worldPos,
      entry.mesh.position.clone(),
      REGION_VIEW_DISTANCE,
      regionId,
    );

    this.followedBodyId = bodyId;
    const positionGetter = () => entry.mesh.position.clone();
    this.cameraController.setFollowTarget(positionGetter);
    this.cameraController.executeCommand(command);
    this.dispatch({ type: WorldSimActionType.SelectRegion, regionId, bodyId });
  }

  /**
   * Navigate the camera to a specific local coordinate on a celestial body.
   * Used for focusing on arbitrary surface points that aren't named regions.
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
    const entry = this.celestials.get(bodyId);
    if (!entry) return;

    const worldPos = surfacePositionToWorld(
      localCoord,
      entry.data.radius,
      entry.mesh.position,
    );

    const distance = viewDist ?? LOCAL_COORD_VIEW_DISTANCE;
    const command = new ZoomToRegionCommand(
      worldPos,
      entry.mesh.position.clone(),
      distance,
      `local-${bodyId}`,
    );

    this.followedBodyId = bodyId;
    const positionGetter = () => entry.mesh.position.clone();
    this.cameraController.setFollowTarget(positionGetter);
    this.cameraController.executeCommand(command);
    this.dispatch({ type: WorldSimActionType.SelectBody, bodyId });
  }

  /**
   * Reset the camera to the default system overview.
   * Delegates all camera state cleanup to the controller's resetToDefault.
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

    if (this.collisionCloud) {
      this.collisionCloud.removeFromScene(this.sceneManager.scene);
      this.collisionCloud.dispose();
      this.collisionCloud = null;
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
   * Register all celestial bodies with the ProjectionBridge for 2D overlay tracking.
   * Passes live mesh.position references so the bridge always reads current positions
   * without needing per-frame updatePosition() calls.
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
    this.inputHandler = new CanvasInputHandler({
      canvas: this.sceneManager.renderer.domElement,
      camera: this.sceneManager.camera,
      getCanvasRect: () => this.sceneManager.getCanvasRect(),
      raycastService: this.raycastService,
      isTransitioning: () => this.cameraController.isTransitioning(),
      onBodyClick: (bodyId) => {
        if (bodyId !== this.followedBodyId) {
          this.eventBus.emit('body:click', { bodyId });
          this.zoomToBody(bodyId);
        }
      },
      onHoverChange: (bodyId) => {
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
    });
    this.inputHandler.attach();
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
   * Delegates to RaycastService. Called once after all bodies are created.
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

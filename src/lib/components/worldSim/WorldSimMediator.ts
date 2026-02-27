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

import { Material, Mesh, Object3D, Raycaster, Vector2 } from 'three';
import type { ProjectionBridge } from './bridge/ProjectionBridge';
import type { SceneEventBus } from './bridge/SceneEventBus';
import {
  ResetViewCommand,
  ZoomToBodyCommand,
  ZoomToRegionCommand,
} from './camera/CameraCommand';
import type { CameraController } from './camera/CameraController';
import type { SceneManager } from './canvas/SceneManager';
import { CelestialBodyFactory } from './celestials/CelestialBodyFactory';
import { CelestialRegistry } from './celestials/CelestialRegistry';
import type {
  CelestialBodyData,
  CelestialRendererType,
  ICelestialRenderer,
  SceneContext,
} from './celestials/interfaces';
import {
  computeOrbitalPosition,
  surfacePositionToWorld,
} from './celestials/OrbitalMechanics';
import { createAllOrbitLines } from './celestials/OrbitLineFactory';
import type { WorldSimAction } from './context/worldSimTypes';

/**
 * Runtime entry for a celestial body in the scene.
 *
 * @interface CelestialEntry
 * @property {CelestialBodyData} data - The body's data definition
 * @property {ICelestialRenderer} renderer - The renderer strategy instance
 * @property {Object3D} mesh - The Three.js scene object
 */
interface CelestialEntry {
  /** @property {CelestialBodyData} data - Body configuration data */
  data: CelestialBodyData;
  /** @property {ICelestialRenderer} renderer - Renderer strategy instance */
  renderer: ICelestialRenderer;
  /** @property {Object3D} mesh - Scene object created by the renderer */
  mesh: Object3D;
}

/** @constant {number} VIEW_DISTANCE_MULTIPLIER - Multiplier for zoom-to-body view distance */
const VIEW_DISTANCE_MULTIPLIER = 3;

/** @constant {number} REGION_VIEW_DISTANCE - View distance when zooming to a region */
const REGION_VIEW_DISTANCE = 15;

/** @constant {number} LOCAL_COORD_VIEW_DISTANCE - Default view distance for local coordinate focus */
const LOCAL_COORD_VIEW_DISTANCE = 10;

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
 * // On each frame (called by SceneManager.onAnimate):
 * mediator.update(time, deltaTime);
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

  /** @property {Raycaster} raycaster - For picking celestial bodies */
  private raycaster: Raycaster;

  /** @property {Vector2} mouseNDC - Normalized device coordinates for raycasting */
  private mouseNDC: Vector2;

  /** @property {string | null} hoveredBodyId - Currently hovered body ID */
  private hoveredBodyId: string | null = null;

  /** @property {string | null} followedBodyId - Currently followed body ID for camera tracking */
  private followedBodyId: string | null = null;

  /** @property {boolean} orbitLinesVisible - Whether orbit lines are currently visible */
  private orbitLinesVisible: boolean = true;

  /** @property {Map<string, Mesh>} orbitLines - Orbit ring meshes by body ID */
  private orbitLines: Map<string, Mesh> = new Map();

  /** @property {Function} boundOnCanvasClick - Bound click handler */
  private boundOnCanvasClick: (e: MouseEvent) => void;

  /** @property {Function} boundOnCanvasMove - Bound mousemove handler */
  private boundOnCanvasMove: (e: MouseEvent) => void;

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
    this.registry = new CelestialRegistry();
    this.raycaster = new Raycaster();
    this.mouseNDC = new Vector2();

    this.boundOnCanvasClick = this.onCanvasClick.bind(this);
    this.boundOnCanvasMove = this.onCanvasMove.bind(this);
  }

  /**
   * Initialize the scene: create all celestial bodies, set up event listeners,
   * and register the animation callback.
   */
  initialize(): void {
    this.createAllBodies();
    this.createOrbitLines();
    this.createEverdark();
    this.registerProjections();
    this.attachInputListeners();

    this.cameraController.onPanUnlock = () => {
      this.followedBodyId = null;
      this.dispatch({ type: 'DESELECT' });
    };

    this.sceneManager.onAnimate((time, deltaTime) => {
      this.update(time, deltaTime);
    });

    this.dispatch({ type: 'INITIALIZE' });
  }

  /**
   * Main per-frame update: advance orbits, update renderers, update camera,
   * and refresh projections.
   *
   * @param {number} time - Elapsed time in seconds
   * @param {number} deltaTime - Time since last frame
   */
  update(time: number, deltaTime: number): void {
    const ctx: SceneContext = {
      camera: this.sceneManager.camera,
      scene: this.sceneManager.scene,
      time,
      deltaTime,
    };

    const entries = Array.from(this.celestials.entries());
    for (let i = 0; i < entries.length; i++) {
      const [, entry] = entries[i];
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

      entry.renderer.update(entry.mesh, time, deltaTime, ctx);

      this.projectionBridge.updatePosition(
        entry.data.id,
        entry.mesh.position.clone(),
      );
    }

    if (this.everdarkRenderer && this.everdarkMesh) {
      this.everdarkRenderer.update(this.everdarkMesh, time, deltaTime, ctx);
    }

    this.cameraController.update(deltaTime);
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
    this.dispatch({ type: 'SELECT_BODY', bodyId });
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
      REGION_VIEW_DISTANCE,
      regionId,
    );

    this.followedBodyId = bodyId;
    const positionGetter = () => entry.mesh.position.clone();
    this.cameraController.setFollowTarget(positionGetter);
    this.cameraController.executeCommand(command);
    this.dispatch({ type: 'SELECT_REGION', regionId, bodyId });
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
      distance,
      `local-${bodyId}`,
    );

    this.followedBodyId = bodyId;
    const positionGetter = () => entry.mesh.position.clone();
    this.cameraController.setFollowTarget(positionGetter);
    this.cameraController.executeCommand(command);
    this.dispatch({ type: 'SELECT_BODY', bodyId });
  }

  /**
   * Reset the camera to the default system overview.
   */
  resetView(): void {
    this.followedBodyId = null;
    this.cameraController.clearFollowTarget();
    const command = new ResetViewCommand();
    this.cameraController.executeCommand(command);
    this.dispatch({ type: 'DESELECT' });
  }

  /**
   * Toggle orbit line visibility on/off.
   */
  toggleOrbitLines(): void {
    this.orbitLinesVisible = !this.orbitLinesVisible;
    const entries = Array.from(this.orbitLines.values());
    for (let i = 0; i < entries.length; i++) {
      entries[i].visible = this.orbitLinesVisible;
    }
  }

  /**
   * Dispose of all resources and clean up.
   */
  dispose(): void {
    this.detachInputListeners();

    const disposeEntries = Array.from(this.celestials.values());
    for (let i = 0; i < disposeEntries.length; i++) {
      const entry = disposeEntries[i];
      entry.renderer.dispose(entry.mesh);
      this.sceneManager.scene.remove(entry.mesh);
    }
    this.celestials.clear();

    if (this.everdarkRenderer && this.everdarkMesh) {
      this.everdarkRenderer.dispose(this.everdarkMesh);
      this.sceneManager.scene.remove(this.everdarkMesh);
    }

    const orbitLineEntries = Array.from(this.orbitLines.values());
    for (let i = 0; i < orbitLineEntries.length; i++) {
      const ring = orbitLineEntries[i];
      ring.geometry.dispose();
      (ring.material as Material).dispose();
      if (ring.parent) {
        ring.parent.remove(ring);
      }
    }
    this.orbitLines.clear();

    this.projectionBridge.clear();
    this.eventBus.clear();
  }

  /**
   * Create mesh entries for all celestial bodies in the registry.
   *
   * @private
   */
  private createAllBodies(): void {
    const bodies = this.registry.getAllBodies();

    for (const body of bodies) {
      const renderer = CelestialBodyFactory.createRenderer(
        body.renderConfig.renderer as CelestialRendererType,
      );
      const mesh = renderer.createMesh(body);

      if (body.orbit) {
        const initialPosition = computeOrbitalPosition(body.orbit, 0);
        mesh.position.copy(initialPosition);
      }

      mesh.userData = { bodyId: body.id };

      this.sceneManager.scene.add(mesh);
      this.celestials.set(body.id, { data: body, renderer, mesh });
    }
  }

  /**
   * Create orbit path lines for all bodies with orbital parameters.
   * Lines for child bodies (with parentBodyId) are parented to the parent mesh
   * so they move with the parent. Top-level orbit lines are added to the scene root.
   *
   * @private
   */
  private createOrbitLines(): void {
    const bodies = this.registry.getAllBodies();
    const meshMap = new Map<string, Object3D>();
    const bodyEntries = Array.from(this.celestials.entries());
    for (let i = 0; i < bodyEntries.length; i++) {
      const [id, entry] = bodyEntries[i];
      meshMap.set(id, entry.mesh);
    }

    this.orbitLines = createAllOrbitLines(bodies, meshMap);

    const lineEntries = Array.from(this.orbitLines.entries());
    for (let i = 0; i < lineEntries.length; i++) {
      const [bodyId, line] = lineEntries[i];
      const bodyData = this.registry.getBodyById(bodyId);
      if (!bodyData?.parentBodyId) {
        this.sceneManager.scene.add(line);
      }
    }
  }

  /**
   * Create the Everdark boundary shell.
   *
   * @private
   */
  private createEverdark(): void {
    const boundary = this.registry.getBoundary();
    this.everdarkRenderer = CelestialBodyFactory.createRenderer(
      boundary.renderConfig.renderer as CelestialRendererType,
    );
    this.everdarkMesh = this.everdarkRenderer.createMesh(boundary);
    this.sceneManager.scene.add(this.everdarkMesh);
  }

  /**
   * Register all celestial bodies with the ProjectionBridge for 2D overlay tracking.
   *
   * @private
   */
  private registerProjections(): void {
    const projEntries = Array.from(this.celestials.entries());
    for (let i = 0; i < projEntries.length; i++) {
      const [id, entry] = projEntries[i];
      this.projectionBridge.track(id, entry.mesh.position.clone());
    }
  }

  /**
   * Attach mouse click and move listeners to the canvas for raycasting.
   *
   * @private
   */
  private attachInputListeners(): void {
    const canvas = this.sceneManager.renderer.domElement;
    canvas.addEventListener('click', this.boundOnCanvasClick);
    canvas.addEventListener('mousemove', this.boundOnCanvasMove);
  }

  /**
   * Remove input listeners from the canvas.
   *
   * @private
   */
  private detachInputListeners(): void {
    const canvas = this.sceneManager.renderer.domElement;
    canvas.removeEventListener('click', this.boundOnCanvasClick);
    canvas.removeEventListener('mousemove', this.boundOnCanvasMove);
  }

  /**
   * Handle canvas click events — raycast to find clicked body.
   *
   * @private
   * @param {MouseEvent} event - The click event
   */
  private onCanvasClick(event: MouseEvent): void {
    if (this.cameraController.isTransitioning()) return;

    const bodyId = this.raycastBody(event);
    if (bodyId && bodyId !== this.followedBodyId) {
      this.eventBus.emit('body:click', { bodyId });
      this.zoomToBody(bodyId);
    }
  }

  /**
   * Handle canvas mousemove events — raycast for hover state.
   *
   * @private
   * @param {MouseEvent} event - The mousemove event
   */
  private onCanvasMove(event: MouseEvent): void {
    if (this.cameraController.isTransitioning()) return;

    const bodyId = this.raycastBody(event);

    if (bodyId !== this.hoveredBodyId) {
      if (this.hoveredBodyId) {
        this.eventBus.emit('body:unhover', { bodyId: this.hoveredBodyId });
        this.dispatch({ type: 'HOVER_BODY', bodyId: null });
      }

      this.hoveredBodyId = bodyId;

      if (bodyId) {
        this.eventBus.emit('body:hover', { bodyId });
        this.dispatch({ type: 'HOVER_BODY', bodyId });
      }
    }
  }

  /**
   * Perform a raycast from a mouse event and return the ID of the hit body.
   *
   * @private
   * @param {MouseEvent} event - The mouse event with client coordinates
   * @returns {string | null} The body ID if hit, null otherwise
   */
  private raycastBody(event: MouseEvent): string | null {
    const rect = this.sceneManager.getCanvasRect();
    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, this.sceneManager.camera);

    const meshes: Object3D[] = [];
    const rayEntries = Array.from(this.celestials.values());
    for (let i = 0; i < rayEntries.length; i++) {
      rayEntries[i].mesh.traverse((child) => {
        if ('isMesh' in child) {
          meshes.push(child);
        }
      });
    }

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      let hitObject: Object3D | null = intersects[0].object;
      while (hitObject) {
        if (hitObject.userData?.bodyId) {
          return hitObject.userData.bodyId as string;
        }
        hitObject = hitObject.parent;
      }
    }

    return null;
  }
}

/**
 * @fileoverview World Sim Celestial Body Interfaces
 * @description Type definitions for the celestial body system, including renderable,
 * interactable, orbital, and labelable interfaces following Interface Segregation Principle.
 *
 * @module worldSim/celestials/interfaces
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';

/**
 * Shared per-frame context passed to all renderers during the update loop.
 * Provides access to scene-wide resources without tight coupling.
 * @interface SceneContext
 * @property {PerspectiveCamera} camera - The active camera
 * @property {Scene} scene - The Three.js scene
 * @property {number} time - Elapsed time in seconds
 * @property {number} deltaTime - Time since last frame in seconds
 */
export interface SceneContext {
  camera: PerspectiveCamera;
  scene: Scene;
  time: number;
  deltaTime: number;
}

/**
 * Orbital parameters for Keplerian motion around a central body.
 * @interface OrbitalParameters
 * @property {number} semiMajorAxis - Semi-major axis of the elliptical orbit (scene units)
 * @property {number} eccentricity - Orbit eccentricity (0 = circle, <1 = ellipse)
 * @property {number} inclination - Orbital inclination in degrees
 * @property {number} period - Orbital period in arbitrary time units
 * @property {number} phase - Initial phase offset in degrees
 */
export interface OrbitalParameters {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  period: number;
  phase: number;
}

/**
 * Surface position on a spherical body using latitude/longitude in degrees.
 * @interface SurfacePosition
 * @property {number} lat - Latitude in degrees (-90 to 90)
 * @property {number} lon - Longitude in degrees (-180 to 180)
 */
export interface SurfacePosition {
  lat: number;
  lon: number;
}

/**
 * A clickable region on a celestial body's surface.
 * @interface CelestialRegion
 * @property {string} id - Unique identifier for the region
 * @property {string} name - Display name of the region
 * @property {string} contentPath - Path to MDX content (relative to library root)
 * @property {SurfacePosition} surfacePosition - Position on the parent body's surface
 * @property {number} areaScale - Relative size of the region (0-1)
 */
export interface CelestialRegion {
  id: string;
  name: string;
  contentPath: string;
  surfacePosition: SurfacePosition;
  areaScale: number;
}

/**
 * Renderer-specific configuration for a celestial body.
 * Extended by each concrete renderer with additional properties.
 * @interface RenderConfig
 * @property {CelestialRendererType} renderer - Which renderer strategy to use
 */
export interface RenderConfig {
  renderer: CelestialRendererType;
  [key: string]: unknown;
}

/**
 * Allowed renderer strategy types.
 * @typedef {string} CelestialRendererType
 */
export type CelestialRendererType =
  | 'star'
  | 'planet'
  | 'gasGiant'
  | 'ringWorld'
  | 'towerWorld'
  | 'asteroidBelt'
  | 'everdark';

/**
 * Allowed celestial body types.
 * @typedef {string} CelestialBodyType
 */
export type CelestialBodyType =
  | 'star'
  | 'planet'
  | 'gasGiant'
  | 'ringWorld'
  | 'towerWorld'
  | 'asteroidBelt'
  | 'boundary';

/**
 * Complete data definition for a celestial body in the Black Cradle.
 * Loaded from the registry JSON and used by the factory to create scene objects.
 * @interface CelestialBodyData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} subtitle - Short descriptor
 * @property {string} loreOrigin - Lore-based origin description
 * @property {CelestialBodyType} type - Classification of the body
 * @property {string} contentPath - Path to MDX content page
 * @property {string} [parentBodyId] - If set, orbit is relative to this parent body (not the star)
 * @property {OrbitalParameters | null} orbit - Orbital parameters (null for central star)
 * @property {number} radius - Visual radius in scene units
 * @property {RenderConfig} renderConfig - Strategy-specific rendering options
 * @property {CelestialRegion[]} regions - Clickable surface regions
 */
export interface CelestialBodyData {
  id: string;
  name: string;
  subtitle: string;
  loreOrigin: string;
  type: CelestialBodyType;
  contentPath: string;
  parentBodyId?: string;
  orbit: OrbitalParameters | null;
  radius: number;
  renderConfig: RenderConfig;
  regions: CelestialRegion[];
}

/**
 * Boundary layer definition (Everdark).
 * @interface BoundaryData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} subtitle - Short descriptor
 * @property {string} loreOrigin - Lore-based origin description
 * @property {'boundary'} type - Always 'boundary'
 * @property {string} contentPath - Path to MDX content page
 * @property {number} radius - Radius of the enclosing sphere
 * @property {RenderConfig} renderConfig - Renderer configuration
 */
export interface BoundaryData {
  id: string;
  name: string;
  subtitle: string;
  loreOrigin: string;
  type: 'boundary';
  contentPath: string;
  radius: number;
  renderConfig: RenderConfig;
}

/**
 * Complete registry structure loaded from blackCradleRegistry.json.
 * @interface CelestialRegistryData
 * @property {CelestialBodyData[]} bodies - All orbital celestial bodies
 * @property {BoundaryData} boundary - The Everdark boundary sphere
 */
export interface CelestialRegistryData {
  bodies: CelestialBodyData[];
  boundary: BoundaryData;
}

/**
 * Projected 2D screen-space position derived from a 3D world-space point.
 * @interface ProjectedPosition
 * @property {number} x - Screen X coordinate in pixels
 * @property {number} y - Screen Y coordinate in pixels
 * @property {boolean} visible - Whether the point is in front of the camera
 * @property {number} distance - Distance from camera to world point
 * @property {number} scale - Distance-based scale factor for DOM elements
 */
export interface ProjectedPosition {
  x: number;
  y: number;
  visible: boolean;
  distance: number;
  scale: number;
}

/**
 * Interface for objects that can be rendered in the Three.js scene.
 * @interface IRenderable
 * @property {Function} createMesh - Create the Three.js Object3D for this body
 * @property {Function} update - Called each frame to animate the mesh
 * @property {Function} dispose - Clean up GPU resources
 */
export interface IRenderable {
  createMesh(data: CelestialBodyData | BoundaryData): Object3D;
  update(mesh: Object3D, time: number, deltaTime: number, ctx: SceneContext): void;
  dispose(mesh: Object3D): void;
}

/**
 * Interface for objects that respond to raycaster interactions.
 * @interface IInteractable
 * @property {Function} getHitTargets - Return meshes that should be raycast-tested
 * @property {Function} onHover - Called when raycaster enters this body
 * @property {Function} onUnhover - Called when raycaster exits this body
 * @property {Function} onClick - Called when this body is clicked
 */
export interface IInteractable {
  getHitTargets(): Object3D[];
  onHover(mesh: Object3D): void;
  onUnhover(mesh: Object3D): void;
  onClick(mesh: Object3D): void;
}

/**
 * Interface for objects with orbital motion.
 * @interface IOrbitable
 * @property {Function} getWorldPosition - Return current world-space position
 * @property {Function} updateOrbit - Advance orbital position by time delta
 */
export interface IOrbitable {
  getWorldPosition(): Vector3;
  updateOrbit(time: number): void;
}

/**
 * Interface for objects that should have a DOM label projected onto the screen.
 * @interface ILabelable
 * @property {Function} getLabelAnchor - Return the 3D world point to project for this label
 * @property {Function} getLabelOffset - Return pixel offset from projected point
 */
export interface ILabelable {
  getLabelAnchor(): Vector3;
  getLabelOffset(): { x: number; y: number };
}

/**
 * Combined renderer strategy interface implementing all segregated interfaces.
 * Each celestial body renderer must implement this contract.
 * @interface ICelestialRenderer
 * @extends IRenderable
 * @property {Function} getLODDistance - Return near/far thresholds for LOD switching
 */
export interface ICelestialRenderer extends IRenderable {
  getLODDistance(): { near: number; far: number };
}

/**
 * Camera command interface for the Command pattern.
 * Each command encapsulates a per-frame camera transition within the render loop.
 * Returns true when the transition is complete.
 * @interface ICameraCommand
 * @property {string} type - Command type identifier
 * @property {Function} execute - Advance the transition by one frame; returns true when done
 * @property {Function} [applyFollowDelta] - Shift internal target positions by a body-tracking delta
 */
export interface ICameraCommand {
  readonly type: string;
  execute(camera: PerspectiveCamera, deltaTime: number): boolean;
  applyFollowDelta?(delta: Vector3): void;
}

/**
 * Camera controller abstraction for dependency inversion.
 * Manages orbit controls, body follow tracking, and camera command execution.
 * @interface ICameraController
 * @property {Function} executeCommand - Start executing a camera command
 * @property {Function} cancelCommand - Cancel the active command
 * @property {Function} setTarget - Set the orbit center target
 * @property {Function} setFollowTarget - Track a moving body as orbit center
 * @property {Function} clearFollowTarget - Stop tracking a body
 * @property {Function} update - Frame update for orbit damping or command execution
 * @property {Function} isTransitioning - Whether a command is in progress
 * @property {Function} dispose - Clean up event listeners
 */
export interface ICameraController {
  executeCommand(command: ICameraCommand): void;
  cancelCommand(): void;
  setTarget(target: Vector3): void;
  setFollowTarget(positionGetter: () => Vector3): void;
  clearFollowTarget(): void;
  update(deltaTime: number): void;
  isTransitioning(): boolean;
  dispose(): void;
}

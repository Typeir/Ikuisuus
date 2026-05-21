/**
 * @fileoverview World Sim Celestial Body Interfaces
 * @description Type definitions for the celestial body system, including renderer
 * strategy, camera command, and data interfaces.
 *
 * @module worldSim/celestials/interfaces
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import type { RenderQualityLevel } from '../optimization/AdaptivePerformanceController';

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
 * Star renderer configuration.
 * @interface StarRenderConfig
 * @property {'star'} renderer - Discriminant
 * @property {string} [emissiveColor] - Core emissive color hex
 * @property {string} [coronaColor] - Corona glow color hex
 * @property {number} [displacementScale] - Vertex displacement amplitude for solar surface turbulence
 */
export interface StarRenderConfig {
  /** @property {'star'} renderer - Renderer discriminant */
  renderer: 'star';
  /** @property {string} [emissiveColor] - Core emissive color hex */
  emissiveColor?: string;
  /** @property {string} [coronaColor] - Corona glow color hex */
  coronaColor?: string;
  /** @property {number} [displacementScale] - Vertex displacement amplitude */
  displacementScale?: number;
}

/**
 * Terrain colour stop for planet surface profile. Defines a colour band
 * that the fragment shader interpolates based on elevation.
 * @interface TerrainColorStop
 * @property {string} color - Hex colour for this elevation band
 * @property {number} threshold - Elevation threshold (0–1) separating this band from the next
 */
export interface TerrainColorStop {
  /** @property {string} color - Hex colour for this elevation band */
  color: string;
  /** @property {number} threshold - Elevation threshold (0–1) */
  threshold: number;
}

/**
 * Planet renderer configuration.
 * @interface PlanetRenderConfig
 * @property {'planet'} renderer - Discriminant
 * @property {string} [baseColor] - Surface base color hex (fallback if no terrain profile)
 * @property {number} [rotationSpeed] - Rotation speed in rad/s
 * @property {string} [atmosphereColor] - Atmosphere glow color hex (falsy = no atmosphere)
 * @property {number} [atmosphereIntensity] - Atmosphere rim light intensity
 * @property {number} [displacementScale] - Vertex displacement amplitude for terrain relief
 * @property {number} [continentScale] - Low-frequency noise scale for continent/ocean shapes
 * @property {number} [detailScale] - High-frequency noise scale for local features (coastlines, ridges)
 * @property {number} [oceanThreshold] - Elevation floor below which terrain is clamped flat
 * @property {number} [noiseSeed] - Body-unique seed offset for noise generation
 * @property {TerrainColorStop[]} [terrainColors] - 5 colour stops for terrain elevation bands
 * @property {boolean} [polarIce] - Whether the planet renders frozen polar caps
 * @property {number} [polarLatitude] - Normal-Y threshold where polar ice begins (0–1)
 * @property {string} [iceColor] - Hex colour for polar ice caps
 */
export interface PlanetRenderConfig {
  /** @property {'planet'} renderer - Renderer discriminant */
  renderer: 'planet';
  /** @property {string} [baseColor] - Surface base color hex */
  baseColor?: string;
  /** @property {number} [rotationSpeed] - Rotation speed in rad/s */
  rotationSpeed?: number;
  /** @property {string} [atmosphereColor] - Atmosphere glow color hex */
  atmosphereColor?: string;
  /** @property {number} [atmosphereIntensity] - Atmosphere rim light intensity */
  atmosphereIntensity?: number;
  /** @property {number} [displacementScale] - Terrain displacement amplitude */
  displacementScale?: number;
  /** @property {number} [continentScale] - Low-frequency noise scale for continent shapes */
  continentScale?: number;
  /** @property {number} [detailScale] - High-frequency noise scale for local features */
  detailScale?: number;
  /** @property {number} [oceanThreshold] - Elevation floor below which terrain is clamped flat (ocean) */
  oceanThreshold?: number;
  /** @property {number} [noiseSeed] - Body-unique seed offset */
  noiseSeed?: number;
  /** @property {TerrainColorStop[]} [terrainColors] - Colour stops for terrain bands */
  terrainColors?: TerrainColorStop[];
  /** @property {boolean} [polarIce] - Whether the planet has frozen polar caps */
  polarIce?: boolean;
  /** @property {number} [polarLatitude] - Normal-Y threshold where ice begins (0–1, higher = smaller caps) */
  polarLatitude?: number;
  /** @property {string} [iceColor] - Hex colour for polar ice caps */
  iceColor?: string;
}

/**
 * Gas giant renderer configuration.
 * @interface GasGiantRenderConfig
 * @property {'gasGiant'} renderer - Discriminant
 * @property {string} [baseColor] - Base sphere color hex
 * @property {string} [bandColor] - Band stripe color hex
 * @property {number} [rotationSpeed] - Rotation speed in rad/s
 * @property {string} [atmosphereColor] - Haze glow color hex
 * @property {string} [stormColor] - Colour of storm spots in cloud bands
 * @property {number} [bandFrequency] - Vertical frequency of cloud band noise (higher = more bands)
 * @property {number} [timeScale] - Animation speed multiplier for cloud drift
 */
export interface GasGiantRenderConfig {
  /** @property {'gasGiant'} renderer - Renderer discriminant */
  renderer: 'gasGiant';
  /** @property {string} [baseColor] - Base sphere color hex */
  baseColor?: string;
  /** @property {string} [bandColor] - Band stripe color hex */
  bandColor?: string;
  /** @property {number} [rotationSpeed] - Rotation speed in rad/s */
  rotationSpeed?: number;
  /** @property {string} [atmosphereColor] - Haze glow color hex */
  atmosphereColor?: string;
  /** @property {string} [stormColor] - Storm spot colour hex */
  stormColor?: string;
  /** @property {number} [bandFrequency] - Cloud band noise frequency */
  bandFrequency?: number;
  /** @property {number} [timeScale] - Animation speed multiplier for cloud drift */
  timeScale?: number;
}

/**
 * Ring world renderer configuration.
 * @interface RingWorldRenderConfig
 * @property {'ringWorld'} renderer - Discriminant
 * @property {string} [coreColor] - Core sphere color hex
 * @property {string} [ringColor] - Ring torus color hex
 * @property {number} [ringCount] - Number of orbital rings
 * @property {number} [rotationSpeed] - Base rotation speed in rad/s
 * @property {number} [coreRadius] - Core sphere radius override
 * @property {number} [ringSpacing] - Spacing between ring orbits
 * @property {number} [ringTubeRadius] - Tube radius of each ring torus
 * @property {boolean} [icyCore] - Whether to apply icy displacement shader to the core
 */
export interface RingWorldRenderConfig {
  /** @property {'ringWorld'} renderer - Renderer discriminant */
  renderer: 'ringWorld';
  /** @property {string} [coreColor] - Core sphere color hex */
  coreColor?: string;
  /** @property {string} [ringColor] - Ring torus color hex */
  ringColor?: string;
  /** @property {number} [ringCount] - Number of orbital rings */
  ringCount?: number;
  /** @property {number} [rotationSpeed] - Base rotation speed in rad/s */
  rotationSpeed?: number;
  /** @property {number} [coreRadius] - Core sphere radius override */
  coreRadius?: number;
  /** @property {number} [ringSpacing] - Spacing between ring orbits */
  ringSpacing?: number;
  /** @property {number} [ringTubeRadius] - Tube radius of each ring torus */
  ringTubeRadius?: number;
  /** @property {boolean} [icyCore] - Apply icy displacement to the core sphere */
  icyCore?: boolean;
}

/**
 * Tower world renderer configuration.
 * @interface TowerWorldRenderConfig
 * @property {'towerWorld'} renderer - Discriminant
 * @property {string} [towerColor] - Tower mesh color hex
 * @property {string} [towerRidgeColor] - Ridge accent colour hex for carved stone highlights
 * @property {number} [rotationSpeed] - Orbiter rotation speed in rad/s
 * @property {number} [towerHeightMultiplier] - Tower height as multiplier of radius
 */
export interface TowerWorldRenderConfig {
  /** @property {'towerWorld'} renderer - Renderer discriminant */
  renderer: 'towerWorld';
  /** @property {string} [towerColor] - Tower mesh color hex */
  towerColor?: string;
  /** @property {string} [towerRidgeColor] - Ridge accent colour for stone highlights */
  towerRidgeColor?: string;
  /** @property {number} [rotationSpeed] - Orbiter rotation speed in rad/s */
  rotationSpeed?: number;
  /** @property {number} [towerHeightMultiplier] - Tower height as multiplier of radius */
  towerHeightMultiplier?: number;
}

/**
 * Asteroid belt renderer configuration.
 * @interface AsteroidBeltRenderConfig
 * @property {'asteroidBelt'} renderer - Discriminant
 * @property {number} [particleCount] - Number of particles in the belt
 * @property {number} [innerRadius] - Inner belt radius
 * @property {number} [outerRadius] - Outer belt radius
 * @property {string} [baseColor] - Particle base color hex
 * @property {number} [rotationSpeed] - Belt rotation speed in rad/s
 */
export interface AsteroidBeltRenderConfig {
  /** @property {'asteroidBelt'} renderer - Renderer discriminant */
  renderer: 'asteroidBelt';
  /** @property {number} [particleCount] - Number of particles */
  particleCount?: number;
  /** @property {number} [innerRadius] - Inner belt radius */
  innerRadius?: number;
  /** @property {number} [outerRadius] - Outer belt radius */
  outerRadius?: number;
  /** @property {string} [baseColor] - Particle base color hex */
  baseColor?: string;
  /** @property {number} [rotationSpeed] - Belt rotation speed in rad/s */
  rotationSpeed?: number;
}

/**
 * Everdark boundary renderer configuration.
 * @interface EverdarkRenderConfig
 * @property {'everdark'} renderer - Discriminant
 */
export interface EverdarkRenderConfig {
  /** @property {'everdark'} renderer - Renderer discriminant */
  renderer: 'everdark';
}

/**
 * Blood ocean world renderer configuration for Urmela.
 * Drives a two-shell architecture: an opaque dark core sphere beneath a
 * semi-transparent, vertex-displaced blood ocean shell with a corona rim.
 *
 * @interface BloodOceanRenderConfig
 * @property {'bloodOcean'} renderer - Discriminant
 * @property {string} [coreColor] - Opaque inner core colour hex
 * @property {string} [oceanColor] - Primary blood ocean colour hex
 * @property {string} [oceanHighlightColor] - Bright arterial crest highlight colour hex
 * @property {string} [coronaColor] - Corona rim and glow colour hex
 * @property {number} [rotationSpeed] - Ocean shell rotation speed in rad/s
 * @property {number} [displacementScale] - Vertex displacement amplitude for ocean surface heave
 * @property {number} [noiseScale] - Noise frequency for the ocean surface (higher = finer churn)
 * @property {number} [timeScale] - Animation speed multiplier for the boiling motion
 * @property {number} [noiseSeed] - Body-unique seed offset to de-correlate from other bodies
 * @property {number} [coreRadiusRatio] - Core sphere radius as a fraction of body radius (0–1)
 * @property {number} [oceanAlpha] - Transparency of the blood shell (0 = invisible, 1 = opaque)
 */
export interface BloodOceanRenderConfig {
  /** @property {'bloodOcean'} renderer - Renderer discriminant */
  renderer: 'bloodOcean';
  /** @property {string} [coreColor] - Opaque inner core colour hex */
  coreColor?: string;
  /** @property {string} [oceanColor] - Primary blood ocean colour hex */
  oceanColor?: string;
  /** @property {string} [oceanHighlightColor] - Bright arterial crest highlight colour hex */
  oceanHighlightColor?: string;
  /** @property {string} [coronaColor] - Corona rim and glow colour hex */
  coronaColor?: string;
  /** @property {number} [rotationSpeed] - Ocean shell rotation speed in rad/s */
  rotationSpeed?: number;
  /** @property {number} [displacementScale] - Vertex displacement amplitude */
  displacementScale?: number;
  /** @property {number} [noiseScale] - Noise frequency for the ocean surface */
  noiseScale?: number;
  /** @property {number} [timeScale] - Animation speed multiplier */
  timeScale?: number;
  /** @property {number} [noiseSeed] - Body-unique seed offset */
  noiseSeed?: number;
  /** @property {number} [coreRadiusRatio] - Core sphere radius as fraction of body radius */
  coreRadiusRatio?: number;
  /** @property {number} [oceanAlpha] - Transparency of the blood shell (0–1) */
  oceanAlpha?: number;
}

/**
 * Discriminated union of all renderer configurations.
 * The `renderer` field serves as the discriminant.
 * @typedef {StarRenderConfig | PlanetRenderConfig | GasGiantRenderConfig | RingWorldRenderConfig | TowerWorldRenderConfig | AsteroidBeltRenderConfig | EverdarkRenderConfig | BloodOceanRenderConfig} RenderConfig
 */
export type RenderConfig =
  | StarRenderConfig
  | PlanetRenderConfig
  | GasGiantRenderConfig
  | RingWorldRenderConfig
  | TowerWorldRenderConfig
  | AsteroidBeltRenderConfig
  | EverdarkRenderConfig
  | BloodOceanRenderConfig;

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
  | 'everdark'
  | 'bloodOcean';

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
 * @property {boolean} occluded - Whether another body blocks the line of sight
 * @property {number} distance - Distance from camera to world point
 * @property {number} scale - Distance-based scale factor for DOM elements
 */
export interface ProjectedPosition {
  x: number;
  y: number;
  visible: boolean;
  occluded: boolean;
  distance: number;
  scale: number;
}

/**
 * Renderer strategy interface for celestial bodies.
 * Each concrete renderer (star, planet, etc.) implements this contract.
 *
 * @interface ICelestialRenderer
 * @property {Function} createMesh - Create the Three.js Object3D for this body
 * @property {Function} update - Called each frame to animate the mesh
 * @property {Function} dispose - Clean up GPU resources
 * @property {Function} [setQualityLevel] - Optional adaptive quality hook
 */
export interface ICelestialRenderer {
  createMesh(data: CelestialBodyData | BoundaryData): Object3D;
  update(
    mesh: Object3D,
    time: number,
    deltaTime: number,
    ctx: SceneContext,
  ): void;
  dispose(mesh: Object3D): void;
  setQualityLevel?(level: RenderQualityLevel): void;
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
  resetToDefault(): void;
  setTarget(target: Vector3): void;
  setFollowTarget(positionGetter: () => Vector3): void;
  clearFollowTarget(): void;
  update(deltaTime: number): void;
  isTransitioning(): boolean;
  dispose(): void;
}

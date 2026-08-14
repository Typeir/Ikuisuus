/**
 * @fileoverview Collision cloud layer factories.
 * @description Builds the four visual layers for `CollisionCloudEffect`:
 *   debris point cloud, opaque grey core, additive outer shells, corona shell.
 *   Each factory returns a `{ geometry, material, mesh }` triple.
 *
 * @module worldSim/celestials/collisionCloudLayers
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-30
 */

import {
    AdditiveBlending,
    BackSide,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    FrontSide,
    Mesh,
    Points,
    PointsMaterial,
    ShaderMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import collisionCloudFrag from '../../shaders/collisionCloud.frag.glsl';
import collisionCloudVert from '../../shaders/collisionCloud.vert.glsl';
import collisionCoreFrag from '../../shaders/collisionCore.frag.glsl';
import collisionCoreVert from '../../shaders/collisionCore.vert.glsl';
import { CORONA_FRAG, CORONA_VERT } from '@/modules/world-sim/infrastructure/effects/collisionCoronaShaders';
import { createDisplacedShaderMaterial } from '@/modules/world-sim/infrastructure/renderers/shaderMaterialFactory';

/** @constant {number} TRIGGER_GAP_SCALE - Surface-gap threshold, as multiple of avg planet radius, that triggers the collision phase. */
export const TRIGGER_GAP_SCALE = 1.0;

/** @constant {number} CORE_RADIUS_SCALE - Opaque core radius multiplier at apex (sizeNorm=1). */
export const CORE_RADIUS_SCALE = 1.8;

/** @constant {number} DEBRIS_RADIUS_SCALE - Debris field radius multiplier at apex. */
export const DEBRIS_RADIUS_SCALE = 2.64;

/** @constant {number} CORONA_RADIUS_SCALE - Corona shell radius multiplier at apex. */
export const CORONA_RADIUS_SCALE = 3.3;

/** @constant {number} DEBRIS_COUNT - Number of debris particles. */
const DEBRIS_COUNT = 380;

/** @constant {number} DEBRIS_ROTATION_SPEED - Tumble speed of the debris field (rad/s). */
export const DEBRIS_ROTATION_SPEED = 0.0006;

/** @constant {number} CORE_BASE_DISPLACEMENT - Core shader displacement at full opacity; scales down with opacity to produce a smooth sphere as the explosion fades. */
export const CORE_BASE_DISPLACEMENT = 0.22;

/** @constant {number} APEX_TIME - Seconds from phase trigger to peak opacity. */
export const APEX_TIME = 9.0;

/** @constant {number} FADE_DURATION - Seconds from apex to fully faded. */
export const FADE_DURATION = 28.0;

/** @constant {number} CORONA_FADE_LEAD - Seconds the corona fade finishes earlier than the rest of the explosion. */
export const CORONA_FADE_LEAD = 10.0;

/** @constant {number} CORONA_FADE_DURATION - Effective fade duration applied to the corona only (always ≥ 1s). */
export const CORONA_FADE_DURATION = Math.max(
  1,
  FADE_DURATION - CORONA_FADE_LEAD,
);

/** @constant {number} NOISE_TIME_SCALE - Multiplier applied to `time` before feeding it into every shader's `uTime` uniform; raises apparent scroll speed of vertex-displacement noise across all collision-cloud layers. */
export const NOISE_TIME_SCALE = 1.5;

/** @constant {number} GROWTH_RATE - Logarithmic growth coefficient. Smaller = slower expansion. */
export const GROWTH_RATE = 0.55;

/** @constant {number} JITTER_FREQ_HZ - Jitter oscillations per second. */
export const JITTER_FREQ_HZ = 7;

/** @constant {number} JITTER_AMPLITUDE - Base jitter amplitude before clamping. */
export const JITTER_AMPLITUDE = 0.22;

/** @constant {number} JITTER_CAP - Maximum absolute jitter applied to scale (±cap). */
export const JITTER_CAP = 0.11;

/** @constant {number} ROTATION_BASE_SPIN - Constant slow spin rate of the explosion group (rad/s). */
export const ROTATION_BASE_SPIN = 0.18;

/**
 * Per-axis multipliers applied to `ROTATION_BASE_SPIN` to bias the explosion
 * group's tumble (faster on Y, slower on Z). Dimensionless scalars 0-1.
 *
 * @constant {Object} COLLISION_ROTATION_AXIS_DAMPING
 * @property {number} x - Multiplier for the X-axis spin rate
 * @property {number} y - Multiplier for the Y-axis spin rate
 * @property {number} z - Multiplier for the Z-axis spin rate
 */
export const COLLISION_ROTATION_AXIS_DAMPING = {
  x: 0.7,
  y: 1.0,
  z: 0.4,
} as const;

/**
 * Per-axis multipliers applied to `DEBRIS_ROTATION_SPEED` for the debris
 * field's idle tumble. X-axis dampened so the cloud reads as a flattened
 * disk rather than a uniform sphere.
 *
 * @constant {Object} DEBRIS_ROTATION_AXIS_DAMPING
 * @property {number} x - Multiplier for the X-axis spin rate
 * @property {number} y - Multiplier for the Y-axis spin rate
 */
export const DEBRIS_ROTATION_AXIS_DAMPING = {
  x: 0.4,
  y: 1.0,
} as const;

/** @constant {number} ROTATION_JITTER_AMPLITUDE - Peak rotation offset (radians) applied per axis at phase start. */
export const ROTATION_JITTER_AMPLITUDE = 0.35;

/** @constant {number} ROTATION_JITTER_FREQ_HZ - Base oscillation rate of the rotation jitter (Hz). Per-axis frequencies are detuned from this. */
export const ROTATION_JITTER_FREQ_HZ = 1.6;

/** @constant {number} CORE_SEGMENTS - Sphere subdivisions for the opaque core */
const CORE_SEGMENTS = 48;

/** @constant {number} SHELL_SEGMENTS - Sphere subdivisions for each outer cloud shell */
const SHELL_SEGMENTS = 32;

/** @constant {number} CORONA_SEGMENTS - Sphere subdivisions for the corona shell */
const CORONA_SEGMENTS = 32;

/**
 * @interface OuterShellConfig
 * @property {number} radiusScale - Radius multiplier (relative to avgRadius)
 * @property {number} opacity - Base opacity at peak influence
 * @property {number} displacementScale - Vertex displacement magnitude
 * @property {number} noiseOffset - Spatial offset for noise decorrelation
 * @property {number} renderOrder - Three.js sort order
 */
export interface OuterShellConfig {
  radiusScale: number;
  opacity: number;
  displacementScale: number;
  noiseOffset: number;
  renderOrder: number;
}

/**
 * Russian-doll outer shells. Each is an inverted (BackSide) additive sphere
 * with progressively larger radius, lower opacity, more displacement, and a
 * unique noise offset. `renderOrder` controls sort.
 */
export const OUTER_SHELL_CONFIGS: OuterShellConfig[] = [
  {
    radiusScale: 1.58,
    opacity: 0.55,
    displacementScale: 0.18,
    noiseOffset: 0,
    renderOrder: 1,
  },
  {
    radiusScale: 2.24,
    opacity: 0.3,
    displacementScale: 0.28,
    noiseOffset: 500,
    renderOrder: 2,
  },
  {
    radiusScale: 3.04,
    opacity: 0.15,
    displacementScale: 0.4,
    noiseOffset: 1200,
    renderOrder: 3,
  },
];

/**
 * @interface DebrisLayer
 * @property {BufferGeometry} geometry - Particle position buffer
 * @property {PointsMaterial} material - Particle material (opacity animated)
 * @property {Points} mesh - Three.js Points mesh
 */
export interface DebrisLayer {
  geometry: BufferGeometry;
  material: PointsMaterial;
  mesh: Points;
}

/**
 * @interface ShaderLayer
 * @property {SphereGeometry} geometry - Sphere geometry
 * @property {ShaderMaterial} material - Custom shader material
 * @property {Mesh} mesh - Three.js mesh
 */
export interface ShaderLayer {
  geometry: SphereGeometry;
  material: ShaderMaterial;
  mesh: Mesh;
}

/**
 * Build the debris point cloud (uniformly distributed inside a unit sphere).
 *
 * @returns {DebrisLayer} Geometry, material, and mesh
 */
export function createDebrisLayer(): DebrisLayer {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(DEBRIS_COUNT * 3);

  for (let i = 0; i < DEBRIS_COUNT; i++) {
    let x: number, y: number, z: number;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const material = new PointsMaterial({
    color: new Color('#e6ecff'),
    size: 3.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const mesh = new Points(geometry, material);
  mesh.name = 'collisionCloud-debris';
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;

  return { geometry, material, mesh };
}

/**
 * Build the opaque grey core. The only depth-writing surface in the effect;
 * acts as a z-fighting anchor for the additive shells.
 *
 * @returns {ShaderLayer} Geometry, material, and mesh
 */
export function createCoreLayer(): ShaderLayer {
  const geometry = new SphereGeometry(1, CORE_SEGMENTS, CORE_SEGMENTS);
  const material = createDisplacedShaderMaterial({
    vertexShader: collisionCoreVert,
    fragmentShader: collisionCoreFrag,
    uniforms: {
      uTime: { value: 0 },
      uNoiseScale: { value: 0.9 },
      uDisplacementScale: { value: 0.22 },
      uOpacity: { value: 1 },
      uDeepColor: { value: new Color('#05070f') },
      uMidColor: { value: new Color('#3a78ff') },
      uHighlightColor: { value: new Color('#f4f6ff') },
      uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
      uAmbient: { value: 0.32 },
    },
    materialParams: {
      transparent: true,
      depthWrite: true,
      side: FrontSide,
    },
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = 'collisionCloud-core';
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;

  return { geometry, material, mesh };
}

/**
 * Build the set of additive outer shells from `OUTER_SHELL_CONFIGS`. Each
 * uses BackSide rendering with additive blending.
 *
 * @returns {ShaderLayer[]} One shader layer per config entry
 */
export function createOuterShells(): ShaderLayer[] {
  return OUTER_SHELL_CONFIGS.map((cfg) => {
    const geometry = new SphereGeometry(1, SHELL_SEGMENTS, SHELL_SEGMENTS);
    const material = createDisplacedShaderMaterial({
      vertexShader: collisionCloudVert,
      fragmentShader: collisionCloudFrag,
      uniforms: {
        uTime: { value: 0 },
        uNoiseScale: { value: 0.8 },
        uDisplacementScale: { value: cfg.displacementScale },
        uNoiseOffset: { value: cfg.noiseOffset },
        uInnerColor: { value: new Color('#dce6ff') },
        uOuterColor: { value: new Color('#1a0840') },
        uHighlightColor: { value: new Color('#ffffff') },
        uAlpha: { value: 0 },
        uLightDir: { value: new Vector3(1, 0.5, 0.5).normalize() },
        uAmbient: { value: 0.3 },
      },
      materialParams: {
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
      },
    });

    const mesh = new Mesh(geometry, material);
    mesh.name = `collisionCloud-shell-${cfg.renderOrder}`;
    mesh.frustumCulled = false;
    mesh.renderOrder = cfg.renderOrder;

    return { geometry, material, mesh };
  });
}

/**
 * @interface CoronaLayers
 * @description Two-pass corona: a near (FrontSide) pass for the rim glow on
 *   the hemisphere facing the camera, and a far (BackSide, depthTest:false)
 *   pass for the dome halo behind the opaque core.
 * @property {SphereGeometry} geometry - Shared unit-sphere geometry
 * @property {ShaderMaterial} nearMaterial - Front-facing pass material
 * @property {Mesh} nearMesh - Front-facing pass mesh
 * @property {ShaderMaterial} farMaterial - Back-facing pass material (depthTest:false)
 * @property {Mesh} farMesh - Back-facing pass mesh
 */
export interface CoronaLayers {
  geometry: SphereGeometry;
  nearMaterial: ShaderMaterial;
  nearMesh: Mesh;
  farMaterial: ShaderMaterial;
  farMesh: Mesh;
}

/**
 * Build the outermost corona as a two-pass additive halo. The near pass uses
 * FrontSide and depth testing; the far pass uses BackSide with
 * `depthTest: false` so it renders even when occluded by the core.
 *
 * Both passes share geometry; dispose `geometry` exactly once.
 *
 * @param {number} renderOrder - Sort order for the near pass; far pass uses renderOrder+1
 * @returns {CoronaLayers} Geometry, near pass, and far pass
 */
export function createCoronaLayer(renderOrder: number): CoronaLayers {
  const geometry = new SphereGeometry(1, CORONA_SEGMENTS, CORONA_SEGMENTS);

  const nearMaterial = createDisplacedShaderMaterial({
    vertexShader: CORONA_VERT,
    fragmentShader: CORONA_FRAG,
    uniforms: {
      uColor: { value: new Color('#4a8cff') },
      uSecondaryColor: { value: new Color('#8a3cff') },
      uIntensity: { value: 0 },
      uFadeT: { value: 0 },
      uTime: { value: 0 },
      uNoiseScale: { value: 1.1 },
    },
    materialParams: {
      transparent: true,
      blending: AdditiveBlending,
      side: FrontSide,
      depthWrite: false,
    },
  });
  const nearMesh = new Mesh(geometry, nearMaterial);
  nearMesh.name = 'collisionCloud-corona-near';
  nearMesh.frustumCulled = false;
  nearMesh.renderOrder = renderOrder;

  const farMaterial = createDisplacedShaderMaterial({
    vertexShader: CORONA_VERT,
    fragmentShader: CORONA_FRAG,
    uniforms: {
      uColor: { value: new Color('#6a4cff') },
      uSecondaryColor: { value: new Color('#c084ff') },
      uIntensity: { value: 0 },
      uFadeT: { value: 0 },
      uTime: { value: 0 },
      uNoiseScale: { value: 0.9 },
    },
    materialParams: {
      transparent: true,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
    },
  });
  const farMesh = new Mesh(geometry, farMaterial);
  farMesh.name = 'collisionCloud-corona-far';
  farMesh.frustumCulled = false;
  farMesh.renderOrder = renderOrder + 1;

  return { geometry, nearMaterial, nearMesh, farMaterial, farMesh };
}

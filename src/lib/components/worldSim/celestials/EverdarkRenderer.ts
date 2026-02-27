/**
 * @fileoverview Everdark Renderer — Multi-Layer Boundary Shell with Fire Effect
 * @description Renders the Everdark as multiple concentric inverted spheres at
 * different depths, each with independently tuned noise parameters and opacity.
 * More opaque (outer) layers use larger, smoother flame blotches; less opaque
 * (inner) layers use finer, more jagged detail — creating parallax depth.
 * Uses GLSL shaders imported from external .glsl files.
 *
 * @module worldSim/celestials/EverdarkRenderer
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  AdditiveBlending,
  BackSide,
  Mesh,
  NormalBlending,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import everdarkFrag from '../shaders/everdark.frag.glsl';
import everdarkVert from '../shaders/everdark.vert.glsl';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  SceneContext,
} from './interfaces';

/**
 * Self-contained configuration for a single Everdark shell layer.
 * All values are absolute — no multipliers against a shared base.
 *
 * @interface EverdarkLayerConfig
 * @property {number} radiusScale - Fraction of the boundary radius for this shell
 * @property {number} opacity - Base opacity for this layer (before rim attenuation)
 * @property {number} flameScale - Noise sampling frequency (lower = bigger blotches)
 * @property {number} flameSpeed - Vertical drift speed for flame animation
 * @property {number} jaggedScale - Fine-noise sampling frequency for edge breakup
 * @property {number} jaggedStrength - How much the fine noise displaces edge thresholds
 * @property {number} edgeWidth - Smoothstep width for edge detection bands
 * @property {number} noiseOffset - Spatial offset to de-correlate layers
 * @property {number} segments - Sphere geometry resolution
 */
interface EverdarkLayerConfig {
  /** @property {number} radiusScale - Shell radius as fraction of boundary radius */
  radiusScale: number;
  /** @property {number} opacity - Absolute base opacity for the shader */
  opacity: number;
  /** @property {boolean} opaqueBlack - Use NormalBlending for opaque black body (outer layer only) */
  opaqueBlack: boolean;
  /** @property {number} flameScale - Noise frequency (lower = bigger features) */
  flameScale: number;
  /** @property {number} flameSpeed - Vertical drift speed */
  flameSpeed: number;
  /** @property {number} jaggedScale - Fine-noise frequency for jagged edges */
  jaggedScale: number;
  /** @property {number} jaggedStrength - Edge displacement magnitude */
  jaggedStrength: number;
  /** @property {number} edgeWidth - Width of the smoothstep edge band */
  edgeWidth: number;
  /** @property {number} noiseOffset - Spatial offset for layer de-correlation */
  noiseOffset: number;
  /** @property {number} segments - Sphere geometry segment count */
  segments: number;
}

/**
 * Layer definitions from outermost to innermost.
 *
 * Design intent:
 * - Outer (most opaque): large, smooth flame shapes — the dominant silhouette
 * - Middle: medium detail, moderate jaggedness — transitional depth
 * - Inner (least opaque): fine, jagged detail — subtle texture fill
 *
 * @constant {EverdarkLayerConfig[]}
 */
const LAYER_CONFIGS: EverdarkLayerConfig[] = [
  {
    radiusScale: 1.0,
    opacity: 0.85,
    opaqueBlack: true,
    flameScale: 0.00008,
    flameSpeed: 0.06,
    jaggedScale: 0.002,
    jaggedStrength: 0.12,
    edgeWidth: 0.1,
    noiseOffset: 0,
    segments: 64,
  },
  {
    radiusScale: 0.97,
    opacity: 0.65,
    opaqueBlack: true,
    flameScale: 0.0002,
    flameSpeed: 0.05,
    jaggedScale: 0.006,
    jaggedStrength: 0.22,
    edgeWidth: 0.08,
    noiseOffset: 500,
    segments: 48,
  },
  {
    radiusScale: 0.93,
    opacity: 0.05,
    opaqueBlack: false,
    flameScale: 0.00045,
    flameSpeed: 0.04,
    jaggedScale: 0.012,
    jaggedStrength: 0.35,
    edgeWidth: 0.06,
    noiseOffset: 1200,
    segments: 32,
  },
];

/**
 * Create a ShaderMaterial for one Everdark shell layer.
 *
 * @function createLayerMaterial
 * @param {EverdarkLayerConfig} layer - Layer-specific shader parameters
 * @returns {ShaderMaterial} Configured fire-wall material
 */
function createLayerMaterial(layer: EverdarkLayerConfig): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: everdarkVert,
    fragmentShader: everdarkFrag,
    uniforms: {
      uTime: { value: 0 },
      uFlameSpeed: { value: layer.flameSpeed },
      uFlameScale: { value: layer.flameScale },
      uEdgeWidth: { value: layer.edgeWidth },
      uBaseOpacity: { value: layer.opacity },
      uJaggedScale: { value: layer.jaggedScale },
      uJaggedStrength: { value: layer.jaggedStrength },
    },
    transparent: true,
    blending: layer.opaqueBlack ? NormalBlending : AdditiveBlending,
    side: BackSide,
    depthWrite: layer.opaqueBlack,
  });
}

/**
 * Renders the Everdark boundary as multiple concentric inverted spheres with
 * layered fire shaders. Each layer has independently tuned noise parameters
 * for a volumetric parallax effect.
 *
 * @class EverdarkRenderer
 * @implements {ICelestialRenderer}
 */
export class EverdarkRenderer implements ICelestialRenderer {
  /** @property {ShaderMaterial[]} materials - All layer materials for time updates */
  private materials: ShaderMaterial[] = [];

  /**
   * Create the multi-layer Everdark boundary.
   *
   * @param {CelestialBodyData | BoundaryData} data - Boundary definition data
   * @returns {Object3D} Group containing all shell layers
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `everdark-${data.id}`;

    for (let i = 0; i < LAYER_CONFIGS.length; i++) {
      const layer = LAYER_CONFIGS[i];
      const geometry = new SphereGeometry(
        data.radius * layer.radiusScale,
        layer.segments,
        layer.segments,
      );

      const material = createLayerMaterial(layer);

      const shell = new Mesh(geometry, material);
      shell.name = `everdark-shell-${i}`;

      if (layer.noiseOffset !== 0) {
        shell.position.y = layer.noiseOffset * 0.001;
      }

      group.add(shell);
      this.materials.push(material);
    }

    return group;
  }

  /**
   * Update the time uniform for the fire animation on all layers.
   *
   * @param {Object3D} _mesh - The Everdark group
   * @param {number} time - Elapsed time in seconds
   * @param {number} _deltaTime - Frame delta
   */
  update(
    _mesh: Object3D,
    time: number,
    _deltaTime: number,
    _ctx: SceneContext,
  ): void {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].uniforms.uTime.value = time;
    }
  }

  /**
   * Dispose of all Everdark layer resources.
   *
   * @param {Object3D} mesh - The Everdark group
   */
  dispose(mesh: Object3D): void {
    mesh.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        (child.geometry as SphereGeometry).dispose();
      }
      if ('material' in child && child.material) {
        const childMaterials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of childMaterials) {
          mat.dispose();
        }
      }
    });
    this.materials = [];
  }

  /**
   * Get LOD distance thresholds.
   *
   * @returns {{ near: number; far: number }} LOD thresholds
   */
  getLODDistance(): { near: number; far: number } {
    return { near: 200, far: 2000 };
  }
}

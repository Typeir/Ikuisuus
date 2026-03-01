/**
 * @fileoverview Star Renderer — Turbulent Solar Surface with Corona Effect
 * @description Renders Kultharja as a displaced sphere with turbulent noise-driven
 * vertex displacement mapped to a hot colour gradient, plus a corona glow sprite
 * and ring. Uses GLSL shaders for the convective photosphere look.
 *
 * @module worldSim/celestials/StarRenderer
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    Color,
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    RingGeometry,
    ShaderMaterial,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
} from 'three';
import type { RenderQualityLevel } from '../optimization/AdaptivePerformanceController';
import {
    createSphereLODSet,
    disposeSphereLODSet,
    STAR_RING_SEGMENTS,
    type SphereLODSet,
} from '../optimization/GeometryBudgets';
import noise3d from '../shaders/noise3d.glsl';
import starFrag from '../shaders/star.frag.glsl';
import starVert from '../shaders/star.vert.glsl';
import { createRadialGradientTexture } from './CelestialGlow';
import { disposeSceneGraph } from './disposeUtils';
import type {
    BoundaryData,
    CelestialBodyData,
    ICelestialRenderer,
    SceneContext,
    StarRenderConfig,
} from './interfaces';

/** @constant {number} CORONA_SCALE - Scale multiplier for the corona sprite relative to body radius */
const CORONA_SCALE = 6.0;

/** @constant {number} PULSE_SPEED - Speed of the corona pulsation animation */
const PULSE_SPEED = 0.5;

/** @constant {number} PULSE_AMPLITUDE - Amplitude of the corona pulsation */
const PULSE_AMPLITUDE = 0.15;

/** @constant {number} GLOW_TEXTURE_SIZE - Resolution of the procedural glow texture */
const GLOW_TEXTURE_SIZE = 256;

/** @constant {number} DEFAULT_DISPLACEMENT_SCALE - Default vertex displacement amplitude for the star surface */
const DEFAULT_DISPLACEMENT_SCALE = 12;

/** @constant {Record<RenderQualityLevel, number>} QUALITY_TO_DETAIL - Quality-to-shader detail mapping */
const QUALITY_TO_DETAIL: Record<RenderQualityLevel, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

/**
 * Gradient stops for the star corona glow texture.
 * Brighter center with smooth falloff for a hot emissive look.
 * @constant {import('./CelestialGlow').GradientStop[]}
 */
const CORONA_GLOW_STOPS = [
  { offset: 0, color: 'rgba(255, 255, 255, 1.0)' },
  { offset: 0.2, color: 'rgba(255, 255, 255, 0.8)' },
  { offset: 0.5, color: 'rgba(255, 255, 255, 0.3)' },
  { offset: 0.8, color: 'rgba(255, 255, 255, 0.05)' },
  { offset: 1.0, color: 'rgba(255, 255, 255, 0.0)' },
];

/**
 * Renders a star body with noise-displaced surface, hot colour gradient, and corona glow.
 *
 * @class StarRenderer
 * @implements {ICelestialRenderer}
 */
export class StarRenderer implements ICelestialRenderer {
  /** @property {Mesh | null} coreMesh - The star's solid sphere mesh */
  private coreMesh: Mesh | null = null;

  /** @property {Sprite | null} coronaSprite - The glow sprite around the star */
  private coronaSprite: Sprite | null = null;

  /** @property {Mesh | null} ringMesh - The corona ring mesh (billboarded toward camera) */
  private ringMesh: Mesh | null = null;

  /** @property {ShaderMaterial | null} surfaceMaterial - ShaderMaterial with noise displacement */
  private surfaceMaterial: ShaderMaterial | null = null;

  /** @property {SphereLODSet | null} coreLOD - Pre-built sphere geometries at three LOD tiers */
  private coreLOD: SphereLODSet | null = null;

  /** @property {RenderQualityLevel} qualityLevel - Current adaptive quality level */
  private qualityLevel: RenderQualityLevel = 'high';

  /**
   * Apply adaptive quality level to shader detail and secondary effects.
   *
   * @param {RenderQualityLevel} level - New quality level
   */
  setQualityLevel(level: RenderQualityLevel): void {
    this.qualityLevel = level;

    if (this.surfaceMaterial) {
      this.surfaceMaterial.uniforms.uDetailLevel.value =
        QUALITY_TO_DETAIL[level];
    }

    if (this.coreMesh && this.coreLOD) {
      this.coreMesh.geometry = this.coreLOD[level];
    }
  }

  /**
   * Create the star mesh group with noise-displaced surface and corona sprite.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the star sphere and corona
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `star-${data.id}`;

    const config = data.renderConfig as StarRenderConfig;
    const emissiveColor = new Color(
      (config.emissiveColor as string) ?? '#ffcc44',
    );
    const coronaColor = new Color((config.coronaColor as string) ?? '#ff8800');
    const displacementScale =
      (config.displacementScale as number) ?? DEFAULT_DISPLACEMENT_SCALE;

    this.coreLOD = createSphereLODSet(data.radius);
    const coreGeometry = this.coreLOD[this.qualityLevel];
    this.surfaceMaterial = new ShaderMaterial({
      vertexShader: noise3d + '\n' + starVert,
      fragmentShader: starFrag,
      uniforms: {
        uTime: { value: 0 },
        uDisplacementScale: { value: displacementScale },
        uDetailLevel: { value: QUALITY_TO_DETAIL[this.qualityLevel] },
        uEmissiveColor: { value: emissiveColor },
        uCoronaColor: { value: coronaColor },
      },
    });
    this.coreMesh = new Mesh(coreGeometry, this.surfaceMaterial);
    this.coreMesh.name = 'star-core';
    this.coreMesh.frustumCulled = true;
    group.add(this.coreMesh);

    const coronaMaterial = new SpriteMaterial({
      map: createRadialGradientTexture(GLOW_TEXTURE_SIZE, CORONA_GLOW_STOPS),
      color: coronaColor,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.coronaSprite = new Sprite(coronaMaterial);
    this.coronaSprite.scale.setScalar(data.radius * CORONA_SCALE);
    this.coronaSprite.name = 'star-corona';
    this.coronaSprite.frustumCulled = true;
    group.add(this.coronaSprite);

    const ringGeometry = new RingGeometry(
      data.radius * 1.05,
      data.radius * 1.2,
      STAR_RING_SEGMENTS,
    );
    const ringMaterial = new MeshBasicMaterial({
      color: coronaColor,
      transparent: true,
      opacity: 0.35,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.name = 'star-ring';
    ring.frustumCulled = true;
    this.ringMesh = ring;
    group.add(ring);

    this.setQualityLevel(this.qualityLevel);

    return group;
  }

  /**
   * Animate the solar surface displacement and corona pulsation each frame.
   *
   * @param {Object3D} _mesh - The star group (unused, using internal refs)
   * @param {number} time - Elapsed time in seconds
   * @param {number} _deltaTime - Frame delta (unused)
   * @param {SceneContext} ctx - Scene context with camera reference
   */
  update(
    _mesh: Object3D,
    time: number,
    _deltaTime: number,
    ctx: SceneContext,
  ): void {
    if (this.surfaceMaterial) {
      this.surfaceMaterial.uniforms.uTime.value = time;
    }

    if (this.coronaSprite && this.coronaSprite.visible) {
      const pulse = 1 + Math.sin(time * PULSE_SPEED) * PULSE_AMPLITUDE;
      const radius = this.coreMesh
        ? (this.coreMesh.geometry as SphereGeometry).parameters.radius
        : 1;
      this.coronaSprite.scale.setScalar(radius * CORONA_SCALE * pulse);
    }

    if (this.ringMesh) {
      this.ringMesh.quaternion.copy(ctx.camera.quaternion);
    }
  }

  /**
   * Dispose of star resources.
   *
   * @param {Object3D} mesh - The star group
   */
  dispose(mesh: Object3D): void {
    disposeSceneGraph(mesh);
    disposeSphereLODSet(this.coreLOD);
    this.coreLOD = null;
  }
}

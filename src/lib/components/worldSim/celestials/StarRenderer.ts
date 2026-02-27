/**
 * @fileoverview Star Renderer — Emissive Sphere with Corona Effect
 * @description Renders Kultharja as a bright emissive sphere with a glowing corona
 * halo effect. Uses additive blending for the outer glow sprite.
 *
 * @module worldSim/celestials/StarRenderer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
} from 'three';
import type {
  BoundaryData,
  CelestialBodyData,
  ICelestialRenderer,
  SceneContext,
} from './interfaces';

/** @constant {number} CORONA_SCALE - Scale multiplier for the corona sprite relative to body radius */
const CORONA_SCALE = 6.0;

/** @constant {number} PULSE_SPEED - Speed of the corona pulsation animation */
const PULSE_SPEED = 0.5;

/** @constant {number} PULSE_AMPLITUDE - Amplitude of the corona pulsation */
const PULSE_AMPLITUDE = 0.15;

/** @constant {number} GLOW_TEXTURE_SIZE - Resolution of the procedural glow texture */
const GLOW_TEXTURE_SIZE = 256;

/**
 * Generate a radial gradient canvas texture for a soft round glow.
 * Draws a circle from opaque center to fully transparent edge.
 *
 * @param {number} size - Texture resolution (square)
 * @returns {CanvasTexture} Round radial gradient texture
 */
function createGlowTexture(size: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new CanvasTexture(canvas);
}

/**
 * Renders a star body with emissive material and corona glow effect.
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

  /**
   * Create the star mesh group with emissive sphere and corona sprite.
   *
   * @param {CelestialBodyData | BoundaryData} data - Body definition data
   * @returns {Object3D} Group containing the star sphere and corona
   */
  createMesh(data: CelestialBodyData | BoundaryData): Object3D {
    const group = new Object3D();
    group.name = `star-${data.id}`;

    const config = data.renderConfig;
    const emissiveColor = new Color(
      (config.emissiveColor as string) ?? '#ffcc44',
    );
    const coronaColor = new Color((config.coronaColor as string) ?? '#ff8800');

    const coreGeometry = new SphereGeometry(data.radius, 32, 32);
    const coreMaterial = new MeshBasicMaterial({
      color: emissiveColor,
    });
    this.coreMesh = new Mesh(coreGeometry, coreMaterial);
    this.coreMesh.name = 'star-core';
    group.add(this.coreMesh);

    const coronaMaterial = new SpriteMaterial({
      map: createGlowTexture(GLOW_TEXTURE_SIZE),
      color: coronaColor,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.coronaSprite = new Sprite(coronaMaterial);
    this.coronaSprite.scale.setScalar(data.radius * CORONA_SCALE);
    this.coronaSprite.name = 'star-corona';
    group.add(this.coronaSprite);

    const ringGeometry = new RingGeometry(
      data.radius * 1.05,
      data.radius * 1.2,
      64,
    );
    const ringMaterial = new MeshBasicMaterial({
      color: coronaColor,
      transparent: true,
      opacity: 0.35,
      side: 2,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.name = 'star-ring';
    this.ringMesh = ring;
    group.add(ring);

    return group;
  }

  /**
   * Animate the corona pulsation each frame.
   *
   * @param {Object3D} _mesh - The star group (unused, using internal refs)
   * @param {number} time - Elapsed time in seconds
   * @param {number} _deltaTime - Frame delta (unused)
   */
  update(
    _mesh: Object3D,
    time: number,
    _deltaTime: number,
    ctx: SceneContext,
  ): void {
    if (this.coronaSprite) {
      const pulse = 1 + Math.sin(time * PULSE_SPEED) * PULSE_AMPLITUDE;
      const radius = this.coreMesh
        ? (this.coreMesh.geometry as SphereGeometry).parameters.radius
        : 1;
      this.coronaSprite.scale.setScalar(radius * CORONA_SCALE * pulse);
    }

    if (this.ringMesh) {
      this.ringMesh.lookAt(ctx.camera.position);
    }
  }

  /**
   * Dispose of star resources.
   *
   * @param {Object3D} mesh - The star group
   */
  dispose(mesh: Object3D): void {
    mesh.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        (child.geometry as SphereGeometry).dispose();
      }
      if ('material' in child && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of materials) {
          mat.dispose();
        }
      }
    });
  }

  /**
   * Get LOD distance thresholds.
   *
   * @returns {{ near: number; far: number }} LOD thresholds
   */
  getLODDistance(): { near: number; far: number } {
    return { near: 100, far: 800 };
  }
}

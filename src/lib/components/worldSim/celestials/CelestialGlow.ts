/**
 * @fileoverview Celestial Glow — Shared Radial Glow Sprite Factory
 * @description Creates a soft additive-blended glow sprite that can be attached to
 * any celestial body. Uses a procedural radial gradient CanvasTexture so no image
 * assets are needed. The texture is cached and shared across all instances.
 *
 * @module worldSim/celestials/CelestialGlow
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    AdditiveBlending,
    CanvasTexture,
    Color,
    Sprite,
    SpriteMaterial,
} from 'three';

/** @constant {number} GLOW_TEXTURE_SIZE - Resolution of the procedural glow texture */
const GLOW_TEXTURE_SIZE = 128;

/** @constant {number} DEFAULT_GLOW_SCALE - Default glow sprite scale relative to body radius */
const DEFAULT_GLOW_SCALE = 3.0;

/** @constant {number} DEFAULT_GLOW_OPACITY - Default glow opacity (subtler than star corona) */
const DEFAULT_GLOW_OPACITY = 0.18;

/** @type {CanvasTexture | null} Cached glow texture shared by all instances */
let cachedGlowTexture: CanvasTexture | null = null;

/**
 * Create or return the cached radial gradient glow texture.
 * The texture is a white radial gradient from opaque center to transparent edge.
 *
 * @returns {CanvasTexture} Shared glow texture
 */
function getGlowTexture(): CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = GLOW_TEXTURE_SIZE;
  canvas.height = GLOW_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;

  const half = GLOW_TEXTURE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);

  cachedGlowTexture = new CanvasTexture(canvas);
  return cachedGlowTexture;
}

/**
 * Create a glow sprite for a celestial body. The sprite uses additive blending
 * so it brightens whatever is behind it, giving a soft halo effect.
 *
 * @function createCelestialGlow
 * @param {number} radius - Body radius in scene units (used to scale the sprite)
 * @param {Color | string} color - Glow tint color
 * @param {number} [scale] - Glow scale multiplier relative to radius (default: 3.0)
 * @param {number} [opacity] - Glow opacity (default: 0.18)
 * @returns {Sprite} Configured glow sprite ready to add to a group
 */
export function createCelestialGlow(
  radius: number,
  color: Color | string,
  scale: number = DEFAULT_GLOW_SCALE,
  opacity: number = DEFAULT_GLOW_OPACITY,
): Sprite {
  const glowColor = color instanceof Color ? color : new Color(color);

  const material = new SpriteMaterial({
    map: getGlowTexture(),
    color: glowColor,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const sprite = new Sprite(material);
  sprite.scale.setScalar(radius * scale);
  sprite.name = 'celestial-glow';

  return sprite;
}

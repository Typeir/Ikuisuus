/**
 * @fileoverview Inline GLSL for the collision-cloud corona.
 * @description Extracted from `collisionCloudLayers.ts` so that file stays
 *   under the max-file-length gate. The corona uses its own shaders (instead
 *   of the shared `atmosphere.*.glsl`) because it needs per-fragment noise
 *   sampling to break up the uniform halo tint and an inward fade so the
 *   outermost silhouette dissipates first.
 *
 * @module worldSim/celestials/collisionCoronaShaders
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-30
 */

/**
 * Vertex shader for the collision corona. Passes view-space normal (for the
 * rim/Fresnel term) and a multi-octave simplex-noise sample of local
 * position so the fragment stage can break up the otherwise uniformly
 * tinted halo. `noise3d.glsl` is prepended at runtime.
 */
export const CORONA_VERT = `
uniform float uTime;
uniform float uNoiseScale;

varying vec3 vNormal;
varying float vNoise;

void main() {
  vec3 coord = position * uNoiseScale;
  float n1 = snoise(coord + vec3(uTime * 0.35, uTime * 0.12, 0.0));
  float n2 = snoise(coord * 2.30 + vec3(uTime * 0.55, 0.0, uTime * 0.25)) * 0.55;
  float n3 = snoise(coord * 4.70 + vec3(0.0, uTime * 0.45, uTime * 0.65)) * 0.30;
  vNoise = n1 + n2 + n3;

  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Fragment shader for the collision corona. Atmosphere-style rim (Fresnel)
 * term, but mixes between primary and secondary colours by noise and
 * modulates alpha by noise so the halo reads as lightning-veined plasma
 * instead of a uniform tint. `uFadeT` drives an inward fade: the outer rim
 * attenuates first, so as `uFadeT` approaches 1 the corona collapses
 * inward.
 */
export const CORONA_FRAG = `
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uIntensity;
uniform float uFadeT;

varying vec3 vNormal;
varying float vNoise;

void main() {
  float rimRaw  = pow(max(0.0, 0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  float rimNorm = clamp(rimRaw / 0.49, 0.0, 1.0);

  float t = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);

  vec3 color       = mix(uColor, uSecondaryColor, smoothstep(0.25, 0.85, t));
  float noiseAlpha = mix(0.55, 1.20, smoothstep(0.10, 0.95, t));

  float fadeMask = clamp(1.0 - uFadeT * rimNorm, 0.0, 1.0);

  float alpha = rimRaw * uIntensity * noiseAlpha * fadeMask;
  gl_FragColor = vec4(color, alpha);
}
`;

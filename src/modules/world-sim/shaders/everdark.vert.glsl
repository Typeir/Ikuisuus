/**
 * Vertex shader for the Everdark fire wall effect.
 * Applies noise-driven radial displacement so the shell surface undulates
 * instead of being a perfect sphere. Passes world-space position and
 * view direction to the fragment shader for 3D noise sampling and rim-based
 * intensity.
 */

uniform float uTime;
uniform float uFlameSpeed;
uniform float uFlameScale;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

/* noise3d.glsl is prepended at build time by EverdarkRenderer */
/** @constant {float} DISPLACEMENT_STRENGTH - Radial displacement magnitude */
const float DISPLACEMENT_STRENGTH = 180.0;

/** @constant {float} DISPLACEMENT_SCALE - Noise sampling frequency for displacement */
const float DISPLACEMENT_SCALE = 0.0018;

void main() {
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

  /* Sample noise at two octaves for organic undulation */
  vec3 noiseCoord = worldPos * DISPLACEMENT_SCALE;
  noiseCoord.y -= uTime * uFlameSpeed * 0.4;

  float disp = snoise(noiseCoord) * 0.6
             + snoise(noiseCoord * 2.3 + vec3(5.2, 1.3, 2.8)) * 0.4;

  /* Displace along the normal direction (outward/inward from sphere center) */
  vec3 displaced = position + normal * disp * DISPLACEMENT_STRENGTH;

  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}

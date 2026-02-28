/**
 * Vertex shader for gas giant cloud layers.
 * Simple pass-through — all cloud pattern computation happens in the
 * fragment shader using world-space coordinates, avoiding vertex
 * displacement jitter at large viewing distances.
 * noise3d.glsl is prepended at build time by GasGiantRenderer.
 */

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

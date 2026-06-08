/**
 * Vertex shader for the planet atmosphere glow effect.
 * Passes the transformed normal to the fragment shader for rim-lighting.
 */

varying vec3 vNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

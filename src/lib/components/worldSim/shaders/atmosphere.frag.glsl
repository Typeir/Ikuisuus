/**
 * Fragment shader for the planet atmosphere glow effect.
 * Computes rim-based intensity from the view-space normal for a soft
 * atmosphere halo around planetary bodies.
 */

uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;

void main() {
  float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0) * uIntensity;
  gl_FragColor = vec4(uColor, intensity);
}

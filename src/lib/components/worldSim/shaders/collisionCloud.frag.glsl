/**
 * Fragment shader for the Länsihenki × Itähenki collision cloud effect —
 * uses the vNoise varying from the vertex shader to carve transparent holes
 * in the cloud (patchiness) and ramp the colour from deep red-orange in the
 * cooler voids to a hot white-yellow at the densest billows. The uAlpha
 * uniform is driven to 0→1 by the proximity influence, so the entire cloud
 * fades in and out as the bodies approach and separate.
 */

uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uAlpha;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying float vNoise;

void main() {
  /* Remap composite noise -1..1 → 0..1 */
  float t = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);

  /* Patchiness: low-noise areas become transparent holes in the cloud.
     smoothstep range controls how "solid vs wispy" the cloud reads. */
  float patchiness = smoothstep(0.08, 0.58, t);

  /* Colour ramp: hotter and brighter at dense billows, deep and dark at voids */
  vec3 color = mix(uOuterColor, uInnerColor, patchiness);

  /* Diffuse + ambient (same pattern as gasGiant / bloodOcean) */
  float diff  = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + diff * (1.0 - uAmbient);
  color *= light;

  /* Alpha combines global influence fade (uAlpha) with per-fragment patchiness */
  gl_FragColor = vec4(color, uAlpha * patchiness);
}

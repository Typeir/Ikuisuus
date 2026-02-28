/**
 * Fragment shader for terrestrial planet surfaces — colour-maps the
 * composite elevation mask from the vertex shader into up to 5 terrain
 * bands and optionally overlays polar ice caps.
 *
 * Two-tier noise in the vertex shader provides large continents + local
 * detail.  This shader turns that elevation into biome colours:
 *   band 0 = deep ocean / lowest terrain
 *   band 1 = lowland / shore
 *   band 2 = midland
 *   band 3 = highlands
 *   band 4 = peaks
 *
 * Polar ice is derived from `vLatitude` (object-normal Y, UV-free) so it
 * stays stable at the poles without UV-stretch artefacts.
 */

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform float uThreshold01;
uniform float uThreshold12;
uniform float uThreshold23;
uniform float uThreshold34;

uniform vec3  uLightDir;
uniform float uAmbient;

uniform float uPolarIce;
uniform float uPolarLatitude;
uniform vec3  uIceColor;

varying vec3  vNormal;
varying vec3  vWorldPosition;
varying float vElevation;
varying float vLatitude;

void main() {
  /* Remap elevation roughly -1..1 → 0..1 */
  float e = clamp(vElevation + 0.5, 0.0, 1.0);

  /* 5-band colour ramp via smoothstep interpolation */
  vec3 color = uColor0;
  color = mix(color, uColor1, smoothstep(uThreshold01 - 0.04, uThreshold01 + 0.04, e));
  color = mix(color, uColor2, smoothstep(uThreshold12 - 0.04, uThreshold12 + 0.04, e));
  color = mix(color, uColor3, smoothstep(uThreshold23 - 0.04, uThreshold23 + 0.04, e));
  color = mix(color, uColor4, smoothstep(uThreshold34 - 0.04, uThreshold34 + 0.04, e));

  /**
   * Polar ice caps — blend to ice colour near the poles.
   * `vLatitude` is the object-normal Y (-1 south pole, +1 north pole).
   * `uPolarLatitude` is the cosine threshold (e.g. 0.75 = ~41 deg from pole).
   * Higher terrain freezes sooner (ice reaches further from the poles).
   */
  if (uPolarIce > 0.5) {
    float absLat       = abs(vLatitude);
    float iceElevBoost = smoothstep(0.45, 0.75, e) * 0.12;
    float iceBlend     = smoothstep(uPolarLatitude - 0.08, uPolarLatitude + 0.08, absLat + iceElevBoost);
    color              = mix(color, uIceColor, iceBlend);
  }

  /* Simple diffuse lighting from the star direction */
  float diff  = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + (1.0 - uAmbient) * diff;

  gl_FragColor = vec4(color * light, 1.0);
}

/**
 * Fragment shader for ring world torus rings.
 * Maps elevation noise to a crystalline colour palette with
 * subtle vein-like detail and diffuse lighting.
 */

uniform vec3 uBaseColor;
uniform vec3 uVeinColor;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
  float e = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);

  /* Two-tone ramp with crystalline veins at mid-range */
  vec3 color = uBaseColor;
  float veinMask = smoothstep(0.4, 0.5, e) * (1.0 - smoothstep(0.5, 0.6, e));
  color = mix(color, uVeinColor, veinMask * 0.8);

  /* Brighten peaks, darken valleys */
  color *= 0.7 + e * 0.6;

  /* Simple diffuse lighting */
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + (1.0 - uAmbient) * diff;

  gl_FragColor = vec4(color * light, 1.0);
}

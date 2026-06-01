/**
 * Fragment shader for icy celestial cores (Mana).
 * Maps elevation mask to an icy colour palette: deep blue → ice blue → white frost.
 * Adds subtle diffuse from a distant light source.
 */

uniform vec3 uDeepColor;
uniform vec3 uIceColor;
uniform vec3 uFrostColor;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
  float e = clamp(vElevation, 0.0, 1.0);

  /* 3-band icy ramp: deep cavities → ice surface → frost peaks */
  vec3 color = uDeepColor;
  color = mix(color, uIceColor, smoothstep(0.2, 0.45, e));
  color = mix(color, uFrostColor, smoothstep(0.55, 0.8, e));

  /* Subtle emissive glow on ice surface */
  float glow = smoothstep(0.3, 0.6, e) * 0.15;
  color += vec3(0.4, 0.7, 1.0) * glow;

  /* Simple diffuse lighting */
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + (1.0 - uAmbient) * diff;

  gl_FragColor = vec4(color * light, 1.0);
}

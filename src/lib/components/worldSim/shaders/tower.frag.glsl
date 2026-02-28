/**
 * Fragment shader for tower world cylinder segments.
 * Maps elevation noise to an ancient bone-stone colour palette with
 * vertical weathering lines and diffuse lighting.
 */

uniform vec3 uBaseColor;
uniform vec3 uRidgeColor;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vHeight;

void main() {
  float e = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);

  /* Base to ridge colour ramp with carved stone look */
  vec3 color = mix(uBaseColor * 0.8, uBaseColor, smoothstep(0.3, 0.5, e));
  color = mix(color, uRidgeColor, smoothstep(0.6, 0.8, e));

  /* Darken lower portions, lighten upper for vertical gradient */
  color *= 0.85 + vHeight * 0.3;

  /* Emissive glow in deep crevices */
  float crevice = 1.0 - smoothstep(0.0, 0.3, e);
  color += uRidgeColor * crevice * 0.15;

  /* Simple diffuse lighting */
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + (1.0 - uAmbient) * diff;

  gl_FragColor = vec4(color * light, 1.0);
}

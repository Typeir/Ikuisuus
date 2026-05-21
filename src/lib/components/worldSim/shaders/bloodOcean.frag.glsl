/**
 * Fragment shader for Urmela's blood ocean surface — maps the noise value
 * from the vertex shader to a three-stop colour ramp (dark coagulated blood →
 * deep crimson → bright arterial crest) with diffuse lighting. The constant
 * alpha keeps the shell semi-transparent so the opaque dark core beneath
 * remains visible through the churning surface.
 */

uniform vec3 uOceanColor;
uniform vec3 uOceanHighlight;
uniform float uOceanAlpha;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying float vNoise;

void main() {
  /* Remap composite noise -1..1 → 0..1 */
  float t = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);

  /* Three-stop colour ramp driven by surface noise:
     low  → dark coagulated blood (shadowed troughs)
     mid  → deep primary blood red (main ocean body)
     high → bright arterial crest (boiling peaks) */
  vec3 dark  = uOceanColor * 0.25;
  vec3 color = mix(dark, uOceanColor, smoothstep(0.15, 0.50, t));
  color      = mix(color, uOceanHighlight, smoothstep(0.55, 0.82, t));

  /* Extra crest flare: at the very peaks, blow the highlight past its base
     value toward a washed-out arterial white for maximum boiling intensity. */
  float crestBlend = smoothstep(0.80, 0.97, t);
  color = mix(color, uOceanHighlight * 1.5, crestBlend);

  /* Diffuse + ambient lighting (same pattern as gasGiant.frag.glsl) */
  float diff  = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + diff * (1.0 - uAmbient);
  color *= light;

  /* Slightly more opaque at boiling crests so peaks press forward visually */
  float highlightBlend = smoothstep(0.55, 0.82, t);
  float alpha = uOceanAlpha + highlightBlend * 0.14;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}

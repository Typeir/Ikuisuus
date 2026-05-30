/**
 * Fragment shader for the Länsihenki × Itähenki collision opaque core —
 * dark electric body whose high-displacement ridges flare white like
 * lightning fronts. A three-stop ramp (deep → electric mid → white peak)
 * driven by the same vertex-stage noise that displaces the surface keeps
 * the white pops perfectly registered to the spiking geometry.
 */

uniform vec3 uDeepColor;
uniform vec3 uMidColor;
uniform vec3 uHighlightColor;
uniform vec3 uLightDir;
uniform float uAmbient;
uniform float uOpacity;

varying vec3 vNormal;
varying float vNoise;

void main() {
  /* Remap composite noise -1..1 → 0..1 */
  float t = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);

  /* Two-stop ramp: low band stays very dark (almost black with blue tint),
     mid band lifts to electric blue, and only the highest displacement
     ridges (>0.78) flash to near-white. Narrow upper window keeps the
     white reading as discrete lightning crests, not a uniform glow. */
  vec3 base = mix(uDeepColor, uMidColor, smoothstep(0.30, 0.70, t));
  vec3 color = mix(base, uHighlightColor, smoothstep(0.78, 0.96, t));

  /* Diffuse + ambient */
  float diff  = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + diff * (1.0 - uAmbient);
  color *= light;

  gl_FragColor = vec4(color, uOpacity);
}

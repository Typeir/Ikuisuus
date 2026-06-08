/**
 * Fragment shader for the Länsihenki × Itähenki collision cloud effect —
 * dust-cloud sibling of the opaque core. Uses the same three-stop ramp
 * (deep void → electric mid → white peak) driven by vNoise so high-
 * displacement billows flash white like lightning crests with an
 * electric-blue/purple fade in the surrounding wisps. Alpha still combines
 * the global influence (uAlpha) with per-fragment patchiness so the cloud
 * reads as wispy rather than solid.
 */

uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform vec3 uHighlightColor;
uniform float uAlpha;
uniform vec3 uLightDir;
uniform float uAmbient;

varying vec3 vNormal;
varying float vNoise;

void main() {
  /* Remap composite noise -1..1 → 0..1 */
  float t = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);

  /* Patchiness: low-noise areas become transparent holes in the cloud. */
  float patchiness = smoothstep(0.08, 0.58, t);

  /* Three-stop colour ramp matching the core: deep void in the cooler
     regions, electric mid through the bulk, and a narrow white peak only
     on the most extreme displacement so highlights read as lightning. */
  vec3 base  = mix(uOuterColor, uInnerColor, smoothstep(0.30, 0.72, t));
  vec3 color = mix(base, uHighlightColor, smoothstep(0.80, 0.97, t));

  /* Diffuse + ambient */
  float diff  = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + diff * (1.0 - uAmbient);
  color *= light;

  gl_FragColor = vec4(color, uAlpha * patchiness);
}

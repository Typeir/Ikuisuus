/**
 * Fragment shader for the star surface — maps displacement to hot
 * colour gradient (dark red → orange → yellow → white) for a
 * convective stellar photosphere look.
 */

uniform vec3 uEmissiveColor;
uniform vec3 uCoronaColor;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  /* Remap displacement -1..1 → 0..1 */
  float t = clamp(vDisplacement * 0.5 + 0.5, 0.0, 1.0);

  /* 4-stop gradient: dark spots → base → bright → white-hot */
  vec3 darkSpot = uCoronaColor * 0.4;
  vec3 bright   = mix(uEmissiveColor, vec3(1.0), 0.3);
  vec3 whiteHot = vec3(1.0, 0.98, 0.9);

  vec3 color;
  if (t < 0.3) {
    color = mix(darkSpot, uEmissiveColor, t / 0.3);
  } else if (t < 0.7) {
    color = mix(uEmissiveColor, bright, (t - 0.3) / 0.4);
  } else {
    color = mix(bright, whiteHot, (t - 0.7) / 0.3);
  }

  gl_FragColor = vec4(color, 1.0);
}

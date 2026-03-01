/**
 * Fragment shader for gas giant cloud layers.
 * Computes all cloud band noise in fragment space using world-space
 * coordinates, similar to the Everdark's approach. No vertex
 * displacement — avoids jitter artefacts at large viewing distances.
 * noise3d.glsl is prepended at build time by GasGiantRenderer.
 */

uniform vec3 uBandColor1;
uniform vec3 uBandColor2;
uniform vec3 uStormColor;
uniform vec3 uLightDir;
uniform float uAmbient;
uniform float uTime;
uniform float uTimeScale;
uniform float uBandFrequency;
uniform float uLayerOpacity;
uniform float uNoiseOffset;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  /* Offset world position to de-correlate layers */
  vec3 wp = vWorldPosition + vec3(uNoiseOffset);

  /* Horizontal cloud bands — stretch y, compress xz */
  vec3 bandCoord = vec3(
    wp.x * 0.02,
    wp.y * 0.02 * uBandFrequency,
    wp.z * 0.02
  );
  float bandN = snoise(bandCoord + vec3(0.0, uTime * uTimeScale * 0.5, 0.0));
  float bandFine = snoise(bandCoord * 2.5 + vec3(uTime * uTimeScale, 0.0, 0.0));
  bandN += bandFine * 0.3;

  float t = clamp(bandN * 0.5 + 0.5, 0.0, 1.0);

  /* Two-tone cloud palette */
  vec3 color = mix(uBandColor1, uBandColor2, smoothstep(0.3, 0.7, t));

  /* Swirl detail — low-frequency turbulence for depth variation */
  vec3 swirlCoord = wp * 0.015 + vec3(uTime * uTimeScale * 0.3);
  float swirl = snoise(swirlCoord) * 0.5
              + snoise(swirlCoord * 2.3 + vec3(5.2, 1.3, 2.8)) * 0.3;
  float turbulence = clamp(swirl * 0.5 + 0.5, 0.0, 1.0);

  color *= 0.8 + turbulence * 0.4;

  /* Storm spots where band edges meet turbulence peaks */
  float stormMask = smoothstep(0.75, 0.88, t) * smoothstep(0.6, 0.8, turbulence);
  color = mix(color, uStormColor, stormMask * 0.6);

  /* Secondary storm at offset threshold */
  float storm2 = smoothstep(0.68, 0.82, t) * smoothstep(0.5, 0.7, turbulence);
  vec3 dimStorm = mix(uBandColor2, uStormColor, 0.3);
  color = mix(color, dimStorm, storm2 * 0.25);

  /* Simple diffuse lighting */
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float light = uAmbient + (1.0 - uAmbient) * diff;

  gl_FragColor = vec4(color * light, uLayerOpacity);
}

/**
 * Fragment shader for the Everdark fire wall effect.
 * Uses dual-layer 3D simplex noise: a large-scale Perlin for flame shape,
 * overlaid with a much smaller-scale Perlin for jagged edge breakup.
 * The small noise modulates the threshold used for edge detection, creating
 * rough, torn flame boundaries. Implements Ashima's simplex noise
 * (MIT license, widely used in GLSL).
 */

uniform float uTime;
uniform float uFlameSpeed;
uniform float uFlameScale;
uniform float uEdgeWidth;
uniform float uBaseOpacity;
uniform float uJaggedScale;
uniform float uJaggedStrength;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

/* noise3d.glsl is prepended at build time by EverdarkRenderer */

/* ── Fractal Brownian Motion (3 octaves) ── */

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  /* Rim factor — stronger at edges when viewed from inside (BackSide) */
  float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);

  /* ── Layer 1: Large-scale flame shape ── */
  vec3 noisePos = vWorldPosition * uFlameScale;
  noisePos.y -= uTime * uFlameSpeed;

  float flame = fbm(noisePos);
  float flameDetail = fbm(noisePos * 2.3 + vec3(5.2, 1.3, 2.8));

  /* Combined flame shape — range roughly -1..1, remap to 0..1 */
  float shape = (flame + flameDetail * 0.4) * 0.5 + 0.5;

  /* ── Layer 2: Small-scale jagged noise for edge breakup ── */
  vec3 jaggedPos = vWorldPosition * uJaggedScale;
  jaggedPos.y -= uTime * uFlameSpeed * 1.7;
  jaggedPos.x += uTime * uFlameSpeed * 0.3;

  float jaggedNoise = snoise(jaggedPos);
  float jaggedDetail = snoise(jaggedPos * 3.1 + vec3(7.7, 3.1, 11.3));
  float jagged = (jaggedNoise + jaggedDetail * 0.5) * 0.5 + 0.5;

  /* Offset the edge thresholds by the jagged noise → torn, rough boundaries */
  float thresholdShift = (jagged - 0.5) * uJaggedStrength;

  /* Edge detection — white outlines at flame boundaries, shifted by jagged noise */
  float t1 = 0.38 + thresholdShift;
  float edgeLow = smoothstep(t1 - uEdgeWidth, t1, shape);
  float edgeHigh = smoothstep(t1, t1 + uEdgeWidth, shape);
  float edge = edgeLow * (1.0 - edgeHigh);

  /* Secondary edge layer at a different threshold for richer detail */
  float t2 = 0.55 + thresholdShift * 0.7;
  float edgeLow2 = smoothstep(t2 - uEdgeWidth * 0.8, t2, shape);
  float edgeHigh2 = smoothstep(t2, t2 + uEdgeWidth * 0.8, shape);
  float edge2 = edgeLow2 * (1.0 - edgeHigh2);

  float totalEdge = max(edge, edge2 * 0.7);

  /* Jagged noise also eats holes in the flame body for extra raggedness */
  float holeMask = smoothstep(0.3, 0.5, jagged);
  shape *= mix(0.6, 1.0, holeMask);

  /* Color: opaque black body with dim silver outlines */
  vec3 flameBlack = vec3(0.01, 0.01, 0.015);
  vec3 edgeWhite = vec3(0.25, 0.27, 0.32);
  vec3 color = mix(flameBlack, edgeWhite, totalEdge);

  /* Alpha: blotches are opaque black, gaps are fully transparent */
  float bodyAlpha = smoothstep(0.42, 0.5, shape) * uBaseOpacity;
  float edgeAlpha = totalEdge * uBaseOpacity * 0.4;
  float alpha = max(bodyAlpha, edgeAlpha) * (rim * 0.5 + 0.5);

  /* Hard cutoff — discard near-transparent fragments for clean gaps */
  if (alpha < 0.02) discard;

  gl_FragColor = vec4(color, alpha);
}

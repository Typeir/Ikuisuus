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

/* ── Simplex 3D Noise (Ashima Arts, MIT) ── */

vec3 mod289_v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289_v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289_v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289_v3(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x_v = x_ * ns.x + ns.yyyy;
  vec4 y_v = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x_v) - abs(y_v);

  vec4 b0 = vec4(x_v.xy, y_v.xy);
  vec4 b1 = vec4(x_v.zw, y_v.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

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

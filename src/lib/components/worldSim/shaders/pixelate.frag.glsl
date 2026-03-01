/**
 * Post-processing fragment shader: pixelation + chromatic aberration +
 * sharpening + pseudo-emboss, all in a single pass.
 *
 * Execution order per fragment:
 *   1. Snap UV to the nearest pixel-grid cell centre (pixelation).
 *   2. Sample R, G, B at slightly different radial offsets (chromatic aberration).
 *   3. Unsharp-mask sharpen using 4-neighbour difference (sharpening).
 *   4. Luminance-gradient bevel using a diagonal pair (pseudo-emboss).
 *
 * All effect strengths are zero-safe — setting any uniform to 0.0 skips that
 * effect at essentially zero extra cost.
 *
 * Uniforms:
 *   uTexture         — full-resolution scene render target
 *   uPixelCount      — pixel grid dimensions, e.g. vec2(480.0, 270.0)
 *   uResolution      — actual canvas size in physical pixels, e.g. vec2(1920.0, 1080.0)
 *                      used only for CA so the offset is independent of the grid
 *   uCAStrength      — chromatic aberration in real-pixel units.
 *                      The effect is automatically suppressed on near-white
 *                      pixels (stars) to prevent rainbow fringing on
 *                      isolated bright points. It is strongest on coloured
 *                      mid-tone edges where it reads as lens dispersion.
 *   uSharpenStrength — unsharp-mask blend weight (e.g. 0.6–1.0)
 *   uEmbossStrength  — pseudo-emboss bevel intensity (e.g. 0.2–0.4)
 */

uniform sampler2D uTexture;
uniform vec2 uPixelCount;
uniform vec2 uResolution;
uniform float uCAStrength;
uniform float uSharpenStrength;
uniform float uEmbossStrength;

varying vec2 vUv;

/** Luma weights (BT.601) */
const vec3 LUMA = vec3(0.299, 0.587, 0.114);

void main() {
  /* --- 1. Pixelation ---------------------------------------------------- */
  vec2 snapped = (floor(vUv * uPixelCount) + 0.5) / uPixelCount;

  /* One pixel step on the quantised grid */
  vec2 px = 1.0 / uPixelCount;

  /* --- 2. Chromatic aberration ------------------------------------------ */
  /* Sample the centre pixel first — used both as the unmodified base and
     to compute a white-avoidance weight that suppresses CA on near-white
     pixels (stars, highlights) where splitting channels causes rainbow noise
     instead of the intended lens-dispersion look.                          */
  vec3  center    = texture2D(uTexture, snapped).rgb;
  float whiteness = min(center.r, min(center.g, center.b));
  float caWeight  = 1.0 - smoothstep(0.55, 0.85, whiteness);

  vec2 rpx        = 1.0 / uResolution;
  vec2 fromCenter = snapped - 0.5;
  vec2 caOffset   = fromCenter * uCAStrength * rpx;

  float r = texture2D(uTexture, snapped + caOffset).r;
  float b = texture2D(uTexture, snapped - caOffset).b;
  /* Blend the split channels toward the unmodified centre for bright whites */
  vec3 col = mix(center, vec3(r, center.g, b), caWeight);

  /* --- 3. Sharpening (unsharp mask) ------------------------------------- */
  /* Average the 4 axis-aligned neighbours on the pixel grid, then boost
     the centre relative to that local blur.                                 */
  vec3 n = texture2D(uTexture, snapped + vec2(  0.0,  px.y)).rgb;
  vec3 s = texture2D(uTexture, snapped + vec2(  0.0, -px.y)).rgb;
  vec3 e = texture2D(uTexture, snapped + vec2( px.x,   0.0)).rgb;
  vec3 w = texture2D(uTexture, snapped + vec2(-px.x,   0.0)).rgb;
  vec3 blur = (n + s + e + w) * 0.25;
  col += (col - blur) * uSharpenStrength;

  /* --- 4. Pseudo-emboss ------------------------------------------------- */
  /* A diagonal luminance gradient creates a subtle bevel / relief feel.
     Top-left is bright (+), bottom-right is dark (-).                       */
  vec3 tl = texture2D(uTexture, snapped + vec2(-px.x,  px.y)).rgb;
  vec3 br = texture2D(uTexture, snapped + vec2( px.x, -px.y)).rgb;
  float bevel = dot(tl - br, LUMA) * uEmbossStrength;
  col += bevel;

  gl_FragColor = vec4(col, 1.0);
}

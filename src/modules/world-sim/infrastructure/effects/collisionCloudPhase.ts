/**
 * @fileoverview Collision Cloud Phase Envelope
 * @description Computes the collision cloud animation envelope: logarithmic
 *   unbounded `sizeNorm`, smoothstep opacity ramp (up to apex, down through
 *   fade), and capped sinusoidal jitter scaled by the opacity envelope.
 * @module modules/world-sim/infrastructure/effects/collisionCloudPhase
 * @version 1.0.0
 * @author Typeir
 * @since 2026-05-30
 */

/**
 * @interface PhaseEnvelope
 * @property {number} opacity - Normalized opacity [0,1]; 1 at `apexTime`,
 *   0 at `apexTime + fadeDuration`.
 * @property {number} sizeNorm - Logarithmic size factor; = 1 at apex, grows
 *   beyond it (never shrinks).
 */
export interface PhaseEnvelope {
  opacity: number;
  sizeNorm: number;
}

/**
 * Cubic Hermite smoothstep (3x^2 - 2x^3) for `x` already clamped to [0,1].
 *
 * @param {number} x - Value in [0,1]
 * @returns {number} Eased value in [0,1]
 */
function smoothstep01(x: number): number {
  return x * x * (3 - 2 * x);
}

/**
 * Compute the phase envelope at a given elapsed phase time.
 *
 * `sizeNorm` is unbounded logarithmic growth, normalized to 1 at `apexTime`.
 * Opacity ramps 0 → 1 over `[0, apexTime]` and 1 → 0 over
 * `[apexTime, apexTime + fadeDuration]`.
 *
 * @param {number} phaseTime - Seconds since the phase was triggered
 * @param {number} apexTime - Seconds from trigger to opacity peak
 * @param {number} fadeDuration - Seconds from apex to fully faded
 * @param {number} growthRate - Logarithmic growth coefficient (>0)
 * @returns {PhaseEnvelope} The current opacity and normalized size
 */
export function computePhaseEnvelope(
  phaseTime: number,
  apexTime: number,
  fadeDuration: number,
  growthRate: number,
): PhaseEnvelope {
  const safeT = Math.max(0, phaseTime);

  const denom = Math.log(1 + apexTime * growthRate);
  const sizeNorm = denom > 0 ? Math.log(1 + safeT * growthRate) / denom : 0;

  let opacity: number;
  if (safeT <= 0) {
    opacity = 0;
  } else if (safeT < apexTime) {
    /* Pre-apex: fully opaque from the first frame. No alpha ramp-in. */
    opacity = 1;
  } else {
    const fadeT = (safeT - apexTime) / fadeDuration;
    /* Concave ease-out (1 - fadeT)^2: alpha drops fast right after apex
       and tapers. */
    opacity = fadeT >= 1 ? 0 : (1 - fadeT) * (1 - fadeT);
  }

  return { opacity, sizeNorm };
}

/**
 * Compute a linear taper envelope that decays from 1 at phase start to 0 at
 * `totalDuration` (falloff at a constant rate). Returns 0 if
 * `totalDuration <= 0`.
 *
 * @param {number} phaseTime - Seconds since the phase was triggered
 * @param {number} totalDuration - Full phase duration (apex + fade)
 * @returns {number} Envelope in [0,1]
 */
export function computeLinearTaper(
  phaseTime: number,
  totalDuration: number,
): number {
  if (totalDuration <= 0) return 0;
  const t = phaseTime / totalDuration;
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  return 1 - t;
}

/**
 * Compute a high-frequency capped sinusoidal jitter scaled by the live
 * envelope (typically opacity).
 *
 * @param {number} time - Global elapsed seconds (drives the oscillation)
 * @param {number} envelope - Live amplitude scalar in [0,1]
 * @param {number} freqHz - Oscillations per second
 * @param {number} amplitude - Pre-clamp amplitude
 * @param {number} cap - Maximum absolute jitter
 * @returns {number} Signed jitter value in [-cap, cap]
 */
export function computeJitter(
  time: number,
  envelope: number,
  freqHz: number,
  amplitude: number,
  cap: number,
): number {
  const raw = Math.sin(time * freqHz * Math.PI * 2) * envelope * amplitude;
  const clamped = Math.sign(raw) * Math.min(Math.abs(raw), cap);
  /* Normalize away signed-zero so callers never see -0. */
  return clamped === 0 ? 0 : clamped;
}

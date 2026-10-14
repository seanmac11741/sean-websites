/**
 * How far through its turn a layer is drawn, given how far through the
 * turn's time it is: both 0 to 1. It eases in, swings a little past the turn
 * and eases back onto it, the way a real layer settles with a click. Pure.
 */

/** How far past the turn the layer swings, as a fraction of it. */
const OVERSHOOT = 0.06;
/** When, as a fraction of the time, the swing peaks and the settle begins. */
const PEAK = 0.8;

/** 0 to 1 with zero speed at both ends. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function easeTurn(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < PEAK) return (1 + OVERSHOOT) * smoothstep(t / PEAK);
  return 1 + OVERSHOOT * (1 - smoothstep((t - PEAK) / (1 - PEAK)));
}

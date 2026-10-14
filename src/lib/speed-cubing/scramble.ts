/**
 * The Scramble: a burst of random face turns that shuffles the Cube.
 *
 * Pure: no DOM, no timers, and no `Math.random` — the random source is
 * injected, so a scramble is reproducible. The page animates the moves it
 * returns, one at a time, and shows them back to the viewer.
 */

import { FACES, type Face } from './cube';

export const SCRAMBLE_LENGTH = 100;

const SUFFIXES = ['', "'", '2'] as const;

/** Picks one of `options` with a uniform draw from [0, 1). */
const pick = <T>(options: readonly T[], random: () => number): T =>
  options[Math.min(Math.floor(random() * options.length), options.length - 1)];

/**
 * SCRAMBLE_LENGTH face turns in standard notation, never the same face twice in a
 * row (which would just be one turn of that face, wasted).
 */
export function scramble(random: () => number): string[] {
  const moves: string[] = [];
  let previous: Face | undefined;
  for (let i = 0; i < SCRAMBLE_LENGTH; i++) {
    const face = pick(
      FACES.filter((f) => f !== previous),
      random,
    );
    moves.push(face + pick(SUFFIXES, random));
    previous = face;
  }
  return moves;
}

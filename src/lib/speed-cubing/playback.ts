/**
 * How a Solve is played back: its Stages flattened into the Steps the page
 * animates, one at a time. Each Step says which Stage, and which move in it,
 * is on screen, so the stage list is highlighted from the same Step the cube
 * is turning and the two cannot fall out of step. Pure.
 */

import type { Stage } from './solve';

export const SOLVE_TURN_SECONDS = 0.5;
export const STAGE_PAUSE_SECONDS = 0.6;

export type Step =
  | { kind: 'move'; stage: number; index: number; move: string; seconds: number }
  | { kind: 'pause'; stage: number; seconds: number };

/** Every Stage's moves in order, with a pause leading into each Stage after the first. */
export function playback(
  stages: readonly Stage[],
  { turnSeconds = SOLVE_TURN_SECONDS, pauseSeconds = STAGE_PAUSE_SECONDS } = {},
): Step[] {
  return stages.flatMap((stage, s) => [
    ...(s > 0 ? [{ kind: 'pause' as const, stage: s, seconds: pauseSeconds }] : []),
    ...stage.moves.map((move, index) => ({ kind: 'move' as const, stage: s, index, move, seconds: turnSeconds })),
  ]);
}

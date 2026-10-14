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

/** Every Stage's moves in order, each Stage led into with a pause that shows it before it turns. */
export function playback(stages: readonly Stage[]): Step[] {
  return stages.flatMap((stage, s): Step[] => [
    { kind: 'pause', stage: s, seconds: STAGE_PAUSE_SECONDS },
    ...stage.moves.map((move, index): Step => ({ kind: 'move', stage: s, index, move, seconds: SOLVE_TURN_SECONDS })),
  ]);
}

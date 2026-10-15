/**
 * How a Solve is played back: its Stages flattened into the Steps the page
 * animates, one at a time. Each Step says which Stage, and which move in it,
 * is on screen, so the stage list is highlighted from the same Step the cube
 * is turning and the two cannot fall out of step. Pure.
 */

import { inverseMove } from './cube';
import type { Stage } from './solve';

export const SOLVE_TURN_SECONDS = 0.5;
export const STAGE_PAUSE_SECONDS = 0.6;
/** A move's time while fast-playing to a Stage. */
export const SEEK_TURN_SECONDS = 0.12;

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

// --- The Playhead: stepping and seeking through the Steps -------------------------
//
// Where playback stands is a position in the Steps: those before it have
// played and the one at it is next, so `0` is the scrambled cube and
// `steps.length` the end. A Stage starts at its pause.

/** One beat of moving the playhead: the Step it shows, the move it turns (none for a pause), and how long it takes. */
export interface Beat {
  step: Step;
  move: string | null;
  seconds: number;
}

/** The Beats that move the Playhead, and where it lands. */
export interface Go {
  beats: Beat[];
  to: number;
}

/** The Step at the playhead, as playing plays it, pause or move; null at the end. */
export function playNext(steps: readonly Step[], at: number): Go | null {
  const step = steps[at];
  if (!step) return null;
  return { beats: [{ step, move: step.kind === 'move' ? step.move : null, seconds: step.seconds }], to: at + 1 };
}

/** One move on, passing over any pauses before it; null at the end. */
export function forward(steps: readonly Step[], at: number): Go | null {
  for (let i = at; i < steps.length; i++) {
    const step = steps[i];
    if (step.kind === 'move') return { beats: [{ step, move: step.move, seconds: step.seconds }], to: i + 1 };
  }
  return null;
}

/** One move back, undone by its inverse, passing back over any pauses after it; null before the first move. */
export function back(steps: readonly Step[], at: number): Go | null {
  for (let i = at - 1; i >= 0; i--) {
    const step = steps[i];
    if (step.kind === 'move') return { beats: [{ step, move: inverseMove(step.move), seconds: step.seconds }], to: i };
  }
  return null;
}

/** Fast-plays forwards or backwards, a move at a time, to where Stage `stage` starts. */
export function seekStage(steps: readonly Step[], at: number, stage: number): Go {
  const to = steps.findIndex((step) => step.kind === 'pause' && step.stage === stage);
  const beats: Beat[] = [];
  for (let i = at; i < to; i++) {
    const step = steps[i];
    if (step.kind === 'move') beats.push({ step, move: step.move, seconds: SEEK_TURN_SECONDS });
  }
  for (let i = at - 1; i >= to; i--) {
    const step = steps[i];
    if (step.kind === 'move') beats.push({ step, move: inverseMove(step.move), seconds: SEEK_TURN_SECONDS });
  }
  return { beats, to };
}

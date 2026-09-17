/**
 * The RPS Royale spritesheet's geometry — the **Sheet module**.
 *
 * One PNG, one uniform grid, twenty-one rows of six columns: three Types in the
 * order rock, paper, scissors, each carrying the same seven states in the same
 * order, so a row is addressable as `typeIndex * STATES.length + stateIndex`.
 * The full art contract is `docs/rps-royale-spritesheet-spec.md`; this module is
 * the code's half of it, and the only place that knows any of those numbers.
 *
 * Row indices are load-bearing. Renumbering a row here without renumbering the
 * artwork silently misaligns every sprite on the page.
 *
 * Pure: no canvas, no image loading, no DOM. Given a Type, a state and how long
 * that state has been playing, it answers which source rectangle to draw. The
 * page owns the `drawImage` call and nothing about where the pixels live.
 */

/** Which of rock, paper or scissors a Fighter currently is. */
export const TYPES = ['rock', 'paper', 'scissors'] as const;
export type Type = (typeof TYPES)[number];

/**
 * The seven animation states every Type carries, in sheet-row order.
 *
 * `transform` is type-agnostic: the same frames play whatever the destination
 * Type is, ending on a neutral silhouette, and the page cuts to the new Type's
 * idle on completion. That is what keeps the sheet from tripling in size.
 */
export const STATES = [
  'idle',
  'hop',
  'duel-windup',
  'duel-impact',
  'spectate',
  'transform',
  'victory',
] as const;
export type State = (typeof STATES)[number];

/** Where the sheet is served from. Under `public/`, so served verbatim. */
export const SHEET_PATH = '/images/rps-royale/sheet.png';

/** The cell size the artwork is authored at — 2× for retina. */
export const AUTHORED_CELL = 128;
/** The cell size the code reasons in. */
export const LOGICAL_CELL = 64;

export const SHEET_COLS = 6;
export const SHEET_ROWS = TYPES.length * STATES.length;
export const SHEET_WIDTH = SHEET_COLS * AUTHORED_CELL;
export const SHEET_HEIGHT = SHEET_ROWS * AUTHORED_CELL;

/**
 * Where the character's base sits inside its cell, as a fraction of the cell.
 * Every grounded frame pins its feet to this line, so the page can draw every
 * cell at the same destination rectangle without the sprite appearing to drift.
 */
export const BASELINE_FRACTION = 104 / AUTHORED_CELL;

interface StateSpec {
  /** Frames drawn on this state's row. Trailing cells are transparent. */
  readonly frames: number;
  readonly fps: number;
  /** Whether the state cycles, or clamps on its last frame. */
  readonly loop: boolean;
}

const STATE_SPECS: Record<State, StateSpec> = {
  idle: { frames: 4, fps: 6, loop: true },
  hop: { frames: 6, fps: 12, loop: true },
  'duel-windup': { frames: 3, fps: 12, loop: false },
  'duel-impact': { frames: 3, fps: 14, loop: false },
  spectate: { frames: 4, fps: 6, loop: true },
  transform: { frames: 6, fps: 12, loop: false },
  victory: { frames: 6, fps: 8, loop: true },
};

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** The sheet row holding a Type's given state. */
export function rowFor(type: Type, state: State): number {
  return TYPES.indexOf(type) * STATES.length + STATES.indexOf(state);
}

export function frameCount(state: State): number {
  return STATE_SPECS[state].frames;
}

export function frameRate(state: State): number {
  return STATE_SPECS[state].fps;
}

export function loops(state: State): boolean {
  return STATE_SPECS[state].loop;
}

/** How long one full pass of a state takes, in seconds. */
export function stateDuration(state: State): number {
  return frameCount(state) / frameRate(state);
}

/**
 * Which frame of a state is showing after `elapsed` seconds in it. A looping
 * state wraps; a once-through state holds its last frame rather than snapping
 * back to the start, so a transform that outlives its animation still reads.
 */
export function frameIndexAt(state: State, elapsed: number): number {
  const { frames, fps, loop } = STATE_SPECS[state];
  const safe = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const index = Math.floor(safe * fps);
  return loop ? index % frames : Math.min(frames - 1, index);
}

/** The rectangle on the sheet holding one frame of one Type's state. */
export function sourceRect(type: Type, state: State, frameIndex: number): SourceRect {
  const column = Math.min(frameCount(state) - 1, Math.max(0, Math.floor(frameIndex)));
  return {
    sx: column * AUTHORED_CELL,
    sy: rowFor(type, state) * AUTHORED_CELL,
    sw: AUTHORED_CELL,
    sh: AUTHORED_CELL,
  };
}

/** The rectangle to draw for a Type `elapsed` seconds into a state. */
export function frameAt(type: Type, state: State, elapsed: number): SourceRect {
  return sourceRect(type, state, frameIndexAt(state, elapsed));
}

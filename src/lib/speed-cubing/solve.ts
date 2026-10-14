/**
 * The Solve: the first half of a beginner-CFOP solve — the white Cross on the
 * bottom, then the four F2L pairs — as labelled Stages of face turns.
 *
 * Pure: no DOM, no timers. Each Stage is the shortest sequence of face turns
 * that solves it alone while keeping every earlier Stage solved, found by
 * iterative-deepening search (IDA*) over the pieces that Stage cares about.
 *
 * The search tracks a piece by where one of its Stickers (its reference) sits:
 * a position and an outward normal, one of 24 sticker slots for an edge and 24
 * for a corner. How each face turn moves those slots is read off the Cube
 * module, so the search and the drawn cube can never disagree about a move.
 * Distances from the goal for small groups of pieces are tabulated once, by
 * breadth-first search, and bound how deep the search has to look.
 */

import { applyMoves, FACES, solvedCube, type Cube, type Sticker, type Vec } from './cube';

export interface Stage {
  readonly label: string;
  readonly moves: readonly string[];
}

// --- Sticker slots ---------------------------------------------------------------

const zeros = (v: Vec) => v.filter((c) => c === 0).length;
const key = (s: Pick<Sticker, 'position' | 'normal'>) => `${s.position}|${s.normal}`;

const SOLVED = solvedCube().stickers;
/** Edge sticker slots are 0–23, corner sticker slots 24–47. */
const SLOT_STICKERS = [
  ...SOLVED.filter((s) => zeros(s.position) === 1),
  ...SOLVED.filter((s) => zeros(s.position) === 0),
];
const SLOT_OF = new Map(SLOT_STICKERS.map((s, i) => [key(s), i]));
const slotOf = (s: Pick<Sticker, 'position' | 'normal'>) => SLOT_OF.get(key(s))!;

/** Where each slot's Sticker goes under `moves`, as read off the Cube module. */
function slotPermutation(moves: string): Int8Array {
  const after = applyMoves(solvedCube(), moves).stickers;
  const perm = new Int8Array(48);
  SOLVED.forEach((s, i) => {
    if (zeros(s.position) < 2) perm[slotOf(s)] = slotOf(after[i]);
  });
  return perm;
}

const MOVES = FACES.flatMap((face) => [face, `${face}'`, `${face}2`]);
const PERMS = MOVES.map(slotPermutation);
/** The face index of each move: U D F B L R, so a face and its opposite are i and i ^ 1. */
const MOVE_FACE = MOVES.map((_, i) => Math.floor(i / 3));

// --- Pieces ----------------------------------------------------------------------

/** A piece is named by the slot its reference Sticker has on a solved cube. */
type Piece = number;

const same = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
/**
 * The piece at `position` on a solved cube. Its reference is its U or D Sticker
 * if it has one, so turning the whole cube about y maps references to references.
 */
function pieceAt(position: Vec): Piece {
  const stickers = SOLVED.filter((s) => same(s.position, position));
  return slotOf(stickers.find((s) => s.normal[1] !== 0) ?? stickers[0]);
}

const coloursKey = (stickers: readonly Sticker[]) => stickers.map((s) => s.colour).sort().join();

/** Where each of `pieces` is on `cube`: the slot its reference Sticker is in. */
function locate(cube: Cube, pieces: readonly Piece[]): number[] {
  const byPosition = new Map<string, Sticker[]>();
  for (const s of cube.stickers) {
    const k = String(s.position);
    byPosition.set(k, [...(byPosition.get(k) ?? []), s]);
  }
  return pieces.map((piece) => {
    const reference = SLOT_STICKERS[piece];
    const homeStickers = SOLVED.filter((s) => same(s.position, reference.position));
    const want = coloursKey(homeStickers);
    for (const stickers of byPosition.values()) {
      if (coloursKey(stickers) !== want) continue;
      return slotOf(stickers.find((s) => s.colour === reference.colour)!);
    }
    throw new Error('Not a cube: a piece is missing');
  });
}

// --- Distance tables -------------------------------------------------------------

const UNSEEN = 255;

/** Slots are packed four or so to an index, 24 to a digit (edges and corners alike). */
function encode(slots: ArrayLike<number>): number {
  let index = 0;
  for (let i = slots.length - 1; i >= 0; i--) index = index * 24 + (slots[i] % 24);
  return index;
}

/**
 * The fewest face turns that bring `pieces` home from every arrangement of
 * them, by breadth-first search outward from home.
 */
function distanceTable(pieces: readonly Piece[]): Uint8Array {
  const n = pieces.length;
  const size = 24 ** n;
  const table = new Uint8Array(size).fill(UNSEEN);
  // What each piece's digit becomes under each move, already in place in the index:
  // a move acts on each piece alone, so the next index is a sum of these.
  const shift = Array.from({ length: PERMS.length * n * 24 }, (_, j) => {
    const s = j % 24;
    const i = Math.floor(j / 24) % n;
    const perm = PERMS[Math.floor(j / 24 / n)];
    return (perm[s + (pieces[i] < 24 ? 0 : 24)] % 24) * 24 ** i;
  });
  const queue = new Int32Array(size);
  queue[0] = encode(pieces);
  table[queue[0]] = 0;
  const digits = new Int32Array(n);
  for (let head = 0, tail = 1; head < tail; head++) {
    let index = queue[head];
    const depth = table[index] + 1;
    for (let i = 0; i < n; i++) {
      digits[i] = i * 24 + (index % 24);
      index = Math.floor(index / 24);
    }
    for (let m = 0; m < PERMS.length; m++) {
      let j = 0;
      for (let i = 0; i < n; i++) j += shift[m * n * 24 + digits[i]];
      if (table[j] === UNSEEN) {
        table[j] = depth;
        queue[tail++] = j;
      }
    }
  }
  return table;
}

// --- Search ----------------------------------------------------------------------

/** A lower bound on the turns still needed, from the slots of the tracked pieces. */
type Bound = (slots: Int8Array) => number;

/**
 * The shortest face turns that bring every bound of one of the goals to zero,
 * trying the goals in order at each depth so the first shortest one wins.
 * Never turns a face twice in a row, and turns opposite faces in one order
 * only, since they commute.
 */
function search(start: Int8Array, goals: readonly (readonly Bound[])[]): { moves: string[]; goal: number } {
  const path: number[] = [];
  // One buffer of slots per ply, reused, so the search allocates nothing as it goes.
  const plies: Int8Array[] = [];
  const dfs = (slots: Int8Array, bounds: readonly Bound[], depth: number, lastFace: number): boolean => {
    let estimate = 0;
    for (const bound of bounds) estimate = Math.max(estimate, bound(slots));
    if (estimate === 0) return true;
    if (estimate > depth) return false;
    for (let m = 0; m < PERMS.length; m++) {
      const face = MOVE_FACE[m];
      if (face === lastFace || ((face ^ 1) === lastFace && face < lastFace)) continue;
      const perm = PERMS[m];
      const next = (plies[path.length] ??= new Int8Array(slots.length));
      for (let i = 0; i < slots.length; i++) next[i] = perm[slots[i]];
      path.push(m);
      if (dfs(next, bounds, depth - 1, face)) return true;
      path.pop();
    }
    return false;
  };
  for (let depth = 0; ; depth++) {
    for (let goal = 0; goal < goals.length; goal++) {
      if (dfs(start, goals[goal], depth, -1)) return { moves: path.map((m) => MOVES[m]), goal };
    }
  }
}

// --- The stages ------------------------------------------------------------------

const CROSS = ([[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]] as Vec[]).map(pieceAt);
const [DF, DR, DB, DL] = CROSS;

/**
 * The F2L slots are the front-right one and its images under y: turning the
 * whole cube a quarter about y, k times, carries front-right onto slot k.
 */
const Y = slotPermutation('y');
const power = (perm: Int8Array, k: number) => {
  let out = Int8Array.from({ length: 48 }, (_, i) => i);
  for (let i = 0; i < k; i++) out = out.map((s) => perm[s]);
  return out;
};
const Y_TO = [0, 1, 2, 3].map((k) => power(Y, k));
/** Undoes Y_TO[k]: carries slot k's pieces back to where front-right's would be. */
const Y_FROM = [0, 1, 2, 3].map((k) => power(Y, (4 - k) % 4));

const FR_CORNER = pieceAt([1, -1, 1]);
const FR_EDGE = pieceAt([1, 0, 1]);
/** Front-right's pair with the Cross edges beside it, and with the two across from it. */
const NEAR = [FR_CORNER, FR_EDGE, DF, DR];
const FAR = [FR_CORNER, FR_EDGE, DB, DL];

/** Every piece the search follows: the Cross, then each slot's corner and edge. */
const TRACKED = [...CROSS, ...Y_TO.flatMap((y) => [y[FR_CORNER], y[FR_EDGE]])];

let tables: { cross: Uint8Array; near: Uint8Array; far: Uint8Array } | undefined;

/**
 * Builds the distance tables now, if they aren't built yet, rather than on the
 * first Solve: a page can call it while idle so Solve starts without a stall.
 */
export function prepareSolve() {
  tables ??= { cross: distanceTable(CROSS), near: distanceTable(NEAR), far: distanceTable(FAR) };
  return tables;
}

/**
 * A bound read from `table`, built for front-right's `group`, applied to the
 * pieces of F2L pair k (k = 0 is front-right itself, and the Cross as it stands).
 */
function pairBound(table: Uint8Array, group: readonly Piece[], k: number): Bound {
  const at = group.map((p) => TRACKED.indexOf(Y_TO[k][p]));
  const back = Y_FROM[k];
  return (slots) => {
    let index = 0;
    for (let i = at.length - 1; i >= 0; i--) index = index * 24 + (back[slots[at[i]]] % 24);
    return table[index];
  };
}

/**
 * The Stages that take `cube` to a solved Cross and F2L, white on the bottom:
 * "Cross", then "F2L pair 1 of 4" to "F2L pair 4 of 4". Each pair is whichever
 * unsolved one is quickest to solve next, as a solver looking ahead would pick.
 */
export function solveF2L(cube: Cube): Stage[] {
  const { cross, near, far } = prepareSolve();
  const crossBound = pairBound(cross, CROSS, 0);
  const pairBounds = (k: number) => [pairBound(near, NEAR, k), pairBound(far, FAR, k)];

  let slots = Int8Array.from(locate(cube, TRACKED));
  const play = (moves: string[]) => {
    for (const move of moves) {
      const perm = PERMS[MOVES.indexOf(move)];
      slots = slots.map((s) => perm[s]);
    }
  };

  const crossMoves = search(slots, [[crossBound]]).moves;
  play(crossMoves);
  const stages: Stage[] = [{ label: 'Cross', moves: crossMoves }];

  const kept: Bound[] = [crossBound];
  let unsolved = [0, 1, 2, 3];
  for (let n = 1; n <= 4; n++) {
    const { moves, goal } = search(slots, unsolved.map((k) => [...kept, ...pairBounds(k)]));
    play(moves);
    kept.push(...pairBounds(unsolved[goal]));
    unsolved = unsolved.filter((_, i) => i !== goal);
    stages.push({ label: `F2L pair ${n} of 4`, moves });
  }
  return stages;
}

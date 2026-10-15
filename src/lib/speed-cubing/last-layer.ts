/**
 * The last layer: 2-look OLL then 2-look PLL, with only the algorithms from
 * the CFOP notes, held yellow up. Each Look is one step of it: a goal, and the
 * algorithms that reach it from each of its cases.
 *
 * Pure: no DOM, no timers. The algorithms are kept as written in the notes and
 * expanded into Moves on demand.
 */

import { applyMoves, faces, isSolved, type Cube } from './cube';
import type { Stage } from './solve';

/** One named algorithm, in the notes' shorthand: brackets for grouping, `(…)x3` to repeat. */
export interface Algorithm {
  readonly name: string;
  readonly notation: string;
}

/**
 * One Look at the last layer: its method, its title, the algorithms for its
 * cases, and whether the cube has reached its goal. Every goal ignores a turn
 * of the top layer, which the solve lines up at the end.
 */
export interface Look {
  readonly method: 'OLL' | 'PLL';
  readonly title: string;
  readonly algorithms: readonly Algorithm[];
  done(cube: Cube): boolean;
}

const SIDES = ['F', 'R', 'B', 'L'] as const;
/** The top face matches its centre at these places in the U face's reading order. */
const topMatches = (cube: Cube, at: readonly number[]) => {
  const top = faces(cube).U;
  return at.every((i) => top[i] === top[4]);
};
/** Every side face's top row agrees with itself at these places. */
const rowsMatch = (cube: Cube, at: readonly number[]) => {
  const f = faces(cube);
  return SIDES.every((side) => at.every((i) => f[side][i] === f[side][at[0]]));
};

export const YELLOW_CROSS: Look = {
  method: 'OLL',
  title: 'Yellow cross',
  done: (cube) => topMatches(cube, [1, 3, 5, 7]),
  algorithms: [
    { name: 'L-shape', notation: "f (R U R' U') f'" },
    { name: 'Line', notation: "F (R U R' U') F'" },
    { name: 'Dot', notation: "F (R U R' U') F'  f (R U R' U') f'" },
  ],
};

export const YELLOW_CORNERS: Look = {
  method: 'OLL',
  title: 'Yellow corners',
  done: (cube) => topMatches(cube, [0, 1, 2, 3, 5, 6, 7, 8]),
  algorithms: [
    { name: 'Antisune', notation: "L' U' L U' L' U2 L" },
    { name: 'Sune', notation: "R U R' U R U2 R'" },
    { name: 'H', notation: "F (R U R' U')x3 F'" },
    { name: 'Pi', notation: "R U2 (R2 U' R2 U' R2) U2 R" },
    { name: 'L', notation: "x (R' U R D') (R' U' R D)" },
    { name: 'T', notation: "x (L U R' U') (L' U R U')" },
    { name: 'U', notation: "R2 D (R' U2 R) D' (R' U2 R')" },
  ],
};

export const PLL_CORNERS: Look = {
  method: 'PLL',
  title: 'Corners',
  // Each side's two top corners match: the corners are in place but for a U-turn.
  done: (cube) => rowsMatch(cube, [0, 2]),
  algorithms: [
    { name: 'Diagonal Swap', notation: "(F R U' R' U' R U R' F') (R U R' U' R' F R F')" },
    { name: 'Adjacent Corner Swap', notation: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  ],
};

export const PLL_EDGES: Look = {
  method: 'PLL',
  title: 'Edges',
  done: (cube) => rowsMatch(cube, [0, 1, 2]),
  algorithms: [
    { name: 'Right to Left', notation: "R U' R U R U R U' R' U' R2" },
    { name: 'Left to Right', notation: "R2 U R U R' U' R' U' R' U R'" },
    { name: 'Opposite Edge Swap', notation: "M2 U' M2 U2 M2 U' M2" },
    { name: 'Adjacent Edge Swap', notation: "M' U' M2 U' M2 U' M' U2 M2 U" },
  ],
};

/** The four Looks in the order a solve plays them. */
export const LOOKS: readonly Look[] = [YELLOW_CROSS, YELLOW_CORNERS, PLL_CORNERS, PLL_EDGES];

/**
 * An algorithm's Moves: brackets dropped and `(…)x3` written out. One that
 * starts by turning the whole cube with `x` ends by turning it back with `x'`,
 * so white is on the bottom again before the next Stage.
 */
export function algorithmMoves({ notation }: Algorithm): string[] {
  const moves = notation
    .replace(/\(([^)]*)\)x(\d)/g, (_, group: string, times: string) => Array(Number(times)).fill(group).join(' '))
    .replace(/[()]/g, ' ')
    .trim()
    .split(/\s+/);
  return moves[0] === 'x' ? [...moves, "x'"] : moves;
}

/** The U-turns that line a case up, fewest first. */
const SETUPS: readonly (readonly string[])[] = [[], ['U'], ["U'"], ['U2']];

/**
 * Which of the Look's cases `cube` is, and the U-turn (if any) that lines it
 * up for its algorithm; null when the Look is already done. A case is the one
 * whose algorithm, so lined up, reaches the Look's goal.
 */
export function recognise(cube: Cube, look: Look): { algorithm: Algorithm; setup: string[] } | null {
  if (look.done(cube)) return null;
  for (const algorithm of look.algorithms) {
    const moves = algorithmMoves(algorithm);
    for (const setup of SETUPS) {
      if (look.done(applyMoves(cube, [...setup, ...moves].join(' ')))) return { algorithm, setup: [...setup] };
    }
  }
  throw new Error(`Not a ${look.title} case the notes cover`);
}

/**
 * The Stages that finish a cube whose first two layers are solved: one per
 * Look, labelled with the case it found ("OLL: Sune", "PLL: Adjacent Corner
 * Swap") or, when there was nothing to do, the Look's title. The last Stage
 * ends with the U-turn, if any, that brings the top layer home.
 */
export function solveLastLayer(cube: Cube): Stage[] {
  const stages = LOOKS.map((look): Stage => {
    const found = recognise(cube, look);
    if (!found) return { label: `${look.method}: ${look.title}`, moves: [] };
    const moves = [...found.setup, ...algorithmMoves(found.algorithm)];
    cube = applyMoves(cube, moves.join(' '));
    return { label: `${look.method}: ${found.algorithm.name}`, moves };
  });
  const last = stages[stages.length - 1];
  const home = SETUPS.find((turn) => isSolved(applyMoves(cube, turn.join(' '))));
  if (!home) throw new Error('The last layer did not come out solved');
  stages[stages.length - 1] = { ...last, moves: [...last.moves, ...home] };
  return stages;
}

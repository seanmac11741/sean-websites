/**
 * The Cube module: a 3×3 cube's state and the moves that change it.
 *
 * Pure: no DOM, no three.js. A Cube is its 54 Stickers, each a Colour at an
 * integer position on the 3×3×3 grid (each axis −1, 0 or 1) facing along an
 * outward normal. Axes are the viewer's: x to the right, y up, z towards them.
 * A move rotates the Stickers in some layers a number of quarter turns about
 * one axis, so every kind of move is the same operation with different
 * layers. The renderer draws whatever Stickers it is given.
 */

export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
export type Colour = 'yellow' | 'white' | 'green' | 'blue' | 'orange' | 'red';
export type Vec = readonly [number, number, number];

export interface Sticker {
  readonly position: Vec;
  readonly normal: Vec;
  readonly colour: Colour;
}

export interface Cube {
  readonly stickers: readonly Sticker[];
}

export const FACES: readonly Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];

/** The scheme as the viewer holds the cube. */
export const SCHEME: Readonly<Record<Face, Colour>> = {
  U: 'yellow',
  D: 'white',
  F: 'green',
  B: 'blue',
  L: 'red',
  R: 'orange',
};

/**
 * Each face's outward normal, plus the directions of "right" and "down" as
 * you read it in the standard net: side faces with U at the top, U with B at
 * the top, D with F at the top.
 */
const FRAMES: Readonly<Record<Face, { normal: Vec; right: Vec; down: Vec }>> = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
};

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];

export function solvedCube(): Cube {
  const stickers: Sticker[] = [];
  for (const face of FACES) {
    const { normal, right, down } = FRAMES[face];
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        stickers.push({
          position: add(normal, add(scale(right, col), scale(down, row))),
          normal,
          colour: SCHEME[face],
        });
      }
    }
  }
  return { stickers };
}

/** Each face's nine Colours in reading order, as laid out in the standard net. */
export function faces(cube: Cube): Record<Face, Colour[]> {
  const out = {} as Record<Face, Colour[]>;
  for (const face of FACES) {
    const { normal, right, down } = FRAMES[face];
    const grid = Array<Colour>(9);
    for (const s of cube.stickers) {
      if (dot(s.normal, normal) !== 1) continue;
      grid[(dot(s.position, down) + 1) * 3 + dot(s.position, right) + 1] = s.colour;
    }
    out[face] = grid;
  }
  return out;
}

/** Every face is one Colour, whichever way round the cube is held. */
export function isSolved(cube: Cube): boolean {
  return Object.values(faces(cube)).every((face) => face.every((c) => c === face[0]));
}

export type Axis = 0 | 1 | 2;

/**
 * What a move's letter grips: the axis, which way its face points along it,
 * and which layers (coordinates along that axis) go with it. Clockwise is as
 * seen looking at that face.
 */
interface Grip {
  readonly axis: Axis;
  readonly sign: 1 | -1;
  readonly layers: readonly number[];
}

const GRIPS: Readonly<Record<string, Grip>> = {
  R: { axis: 0, sign: 1, layers: [1] },
  L: { axis: 0, sign: -1, layers: [-1] },
  U: { axis: 1, sign: 1, layers: [1] },
  D: { axis: 1, sign: -1, layers: [-1] },
  F: { axis: 2, sign: 1, layers: [1] },
  B: { axis: 2, sign: -1, layers: [-1] },
  // Two-layer turns: the face and the slice behind it.
  r: { axis: 0, sign: 1, layers: [1, 0] },
  l: { axis: 0, sign: -1, layers: [-1, 0] },
  u: { axis: 1, sign: 1, layers: [1, 0] },
  d: { axis: 1, sign: -1, layers: [-1, 0] },
  f: { axis: 2, sign: 1, layers: [1, 0] },
  b: { axis: 2, sign: -1, layers: [-1, 0] },
  // The middle slice, turning the way L does.
  M: { axis: 0, sign: -1, layers: [0] },
  // Whole-cube rotations, turning the way R, U and F do.
  x: { axis: 0, sign: 1, layers: [-1, 0, 1] },
  y: { axis: 1, sign: 1, layers: [-1, 0, 1] },
  z: { axis: 2, sign: 1, layers: [-1, 0, 1] },
};

/**
 * What one move does: the Stickers in `layers` (coordinates along `axis`)
 * rotate `quarters` quarter turns about the positive axis, by the right-hand
 * rule, so a renderer can animate exactly the turn the model makes.
 */
export interface Turn {
  readonly axis: Axis;
  readonly layers: readonly number[];
  readonly quarters: number;
}

const MOVE = /^([A-Za-z])(2|')?$/;

/** Reads one move in standard notation: `R`, `U'`, `M2`. Anything else throws. */
export function parseMove(move: string): Turn {
  const match = MOVE.exec(move);
  const grip = match && GRIPS[match[1]];
  if (!match || !grip) throw new Error(`Not a move: ${move}`);
  const clockwise = match[2] === '2' ? 2 : match[2] === "'" ? -1 : 1;
  // Clockwise, looking at the face, is a negative turn about its outward normal.
  return { axis: grip.axis, layers: grip.layers, quarters: -grip.sign * clockwise };
}

/** The move that undoes `move`: `R` ↔ `R'`; a half turn undoes itself. */
export function inverseMove(move: string): string {
  parseMove(move); // throws on anything that isn't a move
  if (move.endsWith('2')) return move;
  return move.endsWith("'") ? move.slice(0, -1) : `${move}'`;
}

/** A quarter turn anticlockwise (right-hand rule) about a positive axis. */
function quarter(v: Vec, axis: Axis): Vec {
  const [x, y, z] = v;
  if (axis === 0) return [x, -z, y];
  if (axis === 1) return [z, y, -x];
  return [-y, x, z];
}

function turn(cube: Cube, { axis, layers, quarters }: Turn): Cube {
  const times = ((quarters % 4) + 4) % 4;
  return {
    stickers: cube.stickers.map((s) => {
      if (!layers.includes(s.position[axis])) return s;
      let { position, normal } = s;
      for (let i = 0; i < times; i++) {
        position = quarter(position, axis);
        normal = quarter(normal, axis);
      }
      return { ...s, position, normal };
    }),
  };
}

/** Applies moves in standard notation, separated by spaces: `R U R' U2`. */
export function applyMoves(cube: Cube, moves: string): Cube {
  return moves
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((state, move) => turn(state, parseMove(move)), cube);
}

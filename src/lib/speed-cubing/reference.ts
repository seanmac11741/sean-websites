/**
 * Learn's reference: the notation guide and the algorithm gallery.
 *
 * Pure: no DOM, no timers. The gallery is the sixteen Algorithms the last
 * layer uses, each with how to hold the cube for it; a case's starting cube is
 * a solved cube with its algorithm run backwards, so the algorithm takes it
 * straight back.
 */

import { applyMoves, inverseMove, solvedCube, type Cube } from './cube';
import { algorithmMoves, LOOKS, lookTitle, type Algorithm, type Look } from './last-layer';

/** One entry of the notation guide: a Move to tap, and what it does. */
export interface Notation {
  readonly move: string;
  readonly explanation: string;
}

export const NOTATION: readonly Notation[] = [
  { move: 'R', explanation: 'Right face, clockwise as you look at it: the front’s right column goes up.' },
  { move: 'L', explanation: 'Left face, clockwise as you look at it: the front’s left column goes down.' },
  { move: 'U', explanation: 'Top face, clockwise from above: the front row goes to the left.' },
  { move: 'D', explanation: 'Bottom face, clockwise from below: the front row goes to the right.' },
  { move: 'F', explanation: 'Front face, clockwise as you look at it.' },
  { move: "R'", explanation: 'A prime (’) turns the other way: anticlockwise, so the right column comes down.' },
  { move: "U'", explanation: 'Top face anticlockwise from above: the front row goes to the right.' },
  { move: 'U2', explanation: 'A 2 is a half turn: the same face twice, either way round.' },
  { move: 'f', explanation: 'Lowercase is two layers: the front face and the slice behind it, together.' },
  { move: 'M', explanation: 'The middle slice between left and right, turning the way L does: down at the front.' },
  { move: 'x', explanation: 'A rotation turns the whole cube the way R does: green comes up to the top.' },
];

/** One case in the gallery: its Look, its Algorithm, and how to hold the cube for it. */
export interface GalleryCase {
  readonly look: Look;
  readonly algorithm: Algorithm;
  /** The step it completes, as the solve's stage list names it: "OLL: Yellow cross". */
  readonly step: string;
  readonly hold: string;
  /** The Moves to play, as the solve plays them. */
  readonly moves: readonly string[];
}

/** How to hold the cube for each case, yellow up, as it is set up in the gallery. */
const HOLDS: Readonly<Record<string, string>> = {
  'L-shape': 'Two yellow edges side by side: hold them at the front and on the right.',
  Line: 'Two yellow edges in a line: hold it running left to right.',
  Dot: 'No yellow edges on top: hold it any way round.',
  Antisune: 'One corner yellow on top: turn the top so yellow shows on the front face’s top left.',
  Sune: 'One corner yellow on top: turn the top so yellow shows on the front face’s top right.',
  H: 'No corners yellow on top: hold it with two yellow on the front and two on the back.',
  Pi: 'No corners yellow on top: hold it with two yellow on the left and none on the right.',
  L: 'Two corners yellow on top, diagonally across: hold them at the back left and front right, with yellow on the front face’s top left.',
  T: 'Two corners yellow on top, side by side: hold them on the right, the other two facing front and back.',
  U: 'Two corners yellow on top, side by side: hold them at the back, the “headlights” facing you.',
  'Diagonal Swap': 'No side has matching corners: hold it any way round.',
  'Adjacent Corner Swap': 'One side has matching corners: hold that pair on the left.',
  'Right to Left': 'One side is solved: hold it at the back. The right edge belongs on the left.',
  'Left to Right': 'One side is solved: hold it at the back. The left edge belongs on the right.',
  'Opposite Edge Swap': 'Every edge belongs across from where it is: hold it any way round.',
  'Adjacent Edge Swap': 'Every edge belongs beside where it is: hold it with the front and right edges swapped, and the back and left.',
};

export const GALLERY: readonly GalleryCase[] = LOOKS.flatMap((look) =>
  look.algorithms.map((algorithm) => ({
    look,
    algorithm,
    step: lookTitle(look),
    hold: HOLDS[algorithm.name],
    moves: algorithmMoves(algorithm),
  })),
);

/** Moves that undo `moves`: reversed, each turned the other way. */
export function undoMoves(moves: readonly string[]): string[] {
  return [...moves].reverse().map(inverseMove);
}

/** The cube a case starts from: solved, with its algorithm run backwards. */
export function caseStart(c: GalleryCase): Cube {
  return applyMoves(solvedCube(), undoMoves(c.moves).join(' '));
}

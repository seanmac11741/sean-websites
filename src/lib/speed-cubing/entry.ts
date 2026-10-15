/**
 * The Entry: a real cube as the viewer enters it in Learn mode, side by side.
 *
 * Pure: no DOM, no storage of its own. The viewer holds the cube yellow up
 * and enters five sides, each read as the standard net lays it out (`faces`
 * in the Cube module): yellow with green towards them, then each side face
 * with yellow up. The white side is then worked out from the other five
 * (`workOutWhite`) and confirmed. `check` says what about the Stickers
 * entered so far no real cube could have, and which sides or Stickers to
 * turn red. The page saves the Entry through `readEntry` / `writeEntry`,
 * which carry on without storage.
 */

import { FACES, SCHEME, fromFaces, faces, type Colour, type Cube, type Face, type Vec } from './cube';

/** Each side's nine Stickers in reading order, `null` where not yet painted. */
export type Sides = Record<Face, (Colour | null)[]>;

export interface Entry {
  readonly sides: Sides;
  /** The white side has been worked out and the viewer has said it matches. */
  readonly confirmed: boolean;
}

/** Where one Sticker is entered: its side and its place in reading order. */
export interface StickerRef {
  readonly face: Face;
  readonly index: number;
}

export type ProblemKind = 'count' | 'missing' | 'duplicate' | 'twist' | 'flip' | 'swap';

/**
 * Something no real cube could have. A problem on whole sides (`sides`)
 * turns those grids red; a problem across sides turns its `stickers` red.
 */
export interface Problem {
  readonly kind: ProblemKind;
  readonly sides: Face[];
  readonly stickers: StickerRef[];
  readonly message: string;
}

export const COLOURS: readonly Colour[] = ['yellow', 'white', 'green', 'blue', 'orange', 'red'];

/** The order the viewer enters the sides in: yellow first, then round the sides. */
export const ENTRY_ORDER: readonly Face[] = ['U', 'F', 'R', 'B', 'L'];

/** A side's centre, in reading order: fixed to the Scheme, never painted. */
export const CENTRE = 4;

const blankSide = (face: Face): (Colour | null)[] =>
  Array.from({ length: 9 }, (_, i) => (i === CENTRE ? SCHEME[face] : null));

export function blankEntry(): Entry {
  return { sides: Object.fromEntries(FACES.map((f) => [f, blankSide(f)])) as Sides, confirmed: false };
}

/** A Cube already on screen, loaded with all six sides and its white side confirmed. */
export function entryFromCube(cube: Cube): Entry {
  return { sides: faces(cube), confirmed: true };
}

const copySides = (sides: Sides): Sides =>
  Object.fromEntries(FACES.map((f) => [f, [...sides[f]]])) as Sides;

/**
 * Paints one Sticker; a centre stays as it is. Changing any of the five
 * sides forgets the white side worked out from them.
 */
export function paint(entry: Entry, face: Face, index: number, colour: Colour | null): Entry {
  if (index === CENTRE) return entry;
  const sides = copySides(entry.sides);
  sides[face][index] = colour;
  if (face !== 'D') sides.D = blankSide('D');
  return { sides, confirmed: false };
}

/** The viewer has said the worked-out white side matches their cube. */
export function confirmWhite(entry: Entry, white: Colour[]): Entry {
  return { sides: { ...copySides(entry.sides), D: [...white] }, confirmed: true };
}

/** The Entry as a Cube, once every Sticker is painted. */
export function entryCube(entry: Entry): Cube | null {
  const complete = FACES.every((f) => entry.sides[f].every((c) => c !== null));
  return complete ? fromFaces(entry.sides as Record<Face, Colour[]>) : null;
}

// --- Pieces --------------------------------------------------------------------

const refOrder = ({ face, index }: StickerRef) => FACES.indexOf(face) * 9 + index;
const byRef = (a: StickerRef, b: StickerRef) => refOrder(a) - refOrder(b);

interface Piece {
  /** Corners run anticlockwise (right-hand rule) round the corner, so a twist is a rotation. */
  readonly stickers: StickerRef[];
  readonly kind: 'edge' | 'corner';
}

const det = (a: Vec, b: Vec, c: Vec) =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);

/** Every edge and corner, each with its Stickers, in the order of their first Sticker. */
const PIECES: readonly Piece[] = (() => {
  const grid = Object.fromEntries(
    FACES.map((face) => [face, Array.from({ length: 9 }, (_, index) => ({ face, index }))]),
  ) as Record<Face, StickerRef[]>;
  const groups = new Map<string, { ref: StickerRef; normal: Vec }[]>();
  for (const { position, normal, colour } of fromFaces(grid).stickers) {
    const key = position.join(',');
    groups.set(key, [...(groups.get(key) ?? []), { ref: colour, normal }]);
  }
  const pieces: Piece[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => byRef(a.ref, b.ref));
    if (group.length === 2) pieces.push({ kind: 'edge', stickers: group.map((s) => s.ref) });
    if (group.length === 3) {
      const [a, b, c] = group;
      const turning = det(a.normal, b.normal, c.normal) > 0 ? [a, b, c] : [a, c, b];
      pieces.push({ kind: 'corner', stickers: turning.map((s) => s.ref) });
    }
  }
  return pieces.sort((p, q) => byRef(p.stickers[0], q.stickers[0]));
})();

/** The colours each piece has on a solved cube, in its Stickers' order. */
const HOME = PIECES.map((p) => p.stickers.map((s) => SCHEME[s.face]));

const rotations = <T>(xs: T[]) => xs.map((_, k) => [...xs.slice(k), ...xs.slice(0, k)]);

/** The arrangements a real piece of this kind can show: any rotation of a corner, either way round for an edge. */
const REAL: Record<Piece['kind'], Colour[][]> = { edge: [], corner: [] };
PIECES.forEach((p, i) => {
  const home = HOME[i];
  REAL[p.kind].push(...(p.kind === 'corner' ? rotations(home) : [home, [...home].reverse()]));
});

const colourKey = (colours: Colour[]) => [...colours].sort().join('+');

const fits = (shown: (Colour | null)[], real: Colour[]) => shown.every((c, i) => c === null || c === real[i]);

const exists = (piece: Piece, shown: (Colour | null)[]) => REAL[piece.kind].some((real) => fits(shown, real));

const shownOn = (sides: Sides, piece: Piece) => piece.stickers.map(({ face, index }) => sides[face][index]);

// --- Checking ---------------------------------------------------------------------

const MESSAGES = {
  missingEdge: 'No edge has these two colours. Check these two stickers.',
  missingCornerWay: 'No corner has these colours this way round. Check these three stickers.',
  missingCorner: 'No corner has these two colours. Check these two stickers.',
  duplicate: 'Two pieces have the same colours. Check these stickers.',
  twist: 'This corner is twisted. Check these three stickers.',
  flip: 'This edge is flipped. Check these two stickers.',
  swap: 'Two pieces are swapped. Check these stickers.',
} as const;

const missingMessage = (piece: Piece, known: number) =>
  piece.kind === 'edge' ? MESSAGES.missingEdge : known === 3 ? MESSAGES.missingCornerWay : MESSAGES.missingCorner;

const problem = (kind: Exclude<ProblemKind, 'count'>, stickers: StickerRef[], message: string): Problem => ({
  kind,
  sides: [],
  stickers: [...stickers].sort(byRef),
  message,
});

/** A corner's twist: how far round from its up-or-down Sticker its yellow or white one sits. */
function twist(piece: Piece, shown: Colour[]): number {
  const k = piece.stickers.findIndex((s) => s.face === 'U' || s.face === 'D');
  const j = shown.findIndex((c) => c === 'yellow' || c === 'white');
  return (j - k + 3) % 3;
}

/** Whether an edge is flipped: its yellow or white (else green or blue) Sticker is off its up-or-down (else front-or-back) place. */
function flipped(piece: Piece, shown: Colour[]): boolean {
  const ud = (f: Face) => f === 'U' || f === 'D';
  const fb = (f: Face) => f === 'F' || f === 'B';
  const place = piece.stickers.some((s) => ud(s.face))
    ? piece.stickers.findIndex((s) => ud(s.face))
    : piece.stickers.findIndex((s) => fb(s.face));
  const yw = shown.findIndex((c) => c === 'yellow' || c === 'white');
  const colour = yw >= 0 ? yw : shown.findIndex((c) => c === 'green' || c === 'blue');
  return place !== colour;
}

/** Whether a permutation (each place to the place its piece belongs) is odd. */
function odd(perm: number[]): boolean {
  const seen = new Set<number>();
  let cycles = 0;
  for (let start = 0; start < perm.length; start++) {
    if (seen.has(start)) continue;
    cycles++;
    for (let i = start; !seen.has(i); i = perm[i]) seen.add(i);
  }
  return (perm.length - cycles) % 2 === 1;
}

/**
 * The pair of pieces most likely entered swapped, given where each piece
 * belongs (`homeAt`): two pieces of the same kind sitting in each other's
 * homes, if any are; else two neighbours in an even-length cycle of the kind
 * whose pieces are an odd number of swaps from home, since swapping those back
 * would make the cube solvable.
 */
function swappedPair(corners: number[], edges: number[], homeAt: (i: number) => number): [number, number] {
  for (const places of [corners, edges]) {
    const i = places.find((i) => homeAt(i) !== i && homeAt(homeAt(i)) === i);
    if (i !== undefined) return [i, homeAt(i)];
  }
  const perm = (places: number[]) => places.map((i) => places.indexOf(homeAt(i)));
  const places = odd(perm(corners)) ? corners : edges;
  for (const start of places) {
    const cycle = [start];
    for (let i = homeAt(start); i !== start; i = homeAt(i)) cycle.push(i);
    if (cycle.length % 2 === 0) return [cycle[0], cycle[1]];
  }
  throw new Error('An odd permutation always has an even-length cycle');
}

/** What about these Stickers no real cube could have. Empty when they could all be real. */
export function check(sides: Sides): Problem[] {
  const problems: Problem[] = [];

  for (const colour of COLOURS) {
    const count = FACES.reduce((n, f) => n + sides[f].filter((c) => c === colour).length, 0);
    if (count > 9) {
      problems.push({
        kind: 'count',
        sides: FACES.filter((f) => sides[f].some((c, i) => i !== CENTRE && c === colour)),
        stickers: [],
        message: `There are ${count} ${colour} stickers, but a cube has only 9.`,
      });
    }
  }

  const shown = PIECES.map((p) => shownOn(sides, p));
  PIECES.forEach((piece, i) => {
    const known = piece.stickers.filter((_, k) => shown[i][k] !== null);
    if (known.length && !exists(piece, shown[i])) {
      problems.push(problem('missing', known, missingMessage(piece, known.length)));
    }
  });

  const complete = PIECES.map((_, i) => shown[i].every((c) => c !== null) && exists(PIECES[i], shown[i]));
  const byColours = new Map<string, number[]>();
  PIECES.forEach((_, i) => {
    if (!complete[i]) return;
    const key = colourKey(shown[i] as Colour[]);
    byColours.set(key, [...(byColours.get(key) ?? []), i]);
  });
  for (const same of byColours.values()) {
    if (same.length > 1) problems.push(problem('duplicate', same.flatMap((i) => PIECES[i].stickers), MESSAGES.duplicate));
  }

  if (problems.length || !complete.every(Boolean)) return problems;

  // Every piece is real and there is one of each: what is left is whether it could ever be solved.
  const full = shown as Colour[][];
  const corners = PIECES.flatMap((p, i) => (p.kind === 'corner' ? [i] : []));
  const edges = PIECES.flatMap((p, i) => (p.kind === 'edge' ? [i] : []));

  if (corners.reduce((sum, i) => sum + twist(PIECES[i], full[i]), 0) % 3 !== 0) {
    const first = corners.find((i) => twist(PIECES[i], full[i]) !== 0)!;
    problems.push(problem('twist', PIECES[first].stickers, MESSAGES.twist));
  }

  const flips = edges.filter((i) => flipped(PIECES[i], full[i]));
  if (flips.length % 2 === 1) problems.push(problem('flip', PIECES[flips[0]].stickers, MESSAGES.flip));

  const homeOf = new Map(HOME.map((colours, i) => [colourKey(colours), i]));
  const perm = (places: number[]) => places.map((i) => places.indexOf(homeOf.get(colourKey(full[i]))!));
  if (odd(perm(corners)) !== odd(perm(edges))) {
    const homeAt = (i: number) => homeOf.get(colourKey(full[i]))!;
    const pair = swappedPair(corners, edges, homeAt);
    problems.push(problem('swap', pair.flatMap((i) => PIECES[i].stickers), MESSAGES.swap));
  }

  return problems;
}

// --- Working out the white side ------------------------------------------------------

export type WhiteSide =
  /** Some of the five sides still have Stickers to paint. */
  | { kind: 'incomplete' }
  /** Exactly one white side makes a real cube. */
  | { kind: 'one'; white: Colour[] }
  /** More than one does: the viewer taps in the Stickers at `unknown`, which differ between the `options`. */
  | { kind: 'many'; unknown: number[]; options: Colour[][] }
  /** None does, and this is why. */
  | { kind: 'none'; problems: Problem[] };

/**
 * Works out the white side from the other five, and any white Stickers the
 * viewer has tapped in: every way of painting the rest that makes a cube
 * which could be solved.
 */
export function workOutWhite(sides: Sides): WhiteSide {
  if (ENTRY_ORDER.some((f) => sides[f].some((c) => c === null))) return { kind: 'incomplete' };
  const own = check(sides);
  if (own.length) return { kind: 'none', problems: own };

  // What each blank white Sticker could be, given the rest of its piece.
  const blanks = sides.D.flatMap((c, index) => (c === null ? [index] : []));
  const choices = blanks.map((index) => {
    const piece = PIECES.find((p) => p.stickers.some((s) => s.face === 'D' && s.index === index))!;
    return COLOURS.filter((colour) => {
      const trial = copySides(sides);
      trial.D[index] = colour;
      return exists(piece, shownOn(trial, piece));
    });
  });

  const solvable: Colour[][] = [];
  let closest: Problem[] | null = null;
  const fill = (k: number, white: (Colour | null)[]) => {
    if (k === blanks.length) {
      const problems = check({ ...sides, D: white });
      if (!problems.length) solvable.push(white as Colour[]);
      else if (!closest || problems.length < closest.length) closest = problems;
      return;
    }
    for (const colour of choices[k]) {
      const next = [...white];
      next[blanks[k]] = colour;
      fill(k + 1, next);
    }
  };
  fill(0, sides.D);

  if (solvable.length === 1) return { kind: 'one', white: solvable[0] };
  if (solvable.length > 1) {
    const unknown = blanks.filter((index) => solvable.some((w) => w[index] !== solvable[0][index]));
    return { kind: 'many', unknown, options: solvable };
  }
  // The white side isn't on screen yet: point only at what the viewer entered.
  const problems = (closest ?? []).map((p: Problem) => ({ ...p, stickers: p.stickers.filter((s) => s.face !== 'D') }));
  return { kind: 'none', problems };
}

// --- What the page shows ---------------------------------------------------------------

/** What an Entry says now: anything red, and the white side as far as it can be worked out. */
export interface Assessment {
  readonly problems: Problem[];
  /** The worked-out white side; null once it is confirmed, or while the five sides have problems of their own. */
  readonly white: WhiteSide | null;
  /** The white side to show: as worked out, blank where it could go more than one way. */
  readonly shownWhite: (Colour | null)[];
  /** The white side opens once the five are in and clean, and stays open while stickers tapped into it are fixed. */
  readonly whiteOpen: boolean;
}

const tappedWhite = (entry: Entry) => entry.sides.D.some((c, i) => i !== CENTRE && c !== null);

export function assess(entry: Entry): Assessment {
  const fiveEntered = ENTRY_ORDER.every((f) => !entry.sides[f].includes(null));
  const own = check(entry.sides);
  const open = (problems: Problem[]) => fiveEntered && (entry.confirmed || !problems.length || tappedWhite(entry));
  if (entry.confirmed || own.length) {
    return { problems: own, white: null, shownWhite: entry.sides.D, whiteOpen: open(own) };
  }
  const white = workOutWhite(entry.sides);
  const problems = white.kind === 'none' ? white.problems : [];
  const shownWhite =
    white.kind === 'one'
      ? white.white
      : white.kind === 'many'
        ? white.options[0].map((c, i) => (white.unknown.includes(i) ? null : c))
        : entry.sides.D;
  return { problems, white, shownWhite, whiteOpen: open(problems) };
}

/**
 * Whether a Sticker can be tapped: any but a centre on the five sides; on the
 * white side, until it is confirmed, only those tapped in already or that
 * can't be worked out.
 */
export function canTap(entry: Entry, { white }: Assessment, face: Face, index: number): boolean {
  if (index === CENTRE) return false;
  if (face !== 'D') return true;
  if (entry.confirmed) return false;
  return entry.sides.D[index] !== null || (white?.kind === 'many' && white.unknown.includes(index));
}

/** Taps a Sticker with the brush: paints it, or clears it if it already has that colour. */
export function tap(entry: Entry, face: Face, index: number, brush: Colour): Entry {
  return paint(entry, face, index, entry.sides[face][index] === brush ? null : brush);
}

// --- Saving -------------------------------------------------------------------------

export const STORAGE_KEY = 'speed-cubing:entry';

export function saveEntry(entry: Entry): string {
  return JSON.stringify({ sides: entry.sides, confirmed: entry.confirmed });
}

const isSide = (side: unknown): side is (Colour | null)[] =>
  Array.isArray(side) && side.length === 9 && side.every((c) => c === null || COLOURS.includes(c));

/** The Entry saved in `raw`, or a blank one if there is none or it is not one. Centres stay where they belong. */
export function loadEntry(raw: string | null | undefined): Entry {
  try {
    const data = JSON.parse(raw ?? '');
    const sides = data?.sides;
    if (typeof data.confirmed !== 'boolean' || !sides || !FACES.every((f) => isSide(sides[f]))) return blankEntry();
    const out = copySides(sides);
    for (const f of FACES) out[f][CENTRE] = SCHEME[f];
    return { sides: out, confirmed: data.confirmed };
  } catch {
    return blankEntry();
  }
}

/** Reads the saved Entry; a blank one when storage is missing or refuses. */
export function readEntry(storage: Pick<Storage, 'getItem'> | null): Entry {
  try {
    return loadEntry(storage?.getItem(STORAGE_KEY));
  } catch {
    return blankEntry();
  }
}

/** Saves the Entry if storage will have it, and carries on if it won't. */
export function writeEntry(storage: Pick<Storage, 'setItem'> | null, entry: Entry): void {
  try {
    storage?.setItem(STORAGE_KEY, saveEntry(entry));
  } catch {
    // No storage: the Entry lasts as long as the page.
  }
}

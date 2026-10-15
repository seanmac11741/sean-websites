import { describe, expect, it } from 'vitest';
import { applyMoves, faces, solvedCube, type Colour, type Face } from '../../src/lib/speed-cubing/cube';
import { scramble } from '../../src/lib/speed-cubing/scramble';
import {
  blankEntry,
  check,
  confirmWhite,
  entryCube,
  entryFromCube,
  loadEntry,
  paint,
  readEntry,
  saveEntry,
  workOutWhite,
  writeEntry,
  type Entry,
  type Sides,
} from '../../src/lib/speed-cubing/entry';

const sidesOf = (moves = ''): Sides => faces(applyMoves(solvedCube(), moves));

/** The five sides a viewer enters, with the white side left for working out. */
const fiveSidesOf = (moves = ''): Sides => ({
  ...sidesOf(moves),
  D: [null, null, null, null, 'white', null, null, null, null],
});

/** Changes some stickers: `with_(sides, ['U', 7, 'blue'], …)`. */
function with_(sides: Sides, ...changes: [Face, number, Colour | null][]): Sides {
  const out = Object.fromEntries(Object.entries(sides).map(([f, g]) => [f, [...g]])) as unknown as Sides;
  for (const [face, index, colour] of changes) out[face][index] = colour;
  return out;
}

const kinds = (sides: Sides) => check(sides).map((p) => p.kind);

describe('check: a cube that could be real', () => {
  it('finds nothing wrong with a solved cube, a scrambled one, or a part-entered one', () => {
    expect(check(sidesOf())).toEqual([]);
    expect(check(sidesOf("R U2 F' L D B2 R' U F2 D'"))).toEqual([]);
    expect(check(fiveSidesOf("R U2 F' L D B2"))).toEqual([]);
    expect(check(blankEntry().sides)).toEqual([]);
  });
});

describe('check: nine of each colour', () => {
  it('turns red the sides holding a colour there is too much of', () => {
    const sides = with_(fiveSidesOf(), ['U', 0, 'green']);
    const problem = check(sides).find((p) => p.kind === 'count')!;
    expect(problem.sides.sort()).toEqual(['F', 'U']);
    expect(problem.stickers).toEqual([]);
    expect(problem.message).toBe('There are 10 green stickers, but a cube has only 9.');
  });
});

describe('check: every piece exists', () => {
  it('turns red an edge whose two colours are on opposite sides of a real cube', () => {
    const sides = with_(sidesOf(), ['U', 7, 'blue']);
    const problem = check(sides).find((p) => p.kind === 'missing')!;
    expect(problem.stickers).toEqual([
      { face: 'U', index: 7 },
      { face: 'F', index: 1 },
    ]);
    expect(problem.sides).toEqual([]);
    expect(problem.message).toBe('No edge has these two colours. Check these two stickers.');
  });

  it('turns red a corner whose colours run the wrong way round, as no real corner does', () => {
    // Swapping two stickers of a corner mirrors it.
    const sides = with_(sidesOf(), ['U', 8, 'green'], ['F', 2, 'yellow']);
    expect(kinds(sides)).toEqual(['missing']);
    expect(check(sides)[0].stickers).toEqual([
      { face: 'U', index: 8 },
      { face: 'F', index: 2 },
      { face: 'R', index: 0 },
    ]);
    expect(check(sides)[0].message).toBe('No corner has these colours this way round. Check these three stickers.');
  });

  it('checks a piece only partly entered against the stickers it has', () => {
    // The white side is yet to be entered, but red and orange can never share a corner.
    const sides = with_(fiveSidesOf(), ['F', 8, 'red']);
    const problem = check(sides).find((p) => p.kind === 'missing')!;
    expect(problem.stickers).toEqual([
      { face: 'F', index: 8 },
      { face: 'R', index: 6 },
    ]);
    expect(problem.message).toBe('No corner has these two colours. Check these two stickers.');
  });

  it('turns red two pieces with the same colours', () => {
    const sides = with_(sidesOf(), ['U', 7, 'white']); // the white-green edge, twice
    const problem = check(sides).find((p) => p.kind === 'duplicate')!;
    expect(problem.stickers).toEqual([
      { face: 'U', index: 7 },
      { face: 'D', index: 1 },
      { face: 'F', index: 1 },
      { face: 'F', index: 7 },
    ]);
    expect(problem.message).toBe('Two pieces have the same colours. Check these stickers.');
  });
});

describe('check: a cube that could be scrambled but never solved', () => {
  it('turns red a twisted corner', () => {
    const sides = with_(sidesOf(), ['U', 8, 'green'], ['F', 2, 'orange'], ['R', 0, 'yellow']);
    expect(check(sides)).toEqual([
      {
        kind: 'twist',
        sides: [],
        stickers: [
          { face: 'U', index: 8 },
          { face: 'F', index: 2 },
          { face: 'R', index: 0 },
        ],
        message: 'This corner is twisted. Check these three stickers.',
      },
    ]);
  });

  it('turns red a flipped edge', () => {
    const sides = with_(sidesOf(), ['U', 7, 'green'], ['F', 1, 'yellow']);
    expect(check(sides)).toEqual([
      {
        kind: 'flip',
        sides: [],
        stickers: [
          { face: 'U', index: 7 },
          { face: 'F', index: 1 },
        ],
        message: 'This edge is flipped. Check these two stickers.',
      },
    ]);
  });

  it('turns red a single swapped pair', () => {
    // The yellow-green and yellow-orange edges change places.
    const sides = with_(sidesOf(), ['F', 1, 'orange'], ['R', 1, 'green']);
    expect(check(sides)).toEqual([
      {
        kind: 'swap',
        sides: [],
        stickers: [
          { face: 'U', index: 5 },
          { face: 'U', index: 7 },
          { face: 'F', index: 1 },
          { face: 'R', index: 1 },
        ],
        message: 'Two pieces are swapped. Check these stickers.',
      },
    ]);
  });

  it('turns red the two pieces sitting in each other’s places, not just any misplaced pieces', () => {
    // The top edges cycle three ways round (a real cube can do that), and the
    // yellow-green-red and yellow-green-orange corners have been entered swapped.
    const cycled = sidesOf("R U' R U R U R U' R' U' R2");
    const sides = with_(
      cycled,
      ['U', 6, cycled.U[8]], ['L', 2, cycled.F[2]], ['F', 0, cycled.R[0]],
      ['U', 8, cycled.U[6]], ['R', 0, cycled.F[0]], ['F', 2, cycled.L[2]],
    );
    const [problem] = check(sides);
    expect(problem.kind).toBe('swap');
    expect(problem.stickers).toEqual([
      { face: 'U', index: 6 },
      { face: 'U', index: 8 },
      { face: 'F', index: 0 },
      { face: 'F', index: 2 },
      { face: 'L', index: 2 },
      { face: 'R', index: 0 },
    ]);
  });

  it('turns red two misplaced pieces of the same kind when no two sit in each other’s places', () => {
    // The top edges have gone a quarter turn round, but the corners stayed home.
    const turned = sidesOf('U');
    const solved = sidesOf();
    const sides = with_(
      turned,
      ...([0, 2, 6, 8] as const).map((i): [Face, number, Colour] => ['U', i, solved.U[i]!]),
      ...(['F', 'R', 'B', 'L'] as const).flatMap((f) => [0, 2].map((i): [Face, number, Colour] => [f, i, solved[f][i]!])),
    );
    const [problem] = check(sides);
    expect(problem.kind).toBe('swap');
    expect(problem.stickers).toHaveLength(4);
    const edgeSticker = ({ face, index }: { face: Face; index: number }) =>
      face === 'U' ? [1, 3, 5, 7].includes(index) : index === 1;
    expect(problem.stickers.every(edgeSticker)).toBe(true);
  });

  it('finds a twist on a scrambled cube too', () => {
    const scrambled = sidesOf("R U2 F' L D B2 R' U F2 D'");
    const [u, f, r] = [scrambled.U[8], scrambled.F[2], scrambled.R[0]];
    expect(kinds(with_(scrambled, ['U', 8, f], ['F', 2, r], ['R', 0, u]))).toEqual(['twist']);
  });
});

describe('workOutWhite', () => {
  it('works out the white side from the other five', () => {
    const moves = "R U2 F' L D B2 R' U F2 D'";
    expect(workOutWhite(fiveSidesOf(moves))).toEqual({ kind: 'one', white: sidesOf(moves).D });
  });

  it('always finds the real white side among those it works out, for any scramble', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let n = 0; n < 40; n++) {
      const moves = scramble(random).slice(0, 25).join(' ');
      expect(check(sidesOf(moves))).toEqual([]);
      const result = workOutWhite(fiveSidesOf(moves));
      const options = result.kind === 'one' ? [result.white] : result.kind === 'many' ? result.options : [];
      expect(options).toContainEqual(sidesOf(moves).D);
    }
  });

  it('waits until all five sides are entered', () => {
    expect(workOutWhite(with_(fiveSidesOf(), ['F', 0, null]))).toEqual({ kind: 'incomplete' });
  });

  it('asks only for the stickers that cannot be worked out when more than one white side is possible', () => {
    // Three of the bottom edges have their white sticker facing sideways, so
    // the three colours underneath could go round either way.
    const moves = "F R2 R' L F' F2 B";
    const result = workOutWhite(fiveSidesOf(moves));
    if (result.kind !== 'many') throw new Error(`expected many, got ${result.kind}`);
    expect(result.unknown).toHaveLength(3);
    expect(result.unknown.every((i) => [1, 3, 5, 7].includes(i))).toBe(true);
    expect(result.options).toContainEqual(sidesOf(moves).D);

    // Tapping one of them in settles the rest.
    const tapped = result.unknown[0];
    const answer = with_(fiveSidesOf(moves), ['D', tapped, sidesOf(moves).D[tapped]]);
    expect(workOutWhite(answer)).toEqual({ kind: 'one', white: sidesOf(moves).D });
  });

  it('says what is wrong when no white side would make a real cube', () => {
    const sides = with_(fiveSidesOf(), ['U', 7, 'green'], ['F', 1, 'yellow']);
    const result = workOutWhite(sides);
    expect(result.kind).toBe('none');
    if (result.kind !== 'none') return;
    expect(result.problems).toEqual([
      expect.objectContaining({
        kind: 'flip',
        stickers: [
          { face: 'U', index: 7 },
          { face: 'F', index: 1 },
        ],
      }),
    ]);
  });

  it('reports the five sides’ own problems before working anything out', () => {
    const sides = with_(fiveSidesOf(), ['U', 7, 'blue']);
    const result = workOutWhite(sides);
    expect(result.kind === 'none' && result.problems.map((p) => p.kind)).toContain('missing');
  });
});

describe('paint', () => {
  it('paints a sticker but never a centre', () => {
    const entry = paint(blankEntry(), 'F', 0, 'red');
    expect(entry.sides.F[0]).toBe('red');
    expect(paint(entry, 'F', 4, 'red').sides.F[4]).toBe('green');
  });

  it('forgets the worked-out white side when one of the five sides changes', () => {
    const confirmed = entryFromCube(applyMoves(solvedCube(), "R U F'"));
    const changed = paint(confirmed, 'F', 0, 'red');
    expect(changed.confirmed).toBe(false);
    expect(changed.sides.D).toEqual([null, null, null, null, 'white', null, null, null, null]);
    // Tapping a white sticker keeps the rest of the white side.
    expect(paint(confirmed, 'D', 0, 'red').sides.D.filter((c) => c === null)).toHaveLength(0);
  });
});

describe('confirmWhite and entryCube', () => {
  it('a confirmed white side completes the Entry, which is then the viewer’s Cube', () => {
    const moves = "R U2 F' L D";
    const fivesEntered = { sides: fiveSidesOf(moves), confirmed: false };
    expect(entryCube(fivesEntered)).toBeNull();
    const done = confirmWhite(fivesEntered, sidesOf(moves).D as Colour[]);
    expect(done.confirmed).toBe(true);
    expect(faces(entryCube(done)!)).toEqual(faces(applyMoves(solvedCube(), moves)));
  });
});

describe('entryFromCube', () => {
  it('loads a cube with all six sides entered and the white side already confirmed', () => {
    const cube = applyMoves(solvedCube(), "R U2 F' L D");
    const entry = entryFromCube(cube);
    expect(entry.sides).toEqual(faces(cube));
    expect(entry.confirmed).toBe(true);
  });
});

describe('saving and loading', () => {
  it('a blank entry has only its centres', () => {
    const { sides, confirmed } = blankEntry();
    expect(confirmed).toBe(false);
    expect(sides.U).toEqual([null, null, null, null, 'yellow', null, null, null, null]);
    expect(sides.D[4]).toBe('white');
  });

  it('loads back what it saved', () => {
    const entry = paint(paint(blankEntry(), 'U', 0, 'red'), 'R', 8, 'white');
    expect(loadEntry(saveEntry(entry))).toEqual(entry);
    const confirmed = entryFromCube(applyMoves(solvedCube(), 'R U'));
    expect(loadEntry(saveEntry(confirmed))).toEqual(confirmed);
  });

  it('starts blank from nothing saved, junk, or something of the wrong shape', () => {
    expect(loadEntry(null)).toEqual(blankEntry());
    expect(loadEntry('not json')).toEqual(blankEntry());
    expect(loadEntry('{"sides":{"U":[1,2,3]},"confirmed":true}')).toEqual(blankEntry());
    const bad = JSON.parse(saveEntry(blankEntry()));
    bad.sides.F[0] = 'purple';
    expect(loadEntry(JSON.stringify(bad))).toEqual(blankEntry());
  });

  it('keeps the centres where they belong whatever was saved', () => {
    const tampered = JSON.parse(saveEntry(blankEntry()));
    tampered.sides.F[4] = 'red';
    expect(loadEntry(JSON.stringify(tampered)).sides.F[4]).toBe('green');
  });

  it('reads and writes storage, and carries on without it', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const entry: Entry = paint(blankEntry(), 'L', 2, 'blue');
    writeEntry(storage, entry);
    expect(readEntry(storage)).toEqual(entry);

    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => writeEntry(broken, entry)).not.toThrow();
    expect(readEntry(broken)).toEqual(blankEntry());
    expect(readEntry(null)).toEqual(blankEntry());
    expect(() => writeEntry(null, entry)).not.toThrow();
  });
});

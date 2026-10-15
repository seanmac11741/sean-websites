import { describe, expect, it } from 'vitest';
import { applyMoves, faces, isSolved, solvedCube, type Colour, type Cube } from '../../src/lib/speed-cubing/cube';
import {
  algorithmMoves,
  LOOKS,
  PLL_CORNERS,
  PLL_EDGES,
  recognise,
  solveLastLayer,
  YELLOW_CORNERS,
  YELLOW_CROSS,
  type Look,
} from '../../src/lib/speed-cubing/last-layer';

/** Undoes a run of moves: reversed, each one turned the other way. */
const inverse = (moves: readonly string[]) =>
  [...moves].reverse().map((m) => (m.endsWith("'") ? m[0] : m.endsWith('2') ? m : `${m}'`));

/** The case an algorithm solves: a solved cube with the algorithm run backwards. */
const caseOf = (look: Look, name: string): Cube => {
  const algorithm = look.algorithms.find((a) => a.name === name)!;
  return applyMoves(solvedCube(), inverse(algorithmMoves(algorithm)).join(' '));
};

const Y: Colour = 'yellow';
const SIDES = ['F', 'R', 'B', 'L'] as const;
/** The U face in net order: back row, middle row, front row, left to right. */
const top = (cube: Cube) => faces(cube).U.map((c) => c === Y);
/** A side face's top row, left to right as you look at that face. */
const row = (cube: Cube, face: 'F' | 'R' | 'B' | 'L') => faces(cube)[face].slice(0, 3);
const yellowIn = (cube: Cube, face: 'F' | 'R' | 'B' | 'L') => row(cube, face).map((c) => c === Y);

/** Everything below the top layer is home, and every centre is where it started. */
function firstTwoLayersSolved(cube: Cube): boolean {
  const f = faces(cube);
  return (
    f.D.every((c) => c === 'white') &&
    SIDES.every((face) => f[face].slice(3).every((c) => c === f[face][4])) &&
    f.F[4] === 'green' &&
    f.U[4] === Y
  );
}

describe('the algorithms from the CFOP notes', () => {
  it('expand the notes’ shorthand into moves: brackets dropped, (…)x3 repeated', () => {
    const h = YELLOW_CORNERS.algorithms.find((a) => a.name === 'H')!;
    expect(algorithmMoves(h)).toEqual(['F', ...Array(3).fill(['R', 'U', "R'", "U'"]).flat(), "F'"]);
  });

  it('turn the view back after an algorithm that starts with a whole-cube x', () => {
    const l = YELLOW_CORNERS.algorithms.find((a) => a.name === 'L')!;
    expect(algorithmMoves(l)).toEqual(['x', "R'", 'U', 'R', "D'", "R'", "U'", 'R', 'D', "x'"]);
  });

  it('every one keeps the first two layers and the centres where they were', () => {
    for (const look of LOOKS) {
      for (const algorithm of look.algorithms) {
        expect(firstTwoLayersSolved(applyMoves(solvedCube(), algorithmMoves(algorithm).join(' ')))).toBe(true);
      }
    }
  });

  describe('OLL step 1: the yellow cross', () => {
    const edges = (cube: Cube) => [1, 3, 5, 7].map((i) => top(cube)[i]);
    it('L-shape solves two yellow edges side by side', () => {
      const [b, l, r, f] = edges(caseOf(YELLOW_CROSS, 'L-shape'));
      expect(b === f || l === r).toBe(false);
      expect([b, l, r, f].filter(Boolean)).toHaveLength(2);
    });
    it('Line solves two yellow edges across from each other', () => {
      const [b, l, r, f] = edges(caseOf(YELLOW_CROSS, 'Line'));
      expect([b, l, r, f].filter(Boolean)).toHaveLength(2);
      expect(b === f && l === r).toBe(true);
    });
    it('Dot solves no yellow edges at all', () => {
      expect(edges(caseOf(YELLOW_CROSS, 'Dot'))).toEqual([false, false, false, false]);
    });
  });

  describe('OLL step 2: the corners, with the cross already made', () => {
    /** Yellow-up corners: back-left, back-right, front-left, front-right. */
    const corners = (cube: Cube) => [0, 2, 6, 8].map((i) => top(cube)[i]);
    const cross = (cube: Cube) => [1, 3, 5, 7].every((i) => top(cube)[i]);

    it('Antisune: one corner yellow up, yellow on the front face’s top left', () => {
      const cube = caseOf(YELLOW_CORNERS, 'Antisune');
      expect(cross(cube)).toBe(true);
      expect(corners(cube).filter(Boolean)).toHaveLength(1);
      expect(yellowIn(cube, 'F')[0]).toBe(true);
    });
    it('Sune: one corner yellow up, yellow on the front face’s top right', () => {
      const cube = caseOf(YELLOW_CORNERS, 'Sune');
      expect(corners(cube).filter(Boolean)).toHaveLength(1);
      expect(yellowIn(cube, 'F')[2]).toBe(true);
    });
    it('H: no corner yellow up, two yellow on the front and two on the back', () => {
      const cube = caseOf(YELLOW_CORNERS, 'H');
      expect(corners(cube)).toEqual([false, false, false, false]);
      expect(yellowIn(cube, 'F')).toEqual([true, false, true]);
      expect(yellowIn(cube, 'B')).toEqual([true, false, true]);
    });
    it('Pi: no corner yellow up, two yellow on one side and none on the side across from it', () => {
      const cube = caseOf(YELLOW_CORNERS, 'Pi');
      expect(corners(cube)).toEqual([false, false, false, false]);
      const pairs = SIDES.map((f) => yellowIn(cube, f).filter(Boolean).length);
      const two = pairs.indexOf(2);
      expect(two).toBeGreaterThanOrEqual(0);
      expect(pairs[(two + 2) % 4]).toBe(0);
    });
    it('L: two corners yellow up, diagonally across', () => {
      const [bl, br, fl, fr] = corners(caseOf(YELLOW_CORNERS, 'L'));
      expect((bl && fr && !br && !fl) || (br && fl && !bl && !fr)).toBe(true);
    });
    it('T: two adjacent corners yellow up, the other two facing opposite ways', () => {
      const cube = caseOf(YELLOW_CORNERS, 'T');
      const [bl, br, fl, fr] = corners(cube);
      // Up at back-right and front-right; the left two face front and back.
      expect([bl, br, fl, fr]).toEqual([false, true, false, true]);
      expect(yellowIn(cube, 'F')[0]).toBe(true);
      expect(yellowIn(cube, 'B')[2]).toBe(true);
    });
    it('U: two adjacent corners yellow up, the other two "headlights" on one face', () => {
      const cube = caseOf(YELLOW_CORNERS, 'U');
      expect(corners(cube)).toEqual([true, true, false, false]);
      expect(yellowIn(cube, 'F')).toEqual([true, false, true]);
    });
  });

  describe('PLL step 1: the corners', () => {
    const headlights = (cube: Cube) =>
      SIDES.filter((f) => row(cube, f)[0] === row(cube, f)[2]);

    it('Diagonal Swap: no face has matching corners', () => {
      expect(headlights(caseOf(PLL_CORNERS, 'Diagonal Swap'))).toEqual([]);
    });
    it('Adjacent Corner Swap: one solved pair, on the left', () => {
      expect(headlights(caseOf(PLL_CORNERS, 'Adjacent Corner Swap'))).toEqual(['L']);
    });
  });

  describe('PLL step 2: the edges, corners already in place', () => {
    /** Where each top edge's colour belongs: the face whose centre matches it. */
    const edge = (cube: Cube, face: 'F' | 'R' | 'B' | 'L') => row(cube, face)[1];
    const centre = (cube: Cube, face: 'F' | 'R' | 'B' | 'L') => faces(cube)[face][4];
    const cornersHome = (cube: Cube) =>
      SIDES.every((f) => row(cube, f)[0] === centre(cube, f) && row(cube, f)[2] === centre(cube, f));

    it('Right to Left: solved edge at the back; the right edge belongs on the left', () => {
      const cube = caseOf(PLL_EDGES, 'Right to Left');
      expect(cornersHome(cube)).toBe(true);
      expect(edge(cube, 'B')).toBe(centre(cube, 'B'));
      expect(edge(cube, 'R')).toBe(centre(cube, 'L'));
      expect(edge(cube, 'L')).toBe(centre(cube, 'F'));
    });
    it('Left to Right: solved edge at the back; the left edge belongs on the right', () => {
      const cube = caseOf(PLL_EDGES, 'Left to Right');
      expect(edge(cube, 'B')).toBe(centre(cube, 'B'));
      expect(edge(cube, 'L')).toBe(centre(cube, 'R'));
      expect(edge(cube, 'R')).toBe(centre(cube, 'F'));
    });
    it('Opposite Edge Swap: front with back, left with right', () => {
      const cube = caseOf(PLL_EDGES, 'Opposite Edge Swap');
      expect(cornersHome(cube)).toBe(true);
      expect([edge(cube, 'F'), edge(cube, 'B'), edge(cube, 'L'), edge(cube, 'R')]).toEqual(['blue', 'green', 'orange', 'red']);
    });
    it('Adjacent Edge Swap: two pairs of neighbouring edges swapped', () => {
      const cube = caseOf(PLL_EDGES, 'Adjacent Edge Swap');
      expect(cornersHome(cube)).toBe(true);
      const wrong = SIDES.filter((f) => edge(cube, f) !== centre(cube, f));
      expect(wrong).toHaveLength(4);
      for (const f of wrong) {
        const opposite = { F: 'B', B: 'F', L: 'R', R: 'L' } as const;
        expect(edge(cube, f)).not.toBe(centre(cube, opposite[f]));
      }
    });
  });
});

describe('recognise', () => {
  const OFFSETS = ['', 'U', 'U2', "U'"];

  it('names every case at every U-turn offset, and lines it up so its algorithm finishes the Look', () => {
    for (const look of LOOKS) {
      for (const { name } of look.algorithms) {
        for (const offset of OFFSETS) {
          const cube = applyMoves(caseOf(look, name), offset);
          const found = recognise(cube, look);
          expect(found?.algorithm.name, `${look.title}: ${name} after "${offset}"`).toBe(name);
          expect(found!.setup.length).toBeLessThanOrEqual(1);
          expect(found!.setup.every((m) => /^U(2|')?$/.test(m))).toBe(true);
          const after = applyMoves(cube, [...found!.setup, ...algorithmMoves(found!.algorithm)].join(' '));
          expect(look.done(after), `${look.title}: ${name} after "${offset}"`).toBe(true);
        }
      }
    }
  });

  it('finds nothing to do once a Look is already done', () => {
    for (const look of LOOKS) {
      for (const offset of OFFSETS) expect(recognise(applyMoves(solvedCube(), offset), look)).toBeNull();
    }
  });

  it('knows each Look’s goal: the cross, then the whole top yellow, then the corners, then every edge', () => {
    const sune = caseOf(YELLOW_CORNERS, 'Sune');
    expect(YELLOW_CROSS.done(sune)).toBe(true);
    expect(YELLOW_CORNERS.done(sune)).toBe(false);
    const swap = caseOf(PLL_CORNERS, 'Adjacent Corner Swap');
    expect(YELLOW_CORNERS.done(swap)).toBe(true);
    expect(PLL_CORNERS.done(swap)).toBe(false);
    const cycle = applyMoves(caseOf(PLL_EDGES, 'Right to Left'), 'U');
    expect(PLL_CORNERS.done(cycle)).toBe(true);
    expect(PLL_EDGES.done(cycle)).toBe(false);
    // Lined up but for a U-turn still counts: the solve turns U once at the end.
    expect(PLL_EDGES.done(applyMoves(solvedCube(), 'U'))).toBe(true);
  });
});

describe('solveLastLayer', () => {
  /** A cube with F2L done and the top layer jumbled by whole algorithms. */
  const jumbled = applyMoves(
    solvedCube(),
    "R U R' U R U2 R' U F R U R' U' F' U2 R U R' U' R' F R2 U' R' U' R U R' F' U' M2 U' M2 U2 M2 U' M2",
  );

  it('plays the four Looks in order, each labelled with the case it found', () => {
    const stages = solveLastLayer(jumbled);
    expect(stages).toHaveLength(4);
    expect(stages.map((s) => s.label.split(':')[0])).toEqual(['OLL', 'OLL', 'PLL', 'PLL']);
    for (const [i, stage] of stages.entries()) {
      const names = LOOKS[i].algorithms.map((a) => `${LOOKS[i].method}: ${a.name}`);
      if (stage.moves.length) expect(names).toContain(stage.label);
    }
  });

  it('makes each Stage a U-turn to line up, then one algorithm from the notes; only the last may add a final U-turn', () => {
    const isU = (m: string | undefined) => m !== undefined && /^U(2|')?$/.test(m);
    for (const offset of ['', 'U', 'U2', "U'"]) {
      solveLastLayer(applyMoves(jumbled, offset)).forEach((stage, i) => {
        if (!stage.moves.length) return;
        const look = LOOKS[i];
        const algorithm = look.algorithms.find((a) => `${look.method}: ${a.name}` === stage.label)!;
        const body = algorithmMoves(algorithm);
        const moves = [...stage.moves];
        if (moves.length > body.length && isU(moves[0])) moves.shift();
        if (i === LOOKS.length - 1 && moves.length > body.length && isU(moves.at(-1))) moves.pop();
        expect(moves).toEqual(body);
      });
    }
  });

  it('ends solved', () => {
    const stages = solveLastLayer(jumbled);
    expect(isSolved(applyMoves(jumbled, stages.flatMap((s) => s.moves).join(' ')))).toBe(true);
  });

  it('has nothing to do on a solved cube but name its four Looks', () => {
    expect(solveLastLayer(solvedCube())).toEqual([
      { label: 'OLL: Yellow cross', moves: [] },
      { label: 'OLL: Yellow corners', moves: [] },
      { label: 'PLL: Corners', moves: [] },
      { label: 'PLL: Edges', moves: [] },
    ]);
  });

  it('only turns the top layer to line it up when that is all that is left', () => {
    expect(solveLastLayer(applyMoves(solvedCube(), 'U')).map((s) => s.moves)).toEqual([[], [], [], ["U'"]]);
  });
});

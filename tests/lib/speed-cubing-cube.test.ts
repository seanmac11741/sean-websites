import { describe, expect, it } from 'vitest';
import {
  applyMoves,
  faces,
  fromFaces,
  inverseMove,
  isSolved,
  parseMove,
  solvedCube,
  type Axis,
  type Colour,
  type Cube,
  type Face,
  type Vec,
} from '../../src/lib/speed-cubing/cube';

const nine = (c: Colour) => Array<Colour>(9).fill(c);

describe('solved cube', () => {
  it('holds the scheme as the viewer holds it: yellow up, white down, green front, orange right, red left, blue back', () => {
    expect(faces(solvedCube())).toEqual({
      U: nine('yellow'),
      D: nine('white'),
      F: nine('green'),
      R: nine('orange'),
      L: nine('red'),
      B: nine('blue'),
    });
  });
});

describe('isSolved', () => {
  it('is true when every face is one colour, whichever way the cube is held', () => {
    expect(isSolved(solvedCube())).toBe(true);
    expect(isSolved(applyMoves(solvedCube(), 'x y'))).toBe(true);
    expect(isSolved(applyMoves(solvedCube(), "R U R' U'"))).toBe(false);
    expect(isSolved(applyMoves(solvedCube(), 'M'))).toBe(false);
  });
});

/** Shorthand for a face in reading order: one letter per sticker. */
const LETTER: Record<string, Colour> = { Y: 'yellow', W: 'white', G: 'green', O: 'orange', R: 'red', B: 'blue' };
const face = (s: string) => [...s.replace(/\s/g, '')].map((c) => LETTER[c]);

describe('face turns', () => {
  it('R carries the front up, the top to the back, the back down and the bottom to the front', () => {
    const f = faces(applyMoves(solvedCube(), 'R'));
    expect(f.U).toEqual(face('YYG YYG YYG'));
    expect(f.F).toEqual(face('GGW GGW GGW'));
    expect(f.D).toEqual(face('WWB WWB WWB'));
    expect(f.B).toEqual(face('YBB YBB YBB'));
    expect(f.R).toEqual(face('OOO OOO OOO'));
    expect(f.L).toEqual(face('RRR RRR RRR'));
  });

  it('U carries the front row to the left', () => {
    const f = faces(applyMoves(solvedCube(), 'U'));
    expect(f.F.slice(0, 3)).toEqual(face('OOO'));
    expect(f.L.slice(0, 3)).toEqual(face('GGG'));
    expect(f.B.slice(0, 3)).toEqual(face('RRR'));
    expect(f.R.slice(0, 3)).toEqual(face('BBB'));
    expect(f.F.slice(3)).toEqual(face('GGG GGG'));
  });

  it('F carries the top row to the right', () => {
    const f = faces(applyMoves(solvedCube(), 'F'));
    expect(f.U).toEqual(face('YYY YYY RRR'));
    expect(f.R).toEqual(face('YOO YOO YOO'));
    expect(f.D).toEqual(face('OOO WWW WWW'));
    expect(f.L).toEqual(face('RRW RRW RRW'));
  });

  it('L, D and B turn clockwise as seen looking at their own face', () => {
    expect(faces(applyMoves(solvedCube(), 'L')).F).toEqual(face('YGG YGG YGG'));
    expect(faces(applyMoves(solvedCube(), 'D')).F).toEqual(face('GGG GGG RRR'));
    expect(faces(applyMoves(solvedCube(), 'B')).U).toEqual(face('OOO YYY YYY'));
  });
});

/** A scrambled start, so an identity can't pass just because the cube is solved. */
const SCRAMBLED = applyMoves(solvedCube(), "R U2 F' L D B2 U' R2 F");

describe('primes, doubles and identities', () => {
  const FACE_TURNS = ['U', 'D', 'L', 'R', 'F', 'B'];

  it.each(FACE_TURNS)("%s' undoes %s", (m) => {
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m}'`))).toEqual(faces(SCRAMBLED));
    expect(faces(applyMoves(SCRAMBLED, `${m}'`))).not.toEqual(faces(SCRAMBLED));
  });

  it.each(FACE_TURNS)('%s2 is two quarter turns, and undoes itself', (m) => {
    expect(faces(applyMoves(SCRAMBLED, `${m}2`))).toEqual(faces(applyMoves(SCRAMBLED, `${m} ${m}`)));
    expect(faces(applyMoves(SCRAMBLED, `${m}2 ${m}2`))).toEqual(faces(SCRAMBLED));
  });

  it.each(FACE_TURNS)('four quarter turns of %s are the identity', (m) => {
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m} ${m} ${m}`))).toEqual(faces(SCRAMBLED));
  });

  it("the sexy move, R U R' U', comes back to solved after six goes and not before", () => {
    let cube = solvedCube();
    for (let i = 1; i <= 6; i++) {
      cube = applyMoves(cube, "R U R' U'");
      if (i < 6) expect(faces(cube)).not.toEqual(faces(solvedCube()));
      else expect(faces(cube)).toEqual(faces(solvedCube()));
    }
  });

  it('rejects anything that is not a move', () => {
    expect(() => applyMoves(solvedCube(), 'Q')).toThrow(/Not a move: Q/);
    expect(() => applyMoves(solvedCube(), "R3")).toThrow();
  });
});

describe('two-layer turns and slices', () => {
  it('r turns the right face and the middle slice with it', () => {
    const f = faces(applyMoves(solvedCube(), 'r'));
    expect(f.F).toEqual(face('GWW GWW GWW'));
    expect(f.U).toEqual(face('YGG YGG YGG'));
    expect(f.L).toEqual(face('RRR RRR RRR'));
  });

  it('each two-layer turn is its face turn plus the slice behind it', () => {
    const f = faces(applyMoves(solvedCube(), 'f'));
    expect(f.U).toEqual(face('YYY RRR RRR'));
    expect(f.R).toEqual(face('YYO YYO YYO'));
    expect(faces(applyMoves(solvedCube(), 'u')).F).toEqual(face('OOO OOO GGG'));
    expect(faces(applyMoves(solvedCube(), 'l')).F).toEqual(face('YYG YYG YYG'));
    expect(faces(applyMoves(solvedCube(), 'd')).F).toEqual(face('GGG RRR RRR'));
    expect(faces(applyMoves(solvedCube(), 'b')).U).toEqual(face('OOO OOO YYY'));
  });

  it('M turns the middle slice the way L does', () => {
    const f = faces(applyMoves(solvedCube(), 'M'));
    expect(f.F).toEqual(face('GYG GYG GYG'));
    expect(f.U).toEqual(face('YBY YBY YBY'));
    expect(f.R).toEqual(face('OOO OOO OOO'));
  });

  it.each(['u', 'd', 'l', 'r', 'f', 'b', 'M'])("%s' undoes %s, and four of %s are the identity", (m) => {
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m}'`))).toEqual(faces(SCRAMBLED));
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m} ${m} ${m}`))).toEqual(faces(SCRAMBLED));
    expect(faces(applyMoves(SCRAMBLED, `${m}2`))).toEqual(faces(applyMoves(SCRAMBLED, `${m} ${m}`)));
  });
});

describe('whole-cube rotations', () => {
  const centres = (moves: string) => {
    const f = faces(applyMoves(solvedCube(), moves));
    return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v[4]]));
  };

  it('x tips the cube forward like R: green comes up, yellow goes to the back', () => {
    expect(faces(applyMoves(solvedCube(), 'x'))).toEqual({
      U: nine('green'),
      F: nine('white'),
      D: nine('blue'),
      B: nine('yellow'),
      R: nine('orange'),
      L: nine('red'),
    });
  });

  it('y turns the cube like U: orange comes to the front', () => {
    expect(centres('y')).toEqual({ U: 'yellow', D: 'white', F: 'orange', R: 'blue', B: 'red', L: 'green' });
  });

  it('z rolls the cube like F: red comes up, yellow goes right', () => {
    expect(centres('z')).toEqual({ U: 'red', R: 'yellow', D: 'orange', L: 'white', F: 'green', B: 'blue' });
  });

  it('a rotation moves every layer: x is R, M\' and L\' together', () => {
    expect(faces(applyMoves(SCRAMBLED, 'x'))).toEqual(faces(applyMoves(SCRAMBLED, "R M' L'")));
  });

  it.each(['x', 'y', 'z'])("%s' undoes %s, and four of %s are the identity", (m) => {
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m}'`))).toEqual(faces(SCRAMBLED));
    expect(faces(applyMoves(SCRAMBLED, `${m} ${m} ${m} ${m}`))).toEqual(faces(SCRAMBLED));

    expect(faces(applyMoves(SCRAMBLED, `${m}2`))).toEqual(faces(applyMoves(SCRAMBLED, `${m} ${m}`)));
  });
});

describe('the Turn a move makes', () => {
  it('names the axis, the layers and the quarter turns about the positive axis, right-hand rule', () => {
    // Clockwise looking at R is clockwise looking down +x: a negative turn.
    expect(parseMove('R')).toEqual({ axis: 0, layers: [1], quarters: -1 });
    expect(parseMove("U'")).toEqual({ axis: 1, layers: [1], quarters: 1 });
    // L looks down −x, so its clockwise is positive about +x, and M turns with it.
    expect(parseMove('L')).toEqual({ axis: 0, layers: [-1], quarters: 1 });
    expect(parseMove('M')).toEqual({ axis: 0, layers: [0], quarters: 1 });
    expect(parseMove('f')).toEqual({ axis: 2, layers: [1, 0], quarters: -1 });
    expect(parseMove('y')).toEqual({ axis: 1, layers: [-1, 0, 1], quarters: -1 });
    expect(Math.abs(parseMove('B2').quarters)).toBe(2);
  });

  it('rejects anything that is not a move', () => {
    expect(() => parseMove('Q')).toThrow(/Not a move: Q/);
    expect(() => parseMove('R3')).toThrow(/Not a move: R3/);
  });

  /** Rotates a vector about an axis by an angle, the way a renderer would: with cos and sin. */
  const rotate = (v: Vec, axis: Axis, angle: number): Vec => {
    const [i, j] = [(axis + 1) % 3, (axis + 2) % 3];
    const out = [...v] as [number, number, number];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[i] = Math.round(v[i] * c - v[j] * s);
    out[j] = Math.round(v[i] * s + v[j] * c);
    return out;
  };
  const stickers = (cube: Cube) =>
    cube.stickers.map((s) => `${s.position} ${s.normal} ${s.colour}`).sort();

  it.each(['R', "L'", 'U2', 'D', "F'", 'B', 'r', "u'", 'M', 'M2', 'x', "y'", 'z2'])(
    'turning the layers of %s by its angle lands every Sticker where applyMoves puts it',
    (move) => {
      const { axis, layers, quarters } = parseMove(move);
      const angle = (quarters * Math.PI) / 2;
      const drawn: Cube = {
        stickers: SCRAMBLED.stickers.map((s) =>
          layers.includes(s.position[axis])
            ? { ...s, position: rotate(s.position, axis, angle), normal: rotate(s.normal, axis, angle) }
            : s,
        ),
      };
      expect(stickers(drawn)).toEqual(stickers(applyMoves(SCRAMBLED, move)));
    },
  );
});

describe('inverseMove', () => {
  it.each([
    ['R', "R'"],
    ["U'", 'U'],
    ['F2', 'F2'],
    ['x', "x'"],
    ["M'", 'M'],
  ])('undoes %s with %s', (move, inverse) => {
    expect(inverseMove(move)).toBe(inverse);
  });

  it('undoes every move, so the move then its inverse leaves a scrambled cube as it was', () => {
    const scrambled = applyMoves(solvedCube(), "R U2 F' l D x M2 B'");
    for (const move of ['R', "U'", 'F2', 'r', "x'", 'M', "B'"]) {
      expect(applyMoves(scrambled, `${move} ${inverseMove(move)}`)).toEqual(scrambled);
    }
  });
});

describe('fromFaces', () => {
  it('builds the Cube whose Faces are the ones given, so faces and fromFaces are inverses', () => {
    const scrambled = applyMoves(solvedCube(), "R U2 F' L D B2 r M x");
    expect(faces(fromFaces(faces(scrambled)))).toEqual(faces(scrambled));
  });

  it('keeps a sticker left blank as blank, so a part-entered cube can be drawn', () => {
    const grid: Record<Face, (Colour | null)[]> = { ...faces(solvedCube()) };
    grid.D = [null, null, null, null, 'white', null, null, null, null];
    const cube = fromFaces(grid);
    const down = cube.stickers.filter((s) => s.normal[1] === -1);
    expect(down.filter((s) => s.colour === null)).toHaveLength(8);
    expect(down.find((s) => s.position[0] === 0 && s.position[2] === 0)?.colour).toBe('white');
  });
});

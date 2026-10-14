import { describe, expect, it } from 'vitest';
import { applyMoves, faces, solvedCube, type Colour } from '../../src/lib/speed-cubing/cube';

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

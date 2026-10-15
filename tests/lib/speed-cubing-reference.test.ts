import { describe, expect, it } from 'vitest';
import { applyMoves, faces, isSolved, parseMove, solvedCube, type Cube } from '../../src/lib/speed-cubing/cube';
import { algorithmMoves, LOOKS, recognise } from '../../src/lib/speed-cubing/last-layer';
import { caseStart, GALLERY, NOTATION } from '../../src/lib/speed-cubing/reference';

const run = (cube: Cube, moves: readonly string[]) => applyMoves(cube, moves.join(' '));

describe('the algorithm gallery', () => {
  it('has every case from the notes, in the order a solve meets them', () => {
    expect(GALLERY.map((c) => `${c.look.method}: ${c.algorithm.name}`)).toEqual(
      LOOKS.flatMap((look) => look.algorithms.map((a) => `${look.method}: ${a.name}`)),
    );
  });

  it('plays each case’s algorithm as the solve does', () => {
    for (const c of GALLERY) expect(c.moves).toEqual(algorithmMoves(c.algorithm));
  });

  it('gives every case its step and how to hold the cube', () => {
    for (const c of GALLERY) {
      expect(c.step).toBe(`${c.look.method}: ${c.look.title}`);
      expect(c.hold.length, c.algorithm.name).toBeGreaterThan(10);
    }
  });

  it('sets each case up so its algorithm completes its step', () => {
    for (const c of GALLERY) {
      const start = caseStart(c);
      expect(c.look.done(start), `${c.algorithm.name} starts unfinished`).toBe(false);
      expect(c.look.done(run(start, c.moves)), `${c.algorithm.name} completes ${c.step}`).toBe(true);
    }
  });

  it('starts each case with the earlier steps done and held the way its hold says, needing no U-turn', () => {
    for (const c of GALLERY) {
      const start = caseStart(c);
      for (const earlier of LOOKS.slice(0, LOOKS.indexOf(c.look))) expect(earlier.done(start)).toBe(true);
      expect(recognise(start, c.look), c.algorithm.name).toEqual({ algorithm: c.algorithm, setup: [] });
    }
  });

  it('starts from a cube that is solved once the algorithm has run', () => {
    for (const c of GALLERY) expect(isSolved(run(caseStart(c), c.moves))).toBe(true);
  });

  it('holds the L-shape with its yellow edges at the front and right, and the Line across', () => {
    const top = (name: string) => {
      const c = GALLERY.find((g) => g.algorithm.name === name)!;
      return [1, 3, 5, 7].map((i) => faces(caseStart(c)).U[i] === 'yellow');
    };
    // Back, left, right, front.
    expect(top('L-shape')).toEqual([false, false, true, true]);
    expect(top('Line')).toEqual([false, true, true, false]);
  });

  it('leaves white on the bottom and green in front, even around an x', () => {
    for (const c of GALLERY) {
      const f = faces(caseStart(c));
      expect([f.D[4], f.F[4]], c.algorithm.name).toEqual(['white', 'green']);
    }
  });
});

describe('the notation guide', () => {
  const tokens = (move: string) => /^([A-Za-z])(2|')?$/.exec(move)!;

  it('covers every move the method uses, by letter and by prime or double', () => {
    const letters = new Set(NOTATION.map((n) => tokens(n.move)[1]));
    const used = new Set(LOOKS.flatMap((l) => l.algorithms.flatMap((a) => algorithmMoves(a))));
    for (const move of used) expect(letters, move).toContain(tokens(move)[1]);
    const kinds = new Set(NOTATION.map((n) => tokens(n.move)[2] ?? ''));
    expect([...kinds].sort()).toEqual(["'", '', '2'].sort());
  });

  it('includes the two-layer turn f, the slice M and the rotation x', () => {
    const moves = NOTATION.map((n) => n.move);
    for (const move of ['f', 'M', 'x']) expect(moves).toContain(move);
  });

  it('explains each move, and each is one the cube can turn', () => {
    for (const { move, explanation } of NOTATION) {
      expect(() => parseMove(move)).not.toThrow();
      expect(explanation.length, move).toBeGreaterThan(10);
    }
  });

  it('turns the right layers: R lifts the front’s right column to the top, M drops the top’s middle column to the front', () => {
    const r = faces(applyMoves(solvedCube(), 'R'));
    expect([r.U[2], r.U[5], r.U[8]]).toEqual(['green', 'green', 'green']);
    const m = faces(applyMoves(solvedCube(), 'M'));
    expect([m.F[1], m.F[4], m.F[7]]).toEqual(['yellow', 'yellow', 'yellow']);
    const f = faces(applyMoves(solvedCube(), 'f'));
    expect([f.R[0], f.R[3], f.R[1]]).toEqual(['yellow', 'yellow', 'yellow']);
    const x = faces(applyMoves(solvedCube(), 'x'));
    expect(x.U[4]).toBe('green');
  });
});

import { describe, expect, it } from 'vitest';
import { applyMoves, solvedCube, type Cube, type Vec } from '../../src/lib/speed-cubing/cube';
import { scramble } from '../../src/lib/speed-cubing/scramble';
import { solveF2L } from '../../src/lib/speed-cubing/solve';

/** A deterministic uniform source, so a scramble is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const same = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** A piece is home when every Sticker on it matches the centre of the face it looks out of. */
function home(cube: Cube, position: Vec): boolean {
  const centre = (normal: Vec) => cube.stickers.find((s) => same(s.position, normal))!.colour;
  return cube.stickers
    .filter((s) => same(s.position, position))
    .every((s) => s.colour === centre(s.normal));
}

const CROSS: Vec[] = [
  [0, -1, 1],
  [1, -1, 0],
  [0, -1, -1],
  [-1, -1, 0],
];
const crossSolved = (cube: Cube) => CROSS.every((p) => home(cube, p));

/** The four F2L slots, each a corner on the bottom and the edge above it. */
const SLOTS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const;
const solvedSlots = (cube: Cube) =>
  SLOTS.filter(([x, z]) => home(cube, [x, -1, z]) && home(cube, [x, 0, z]));

const scrambled = (seed: number) => applyMoves(solvedCube(), scramble(mulberry32(seed)).join(' '));

describe('solveF2L', () => {
  it('starts with a Cross stage that solves the white cross on the bottom', () => {
    const cube = scrambled(1);
    const [cross] = solveF2L(cube);
    expect(cross.label).toBe('Cross');
    expect(crossSolved(applyMoves(cube, cross.moves.join(' ')))).toBe(true);
  });

  it('then solves one more F2L pair per stage, never breaking the Cross or an earlier pair', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const stages = solveF2L(scrambled(seed));
      expect(stages.map((s) => s.label)).toEqual([
        'Cross',
        'F2L pair 1 of 4',
        'F2L pair 2 of 4',
        'F2L pair 3 of 4',
        'F2L pair 4 of 4',
      ]);
      let cube = applyMoves(scrambled(seed), stages[0].moves.join(' '));
      let before = solvedSlots(cube);
      stages.slice(1).forEach((stage, i) => {
        cube = applyMoves(cube, stage.moves.join(' '));
        const after = solvedSlots(cube);
        expect(crossSolved(cube)).toBe(true);
        expect(after).toEqual(expect.arrayContaining(before));
        expect(after.length).toBeGreaterThanOrEqual(i + 1);
        before = after;
      });
      expect(before).toHaveLength(4);
    }
  });

  it('keeps every stage short: the Cross in at most 8 face turns, each pair in at most 10', () => {
    for (let seed = 100; seed < 300; seed++) {
      const [cross, ...pairs] = solveF2L(scrambled(seed));
      expect(cross.moves.length).toBeLessThanOrEqual(8);
      for (const pair of pairs) expect(pair.moves.length).toBeLessThanOrEqual(10);
      for (const stage of [cross, ...pairs]) for (const move of stage.moves) expect(move).toMatch(/^[UDLRFB](2|')?$/);
    }
  });

  it('has nothing to do on a solved cube, and leaves its stages empty', () => {
    expect(solveF2L(solvedCube()).map((s) => s.moves)).toEqual([[], [], [], [], []]);
  });

  it('solves the Cross optimally: a cube one turn off it takes one turn back', () => {
    const [cross] = solveF2L(applyMoves(solvedCube(), 'F'));
    expect(cross.moves).toEqual(["F'"]);
  });
});

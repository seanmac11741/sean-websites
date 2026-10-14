import { describe, expect, it } from 'vitest';
import { applyMoves, faces, solvedCube } from '../../src/lib/speed-cubing/cube';
import { SCRAMBLE_LENGTH, scramble } from '../../src/lib/speed-cubing/scramble';

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

/** A random source that always answers the same draw. */
const always = (value: number) => () => value;

const FACE_TURN = /^[UDLRFB](2|')?$/;

const expectNoFaceTwiceInARow = (moves: string[]) => {
  for (let i = 1; i < moves.length; i++) expect(moves[i][0]).not.toBe(moves[i - 1][0]);
};

describe('scramble', () => {
  it('is 100 face turns in standard notation', () => {
    expect(SCRAMBLE_LENGTH).toBe(100);
    const moves = scramble(mulberry32(1));
    expect(moves).toHaveLength(100);
    for (const move of moves) expect(move).toMatch(FACE_TURN);
  });

  it('never turns the same face twice in a row', () => {
    for (let seed = 1; seed <= 50; seed++) expectNoFaceTwiceInARow(scramble(mulberry32(seed)));
  });

  it('never turns the same face twice in a row, even when the random source keeps answering the same', () => {
    for (const value of [0, 0.5, 0.999999]) expectNoFaceTwiceInARow(scramble(always(value)));
  });

  it('uses every face, and quarter, prime and double turns', () => {
    const moves = scramble(mulberry32(2));
    expect(new Set(moves.map((m) => m[0]))).toEqual(new Set(['U', 'D', 'L', 'R', 'F', 'B']));
    expect(moves.some((m) => m.length === 1)).toBe(true);
    expect(moves.some((m) => m.endsWith("'"))).toBe(true);
    expect(moves.some((m) => m.endsWith('2'))).toBe(true);
  });

  it('is the same under the same random source, and different under another', () => {
    expect(scramble(mulberry32(3))).toEqual(scramble(mulberry32(3)));
    expect(scramble(mulberry32(3))).not.toEqual(scramble(mulberry32(4)));
  });

  it('applied one move at a time, as the page animates it, lands on the state of the whole sequence', () => {
    const moves = scramble(mulberry32(5));
    const oneAtATime = moves.reduce((cube, move) => applyMoves(cube, move), solvedCube());
    expect(faces(oneAtATime)).toEqual(faces(applyMoves(solvedCube(), moves.join(' '))));
    expect(faces(oneAtATime)).not.toEqual(faces(solvedCube()));
  });
});

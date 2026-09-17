import { describe, expect, it } from 'vitest';
import {
  AUTHORED_CELL,
  SHEET_COLS,
  SHEET_HEIGHT,
  SHEET_ROWS,
  SHEET_WIDTH,
  STATES,
  TYPES,
  frameCount,
  frameIndexAt,
  frameRate,
  loops,
  rowFor,
  sourceRect,
} from '../../src/lib/rps-royale/sprites';

describe('row map', () => {
  it('starts at rock idle', () => {
    expect(rowFor('rock', 'idle')).toBe(0);
  });

  it('ends at scissors victory', () => {
    expect(rowFor('scissors', 'victory')).toBe(20);
  });

  it('orders types rock, paper, scissors in blocks of the same states', () => {
    expect(rowFor('rock', 'victory')).toBe(6);
    expect(rowFor('paper', 'idle')).toBe(7);
    expect(rowFor('paper', 'duel-impact')).toBe(10);
    expect(rowFor('scissors', 'idle')).toBe(14);
  });

  it('gives every type and state its own row, with no gaps', () => {
    const rows = TYPES.flatMap((type) => STATES.map((state) => rowFor(type, state)));
    expect(new Set(rows).size).toBe(rows.length);
    expect(Math.min(...rows)).toBe(0);
    expect(Math.max(...rows)).toBe(rows.length - 1);
    expect(rows.length).toBe(SHEET_ROWS);
  });
});

describe('sheet geometry', () => {
  it('is an exact multiple of the authored cell in both axes', () => {
    expect(SHEET_WIDTH).toBe(SHEET_COLS * AUTHORED_CELL);
    expect(SHEET_HEIGHT).toBe(SHEET_ROWS * AUTHORED_CELL);
  });

  it('places a frame at its column and row multiple of the cell size', () => {
    expect(sourceRect('paper', 'hop', 3)).toEqual({
      sx: 3 * AUTHORED_CELL,
      sy: 8 * AUTHORED_CELL,
      sw: AUTHORED_CELL,
      sh: AUTHORED_CELL,
    });
  });

  it('keeps the last frame of the last row inside the sheet', () => {
    const rect = sourceRect('scissors', 'victory', frameCount('victory') - 1);
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(SHEET_WIDTH);
    expect(rect.sy + rect.sh).toBeLessThanOrEqual(SHEET_HEIGHT);
  });

  it('never addresses a frame past the row it belongs to', () => {
    for (const state of STATES) {
      expect(frameCount(state)).toBeLessThanOrEqual(SHEET_COLS);
    }
  });
});

describe('frame selection', () => {
  it('advances at the state declared frame rate', () => {
    expect(frameIndexAt('idle', 0)).toBe(0);
    expect(frameIndexAt('idle', 1 / frameRate('idle') - 0.001)).toBe(0);
    expect(frameIndexAt('idle', 1 / frameRate('idle'))).toBe(1);
    expect(frameIndexAt('idle', 2 / frameRate('idle'))).toBe(2);
  });

  it('wraps a looping state at its frame count', () => {
    expect(loops('hop')).toBe(true);
    const cycle = frameCount('hop') / frameRate('hop');
    expect(frameIndexAt('hop', cycle)).toBe(0);
    expect(frameIndexAt('hop', cycle + 1 / frameRate('hop'))).toBe(1);
  });

  it('clamps a once-through state on its last frame', () => {
    expect(loops('transform')).toBe(false);
    const last = frameCount('transform') - 1;
    expect(frameIndexAt('transform', last / frameRate('transform'))).toBe(last);
    expect(frameIndexAt('transform', 100)).toBe(last);
  });

  it('treats a negative elapsed time as the first frame', () => {
    expect(frameIndexAt('transform', -5)).toBe(0);
    expect(frameIndexAt('hop', -5)).toBe(0);
  });
});

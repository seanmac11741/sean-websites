import { describe, expect, it } from 'vitest';
import { applyMoves, isSolved, solvedCube, type Cube } from '../../src/lib/speed-cubing/cube';
import { solve } from '../../src/lib/speed-cubing/solve';
import {
  SEEK_TURN_SECONDS,
  SOLVE_TURN_SECONDS,
  STAGE_PAUSE_SECONDS,
  back,
  forward,
  playNext,
  playback,
  seekStage,
  type Go,
} from '../../src/lib/speed-cubing/playback';

const stages = [
  { label: 'Cross', moves: ['F', "R'"] },
  { label: 'F2L pair 1 of 4', moves: [] },
  { label: 'F2L pair 2 of 4', moves: ['U2'] },
];

describe('playback', () => {
  it('turns at about half a second a move, with a short pause between stages', () => {
    expect(SOLVE_TURN_SECONDS).toBe(0.5);
    expect(STAGE_PAUSE_SECONDS).toBeGreaterThan(0);
    expect(STAGE_PAUSE_SECONDS).toBeLessThanOrEqual(1);
  });

  it('leads into every stage with a pause, then plays its moves in order, each tagged with its stage and place', () => {
    expect(playback(stages)).toEqual([
      { kind: 'pause', stage: 0, seconds: STAGE_PAUSE_SECONDS },
      { kind: 'move', stage: 0, index: 0, move: 'F', seconds: 0.5 },
      { kind: 'move', stage: 0, index: 1, move: "R'", seconds: 0.5 },
      { kind: 'pause', stage: 1, seconds: STAGE_PAUSE_SECONDS },
      { kind: 'pause', stage: 2, seconds: STAGE_PAUSE_SECONDS },
      { kind: 'move', stage: 2, index: 0, move: 'U2', seconds: 0.5 },
    ]);
  });
});

// The fixture's Steps, by position: 0 pause Cross, 1 F, 2 R', 3 pause pair 1, 4 pause pair 2, 5 U2; 6 is the end.
const steps = playback(stages);
const END = steps.length;

describe('forward', () => {
  it('turns the next move, leaving the playhead just after it', () => {
    expect(forward(steps, 0)).toEqual({
      beats: [{ step: steps[1], move: 'F', seconds: SOLVE_TURN_SECONDS }],
      to: 2,
    });
  });

  it('passes over pauses, and a stage with no moves, without stopping on them', () => {
    expect(forward(steps, 3)).toEqual({
      beats: [{ step: steps[5], move: 'U2', seconds: SOLVE_TURN_SECONDS }],
      to: END,
    });
  });

  it('has nowhere to go at the end', () => {
    expect(forward(steps, END)).toBeNull();
  });
});

describe('back', () => {
  it('undoes the last move with its inverse, leaving the playhead on that move', () => {
    expect(back(steps, 3)).toEqual({
      beats: [{ step: steps[2], move: 'R', seconds: SOLVE_TURN_SECONDS }],
      to: 2,
    });
  });

  it('passes back over pauses to the last move made', () => {
    expect(back(steps, 5)).toEqual({
      beats: [{ step: steps[2], move: 'R', seconds: SOLVE_TURN_SECONDS }],
      to: 2,
    });
  });

  it('has nowhere to go before the first move', () => {
    expect(back(steps, 1)).toBeNull();
    expect(back(steps, 0)).toBeNull();
  });
});

describe('seekStage', () => {
  it('fast-plays forwards to the start of a later stage, stopping on its pause', () => {
    expect(seekStage(steps, 0, 2)).toEqual({
      beats: [
        { step: steps[1], move: 'F', seconds: SEEK_TURN_SECONDS },
        { step: steps[2], move: "R'", seconds: SEEK_TURN_SECONDS },
      ],
      to: 4,
    });
  });

  it('fast-plays backwards to the start of an earlier stage, undoing each move in turn', () => {
    expect(seekStage(steps, END, 0)).toEqual({
      beats: [
        { step: steps[5], move: 'U2', seconds: SEEK_TURN_SECONDS },
        { step: steps[2], move: 'R', seconds: SEEK_TURN_SECONDS },
        { step: steps[1], move: "F'", seconds: SEEK_TURN_SECONDS },
      ],
      to: 0,
    });
  });

  it('turns nothing when the cube is already at that stage', () => {
    expect(seekStage(steps, 4, 1)).toEqual({ beats: [], to: 3 });
  });

  it('is quicker than playing', () => {
    expect(SEEK_TURN_SECONDS).toBeLessThan(SOLVE_TURN_SECONDS / 2);
  });
});

describe('playNext', () => {
  it('plays the Step at the playhead, pauses included, at its own pace', () => {
    expect(playNext(steps, 3)).toEqual({
      beats: [{ step: steps[3], move: null, seconds: STAGE_PAUSE_SECONDS }],
      to: 4,
    });
    expect(playNext(steps, 5)).toEqual({
      beats: [{ step: steps[5], move: 'U2', seconds: SOLVE_TURN_SECONDS }],
      to: END,
    });
  });

  it('stops at the end', () => {
    expect(playNext(steps, END)).toBeNull();
  });
});

describe('stepping through a whole Solve', () => {
  const scrambled = applyMoves(solvedCube(), "R U' F2 L' D B R2 U F' L2 D' B2 R' U2 F L D2 B' R U");
  const real = playback(solve(scrambled));
  const land = (cube: Cube, go: Go) => go.beats.reduce((c, { move }) => (move ? applyMoves(c, move) : c), cube);

  it('steps forward to a solved cube, then back to exactly the scramble', () => {
    let cube = scrambled;
    let at = 0;
    for (let go = forward(real, at); go; go = forward(real, at)) [cube, at] = [land(cube, go), go.to];
    expect(at).toBe(real.length);
    expect(isSolved(cube)).toBe(true);

    for (let go = back(real, at); go; go = back(real, at)) [cube, at] = [land(cube, go), go.to];
    expect(cube).toEqual(scrambled);
  });

  it('seeks to any stage, from either side, to the cube that stage starts from', () => {
    const stageCount = real[real.length - 1].stage + 1;
    let cube = scrambled;
    let at = 0;
    for (const stage of [3, 1, stageCount - 1, 0]) {
      const go = seekStage(real, at, stage);
      [cube, at] = [land(cube, go), go.to];
      const before = real.slice(0, at).flatMap((s) => (s.kind === 'move' ? [s.move] : []));
      expect(cube).toEqual(applyMoves(scrambled, before.join(' ')));
      expect(real[at]).toMatchObject({ kind: 'pause', stage });
    }
    expect(cube).toEqual(scrambled);
  });
});

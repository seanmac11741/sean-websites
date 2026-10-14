import { describe, expect, it } from 'vitest';
import { SOLVE_TURN_SECONDS, STAGE_PAUSE_SECONDS, playback } from '../../src/lib/speed-cubing/playback';

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

  it('plays every move of every stage, in order, each tagged with its stage and its place in it', () => {
    expect(playback(stages)).toEqual([
      { kind: 'move', stage: 0, index: 0, move: 'F', seconds: 0.5 },
      { kind: 'move', stage: 0, index: 1, move: "R'", seconds: 0.5 },
      { kind: 'pause', stage: 1, seconds: STAGE_PAUSE_SECONDS },
      { kind: 'pause', stage: 2, seconds: STAGE_PAUSE_SECONDS },
      { kind: 'move', stage: 2, index: 0, move: 'U2', seconds: 0.5 },
    ]);
  });

  it('plays at the speeds it is given', () => {
    const steps = playback(stages, { turnSeconds: 0, pauseSeconds: 0 });
    expect(steps.every((s) => s.seconds === 0)).toBe(true);
  });
});

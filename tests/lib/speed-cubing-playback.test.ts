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

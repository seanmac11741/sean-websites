import { describe, expect, it } from 'vitest';
import {
  LINEUP_MAX,
  LINEUP_MIN,
  clampLineup,
  describeLineup,
  deviceFor,
  lineupTotal,
  parseLineup,
  withCount,
} from '../../src/lib/rps-royale/lineup';

describe('the device a round is played on', () => {
  it('gives a wide viewport twenty of each Type, up to a hundred each, at full sprite size', () => {
    expect(deviceFor(1280)).toEqual({
      defaultLineup: { rock: 20, paper: 20, scissors: 20 },
      cap: 100,
      maxFighterSize: 69,
    });
  });

  it('gives a phone ten of each Type, capped at forty each, with smaller sprites', () => {
    expect(deviceFor(390)).toEqual({
      defaultLineup: { rock: 10, paper: 10, scissors: 10 },
      cap: 40,
      maxFighterSize: 57,
    });
  });

  it('treats the breakpoint itself as wide', () => {
    expect(deviceFor(640).cap).toBe(100);
    expect(deviceFor(639).cap).toBe(40);
  });
});

describe('clamping a Lineup to a cap', () => {
  it('brings any count over the cap down to it and leaves the rest alone', () => {
    expect(clampLineup({ rock: 100, paper: 5, scissors: 40 }, 40)).toEqual({
      rock: 40,
      paper: 5,
      scissors: 40,
    });
  });

  it('never lets a Type start with fewer than one Fighter', () => {
    expect(clampLineup({ rock: 0, paper: -3, scissors: 2 }, 100)).toEqual({
      rock: 1,
      paper: 1,
      scissors: 2,
    });
  });
});

describe('moving one slider', () => {
  it('changes only that Type, keeping the others as saved', () => {
    expect(withCount({ rock: 100, paper: 100, scissors: 100 }, 'paper', 7)).toEqual({
      rock: 100,
      paper: 7,
      scissors: 100,
    });
  });

  it('keeps the moved count inside the slider range', () => {
    expect(withCount({ rock: 5, paper: 5, scissors: 5 }, 'rock', 250).rock).toBe(LINEUP_MAX);
    expect(withCount({ rock: 5, paper: 5, scissors: 5 }, 'rock', 0).rock).toBe(LINEUP_MIN);
    expect(withCount({ rock: 5, paper: 5, scissors: 5 }, 'rock', 12.7).rock).toBe(12);
  });
});

describe('a saved Lineup', () => {
  it('reads back what was saved', () => {
    expect(parseLineup('{"rock":100,"paper":5,"scissors":5}')).toEqual({
      rock: 100,
      paper: 5,
      scissors: 5,
    });
  });

  it('is nothing at all when missing or junk, so the device default applies', () => {
    for (const raw of [null, '', 'nope', '[]', '{"rock":5}', '{"rock":"x","paper":1,"scissors":1}']) {
      expect(parseLineup(raw)).toBeNull();
    }
  });

  it('is pulled back into the slider range when out of it', () => {
    expect(parseLineup('{"rock":500,"paper":0,"scissors":3}')).toEqual({
      rock: 100,
      paper: 1,
      scissors: 3,
    });
  });
});

describe('reading a Lineup out', () => {
  it('totals every Fighter', () => {
    expect(lineupTotal({ rock: 100, paper: 5, scissors: 5 })).toBe(110);
  });

  it('describes the starting Lineup in rock, paper, scissors order', () => {
    expect(describeLineup({ rock: 100, paper: 5, scissors: 5 })).toBe('Started 100 · 5 · 5');
    expect(describeLineup({ rock: 1, paper: 2, scissors: 3 })).toBe('Started 1 · 2 · 3');
  });
});

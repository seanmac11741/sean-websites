import { describe, expect, it } from 'vitest';
import {
  BONKS_PER_DUEL,
  BONK_INTERVAL,
  CLEARING_RADIUS,
  COOLDOWN_SECONDS,
  DUEL_RADIUS,
  DUEL_SECONDS,
  MAX_TEMPO,
  TEMPO_RAMP_START,
  TRANSFORM_SECONDS,
  UPSET_RATE,
  WINDUP_SECONDS,
  beats,
  createArena,
  duelBeat,
  outcomeFor,
  standardWinner,
  type Arena,
  type ArenaEvent,
  type FighterSeed,
  type Type,
} from '../../src/lib/rps-royale/arena';
import { TYPES } from '../../src/lib/rps-royale/sprites';

const FRAME = 1 / 60;

/** Long enough for one encounter to run all the way out and settle. */
const ENCOUNTER = DUEL_SECONDS + TRANSFORM_SECONDS + COOLDOWN_SECONDS + 0.2;

/** A deterministic uniform source, so a whole round is reproducible. */
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

function pair(a: Type, b: Type, gap = DUEL_RADIUS / 2): FighterSeed[] {
  return [
    { type: a, x: 200 - gap / 2, y: 200, heading: 0 },
    { type: b, x: 200 + gap / 2, y: 200, heading: Math.PI },
  ];
}

/** Steps an arena in frame-sized slices, collecting everything it reports. */
function run(arena: Arena, seconds: number): ArenaEvent[] {
  const events: ArenaEvent[] = [];
  for (let t = 0; t < seconds; t += FRAME) events.push(...arena.step(FRAME));
  return events;
}

function conversions(events: readonly ArenaEvent[]) {
  return events.filter((e) => e.kind === 'conversion');
}

describe('the rock-paper-scissors rules', () => {
  it('has each type beating exactly one other and losing to exactly one', () => {
    expect(beats('rock')).toBe('scissors');
    expect(beats('paper')).toBe('rock');
    expect(beats('scissors')).toBe('paper');
  });

  it('gives the standard winner of a matchup either way round', () => {
    expect(standardWinner('rock', 'scissors')).toBe('rock');
    expect(standardWinner('scissors', 'rock')).toBe('rock');
    expect(standardWinner('paper', 'scissors')).toBe('scissors');
  });

  it('takes the standard result on a draw below the upset rate threshold', () => {
    expect(outcomeFor('rock', 'scissors', UPSET_RATE + 0.01)).toEqual({
      winner: 'rock',
      upset: false,
    });
  });

  it('takes the upset on a draw under the upset rate', () => {
    expect(outcomeFor('rock', 'scissors', UPSET_RATE / 2)).toEqual({
      winner: 'scissors',
      upset: true,
    });
  });
});

describe('a fresh arena', () => {
  it('has the requested roster size, split exactly evenly', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(1) });
    expect(arena.fighters).toHaveLength(60);
    for (const type of TYPES) expect(arena.tally[type]).toBe(20);
  });

  it('rounds a roster size down to something it can split three ways', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 62, random: mulberry32(1) });
    expect(arena.fighters).toHaveLength(60);
    for (const type of TYPES) expect(arena.tally[type]).toBe(20);
  });

  it('scatters fighters across the arena rather than stacking them', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(7) });
    const xs = arena.fighters.map((f) => f.x);
    const ys = arena.fighters.map((f) => f.y);

    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(800 * 0.6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(600 * 0.6);
    expect(new Set(arena.fighters.map((f) => `${f.x},${f.y}`)).size).toBe(60);
  });

  it('mixes the types across the board rather than clustering each in one place', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(3) });
    for (const type of TYPES) {
      const xs = arena.fighters.filter((f) => f.type === type).map((f) => f.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(800 * 0.4);
    }
  });

  it('starts every fighter roaming, off cooldown, with nothing duelling', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(2) });
    expect(arena.fighters.every((f) => f.activity === 'roaming')).toBe(true);
    expect(arena.fighters.every((f) => f.cooldown === 0)).toBe(true);
    expect(arena.duels).toHaveLength(0);
    expect(arena.champion).toBeNull();
  });

  it('starts at flat tempo with no elapsed time', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(2) });
    expect(arena.elapsed).toBe(0);
    expect(arena.tempo).toBe(1);
  });
});

describe('proximity', () => {
  it('locks two fighters of different types into a duel', () => {
    const arena = createArena({
      width: 400,
      height: 400,
      rosterSize: 2,
      random: always(0.5),
      seed: pair('rock', 'scissors'),
    });

    arena.step(FRAME);
    expect(arena.duels).toHaveLength(1);
    expect(arena.fighters.every((f) => f.activity === 'duelling')).toBe(true);
  });

  it('leaves two fighters of the same type alone', () => {
    const arena = createArena({
      width: 400,
      height: 400,
      rosterSize: 2,
      random: always(0.5),
      seed: pair('rock', 'rock'),
    });

    const events = run(arena, 3);
    expect(arena.duels).toHaveLength(0);
    expect(conversions(events)).toHaveLength(0);
    expect(arena.tally.rock).toBe(2);
  });

  it('does not start a duel between fighters that are far apart', () => {
    const arena = createArena({
      width: 400,
      height: 400,
      rosterSize: 2,
      random: always(0.5),
      seed: [
        { type: 'rock', x: 20, y: 20, heading: Math.PI },
        { type: 'scissors', x: 380, y: 380, heading: 0 },
      ],
    });

    arena.step(FRAME);
    expect(arena.duels).toHaveLength(0);
  });
});

describe('a duel', () => {
  function duelArena(a: Type, b: Type, draw: number) {
    return createArena({
      width: 400,
      height: 400,
      rosterSize: 2,
      random: always(draw),
      seed: pair(a, b),
    });
  }

  it('plays a windup and three bonks before it lands', () => {
    const arena = duelArena('rock', 'scissors', 0.5);
    arena.step(FRAME);
    const duel = arena.duels[0];
    expect(duel.bonks).toBe(0);

    const events = run(arena, ENCOUNTER);
    expect(events.filter((e) => e.kind === 'bonk')).toHaveLength(BONKS_PER_DUEL);
  });

  it('lands the conversion on the third bonk, not before it', () => {
    const arena = duelArena('rock', 'scissors', 0.5);
    const events = run(arena, ENCOUNTER);
    const bonks = events.filter((e) => e.kind === 'bonk');
    const converted = events.findIndex((e) => e.kind === 'conversion');

    expect(bonks).toHaveLength(BONKS_PER_DUEL);
    expect(events.indexOf(bonks[BONKS_PER_DUEL - 1])).toBeLessThan(converted);
    expect(events.slice(0, converted).filter((e) => e.kind === 'bonk')).toHaveLength(
      BONKS_PER_DUEL,
    );
  });

  it('resolves in exactly one conversion', () => {
    const arena = duelArena('rock', 'scissors', 0.5);
    const events = run(arena, ENCOUNTER);

    expect(conversions(events)).toHaveLength(1);
    expect(arena.tally.rock).toBe(2);
    expect(arena.tally.scissors).toBe(0);
  });

  it('gives the standard winner every duel when the draw is above the upset rate', () => {
    for (const [a, b] of [
      ['rock', 'scissors'],
      ['paper', 'rock'],
      ['scissors', 'paper'],
    ] as const) {
      const arena = duelArena(a, b, 0.9);
      const [conversion] = conversions(run(arena, ENCOUNTER));
      expect(conversion).toMatchObject({ to: standardWinner(a, b), upset: false });
    }
  });

  it('gives the upset every duel when the draw is under the upset rate', () => {
    for (const [a, b] of [
      ['rock', 'scissors'],
      ['paper', 'rock'],
      ['scissors', 'paper'],
    ] as const) {
      const arena = duelArena(a, b, 0);
      const [conversion] = conversions(run(arena, ENCOUNTER));
      expect(conversion.to).not.toBe(standardWinner(a, b));
      expect(conversion.upset).toBe(true);
    }
  });

  it('applies the outcome it recorded when the duel started', () => {
    const arena = duelArena('rock', 'scissors', 0.05);
    arena.step(FRAME);
    const { winnerType, upset } = arena.duels[0];

    const [conversion] = conversions(run(arena, ENCOUNTER));
    expect(conversion.to).toBe(winnerType);
    expect(conversion.upset).toBe(upset);
    expect(arena.tally[winnerType]).toBe(2);
  });

  it('morphs the loser through a transform before it changes type', () => {
    const arena = duelArena('rock', 'scissors', 0.9);
    run(arena, DUEL_SECONDS + 0.1);

    const transforming = arena.fighters.filter((f) => f.activity === 'transforming');
    expect(transforming).toHaveLength(1);
    expect(transforming[0].type).toBe('scissors');

    run(arena, TRANSFORM_SECONDS + 0.2);
    expect(arena.fighters.every((f) => f.type === 'rock')).toBe(true);
  });

  it('pushes the pair apart and puts both on cooldown when it ends', () => {
    const arena = duelArena('rock', 'scissors', 0.9);
    const events: ArenaEvent[] = [];
    while (conversions(events).length === 0) events.push(...arena.step(FRAME));

    const [a, b] = arena.fighters;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(DUEL_RADIUS);
    expect(arena.fighters.every((f) => f.cooldown > 0)).toBe(true);
  });

  it('does not re-duel a freshly converted fighter while it is on cooldown', () => {
    const arena = duelArena('rock', 'scissors', 0.9);
    // One encounter's worth of time: the duel, the transform, and the cooldown.
    const events = run(arena, ENCOUNTER);

    expect(conversions(events)).toHaveLength(1);
    expect(COOLDOWN_SECONDS).toBeGreaterThan(0);
  });
});

describe('the beats of a duel', () => {
  const CLASH = 0.2;
  const bonkAt = (bonk: number) => WINDUP_SECONDS + bonk * BONK_INTERVAL;

  it('lasts three seconds at flat tempo', () => {
    expect(DUEL_SECONDS).toBeCloseTo(3);
  });

  it('opens on a windup', () => {
    expect(duelBeat(0, CLASH)).toMatchObject({ phase: 'windup', elapsed: 0, bonk: 0 });
    expect(duelBeat(0.5, CLASH).phase).toBe('windup');
  });

  it('centres each clash on its bonk, so contact lands with the hit', () => {
    for (let bonk = 0; bonk < BONKS_PER_DUEL; bonk++) {
      const beat = duelBeat(bonkAt(bonk), CLASH);
      expect(beat).toMatchObject({ phase: 'impact', bonk });
      // Halfway through the clash animation: the contact pose.
      expect(beat.elapsed).toBeCloseTo(CLASH / 2);
    }
  });

  it('rears back again between bonks rather than holding a pose', () => {
    const between = (bonkAt(0) + bonkAt(1)) / 2;
    const beat = duelBeat(between, CLASH);
    expect(beat).toMatchObject({ phase: 'windup', bonk: 1 });
    // Counted from the end of the previous clash, so the windup replays.
    expect(beat.elapsed).toBeCloseTo(between - (bonkAt(0) + CLASH / 2));
  });

  it('spends most of a duel winding up, not mid-clash', () => {
    let impact = 0;
    const samples = 300;
    for (let i = 0; i < samples; i++) {
      if (duelBeat((i / samples) * DUEL_SECONDS, CLASH).phase === 'impact') impact++;
    }
    expect(impact / samples).toBeLessThan(0.3);
    expect(impact).toBeGreaterThan(0);
  });

  it('never runs off the end of the bonks it has', () => {
    for (const t of [-1, 0, DUEL_SECONDS, DUEL_SECONDS * 2, 100]) {
      const beat = duelBeat(t, CLASH);
      expect(beat.bonk).toBeGreaterThanOrEqual(0);
      expect(beat.bonk).toBeLessThan(BONKS_PER_DUEL);
      expect(beat.elapsed).toBeGreaterThanOrEqual(0);
    }
  });

  it('agrees with the bonks the arena actually reports', () => {
    const arena = createArena({
      width: 400,
      height: 400,
      rosterSize: 2,
      random: always(0.9),
      seed: pair('rock', 'scissors'),
    });

    // Every reported bonk should find the duel mid-clash, not mid-windup.
    let t = 0;
    let checked = 0;
    for (let i = 0; i < ENCOUNTER / FRAME; i++) {
      const events = arena.step(FRAME);
      t += FRAME;
      for (const e of events) {
        if (e.kind !== 'bonk') continue;
        expect(duelBeat(t, CLASH).phase).toBe('impact');
        checked++;
      }
    }
    expect(checked).toBe(BONKS_PER_DUEL);
  });
});

describe('what tempo does and does not speed up', () => {
  it('runs a duel faster once the tempo has ramped', () => {
    // Far enough apart that they are still closing when the ramp arrives.
    const arena = createArena({
      width: 4000,
      height: 400,
      rosterSize: 2,
      random: always(0.9),
      seed: [
        { type: 'rock', x: 60, y: 200, heading: 0 },
        { type: 'scissors', x: 3940, y: 200, heading: Math.PI },
      ],
    });

    let guard = 0;
    while (arena.duels.length === 0 && guard++ < 60 * 180) arena.step(FRAME);
    expect(arena.duels).toHaveLength(1);
    expect(arena.tempo).toBeGreaterThan(1);

    const before = arena.duels[0].elapsed;
    arena.step(FRAME);
    expect(arena.duels[0].elapsed - before).toBeCloseTo(FRAME * arena.tempo, 4);
  });

  it('leaves a fighter animating in real seconds however frantic the round got', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(4) });
    for (let i = 0; i < 60 * 60 * 5 && arena.champion === null; i++) arena.step(FRAME);

    expect(arena.champion).not.toBeNull();
    // The round did escalate — otherwise this asserts nothing.
    expect(arena.tempo).toBeGreaterThan(1);

    const before = arena.fighters[0].stateElapsed;
    run(arena, 1);
    expect(arena.fighters[0].stateElapsed - before).toBeCloseTo(1, 1);
  });
});

describe('the upset rate', () => {
  it('turns up about one duel in ten over many duels, and does turn up', () => {
    const random = mulberry32(99);
    let upsets = 0;
    const rounds = 600;

    for (let i = 0; i < rounds; i++) {
      const arena = createArena({
        width: 400,
        height: 400,
        rosterSize: 2,
        random,
        seed: pair('rock', 'scissors'),
      });
      const [conversion] = conversions(run(arena, ENCOUNTER));
      if (conversion.upset) upsets++;
    }

    expect(upsets).toBeGreaterThan(0);
    expect(upsets / rounds).toBeGreaterThan(UPSET_RATE / 2);
    expect(upsets / rounds).toBeLessThan(UPSET_RATE * 2);
  });
});

describe('a clearing', () => {
  it('makes nearby fighters spectate and backs them out of the fight', () => {
    const arena = createArena({
      width: 600,
      height: 600,
      rosterSize: 3,
      random: always(0.9),
      seed: [
        ...pair('rock', 'scissors'),
        { type: 'rock', x: 200 + DUEL_RADIUS, y: 200, heading: Math.PI },
      ],
    });

    arena.step(FRAME);
    const watcher = () => arena.fighters[2];
    const distance = () => Math.hypot(watcher().x - 200, watcher().y - 200);
    const before = distance();

    run(arena, 0.3);
    expect(watcher().activity).toBe('spectating');
    expect(distance()).toBeGreaterThan(before);
  });

  it('releases spectators back to roaming once the duel is over', () => {
    const arena = createArena({
      width: 600,
      height: 600,
      rosterSize: 3,
      random: always(0.9),
      seed: [
        ...pair('rock', 'scissors'),
        { type: 'paper', x: 200 + DUEL_RADIUS, y: 200, heading: Math.PI },
      ],
    });

    run(arena, 0.3);
    expect(arena.fighters[2].activity).toBe('spectating');

    run(arena, DUEL_SECONDS);
    expect(arena.duels).toHaveLength(0);
    expect(arena.fighters[2].activity).toBe('roaming');
  });

  it('leaves fighters outside it going about their business', () => {
    const far = 200 + CLEARING_RADIUS * 2;
    const arena = createArena({
      width: 900,
      height: 600,
      rosterSize: 3,
      random: always(0.9),
      seed: [...pair('rock', 'scissors'), { type: 'rock', x: far, y: 200, heading: 0 }],
    });

    run(arena, 0.3);
    expect(arena.fighters[2].activity).toBe('roaming');
  });
});

describe('stepping an arena', () => {
  it('never changes the roster size — conversion preserves population exactly', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(11) });

    for (let i = 0; i < 3000; i++) {
      arena.step(FRAME);
      expect(arena.fighters).toHaveLength(60);
      expect(TYPES.reduce((sum, t) => sum + arena.tally[t], 0)).toBe(60);
    }
  });

  it('never lets a fighter leave the arena', () => {
    const arena = createArena({ width: 640, height: 480, rosterSize: 60, random: mulberry32(13) });

    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    for (let i = 0; i < 3000; i++) {
      arena.step(FRAME);
      for (const f of arena.fighters) {
        bounds.minX = Math.min(bounds.minX, f.x);
        bounds.maxX = Math.max(bounds.maxX, f.x);
        bounds.minY = Math.min(bounds.minY, f.y);
        bounds.maxY = Math.max(bounds.maxY, f.y);
      }
    }

    expect(bounds.minX).toBeGreaterThanOrEqual(0);
    expect(bounds.maxX).toBeLessThanOrEqual(640);
    expect(bounds.minY).toBeGreaterThanOrEqual(0);
    expect(bounds.maxY).toBeLessThanOrEqual(480);
  });

  it('ignores a leap forward in time rather than teleporting the board', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 60, random: mulberry32(17) });
    arena.step(FRAME);
    const before = arena.fighters.map((f) => ({ x: f.x, y: f.y }));

    // A tab left in the background for a minute comes back to one small step,
    // not a minute of simulation compressed into a single frame.
    arena.step(60);
    const moved = arena.fighters.map((f, i) => Math.hypot(f.x - before[i].x, f.y - before[i].y));
    expect(Math.max(...moved)).toBeLessThan(20);
    expect(arena.elapsed).toBeLessThan(2);
  });
});

describe('tempo', () => {
  it('stays flat through the early part of a round', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 3, random: always(0.9) });
    run(arena, TEMPO_RAMP_START - 1);
    expect(arena.tempo).toBe(1);
  });

  it('ramps up once the round has gone on', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 3, random: always(0.9) });
    run(arena, TEMPO_RAMP_START + 5);
    expect(arena.tempo).toBeGreaterThan(1);
  });

  it('is bounded, so a long round speeds up without fighters tunnelling past each other', () => {
    const arena = createArena({ width: 800, height: 600, rosterSize: 3, random: always(0.9) });
    run(arena, TEMPO_RAMP_START + 500);
    expect(arena.tempo).toBe(MAX_TEMPO);
  });
});

describe('a champion', () => {
  /** Runs a round to its end, or throws if it never gets there. */
  function toCompletion(seed: number, rosterSize = 60) {
    const arena = createArena({
      width: 800,
      height: 600,
      rosterSize,
      random: mulberry32(seed),
      });
    const events: ArenaEvent[] = [];
    const budget = 60 * 60 * 5; // five simulated minutes of frames

    for (let i = 0; i < budget && arena.champion === null; i++) {
      events.push(...arena.step(FRAME));
    }
    if (arena.champion === null) {
      throw new Error(`seed ${seed} did not reach a champion: ${JSON.stringify(arena.tally)}`);
    }
    return { arena, events };
  }

  it('always emerges, from any seed', () => {
    for (const seed of [1, 2, 3, 5, 8]) {
      const { arena } = toCompletion(seed);
      expect(TYPES).toContain(arena.champion);
    }
  });

  it('owns the whole roster when it is declared', () => {
    const { arena } = toCompletion(4);
    const champion = arena.champion!;
    expect(arena.tally[champion]).toBe(60);
    expect(arena.fighters.every((f) => f.type === champion)).toBe(true);
  });

  it('is reported exactly once, as an event', () => {
    const { arena, events } = toCompletion(6);
    const declared = events.filter((e) => e.kind === 'champion');
    expect(declared).toHaveLength(1);
    expect(declared[0]).toMatchObject({ kind: 'champion', type: arena.champion });
  });

  it('starts no new duels once the round is over', () => {
    const { arena } = toCompletion(9);
    const events = run(arena, 5);

    expect(arena.duels).toHaveLength(0);
    expect(conversions(events)).toHaveLength(0);
    expect(events.filter((e) => e.kind === 'champion')).toHaveLength(0);
  });

  it('sets the whole roster celebrating', () => {
    const { arena } = toCompletion(10);
    run(arena, 0.5);
    expect(arena.fighters.every((f) => f.activity === 'celebrating')).toBe(true);
  });

  it('resolves a small roster too', () => {
    const { arena } = toCompletion(12, 30);
    expect(arena.tally[arena.champion!]).toBe(30);
  });
});

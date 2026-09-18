import { describe, expect, it } from 'vitest';
import {
  BASE_SPEED,
  BONKS_PER_DUEL,
  BONK_INTERVAL,
  CLEARING_RADIUS,
  COOLDOWN_SECONDS,
  DUEL_RADIUS,
  DUEL_SECONDS,
  FULL_FIGHTER_SIZE,
  MIN_FIGHTER_SIZE,
  MAX_TEMPO,
  TEMPO_RAMP_START,
  TRANSFORM_SECONDS,
  UPSET_RATE,
  WINDUP_SECONDS,
  beats,
  fighterSizeFor,
  leaderOf,
  playOut,
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

/** A Lineup of `n` Fighters of every Type. */
const even = (n: number) => ({ rock: n, paper: n, scissors: n });

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
  it('seeds exactly the Lineup it was given', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(1) });
    expect(arena.fighters).toHaveLength(60);
    for (const type of TYPES) expect(arena.tally[type]).toBe(20);
  });

  it('seeds an uneven Lineup just as faithfully', () => {
    const lineup = { rock: 100, paper: 5, scissors: 1 };
    const arena = createArena({ width: 1200, height: 700, lineup, random: mulberry32(1) });
    expect(arena.fighters).toHaveLength(106);
    expect(arena.tally).toEqual(lineup);
  });

  it('places the Lineup the same way every time under the same random source', () => {
    const lineup = { rock: 30, paper: 12, scissors: 3 };
    const place = (seed: number) =>
      createArena({ width: 800, height: 600, lineup, random: mulberry32(seed) }).fighters.map(
        (f) => `${f.type}@${f.x.toFixed(3)},${f.y.toFixed(3)}`,
      );

    expect(place(5)).toEqual(place(5));
    expect(place(5)).not.toEqual(place(6));
  });

  it('shuffles the Types across the board rather than dealing them in turn', () => {
    // Dealt round-robin, every third grid slot is the same Type.
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(8) });
    const dealt = arena.fighters.every((f, i) => f.type === TYPES[i % TYPES.length]);
    expect(dealt).toBe(false);
  });

  it('scatters fighters across the arena rather than stacking them', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(7) });
    const xs = arena.fighters.map((f) => f.x);
    const ys = arena.fighters.map((f) => f.y);

    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(800 * 0.6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(600 * 0.6);
    expect(new Set(arena.fighters.map((f) => `${f.x},${f.y}`)).size).toBe(60);
  });

  it('mixes the types across the board rather than clustering each in one place', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(3) });
    for (const type of TYPES) {
      const xs = arena.fighters.filter((f) => f.type === type).map((f) => f.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(800 * 0.4);
    }
  });

  it('starts every fighter roaming, off cooldown, with nothing duelling', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(2) });
    expect(arena.fighters.every((f) => f.activity === 'roaming')).toBe(true);
    expect(arena.fighters.every((f) => f.cooldown === 0)).toBe(true);
    expect(arena.duels).toHaveLength(0);
    expect(arena.champion).toBeNull();
  });

  it('starts at flat tempo with no elapsed time', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(2) });
    expect(arena.elapsed).toBe(0);
    expect(arena.tempo).toBe(1);
  });
});

describe('proximity', () => {
  it('locks two fighters of different types into a duel', () => {
    const arena = createArena({
      width: 400,
      height: 400,
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
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(4) });
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
      random: always(0.9),
      seed: [...pair('rock', 'scissors'), { type: 'rock', x: far, y: 200, heading: 0 }],
    });

    run(arena, 0.3);
    expect(arena.fighters[2].activity).toBe('roaming');
  });
});

describe('stepping an arena', () => {
  it('never changes the roster size — conversion preserves population exactly', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(11) });

    for (let i = 0; i < 3000; i++) {
      arena.step(FRAME);
      expect(arena.fighters).toHaveLength(60);
      expect(TYPES.reduce((sum, t) => sum + arena.tally[t], 0)).toBe(60);
    }
  });

  it('never lets a fighter leave the arena', () => {
    const arena = createArena({ width: 640, height: 480, lineup: even(20), random: mulberry32(13) });

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
    const arena = createArena({ width: 800, height: 600, lineup: even(20), random: mulberry32(17) });
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
    const arena = createArena({ width: 800, height: 600, lineup: even(1), random: always(0.9) });
    run(arena, TEMPO_RAMP_START - 1);
    expect(arena.tempo).toBe(1);
  });

  it('ramps up once the round has gone on', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(1), random: always(0.9) });
    run(arena, TEMPO_RAMP_START + 5);
    expect(arena.tempo).toBeGreaterThan(1);
  });

  it('is bounded, so a long round speeds up without fighters tunnelling past each other', () => {
    const arena = createArena({ width: 800, height: 600, lineup: even(1), random: always(0.9) });
    run(arena, TEMPO_RAMP_START + 500);
    expect(arena.tempo).toBe(MAX_TEMPO);
  });
});

describe('a champion', () => {
  /** Runs a round to its end, or throws if it never gets there. */
  function toCompletion(seed: number, perType = 20) {
    const arena = createArena({
      width: 800,
      height: 600,
      lineup: even(perType),
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
    const { arena } = toCompletion(12, 10);
    expect(arena.tally[arena.champion!]).toBe(30);
  });
});

describe('how big a Fighter is', () => {
  it('keeps the classic sixty-Fighter wide round at full size', () => {
    expect(fighterSizeFor(960, 540, 60, FULL_FIGHTER_SIZE)).toBeCloseTo(69, 0);
    expect(fighterSizeFor(1024, 700, 60, FULL_FIGHTER_SIZE)).toBe(69);
  });

  it('shrinks as the board gets more crowded', () => {
    const sixty = fighterSizeFor(960, 540, 60, FULL_FIGHTER_SIZE);
    const hundredFifty = fighterSizeFor(960, 540, 150, FULL_FIGHTER_SIZE);
    const threeHundred = fighterSizeFor(960, 540, 300, FULL_FIGHTER_SIZE);
    expect(hundredFifty).toBeLessThan(sixty);
    expect(threeHundred).toBeLessThan(hundredFifty);
  });

  it('never grows past the device maximum or shrinks below legibility', () => {
    expect(fighterSizeFor(2000, 2000, 3, 57)).toBe(57);
    expect(fighterSizeFor(300, 300, 300, FULL_FIGHTER_SIZE)).toBe(MIN_FIGHTER_SIZE);
  });

  it('is what a fresh Arena sizes its Fighters to', () => {
    const arena = createArena({
      width: 960,
      height: 540,
      lineup: even(100),
      random: mulberry32(1),
      maxFighterSize: FULL_FIGHTER_SIZE,
    });
    expect(arena.fighterSize).toBe(fighterSizeFor(960, 540, 300, FULL_FIGHTER_SIZE));
  });

  it('keeps the full-size Duel and Clearing distances on an uncrowded board', () => {
    const arena = createArena({ width: 400, height: 400, random: always(0.5), seed: pair('rock', 'paper') });
    expect(arena.duelRadius).toBe(DUEL_RADIUS);
    expect(arena.clearingRadius).toBe(CLEARING_RADIUS);
    expect(CLEARING_RADIUS).toBeCloseTo(90, -1);
  });

  it('shrinks the Duel distance with the Fighters, so a crowded board needs closer contact', () => {
    const gap = DUEL_RADIUS * 0.8;
    const roomy = createArena({ width: 400, height: 400, random: always(0.5), seed: pair('rock', 'scissors', gap) });
    const cramped = createArena({
      width: 60,
      height: 60,
      random: always(0.5),
      seed: [
        { type: 'rock', x: 30 - gap / 2, y: 30, heading: 0 },
        { type: 'scissors', x: 30 + gap / 2, y: 30, heading: Math.PI },
      ],
    });

    roomy.step(FRAME);
    cramped.step(FRAME);
    expect(cramped.fighterSize).toBeLessThan(roomy.fighterSize);
    expect(roomy.duels).toHaveLength(1);
    expect(cramped.duels).toHaveLength(0);
  });
});

describe('same-Type spreading', () => {
  function neighbours(a: Type, b: Type) {
    // Side by side, both heading right: without a push they travel in parallel.
    return createArena({
      width: 2000,
      height: 1000,
      random: always(0.5),
      seed: [
        { type: a, x: 200, y: 500, heading: 0 },
        { type: b, x: 200, y: 520, heading: 0 },
      ],
    });
  }

  it('pushes roaming Fighters of the same Type gently apart', () => {
    const arena = neighbours('rock', 'rock');
    run(arena, 0.5);
    const [a, b] = arena.fighters;
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    expect(gap).toBeGreaterThan(20);
    // Gently: a nudge, not a scatter.
    expect(gap).toBeLessThan(FULL_FIGHTER_SIZE * 1.5);
  });

  it('stops pushing once they are about a sprite and a half apart', () => {
    const arena = createArena({
      width: 2000,
      height: 1000,
      random: always(0.5),
      seed: [
        { type: 'rock', x: 200, y: 500, heading: 0 },
        { type: 'rock', x: 200, y: 500 + FULL_FIGHTER_SIZE * 1.6, heading: 0 },
      ],
    });
    run(arena, 0.5);
    const [a, b] = arena.fighters;
    expect(Math.abs(b.y - a.y)).toBeCloseTo(FULL_FIGHTER_SIZE * 1.6, 5);
  });

  it('spreads spectators of the same Type along the Clearing too', () => {
    const arena = createArena({
      width: 600,
      height: 600,
      random: always(0.9),
      seed: [
        ...pair('rock', 'scissors'),
        { type: 'paper', x: 200, y: 200 + DUEL_RADIUS, heading: 0 },
        { type: 'paper', x: 203, y: 200 + DUEL_RADIUS, heading: 0 },
      ],
    });
    run(arena, 1);
    const [, , c, d] = arena.fighters;
    expect(c.activity).toBe('spectating');
    expect(d.activity).toBe('spectating');
    expect(Math.hypot(c.x - d.x, c.y - d.y)).toBeGreaterThan(20);
  });
});

describe('the transform', () => {
  it('takes about a second and a bit, long enough to read as a death and a rebirth', () => {
    expect(TRANSFORM_SECONDS).toBeCloseTo(1.2, 1);
  });

  it('reports the rebirth when the new Type takes over', () => {
    const arena = createArena({ width: 400, height: 400, random: always(0.9), seed: pair('rock', 'scissors') });
    const events = run(arena, ENCOUNTER);
    const reborn = events.filter((e) => e.kind === 'rebirth');
    expect(reborn).toHaveLength(1);
    expect(reborn[0]).toMatchObject({ fighter: 1, from: 'scissors', to: 'rock' });
  });

  it('is not prey: nobody hunts a Fighter mid-transform', () => {
    // C is a rock far below, walking straight down, away from the Duel. The
    // only scissors on the board is the one losing it, so while that Duel runs
    // C bends back toward it; once it is transforming, C has nothing to chase.
    const arena = createArena({
      width: 2000,
      height: 2000,
      random: always(0.5),
      seed: [...pair('rock', 'scissors'), { type: 'rock', x: 200, y: 1400, heading: Math.PI / 2 }],
    });

    const events: ArenaEvent[] = [];
    while (conversions(events).length === 0) events.push(...arena.step(FRAME));
    const c = arena.fighters[2];
    const before = c.heading;
    run(arena, TRANSFORM_SECONDS * 0.8);
    expect(arena.fighters[1].activity).toBe('transforming');
    expect(c.heading).toBeCloseTo(before, 6);
  });
});

describe('the shockwave', () => {
  /**
   * A rock-scissors Duel at the centre of a big board, and one bystander,
   * stepped until the Conversion lands. Also says what the bystander was doing
   * the moment before: the Clearing goes with its Duel, so a spectator is
   * released in the very step the Shockwave goes off.
   */
  function fight(draw: number, bystander: FighterSeed) {
    const arena = createArena({
      width: 1200,
      height: 1200,
      random: always(draw),
      seed: [
        { type: 'rock', x: 600 - DUEL_RADIUS / 4, y: 600, heading: 0 },
        { type: 'scissors', x: 600 + DUEL_RADIUS / 4, y: 600, heading: Math.PI },
        bystander,
      ],
    });
    let wasDoing = arena.fighters[2].activity;
    const events: ArenaEvent[] = [];
    while (conversions(events).length === 0) {
      wasDoing = arena.fighters[2].activity;
      events.push(...arena.step(FRAME));
    }
    return { arena, wasDoing };
  }

  const distance = (arena: Arena, i: number) =>
    Math.hypot(arena.fighters[i].x - 600, arena.fighters[i].y - 600);

  /** The furthest a Fighter can walk under its own steam in `seconds`. */
  const walk = (seconds: number) => BASE_SPEED * seconds;

  // A scissors has no paper to chase here, so it only wanders where it is put.
  const wanderer = (at: number): FighterSeed => ({ type: 'scissors', x: 600, y: 600 + at, heading: 0 });

  it("goes off where a Conversion lands, in the winner's Type", () => {
    const { arena } = fight(0.9, wanderer(500));
    expect(arena.shockwaves).toHaveLength(1);
    const [wave] = arena.shockwaves;
    expect(wave).toMatchObject({ type: 'rock', upset: false });
    expect(wave.x).toBeCloseTo(600, 1);
    expect(wave.y).toBeCloseTo(600, 1);
    expect(arena.shockwaves[0].radius).toBeCloseTo(CLEARING_RADIUS * 2.5, 0);
  });

  it('pushes a spectator well out past the Clearing', () => {
    const { arena, wasDoing } = fight(0.9, { type: 'paper', x: 600, y: 600 + DUEL_RADIUS * 2, heading: 0 });
    expect(wasDoing).toBe('spectating');
    run(arena, 0.4);
    expect(distance(arena, 2)).toBeGreaterThan(CLEARING_RADIUS * 1.5);
  });

  it('pushes a roaming Fighter outward too — nobody is immune', () => {
    const { arena, wasDoing } = fight(0.9, wanderer(CLEARING_RADIUS * 1.4));
    expect(wasDoing).toBe('roaming');
    const before = distance(arena, 2);
    run(arena, 0.4);
    expect(distance(arena, 2) - before).toBeGreaterThan(walk(0.4) + CLEARING_RADIUS * 0.3);
  });

  it('leaves Fighters beyond its reach alone', () => {
    const { arena } = fight(0.9, wanderer(CLEARING_RADIUS * 3));
    expect(distance(arena, 2)).toBeGreaterThan(arena.shockwaves[0].radius);
    const before = distance(arena, 2);
    run(arena, 0.4);
    expect(Math.abs(distance(arena, 2) - before)).toBeLessThanOrEqual(walk(0.4));
  });

  it('fades out in under half a second', () => {
    const { arena } = fight(0.9, wanderer(500));
    run(arena, 0.45);
    expect(arena.shockwaves).toHaveLength(0);
  });

  it('is bigger on an Upset', () => {
    const standard = fight(0.9, wanderer(500)).arena;
    const upset = fight(0, wanderer(500)).arena;
    expect(upset.shockwaves[0].upset).toBe(true);
    expect(upset.shockwaves[0].radius).toBeGreaterThan(standard.shockwaves[0].radius);

    const pushed = (draw: number) => {
      const { arena } = fight(draw, { type: 'paper', x: 600, y: 600 + DUEL_RADIUS * 2, heading: 0 });
      run(arena, 0.4);
      return distance(arena, 2);
    };
    expect(pushed(0)).toBeGreaterThan(pushed(0.9));
  });
});

describe('playing a round out without drawing it', () => {
  const LIMIT = 10 * 60;

  it('crowns a Champion in a seeded hundred-a-side round within the time limit', () => {
    const arena = createArena({ width: 1200, height: 700, lineup: even(100), random: mulberry32(21) });
    const winner = playOut(arena, LIMIT, mulberry32(1));
    expect(arena.champion).toBe(winner);
    expect(arena.elapsed).toBeLessThan(LIMIT);
  });

  it('crowns a Champion in a lopsided one-one-hundred round within the time limit', () => {
    const arena = createArena({
      width: 1200,
      height: 700,
      lineup: { rock: 1, paper: 1, scissors: 100 },
      random: mulberry32(22),
    });
    const winner = playOut(arena, LIMIT, mulberry32(1));
    expect(arena.champion).toBe(winner);
  });

  it('gives the round to the biggest Type when time runs out first', () => {
    // Nobody here can ever meet: the time limit is what ends it.
    const arena = createArena({
      width: 4000,
      height: 4000,
      random: always(0.5),
      seed: [
        { type: 'rock', x: 100, y: 100, heading: Math.PI },
        { type: 'rock', x: 300, y: 100, heading: Math.PI },
        { type: 'paper', x: 3900, y: 3900, heading: 0 },
      ],
    });
    expect(playOut(arena, 1, always(0.5))).toBe('rock');
    expect(arena.champion).toBeNull();
  });

  it('breaks a tie for the most Fighters with the random source', () => {
    const tally = { rock: 4, paper: 4, scissors: 1 };
    expect(leaderOf(tally, always(0))).toBe('rock');
    expect(leaderOf(tally, always(0.99))).toBe('paper');
    expect(leaderOf({ rock: 1, paper: 2, scissors: 9 }, always(0))).toBe('scissors');
  });
});

/**
 * The RPS Royale **Arena** — every decision the game makes.
 *
 * An Arena is one run: a **Roster** of Fighters hopping around a rectangle,
 * seeded from the viewer's **Lineup**, the **Duels** in flight, the
 * **Shockwaves** spreading from each Conversion, the elapsed time, the
 * **Tempo**, and the **Champion** once one Type owns the whole board. Nobody dies — the loser of a Duel
 * **converts** into the winner's Type — so the Roster's size is invariant for
 * the life of the Arena and one Type slowly sweeps the board.
 *
 * Pure. No canvas, no DOM, no timers, no storage, and in particular no
 * `Math.random`: the random source is injected, which is what makes the ninety-
 * ten Upset split and the spawn scatter assertable. The page steps the Arena
 * with a time delta, reads the Roster back, and asks the Sheet module
 * (`./sprites.ts`) where the pixels for a given Type and state live. It makes no
 * decision about who wins anything.
 *
 * The Arena exposes no drawing concept whatsoever — no colours, no sprite
 * indices, no screen coordinates beyond its own coordinate space, which is
 * simply pixels of the canvas it was sized to. It does decide how big a Fighter
 * is, because every distance the rules care about — how close a Duel needs,
 * how wide a Clearing is, how far apart a crowd spreads — is measured in it.
 */

import type { Lineup } from './lineup';
import { TYPES, type Type } from './sprites';

export type { Type };

/**
 * What a Fighter is doing. Exactly one at a time, and the transitions between
 * them are the Arena's whole state machine:
 *
 * ```
 * roaming      --near an enemy, neither on Cooldown, no Clearing in the way--> duelling
 * roaming      --inside someone else's Clearing--> spectating
 * spectating   --that Clearing expires--> roaming
 * duelling     --windup, bonk, bonk, bonk--> transforming (loser) / roaming (winner)
 * transforming --the morph completes (a rebirth)--> roaming, now the winner's Type
 * any          --a Champion emerges--> celebrating
 * ```
 */
export type Activity = 'roaming' | 'spectating' | 'duelling' | 'transforming' | 'celebrating';

export interface Fighter {
  readonly id: number;
  /** Which of rock, paper or scissors this Fighter currently is. */
  type: Type;
  x: number;
  y: number;
  /** Direction of travel, in radians. */
  heading: number;
  /** -1 or 1: which way the sprite is drawn. Never derived by the page. */
  facing: 1 | -1;
  /** Where in its hop this Fighter is, 0 to 1. A property of travel. */
  hopPhase: number;
  activity: Activity;
  /** Seconds of immunity left: while this is above zero, no new Duel. */
  cooldown: number;
  /** Seconds spent in the current activity — what picks the animation frame. */
  stateElapsed: number;
  /** The Type a transforming Fighter is becoming, null for everyone else. */
  becoming: Type | null;
}

export interface Duel {
  readonly id: number;
  /** The fixed point the Duel happens at. The Clearing is centred here. */
  readonly x: number;
  readonly y: number;
  readonly winner: number;
  readonly loser: number;
  /**
   * The Outcome, rolled when the Duel was created rather than when it ends, so
   * every later beat of it reads a value already decided and the animation can
   * telegraph the result instead of contradicting it.
   */
  readonly winnerType: Type;
  readonly loserType: Type;
  readonly upset: boolean;
  /** Bonks landed so far. The last one is what lands the Conversion. */
  bonks: number;
  elapsed: number;
}

/** Something that happened this step, for the page to make a noise about. */
export type ArenaEvent =
  | { kind: 'bonk'; x: number; y: number; index: number }
  | { kind: 'conversion'; fighter: number; from: Type; to: Type; upset: boolean; x: number; y: number }
  | { kind: 'rebirth'; fighter: number; from: Type; to: Type; x: number; y: number }
  | { kind: 'champion'; type: Type };

/**
 * The outward push from a Conversion. It shoves roaming and spectating
 * Fighters of every Type away from where the Duel landed, and fades out.
 */
export interface Shockwave {
  readonly x: number;
  readonly y: number;
  /** How far it reaches. Bigger on an Upset. */
  readonly radius: number;
  /** The winner's Type. */
  readonly type: Type;
  readonly upset: boolean;
  /** Seconds since it went off. It is gone at `SHOCKWAVE_SECONDS`. */
  elapsed: number;
}

/** An explicit starting placement, instead of the shuffled scatter. */
export interface FighterSeed {
  type: Type;
  x: number;
  y: number;
  heading?: number;
}

export interface ArenaOptions {
  width: number;
  height: number;
  /** How many of each Type to scatter. Ignored with a `seed`. */
  lineup?: Lineup;
  /** The injected random source, uniform over [0, 1). */
  random: () => number;
  seed?: readonly FighterSeed[];
  /** The largest a Fighter gets, on an uncrowded board. Full size by default. */
  maxFighterSize?: number;
}

export interface Arena {
  readonly width: number;
  readonly height: number;
  readonly fighters: readonly Fighter[];
  readonly duels: readonly Duel[];
  readonly shockwaves: readonly Shockwave[];
  /** How big a Fighter is, in arena pixels. Fixed for the round. */
  readonly fighterSize: number;
  /** How close two Fighters must get to lock into a Duel. */
  readonly duelRadius: number;
  /** The radius a Duel clears around itself. */
  readonly clearingRadius: number;
  readonly tally: Readonly<Record<Type, number>>;
  readonly tempo: number;
  readonly elapsed: number;
  readonly champion: Type | null;
  /** Advance by `dt` seconds, and report what happened. */
  step(dt: number): readonly ArenaEvent[];
}

// === The rules ===

/** One duel in ten goes the other way. */
export const UPSET_RATE = 0.1;

const PREY: Record<Type, Type> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

/** The Type this one defeats under the standard rules. */
export function beats(type: Type): Type {
  return PREY[type];
}

/** Who wins a matchup under the standard rules, either way round. */
export function standardWinner(a: Type, b: Type): Type {
  if (a === b) return a;
  return beats(a) === b ? a : b;
}

/** The Outcome of a matchup for a draw in [0, 1): standard, or the Upset. */
export function outcomeFor(a: Type, b: Type, draw: number): { winner: Type; upset: boolean } {
  const standard = standardWinner(a, b);
  if (a === b || draw >= UPSET_RATE) return { winner: standard, upset: false };
  return { winner: standard === a ? b : a, upset: true };
}

// === How big a Fighter is ===

/** A Fighter's size on an uncrowded wide board — what the classic round draws. */
export const FULL_FIGHTER_SIZE = 69;
/** Below this, a sprite stops reading as a character. */
export const MIN_FIGHTER_SIZE = 32;

/**
 * The board every size is calibrated against: sixty Fighters on a 960 × 540
 * board are exactly full size, so the classic round looks as it always did,
 * and anything more crowded shrinks with the square root of the room each
 * Fighter has.
 */
const REFERENCE_ROOM = Math.sqrt((960 * 540) / 60);
const SIZE_PER_ROOM = FULL_FIGHTER_SIZE / REFERENCE_ROOM;

/**
 * How big a Fighter is on a board of this size holding this many:
 * `clamp(k · √(area / total), MIN_FIGHTER_SIZE, max)`.
 */
export function fighterSizeFor(width: number, height: number, total: number, max: number): number {
  const room = Math.sqrt(Math.max(0, width * height) / Math.max(1, total));
  return Math.min(max, Math.max(MIN_FIGHTER_SIZE, SIZE_PER_ROOM * room));
}

// === Timings and distances, all in seconds and arena pixels ===
//
// Distances are stated at full Fighter size and scale with it, so a crowded
// board of small Fighters keeps the same proportions as the classic one.

/** How close two full-size Fighters must get to lock into a Duel. */
export const DUEL_RADIUS = 18;
/** The radius a Duel clears around itself at full size. Spectators back out to its edge. */
export const CLEARING_RADIUS = DUEL_RADIUS * 5;

export const BONKS_PER_DUEL = 3;
/** How long a Duel rears back before the first Bonk. */
export const WINDUP_SECONDS = 1.2;
/** The gap between Bonks: rear back again, then clash again. */
export const BONK_INTERVAL = 0.9;
/**
 * Windup, then a Bonk every interval, the last of which ends the Duel — three
 * seconds at flat Tempo. A Duel is the thing the tool exists to be watched, so
 * it is paced as a beat of animation rather than as a state change that happens
 * to be drawn. Tempo shortens it as a round escalates.
 */
export const DUEL_SECONDS = WINDUP_SECONDS + (BONKS_PER_DUEL - 1) * BONK_INTERVAL;

export interface DuelBeat {
  /** Rearing back, or mid-clash. */
  phase: 'windup' | 'impact';
  /** How far into that beat, in seconds. */
  elapsed: number;
  /** Which Bonk this beat is leading up to, from 0. */
  bonk: number;
}

/**
 * Which beat of a Duel is playing `elapsed` seconds in.
 *
 * A Duel is not one windup and then three twitches: between Bonks it rears back
 * again, so the three seconds read as a brawl rather than as a long pause with
 * some frames at the end. `clashWindow` is how long the caller's clash animation
 * runs, and the clash is centred on the Bonk — the contact pose in the middle of
 * that animation lands on the instant the Bonk is reported, rather than trailing
 * it. Everything either side of a clash is windup.
 *
 * Pure, and free of sprite concepts: the caller says how long its clash takes,
 * and gets back which beat to draw.
 */
export function duelBeat(elapsed: number, clashWindow: number): DuelBeat {
  const half = Math.max(0, clashWindow) / 2;
  const e = Math.max(0, elapsed);

  // The Bonk this beat belongs to: the first whose clash has not finished.
  const raw = Math.floor((e - WINDUP_SECONDS - half) / BONK_INTERVAL) + 1;
  const bonk = Math.max(0, Math.min(BONKS_PER_DUEL - 1, raw));
  const at = WINDUP_SECONDS + bonk * BONK_INTERVAL;

  if (e >= at - half) return { phase: 'impact', elapsed: e - (at - half), bonk };

  const previousEnd = bonk === 0 ? 0 : WINDUP_SECONDS + (bonk - 1) * BONK_INTERVAL + half;
  return { phase: 'windup', elapsed: e - previousEnd, bonk };
}
/**
 * The loser's death and rebirth: the morph plays, the Fighter holds as a
 * neutral silhouette, then pops back as the winner's Type. Long enough to read
 * as a beat of its own rather than a sprite swap.
 */
export const TRANSFORM_SECONDS = 1.2;
/** Immunity carried out of a Duel, so one encounter is exactly one Conversion. */
export const COOLDOWN_SECONDS = 0.4;

/** How long a round runs at flat Tempo before it starts to escalate. */
export const TEMPO_RAMP_START = 15;
const TEMPO_RAMP_SPAN = 10;
/**
 * The ceiling on Tempo. Bounded on purpose: an unbounded ramp would move a
 * Fighter further in one step than a Duel's radius, and they would start
 * tunnelling past each other instead of fighting.
 */
export const MAX_TEMPO = 6;

/** How fast a Fighter roams at flat Tempo. */
export const BASE_SPEED = 46;
const BASE_SEEK_RATE = 1.2;
const MAX_SEEK_RATE = 8;
const WANDER_RATE = 2.4;
const SPECTATOR_BACKOFF = 70;
const HOP_CYCLES_PER_SECOND = 1.6;
const SEPARATION = DUEL_RADIUS * 1.2;
const MARGIN = 16;

/** Same-Type Fighters push apart within this many Fighter widths. */
const SPREAD_RANGE = 1.5;
/** How fast, at full size, two touching same-Type Fighters drift apart. */
const SPREAD_SPEED = 60;

/** How long a Shockwave lasts. */
export const SHOCKWAVE_SECONDS = 0.4;
/** How far a Shockwave reaches, in Clearings. */
const SHOCKWAVE_REACH = 2.5;
/** The initial outward speed at the centre, at full size. */
const SHOCKWAVE_PUSH = 900;
/** An Upset hits harder and further. */
const UPSET_REACH = 1.4;
const UPSET_PUSH = 1.5;

/**
 * The largest slice of time one step will simulate. A tab that was hidden for a
 * minute comes back to one ordinary step rather than a minute of simulation
 * compressed into a single frame, which would teleport the whole board.
 */
const MAX_STEP = 1 / 30;

/** The escalation factor at a given point in a round: flat, then ramping. */
export function tempoAt(elapsed: number): number {
  if (elapsed <= TEMPO_RAMP_START) return 1;
  return Math.min(MAX_TEMPO, 1 + (elapsed - TEMPO_RAMP_START) / TEMPO_RAMP_SPAN);
}

/** Turn `from` toward `to` by at most `maxTurn`, the short way round. */
function turnToward(from: number, to: number, maxTurn: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + Math.max(-maxTurn, Math.min(maxTurn, delta));
}

function facingOf(heading: number): 1 | -1 {
  return Math.cos(heading) >= 0 ? 1 : -1;
}

export function createArena(options: ArenaOptions): Arena {
  const { width, height, random } = options;
  const lineup: Lineup = options.lineup ?? { rock: 0, paper: 0, scissors: 0 };
  const total = options.seed ? options.seed.length : TYPES.reduce((n, t) => n + lineup[t], 0);

  const fighterSize = fighterSizeFor(
    width,
    height,
    total,
    options.maxFighterSize ?? FULL_FIGHTER_SIZE,
  );
  const scale = fighterSize / FULL_FIGHTER_SIZE;
  const duelRadius = DUEL_RADIUS * scale;
  const clearingRadius = CLEARING_RADIUS * scale;
  const separation = SEPARATION * scale;
  const spreadRange = SPREAD_RANGE * fighterSize;

  const fighters: Fighter[] = options.seed
    ? options.seed.map((s, id) => spawn(id, s.type, s.x, s.y, s.heading ?? random() * Math.PI * 2))
    : scatter();

  let duels: Duel[] = [];
  let shockwaves: Shockwave[] = [];
  let elapsed = 0;
  let tempo = 1;
  let champion: Type | null = null;
  let nextDuelId = 0;

  function spawn(id: number, type: Type, x: number, y: number, heading: number): Fighter {
    return {
      id,
      type,
      x,
      y,
      heading,
      facing: facingOf(heading),
      hopPhase: random(),
      activity: 'roaming',
      cooldown: 0,
      stateElapsed: 0,
      becoming: null,
    };
  }

  /**
   * The starting Roster: exactly the Lineup, spread over a jittered grid so the
   * fight does not begin as one pile in the middle. Which Type lands in which
   * slot is shuffled with the injected random source, so every Type starts
   * mixed into the board whatever its numbers, and the same source always
   * places the same round.
   */
  function scatter(): Fighter[] {
    const types: Type[] = TYPES.flatMap((t) => Array.from({ length: lineup[t] }, () => t));
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    const size = types.length;
    const columns = Math.max(1, Math.round(Math.sqrt((size * width) / height)));
    const rows = Math.ceil(size / columns);
    const cellW = (width - MARGIN * 2) / columns;
    const cellH = (height - MARGIN * 2) / rows;

    return Array.from({ length: size }, (_, i) => {
      const column = i % columns;
      const row = Math.floor(i / columns);
      const x = MARGIN + (column + 0.15 + random() * 0.7) * cellW;
      const y = MARGIN + (row + 0.15 + random() * 0.7) * cellH;
      return spawn(i, types[i], x, y, random() * Math.PI * 2);
    });
  }

  /**
   * Every pair from `list` closer than `range`, found through a grid of
   * range-sized cells so a crowded board does not cost every pair on it.
   */
  function closePairs(
    list: readonly Fighter[],
    range: number,
    visit: (a: Fighter, b: Fighter, dx: number, dy: number, squared: number) => void,
  ) {
    // Never finer than the spread range: a grid of Duel-radius cells is
    // thousands of buckets to allocate every step for a few hundred Fighters.
    const cell = Math.max(1, range, spreadRange);
    const columns = Math.ceil(width / cell) + 1;
    const rows = Math.ceil(height / cell) + 1;
    const grid: Fighter[][] = Array.from({ length: columns * rows }, () => []);
    const columnOf = (f: Fighter) => Math.min(columns - 1, Math.floor(Math.max(0, f.x) / cell));
    const rowOf = (f: Fighter) => Math.min(rows - 1, Math.floor(Math.max(0, f.y) / cell));

    for (const f of list) grid[rowOf(f) * columns + columnOf(f)].push(f);

    const limit = range * range;
    for (const a of list) {
      const column = columnOf(a);
      const row = rowOf(a);
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, column - 1); c <= Math.min(columns - 1, column + 1); c++) {
          for (const b of grid[r * columns + c]) {
            // Each pair once, lower id first, whichever cell it was found from.
            if (b.id <= a.id) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const squared = dx * dx + dy * dy;
            if (squared < limit) visit(a, b, dx, dy, squared);
          }
        }
      }
    }
  }

  /** The Fighters of each Type, rebuilt once a step so a hunt only walks its prey. */
  let ofType: Record<Type, Fighter[]> = { rock: [], paper: [], scissors: [] };

  function sortByType() {
    ofType = { rock: [], paper: [], scissors: [] };
    for (const f of fighters) ofType[f.type].push(f);
  }

  function byId(id: number): Fighter {
    return fighters[id];
  }

  function tallyNow(): Record<Type, number> {
    const counts: Record<Type, number> = { rock: 0, paper: 0, scissors: 0 };
    for (const f of fighters) counts[f.type]++;
    return counts;
  }

  /** The Clearing a Fighter stands inside, or null. Nearest one wins. */
  function clearingAround(f: Fighter): Duel | null {
    let closest: Duel | null = null;
    let best = clearingRadius;
    for (const duel of duels) {
      if (duel.winner === f.id || duel.loser === f.id) return null;
      const distance = Math.sqrt((f.x - duel.x) ** 2 + (f.y - duel.y) ** 2);
      if (distance < best) {
        best = distance;
        closest = duel;
      }
    }
    return closest;
  }

  function clamp(f: Fighter) {
    const minX = MARGIN;
    const maxX = Math.max(MARGIN, width - MARGIN);
    const minY = MARGIN;
    const maxY = Math.max(MARGIN, height - MARGIN);

    if (f.x < minX || f.x > maxX) {
      f.x = Math.min(maxX, Math.max(minX, f.x));
      f.heading = Math.PI - f.heading;
    }
    if (f.y < minY || f.y > maxY) {
      f.y = Math.min(maxY, Math.max(minY, f.y));
      f.heading = -f.heading;
    }
  }

  function nearestPrey(f: Fighter): Fighter | null {
    const prey = beats(f.type);
    let closest: Fighter | null = null;
    let best = Infinity;
    for (const other of ofType[prey]) {
      // A Fighter mid-transform is neither what it was nor what it will be.
      if (other.activity === 'celebrating' || other.activity === 'transforming') continue;
      // Squared: this runs for every pair on the board, every step.
      const dx = other.x - f.x;
      const dy = other.y - f.y;
      const distance = dx * dx + dy * dy;
      if (distance < best) {
        best = distance;
        closest = other;
      }
    }
    return closest;
  }

  function roam(f: Fighter, d: number) {
    f.heading += (random() * 2 - 1) * WANDER_RATE * d;

    // Mostly its own heading, leaning gently toward the nearest Type it beats:
    // pure drift stalemates, and full pursuit looks like a flocking demo.
    const prey = nearestPrey(f);
    if (prey) {
      const desired = Math.atan2(prey.y - f.y, prey.x - f.x);
      const rate = Math.min(MAX_SEEK_RATE, BASE_SEEK_RATE * tempo);
      f.heading = turnToward(f.heading, desired, rate * d);
    }

    const speed = BASE_SPEED * tempo;
    f.x += Math.cos(f.heading) * speed * d;
    f.y += Math.sin(f.heading) * speed * d;
    clamp(f);

    f.facing = facingOf(f.heading);
    f.hopPhase = (f.hopPhase + HOP_CYCLES_PER_SECOND * tempo * d) % 1;
  }

  /** Back out to the Clearing's edge and turn to watch the fight. */
  function spectate(f: Fighter, duel: Duel, d: number) {
    const dx = f.x - duel.x;
    const dy = f.y - duel.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const target = Math.min(clearingRadius, distance + SPECTATOR_BACKOFF * scale * d * tempo);
    f.x = duel.x + (dx / distance) * target;
    f.y = duel.y + (dy / distance) * target;
    clamp(f);

    f.heading = Math.atan2(duel.y - f.y, duel.x - f.x);
    f.facing = facingOf(f.heading);
  }

  function enter(f: Fighter, activity: Activity) {
    if (f.activity !== activity) {
      f.activity = activity;
      f.stateElapsed = 0;
    }
  }

  /** Pairs eligible to start a Duel, closest first, one Duel per Fighter. */
  function startDuels() {
    const eligible = fighters.filter((f) => f.activity === 'roaming' && f.cooldown <= 0);
    const candidates: { a: Fighter; b: Fighter; distance: number }[] = [];

    // A hair past the radius, so a pair exactly at it still counts.
    closePairs(eligible, duelRadius * (1 + 1e-9), (a, b, _dx, _dy, squared) => {
      if (a.type !== b.type) candidates.push({ a, b, distance: Math.sqrt(squared) });
    });

    // Closest first; ties in the order the Roster lists them, so a seeded
    // round always pairs the same way.
    candidates.sort((l, r) => l.distance - r.distance || l.a.id - r.a.id || l.b.id - r.b.id);
    const taken = new Set<number>();

    for (const { a, b } of candidates) {
      if (taken.has(a.id) || taken.has(b.id)) continue;
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      // No Duel inside somebody else's Clearing — that is what stops a crowded
      // board from chaining one fight into the next on top of it.
      if (duels.some((d) => Math.sqrt((x - d.x) ** 2 + (y - d.y) ** 2) < clearingRadius)) continue;

      const { winner, upset } = outcomeFor(a.type, b.type, random());
      const winnerFighter = a.type === winner ? a : b;
      const loserFighter = winnerFighter === a ? b : a;

      duels.push({
        id: nextDuelId++,
        x,
        y,
        winner: winnerFighter.id,
        loser: loserFighter.id,
        winnerType: winner,
        loserType: loserFighter.type,
        upset,
        bonks: 0,
        elapsed: 0,
      });

      taken.add(a.id);
      taken.add(b.id);
      enter(a, 'duelling');
      enter(b, 'duelling');
      a.heading = Math.atan2(b.y - a.y, b.x - a.x);
      b.heading = Math.atan2(a.y - b.y, a.x - b.x);
      a.facing = facingOf(a.heading);
      b.facing = facingOf(b.heading);
    }
  }

  function advanceDuels(events: ArenaEvent[], beat: number) {
    const surviving: Duel[] = [];

    for (const duel of duels) {
      duel.elapsed += beat;

      while (
        duel.bonks < BONKS_PER_DUEL &&
        duel.elapsed >= WINDUP_SECONDS + duel.bonks * BONK_INTERVAL
      ) {
        duel.bonks++;
        events.push({ kind: 'bonk', x: duel.x, y: duel.y, index: duel.bonks });
      }

      // The third bonk is the one that lands the result.
      if (duel.bonks < BONKS_PER_DUEL) {
        surviving.push(duel);
        continue;
      }

      resolve(duel, events);
    }

    duels = surviving;
  }

  function resolve(duel: Duel, events: ArenaEvent[]) {
    const winner = byId(duel.winner);
    const loser = byId(duel.loser);

    enter(winner, 'roaming');
    winner.cooldown = COOLDOWN_SECONDS;

    enter(loser, 'transforming');
    loser.becoming = duel.winnerType;
    loser.cooldown = COOLDOWN_SECONDS + TRANSFORM_SECONDS;

    // Pushed apart on release, so one encounter cannot produce a second Duel.
    const angle = Math.atan2(loser.y - winner.y, loser.x - winner.x) || 0;
    winner.x = duel.x - Math.cos(angle) * (separation / 2);
    winner.y = duel.y - Math.sin(angle) * (separation / 2);
    loser.x = duel.x + Math.cos(angle) * (separation / 2);
    loser.y = duel.y + Math.sin(angle) * (separation / 2);
    clamp(winner);
    clamp(loser);

    shockwaves.push({
      x: duel.x,
      y: duel.y,
      radius: clearingRadius * SHOCKWAVE_REACH * (duel.upset ? UPSET_REACH : 1),
      type: duel.winnerType,
      upset: duel.upset,
      elapsed: 0,
    });

    events.push({
      kind: 'conversion',
      fighter: loser.id,
      from: duel.loserType,
      to: duel.winnerType,
      upset: duel.upset,
      x: duel.x,
      y: duel.y,
    });
  }

  function finishTransforms(events: ArenaEvent[]) {
    for (const f of fighters) {
      if (f.activity !== 'transforming') continue;
      if (f.stateElapsed < TRANSFORM_SECONDS) continue;
      const from = f.type;
      f.type = f.becoming ?? f.type;
      f.becoming = null;
      enter(f, 'roaming');
      f.cooldown = Math.max(f.cooldown, COOLDOWN_SECONDS);
      events.push({ kind: 'rebirth', fighter: f.id, from, to: f.type, x: f.x, y: f.y });
    }
  }

  const free = (f: Fighter) => f.activity === 'roaming' || f.activity === 'spectating';

  /**
   * Same-Type Fighters nudge each other apart, so a Type reads as a crowd of
   * characters rather than a stack of one sprite. Only the free move; a
   * duelling or transforming Fighter still counts as someone to keep clear of.
   */
  function spread(d: number) {
    const pushes = fighters.map(() => ({ x: 0, y: 0 }));
    closePairs(fighters, spreadRange, (a, b, dx, dy, squared) => {
      if (a.type !== b.type) return;
      const distance = Math.sqrt(squared);
      // Exactly on top of each other: part them along the x axis.
      const ux = distance > 0 ? dx / distance : 1;
      const uy = distance > 0 ? dy / distance : 0;
      const push = SPREAD_SPEED * scale * (1 - distance / spreadRange) * d;
      pushes[a.id].x -= ux * push;
      pushes[a.id].y -= uy * push;
      pushes[b.id].x += ux * push;
      pushes[b.id].y += uy * push;
    });

    for (let i = 0; i < fighters.length; i++) {
      const f = fighters[i];
      if (!free(f)) continue;
      f.x += pushes[i].x;
      f.y += pushes[i].y;
      clamp(f);
    }
  }

  /** Every live Shockwave shoves the free Fighters in reach outward, fading as it ages. */
  function blast(d: number) {
    for (const wave of shockwaves) {
      const fade = Math.max(0, 1 - wave.elapsed / SHOCKWAVE_SECONDS);
      const strength = SHOCKWAVE_PUSH * scale * (wave.upset ? UPSET_PUSH : 1) * fade;
      for (const f of fighters) {
        if (!free(f)) continue;
        const dx = f.x - wave.x;
        const dy = f.y - wave.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= wave.radius || distance === 0) continue;
        const push = strength * (1 - distance / wave.radius) * d;
        f.x += (dx / distance) * push;
        f.y += (dy / distance) * push;
        clamp(f);
      }
      wave.elapsed += d;
    }
    shockwaves = shockwaves.filter((wave) => wave.elapsed < SHOCKWAVE_SECONDS);
  }

  return {
    width,
    height,
    fighterSize,
    duelRadius,
    clearingRadius,

    get fighters() {
      return fighters;
    },
    get duels() {
      return duels;
    },
    get shockwaves() {
      return shockwaves;
    },
    get tally() {
      return tallyNow();
    },
    get tempo() {
      return tempo;
    },
    get elapsed() {
      return elapsed;
    },
    get champion() {
      return champion;
    },

    step(dt) {
      const events: ArenaEvent[] = [];
      const d = Math.min(MAX_STEP, Math.max(0, Number.isFinite(dt) ? dt : 0));

      elapsed += d;
      tempo = tempoAt(elapsed);

      // Tempo escalates how fast a Fighter gets somewhere, not how fast it is
      // animated. A character's own business — breathing, spectating, morphing,
      // dancing — plays at its authored frame rate however frantic the round
      // has become; speeding that up just makes the sprites flicker. Travel is
      // the exception, and hopping with it: a Fighter crossing the board at six
      // times the speed has to hop six times as often or it reads as skating.
      for (const f of fighters) f.stateElapsed += d;

      if (champion !== null) return events;

      for (const f of fighters) f.cooldown = Math.max(0, f.cooldown - d);

      // Duels are the other exception. A Duel is three seconds early on, when
      // there is everything to watch, and a fraction of that once the ramp is
      // on — it holds two Fighters and a Clearing for as long as it runs, so
      // duels staying three seconds all round is what would make one grind.
      advanceDuels(events, d * tempo);
      finishTransforms(events);
      sortByType();

      for (const f of fighters) {
        if (f.activity === 'duelling' || f.activity === 'transforming') continue;
        const clearing = clearingAround(f);
        if (clearing) {
          enter(f, 'spectating');
          spectate(f, clearing, d);
        } else {
          enter(f, 'roaming');
          roam(f, d);
        }
      }

      spread(d);
      blast(d);
      startDuels();

      const counts = tallyNow();
      const swept = TYPES.find((type) => counts[type] === fighters.length);
      if (swept) {
        champion = swept;
        duels = [];
        shockwaves = [];
        for (const f of fighters) enter(f, 'celebrating');
        events.push({ kind: 'champion', type: swept });
      }

      return events;
    },
  };
}

/**
 * The Type with the most Fighters. A tie is broken with the injected random
 * source, so a seeded round always ends the same way.
 */
export function leaderOf(tally: Readonly<Record<Type, number>>, random: () => number): Type {
  const most = Math.max(...TYPES.map((t) => tally[t]));
  const tied = TYPES.filter((t) => tally[t] === most);
  return tied[Math.min(tied.length - 1, Math.floor(random() * tied.length))];
}

/**
 * Plays a round out without drawing it, for a viewer who asked for reduced
 * motion. Steps until a Champion emerges or `limitSeconds` of round time has
 * passed, whichever is first; out of time, the biggest Type takes it.
 */
export function playOut(arena: Arena, limitSeconds: number, random: () => number): Type {
  // The largest step the Arena will take: nobody is watching, and a hundred-a-side
  // round is a lot of steps to make a viewer wait through.
  while (arena.champion === null && arena.elapsed < limitSeconds) arena.step(MAX_STEP);
  return arena.champion ?? leaderOf(arena.tally, random);
}

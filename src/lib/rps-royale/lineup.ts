/**
 * The RPS Royale **Lineup** — how many Fighters of each Type start a round.
 *
 * The viewer sets it with three sliders, it is saved between visits, and
 * Rematch reuses it. What the device allows is decided here too: a phone gets a
 * smaller default, a lower cap per Type and smaller sprites, because a hundred
 * of each on a phone is neither legible nor smooth.
 *
 * Pure: no DOM, no storage. The page reads and writes the raw saved string and
 * hands it here to be made sense of.
 */

import { TYPES, type Type } from './sprites';

export type Lineup = Record<Type, number>;

/** The slider range, per Type. At least one of each, so every Type is in it. */
export const LINEUP_MIN = 1;
export const LINEUP_MAX = 100;

/** Below this viewport width, a round is played the phone way. */
export const NARROW_BREAKPOINT = 640;

export interface Device {
  /** What the sliders show until the viewer moves one, and what Even it out restores. */
  defaultLineup: Lineup;
  /** The most Fighters of one Type this device starts a round with. */
  cap: number;
  /** The largest a Fighter is drawn, in pixels — reached on an uncrowded board. */
  maxFighterSize: number;
}

const WIDE: Device = {
  defaultLineup: { rock: 20, paper: 20, scissors: 20 },
  cap: LINEUP_MAX,
  maxFighterSize: 69,
};

const NARROW: Device = {
  defaultLineup: { rock: 10, paper: 10, scissors: 10 },
  cap: 40,
  maxFighterSize: 57,
};

/** What a viewport of this width allows. Decided when a round starts. */
export function deviceFor(viewportWidth: number): Device {
  const device = viewportWidth < NARROW_BREAKPOINT ? NARROW : WIDE;
  return { ...device, defaultLineup: { ...device.defaultLineup } };
}

function clampCount(count: number, cap: number): number {
  return Math.min(cap, Math.max(LINEUP_MIN, Math.floor(count)));
}

/**
 * A Lineup as a device can actually play it. What is shown and what a round
 * starts with — never what is saved, so a phone visit does not quietly shrink
 * the hundred-a-side Lineup saved on a desktop.
 */
export function clampLineup(lineup: Lineup, cap: number): Lineup {
  return {
    rock: clampCount(lineup.rock, cap),
    paper: clampCount(lineup.paper, cap),
    scissors: clampCount(lineup.scissors, cap),
  };
}

/** The saved Lineup after one slider moves: only that Type changes. */
export function withCount(lineup: Lineup, type: Type, count: number): Lineup {
  return { ...lineup, [type]: clampCount(count, LINEUP_MAX) };
}

/** A saved Lineup, or null when there is nothing usable and the default applies. */
export function parseLineup(raw: string | null): Lineup | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const counts = value as Record<string, unknown>;
  if (!TYPES.every((t) => typeof counts[t] === 'number' && Number.isFinite(counts[t]))) {
    return null;
  }
  return clampLineup(counts as Lineup, LINEUP_MAX);
}

export function lineupTotal(lineup: Lineup): number {
  return TYPES.reduce((sum, t) => sum + lineup[t], 0);
}

/** The starting Lineup as the result card shows it: "Started 100 · 5 · 5". */
export function describeLineup(lineup: Lineup): string {
  return `Started ${TYPES.map((t) => lineup[t]).join(' · ')}`;
}

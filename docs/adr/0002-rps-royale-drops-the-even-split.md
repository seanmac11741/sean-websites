# 2. RPS Royale drops the even split

Date: 2026-09-17

## Status

Accepted

## Context

RPS Royale shipped with a fixed **Roster**: sixty Fighters on a wide viewport, thirty on a phone,
split exactly evenly between the three Types. The split was a fairness rule. The viewer's **Pick**
was never to be handicapped or favoured, so the ten percent **Upset** rate was the only randomness
that mattered, and the round-robin deal of Types across the starting grid enforced that.

Viewers wanted to set up the fight themselves: a hundred rocks against five papers and five
scissors, a lone paper against a hundred scissors, or a plain three hundred Fighter brawl.
Every one of those breaks the even split.

## Decision

The Roster is seeded from the viewer's **Lineup**: one to a hundred Fighters per Type (forty on a
phone), set with sliders and saved between visits. Twenty of each stays the wide default and ten of
each the phone default. **Even it out** restores the default in one click.

- The even-split fairness rule is gone. An uneven round is a setup the viewer chose, not a flaw in
  the game.
- The **Record** counts every round, uneven ones included. A stacked round can be won cheaply, and
  that is the viewer's business. The result card shows the starting Lineup ("Started 100 · 5 · 5"),
  so the Record's context stays visible.
- Starting placement is no longer dealt round-robin. The Types are shuffled across the jittered
  grid with the Arena's injected random source, which keeps any Lineup mixed into the board and
  keeps a seeded round reproducible.

## Consequences

- The Arena takes a `lineup` in place of a `rosterSize`, and a Roster's size is whatever the Lineup
  adds up to: three to three hundred Fighters. How big a Fighter is now depends on how crowded the
  board is, and every distance in the rules scales with that size (see **Fighter size** in
  `CONTEXT.md`).
- A lopsided round still has to end. Headless rounds get a time limit, after which the Type with the
  most Fighters wins.
- The Upset is no longer the only randomness that matters, but it is still what lets a Type down to
  a handful come back.

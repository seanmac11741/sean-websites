# RPS Royale — Spritesheet Asset Spec

Brief for producing the raster spritesheet used by the `/tools/rps-royale` page. This document
describes **art only**. No game code, timing logic or engine behaviour is specified here beyond
what the artist needs to draw the right frames.

> **Status:** confirmed by the repo owner. Every section is a contract — build to it exactly.

## 1. The file

| Property     | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Path         | `public/images/rps-royale/sheet.png` (served at `/images/rps-royale/sheet.png`) |
| Format       | PNG, 8-bit RGBA, **alpha transparency required**                       |
| Background   | Fully transparent — no matte, no colour fill, no checkerboard baked in |
| Colour space | sRGB, no embedded ICC profile                                          |
| Target size  | Under ~500 KB after optimisation (single request, no sprite streaming) |

Path follows the existing repo convention of `public/images/<domain>/<file>` (see
`public/images/presentations/`). Files under `public/` are served verbatim at the same path and are
not processed by Astro's image pipeline — which is what we want, since the canvas loads the sheet
directly.

## 2. Grid geometry

| Property               | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Authored cell size     | **128 × 128 px** (2× for retina)                           |
| Logical cell size      | 64 × 64 px (what the code reasons in)                      |
| On-screen draw size    | ~32–40 px tall per sprite                                  |
| Safe area within cell  | Character occupies the centre **96 × 96 px** of the 128 px cell |
| Padding / gutters      | **Zero** — cells are edge-to-edge, perfectly uniform       |
| Extrusion / bleed      | None                                                       |
| Sheet width            | `cols × 128` — every row padded to the widest row's frame count |
| Sheet height           | `rows × 128`                                               |

**Why zero padding.** The renderer computes a source rectangle arithmetically —
`sx = col * CELL`, `sy = row * CELL` — from a single uniform grid. Any gutter, inconsistent cell
size, or trimmed/packed atlas breaks that math and forces a per-frame JSON atlas, which this tool
deliberately does not have. Bleed is unnecessary because sprites are drawn at integer-ish scale
with no texture filtering across cell borders.

**Short rows.** If a state has fewer frames than the widest row, leave the trailing cells of that
row **fully transparent**. Do not reflow frames onto the next row; do not repeat frames to fill.

## 3. Anchor, registration, facing

| Rule            | Requirement                                                                             |
| --------------- | --------------------------------------------------------------------------------------- |
| Horizontal      | Character **centred on the cell's vertical centre-line** in every frame                  |
| Vertical / base | The character's **feet/base sit on a fixed baseline at y = 104 px** (of 128) in all grounded frames |
| Hop lift        | In hop frames the whole body moves **up** off that baseline; the baseline itself never moves |
| Head room       | Tallest pose (hop apex, transform peak, victory) must still fit inside the 96 px safe area |
| Facing          | **Every frame faces right.** The code mirrors horizontally for leftward movement — so never draw a left-facing frame, and keep the design readable when flipped (no asymmetric text, no one-sided branding) |
| Squash & stretch | Allowed, but the base must stay pinned to the baseline on contact frames               |

Consistent anchoring is what stops the sprite from jittering as frames cycle: the code draws every
cell at the same destination rectangle, so any drift in where the character sits inside the cell
reads as a glitch on screen.

## 4. Row map

Characters are ordered **rock → paper → scissors**, each with the same block of states in the same
order, so the code can index a row as `characterIndex * STATES + stateIndex`.

| Row | Character | State        | Frames | FPS | Loop     | Priority       |
| --- | --------- | ------------ | ------ | --- | -------- | -------------- |
| 0   | Rock      | idle         | 4      | 6   | loop     | Essential      |
| 1   | Rock      | hop          | 6      | 12  | loop     | Essential      |
| 2   | Rock      | duel-windup  | 3      | 12  | once     | Essential      |
| 3   | Rock      | duel-impact  | 3      | 14  | once     | Essential      |
| 4   | Rock      | spectate     | 4      | 6   | loop     | Essential      |
| 5   | Rock      | transform    | 6      | 12  | once     | Essential      |
| 6   | Rock      | victory      | 6      | 8   | loop     | Essential      |
| 7   | Paper     | idle         | 4      | 6   | loop     | Essential      |
| 8   | Paper     | hop          | 6      | 12  | loop     | Essential      |
| 9   | Paper     | duel-windup  | 3      | 12  | once     | Essential      |
| 10  | Paper     | duel-impact  | 3      | 14  | once     | Essential      |
| 11  | Paper     | spectate     | 4      | 6   | loop     | Essential      |
| 12  | Paper     | transform    | 6      | 12  | once     | Essential      |
| 13  | Paper     | victory      | 6      | 8   | loop     | Essential      |
| 14  | Scissors  | idle         | 4      | 6   | loop     | Essential      |
| 15  | Scissors  | hop          | 6      | 12  | loop     | Essential      |
| 16  | Scissors  | duel-windup  | 3      | 12  | once     | Essential      |
| 17  | Scissors  | duel-impact  | 3      | 14  | once     | Essential      |
| 18  | Scissors  | spectate     | 4      | 6   | loop     | Essential      |
| 19  | Scissors  | transform    | 6      | 12  | once     | Essential      |
| 20  | Scissors  | victory      | 6      | 8   | loop     | Essential      |

**Totals:** 21 rows × 6 columns = 126 cells, all 126 drawn. Sheet dimensions at 2×:
**768 × 2688 px** (6 cols × 128, 21 rows × 128).

Every row is required. Row indices are load-bearing — never renumber, never skip a state.

### What each state depicts

| State       | Content                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| idle        | Standing still, gentle breathing bob, eyes blinking or drifting. No horizontal travel.                        |
| hop         | One full walking-hop cycle: crouch → push off → airborne apex → descend → land squash → recover. Reads as little hops, never a smooth glide. |
| duel-windup | Leaning/rearing back, gathering for a bonk. Ends at the pose that `duel-impact` frame 0 starts from.          |
| duel-impact | The clash itself: lunge forward, contact pose, recoil. Frame 1 should be the punchiest, most exaggerated pose on the sheet. |
| spectate    | Standing off to one side **watching** a nearby duel: attention on the action, eyes wide, plus the character's own nervous habit from §4.1. Faces right like everything else. |
| transform   | Morphing from this character into another type: body distorts/puffs/flashes and dissolves toward a neutral blob. **Type-agnostic** — the same 6 frames are used whatever the destination type is, and the code cuts to the new type's idle on completion. Frame 0 must read as this character; frame 5 as a neutral, nearly-featureless silhouette. |
| victory     | Celebratory dance, looping. See §4.1 — this is a per-character routine, not a generic pose.                  |

### 4.1 Per-character flavour (required)

`idle`, `spectate` and `victory` are where the characters get personality. They must **not** be
three generic poses reused across all three types — each character does its own piece of business.
This is the single most important thing on the sheet.

| Character | idle                                                     | spectate                                                        | victory                                                            |
| --------- | -------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Rock      | Sits heavy, blinks, tips gently side to side              | Grinds/knuckles itself, shifting weight like it wants a turn      | Heavy stomp-stomp dance — two big landings, dust-free, ground shakes in pose only |
| Paper     | Ripples and breathes as if in a breeze                    | Folds a corner over nervously, unfolds it, folds it again          | Flutters up off the baseline and does a full spin                     |
| Scissors  | Snips at the air, opening and closing                      | **Sharpens itself** — one blade whetting against the other         | Rapid overhead snipping, scissor-kick legs                            |

The other four states (`hop`, `duel-windup`, `duel-impact`, `transform`) can share a common
choreography across characters — only the body shape differs.

## 5. Art direction

- **Style:** cute, chunky game sprites with faces — big **googly eyes**, simple mouth, minimal limbs.
  Think modern pixel-adjacent chibi mascots, not realistic objects.
- **Readability:** must read clearly at **~32–40 px tall on screen**. Detail that disappears at that
  size is wasted; favour big shapes and one or two accent details each.
- **Silhouette:** each of the three must be **instantly distinguishable from the other two at a
  glance, in motion, by silhouette alone**. Suggested: rock = low, wide, lumpy dome; paper = tall,
  flat, rectangular with a folded corner; scissors = narrow with a distinct V-shaped split at the top.
- **Contrast:** the canvas background is **`#0A0A0F`** (near-black). Every character needs light,
  saturated body values and a bright rim/outline so it never sinks into the background. Avoid very
  dark greys and deep navies for body fills.
- **Accent:** the site accent is **`#818CF8`** (electric indigo). Use it sparingly for highlights,
  eye shine, or impact sparks — do not make a whole character that colour, since all three must stay
  distinguishable from each other and from UI chrome.
- **Light direction:** consistent across every frame and every character — **top-left key light**.
- **No baked drop shadows.** No ground shadow, glow, or ambient occlusion outside the character's
  own body. Any shadow is the renderer's job.
- **No background.** No panels, no frames, no cell borders, no grid lines, no registration marks.
- **No text or labels** anywhere in the cells — not frame numbers, not state names, not a watermark.
- **Outlines:** a consistent outline treatment (or consistently none) across all three characters.
  A 2 px (authored, = 1 px logical) dark-or-light outline is recommended for pop against the
  background.
- **Anti-aliasing:** soft edges are fine; avoid semi-transparent haloes bleeding past the safe area.

## 6. How to verify (self-check before handing over)

- [ ] File is at `public/images/rps-royale/sheet.png`, PNG with a real alpha channel.
- [ ] Sheet dimensions are an exact multiple of 128 in both axes (768 × 2688 as specified).
- [ ] Overlaying a 128 px grid: every character sits fully inside its own cell, nothing crosses a
      cell boundary, no frame is clipped by the sheet edge.
- [ ] Rows are in the exact order of the §4 table; no state is skipped, no row is renumbered.
- [ ] Short rows are padded with **transparent** cells, not duplicates.
- [ ] Background is transparent everywhere — check on both a white and a `#0A0A0F` backdrop.
- [ ] No cropped limbs, eyes or corners in any frame, including hop apex and transform peak.
- [ ] Baseline test: flipping between all frames of one row, the feet/base stay on the same y except
      where the character is deliberately airborne.
- [ ] Centring test: same flip-through, the body does not drift left/right between frames of a
      non-travelling state.
- [ ] Every frame faces right; mirroring any frame horizontally still looks correct.
- [ ] Zoom to 35 px tall: all three characters remain distinguishable and their faces still read.
- [ ] No text, numbers, borders, shadows or background artefacts in any cell.

## 7. Placeholder

Development proceeds against a **procedurally generated placeholder sheet at the same path
(`public/images/rps-royale/sheet.png`) with identical grid geometry and identical row order**. The
real sheet is therefore a **drop-in replacement**: delivering a file that matches §1–§4 requires no
code change. Conversely, any deviation from the grid or row map silently misaligns every sprite on
the page, so treat those sections as a contract rather than a suggestion.

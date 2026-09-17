# RPS Royale artwork

Production asset: [sheet.png](../../../public/images/rps-royale/sheet.png).
Contract: [spritesheet spec](../../rps-royale-spritesheet-spec.md).

The atlas is 768 × 2688, with 21 rows of six 128 px cells. The specified frame
counts require **96 drawn frames and 30 transparent cells**; this follows the
row table and short-row rule rather than the contradictory "all 126 drawn" sentence.
It is an 8-bit RGBA PNG with an sRGB chunk and no ICC profile.

Artwork was generated with the built-in imagegen tool, then assembled with
Python and ImageMagick with Sean's explicit approval. The exact prompts and
selected source sheets are retained here. Source sheets are intermediate art:
their layout and low-alpha background noise are not suitable for direct use.

## Rebuild and validate

Run from the repository root:

```bash
python3 scripts/assemble-rps-sprites.py
```

Requires Python 3 and the ImageMagick `magick` command, with no Python packages.
The script extracts connected artwork, discards low-alpha background residue,
resizes and registers each pose, preserves alpha during color reduction, and
writes the production PNG. Targeted corrections supply the rock contact pose,
paper corner folding, scissors sharpening, and alternating victory kicks.

Validation reads the exported PNG and checks dimensions, RGBA bit depth, size
below 500,000 bytes, absence of an ICC profile, every frame's safe-area bounds,
horizontal centering, grounded/airborne baselines, all transparent padding cells,
and identical windup-to-impact and idle-to-transform entry poses. Results are
recorded in [validation.json](validation.json).

## Visual review

Open [preview.html](preview.html) in a browser to inspect all 21 animations.
It offers playback speed, stepping, dark/white backgrounds, grid guides, and
mirrored frames. Each animation appears at authored size and at a 64 px cell
size, where the standing artwork is roughly 32–41 px tall.

[background-review.png](background-review.png) shows all frames at that game
scale against both backgrounds. Visual review covers distinct silhouettes,
right-facing visible faces, clean outlines, no clipping or baked shadows,
and the per-character choreography. During paper's full spin, the reverse
and far edge hide its face so no left-facing face enters the atlas.

The image and this review page are standalone assets; no game code was changed.

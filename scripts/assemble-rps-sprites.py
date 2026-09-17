#!/usr/bin/env python3
"""Register generated RPS artwork; requires Python 3 and ImageMagick, no packages.

Usage: python3 scripts/assemble-rps-sprites.py
The PNG itself is validated, including transparent padding and all 96 frame bounds.
"""

import json
import struct
import subprocess
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "docs/art/rps-royale"
OUTPUT = ROOT / "public/images/rps-royale/sheet.png"
COUNTS = (4, 6, 3, 3, 4, 6, 6)
STATES = ("idle", "hop", "duel-windup", "duel-impact", "spectate", "transform", "victory")
CHARACTERS = ("rock", "paper", "scissors")
CELL = 128
WIDTH, HEIGHT = 768, 2688


def magick(*args, data=None):
    return subprocess.check_output(["magick", *map(str, args)], input=data)


def read_image(path):
    width, height = map(int, magick("identify", "-format", "%w %h", path).split())
    return width, height, magick(path, "-depth", "8", "rgba:-")


def components(path, row_count):
    """Use connected opaque artwork, excluding generator's low-alpha matte noise."""
    width, height, raw = read_image(path)
    mask = bytearray(alpha >= 128 for alpha in raw[3::4])
    rows = [[] for _ in range(row_count)]
    for start in range(width * height):
        if not mask[start]:
            continue
        mask[start] = 0
        pending, pixels = [start], []
        while pending:
            index = pending.pop()
            pixels.append(index)
            y, x = divmod(index, width)
            neighbors = [index - width, index + width]
            if x:
                neighbors.append(index - 1)
            if x < width - 1:
                neighbors.append(index + 1)
            for neighbor in neighbors:
                if 0 <= neighbor < len(mask) and mask[neighbor]:
                    mask[neighbor] = 0
                    pending.append(neighbor)
        if len(pixels) < 700:
            continue
        left = min(index % width for index in pixels)
        right = max(index % width for index in pixels) + 1
        top = min(index // width for index in pixels)
        bottom = max(index // width for index in pixels) + 1
        crop_width, crop_height = right - left, bottom - top
        rgba = bytearray(crop_width * crop_height * 4)
        for index in pixels:
            y, x = divmod(index, width)
            dest = ((y - top) * crop_width + x - left) * 4
            rgba[dest:dest + 3] = raw[index * 4:index * 4 + 3]
            rgba[dest + 3] = 255
        row = min(row_count - 1, int((top + bottom) / 2 / height * row_count))
        rows[row].append((left, (crop_width, crop_height, bytes(rgba))))
    return [[frame for _, frame in sorted(row)] for row in rows]


def resize(frame, width, height, flip=False, angle=0):
    source_width, source_height, raw = frame
    args = ["-size", f"{source_width}x{source_height}", "-depth", "8", "rgba:-"]
    if flip:
        args.append("-flop")
    args += ["-filter", "Lanczos", "-resize", f"{width}x{height}!"]
    if angle:
        # Rotate in a generously padded canvas, then trim before registration.
        args += ["-background", "none", "-rotate", str(angle), "+repage"]
    encoded = magick(*args, "-depth", "8", "miff:-", data=raw)
    width, height = map(int, magick("identify", "-format", "%w %h", "miff:-", data=encoded).split())
    raw = bytearray(magick("miff:-", "-depth", "8", "rgba:-", data=encoded))
    # Remove Lanczos ringing; retain smooth edge coverage at meaningful alpha.
    for index in range(0, len(raw), 4):
        if raw[index + 3] < 16:
            raw[index:index + 4] = bytes(4)
    xs, ys = [], []
    for index, alpha in enumerate(raw[3::4]):
        if alpha:
            y, x = divmod(index, width)
            xs.append(x)
            ys.append(y)
    left, right, top, bottom = min(xs), max(xs) + 1, min(ys), max(ys) + 1
    cropped = b"".join(raw[(y * width + left) * 4:(y * width + right) * 4] for y in range(top, bottom))
    return right - left, bottom - top, cropped


def place(sheet, row, column, frame, bottom=104):
    width, height, raw = frame
    left, top = (CELL - width) // 2, bottom - height + 1
    assert 16 <= left and left + width <= 112, (row, column, width)
    assert 16 <= top and top + height <= 112, (row, column, top, height)
    for y in range(height):
        dest = ((row * CELL + top + y) * WIDTH + column * CELL + left) * 4
        sheet[dest:dest + width * 4] = raw[y * width * 4:(y + 1) * width * 4]


def write_png(path, width, height, raw):
    """Sparse RGBA sprite rows compress better without predictive PNG filters."""
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    scanlines = b"".join(b"\x00" + raw[y * width * 4:(y + 1) * width * 4] for y in range(height))
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"sRGB", b"\x00")
        + chunk(b"IDAT", zlib.compress(scanlines, 9))
        + chunk(b"IEND", b"")
    )


def build():
    sources = {name: components(ART / "sources" / f"{name}.png", 7) for name in CHARACTERS}
    corrections = components(ART / "sources/corrections.png", 3)
    assert list(map(len, corrections)) == [4, 4, 1]
    # The original rock punch overlaps its neighbor; both are replaced.
    sources["rock"][3] = [sources["rock"][2][2], corrections[2][0], sources["rock"][3][0]]
    sources["paper"][4] = corrections[0]
    sources["scissors"][4] = corrections[1]
    victory = components(ART / "sources/scissors-victory.png", 2)
    assert list(map(len, victory)) == [3, 3]
    sources["scissors"][6] = victory[0] + victory[1]
    # Exact continuity between windup and impact, and between idle and transform.
    for rows in sources.values():
        rows[3][0] = rows[2][2]
        rows[5][0] = rows[0][0]
        assert tuple(map(len, rows)) == COUNTS

    sheet = bytearray(WIDTH * HEIGHT * 4)
    for character_index, name in enumerate(CHARACTERS):
        for state_index, frames in enumerate(sources[name]):
            row = character_index * 7 + state_index
            for column, frame in enumerate(frames):
                source_width, source_height, _ = frame
                scale = (0.53, 0.51, 0.43)[character_index]
                # The correction sheet was generated at a larger drawing scale.
                if state_index == 4 and name in ("paper", "scissors"):
                    scale = (80 if name == "paper" else 82) / max(f[1] for f in frames)
                if name == "rock" and state_index == 3 and column == 1:
                    scale = 94 / source_width
                if state_index == 6 and name == "paper":
                    scale = 78 / source_height
                if state_index == 6 and name == "scissors":
                    scale = 82 / max(f[1] for f in frames)
                if state_index == 5 and column == 5:
                    scale = 68 / max(source_width, source_height)
                width, height = round(source_width * scale), round(source_height * scale)
                limit = min(1, 94 / width, 86 / height)
                width, height = round(width * limit), round(height * limit)
                if state_index == 3 and column == 1:
                    # Exaggerate contact within the same footprint instead of
                    # letting the outstretched fist shrink the entire character.
                    width, height = 94, (64, 80, 80)[character_index]
                bottom = 104
                if state_index == 1:
                    bottom -= (0, 4, 18, 9, 0, 0)[column]
                    height = min(height, bottom - 16 + 1)
                if name == "paper" and state_index == 6:
                    bottom -= (6, 10, 8, 10, 6, 3)[column]
                    # The far-side edge of the spin uses the back silhouette,
                    # keeping a left-facing eye out of the right-facing atlas.
                    if column == 3:
                        frame = frames[2]
                        width = 18
                angle = 0
                if name == "rock" and state_index == 0:
                    angle = (-3, 0, 3, 0)[column]
                # The same transform entry must match the tipped idle entry.
                if name == "rock" and state_index == 5 and column == 0:
                    angle = -3
                normalized = resize(frame, width, height, angle=angle)
                place(sheet, row, column, normalized, bottom)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # Reduce insignificant color variation without converting the artifact to
    # indexed PNG. PNG color type 6 preserves the required 8-bit RGBA interface.
    quantized = bytearray(magick("-size", f"{WIDTH}x{HEIGHT}", "-depth", "8", "rgba:-",
           "-alpha", "off", "+dither", "-colors", "128", "-colorspace", "sRGB", "-strip",
           "-depth", "8", "rgba:-", data=sheet))
    quantized[3::4] = sheet[3::4]
    write_png(OUTPUT, WIDTH, HEIGHT, quantized)
    verify()


def verify():
    width, height, raw = read_image(OUTPUT)
    png = OUTPUT.read_bytes()
    bit_depth, color_type = png[24:26]
    assert (width, height, bit_depth, color_type) == (768, 2688, 8, 6)
    assert len(png) < 500_000, len(png)
    offset, chunks = 8, []
    while offset < len(png):
        size = struct.unpack(">I", png[offset:offset + 4])[0]
        chunks.append(png[offset + 4:offset + 8].decode("ascii"))
        offset += size + 12
    assert "iCCP" not in chunks
    frames, empty = [], 0
    for row in range(21):
        for column in range(6):
            pixels = []
            for y in range(CELL):
                for x in range(CELL):
                    if raw[((row * CELL + y) * WIDTH + column * CELL + x) * 4 + 3]:
                        pixels.append((x, y))
            if column >= COUNTS[row % 7]:
                assert not pixels, ("padding is not transparent", row, column)
                empty += 1
                continue
            assert pixels, ("missing frame", row, column)
            left, right = min(p[0] for p in pixels), max(p[0] for p in pixels)
            top, bottom = min(p[1] for p in pixels), max(p[1] for p in pixels)
            assert 16 <= left <= right < 112 and 16 <= top <= bottom < 112
            assert abs((left + right) / 2 - 63.5) <= 0.5
            expected_bottom = 104
            if row % 7 == 1:
                expected_bottom -= (0, 4, 18, 9, 0, 0)[column]
            if row == 13:
                expected_bottom -= (6, 10, 8, 10, 6, 3)[column]
            assert bottom == expected_bottom, ("baseline", row, column, bottom, expected_bottom)
            frames.append({"row": row, "column": column, "bounds": [left, top, right, bottom]})
    assert len(frames) == 96 and empty == 30
    def cell_bytes(row, column):
        return b"".join(
            raw[((row * CELL + y) * WIDTH + column * CELL) * 4:
                ((row * CELL + y) * WIDTH + (column + 1) * CELL) * 4]
            for y in range(CELL)
        )
    for base in (0, 7, 14):
        assert cell_bytes(base + 2, 2) == cell_bytes(base + 3, 0), "windup/impact discontinuity"
        assert cell_bytes(base, 0) == cell_bytes(base + 5, 0), "idle/transform discontinuity"
    report = {
        "file": str(OUTPUT.relative_to(ROOT)), "width": width, "height": height,
        "bytes": len(png), "bitDepth": bit_depth, "colorType": color_type,
        "pngChunks": chunks, "drawnFrames": len(frames), "transparentCells": empty,
        "safeArea": "all pixels within [16,112) on both axes",
        "registration": "bounding boxes centered; grounded bases at y=104",
        "transitions": "all windup/impact and idle/transform boundaries are pixel-identical",
        "frames": frames,
    }
    (ART / "validation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"Validated {OUTPUT.relative_to(ROOT)}: {width}×{height}, {len(png):,} bytes, "
          f"{len(frames)} frames, {empty} transparent cells, RGBA8, no ICC profile.")


if __name__ == "__main__":
    build()

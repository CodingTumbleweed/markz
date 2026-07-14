#!/usr/bin/env python3
"""Generate Markz app icons for electron-builder (macOS, Windows, Linux)."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
ICONSET = BUILD / "icon.iconset"
LINUX_ICONS = BUILD / "icons"

# Brand colors — markdown-editor feel: deep blue with accent
BG = (30, 64, 120)
ACCENT = (96, 165, 250)
TEXT = (255, 255, 255)

MAC_ICONSET = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024),
]

LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512]
WIN_SIZES = [16, 24, 32, 48, 64, 128, 256]


def render_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = max(2, size // 16)
    radius = max(4, size // 5)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill=BG,
    )

    # Accent bar — evokes a rendered heading underline
    bar_h = max(2, size // 12)
    bar_y = size // 2 + size // 10
    draw.rounded_rectangle(
        [size // 4, bar_y, size * 3 // 4, bar_y + bar_h],
        radius=bar_h // 2,
        fill=ACCENT,
    )

    # Letter M
    font_size = max(8, int(size * 0.52))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1] - size // 16
    draw.text((x, y), text, fill=TEXT, font=font)

    return img


def main() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)

    master = render_icon(1024)
    master.save(BUILD / "icon.png")

    if ICONSET.exists():
        shutil.rmtree(ICONSET)
    ICONSET.mkdir(parents=True)

    for name, px in MAC_ICONSET:
        render_icon(px).save(ICONSET / name)

    icns_path = BUILD / "icon.icns"
    subprocess.run(
        ["iconutil", "-c", "icns", str(ICONSET), "-o", str(icns_path)],
        check=True,
    )
    shutil.rmtree(ICONSET)

    if LINUX_ICONS.exists():
        shutil.rmtree(LINUX_ICONS)
    LINUX_ICONS.mkdir(parents=True)
    for px in LINUX_SIZES:
        render_icon(px).save(LINUX_ICONS / f"{px}x{px}.png")

    win_images = [render_icon(px) for px in WIN_SIZES]
    win_images[0].save(
        BUILD / "icon.ico",
        format="ICO",
        sizes=[(img.width, img.height) for img in win_images],
        append_images=win_images[1:],
    )

    print(f"Generated icons in {BUILD}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate a unique 1200×630 social card for every non-redirect HTML page."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from seo_lib import SITE, og_card_path  # noqa: E402

MAP_PATH = ROOT / "seo-map.json"
SIZE = (1200, 630)
FONT_CANDIDATES = (
    Path("/System/Library/Fonts/Hiragino Sans GB.ttc"),
    Path("/System/Library/Fonts/STHeiti Medium.ttc"),
    Path("/System/Library/Fonts/HelveticaNeue.ttc"),
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
)


def font_path() -> Path:
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("No supported CJK font found for social-card generation")


def local_source(entry: dict) -> Path:
    candidates = [entry.get("hero_image", ""), entry.get("og_image", "")]
    for raw in candidates:
        if not raw:
            continue
        if raw.startswith(SITE):
            raw = urlparse(raw).path.lstrip("/")
        elif raw.startswith("http://") or raw.startswith("https://"):
            continue
        raw = raw.lstrip("/")
        path = ROOT / raw
        if path.is_file():
            return path
    return ROOT / "assets/images/experience-refresh/joyforest-forest-aerial-view.jpg"


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split() if " " in text and not any("\u4e00" <= c <= "\u9fff" for c in text) else list(text)
    joiner = " " if words != list(text) else ""
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current}{joiner if current else ''}{word}"
        if current and draw.textbbox((0, 0), trial, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def draw_card(entry: dict, source: Path, output: Path, font_file: Path) -> None:
    with Image.open(source) as opened:
        base = ImageOps.exif_transpose(opened).convert("RGB")
    base = ImageOps.fit(base, SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    base = ImageEnhance.Contrast(base).enhance(1.04).convert("RGBA")

    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for y in range(SIZE[1]):
        progress = y / SIZE[1]
        alpha = int(35 + 155 * (progress ** 1.7))
        overlay_draw.line((0, y, SIZE[0], y), fill=(12, 34, 25, alpha))
    canvas = Image.alpha_composite(base, overlay)
    draw = ImageDraw.Draw(canvas)

    brand_font = ImageFont.truetype(str(font_file), 28)
    title_font = ImageFont.truetype(str(font_file), 58)
    route_font = ImageFont.truetype(str(font_file), 24)

    draw.rounded_rectangle((64, 52, 342, 104), radius=24, fill=(248, 245, 237, 230))
    draw.text((84, 62), "揪好森 Joyforest", font=brand_font, fill=(26, 51, 41, 255))

    title = entry.get("title", "揪好森 Joyforest").split("｜揪好森")[0].split("| Joyforest")[0].strip()
    lines = wrap_text(draw, title, title_font, 980)
    if len(lines) > 3:
        lines = lines[:3]
        lines[-1] = lines[-1].rstrip("…") + "…"
    line_height = 78
    title_y = 300 - max(0, len(lines) - 1) * 32
    for index, line in enumerate(lines):
        draw.text((68, title_y + index * line_height), line, font=title_font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(0, 0, 0, 100))

    route = entry.get("route", "/")
    draw.text((70, 564), f"camp.8-ways.com{route}", font=route_font, fill=(238, 240, 232, 245))

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, "JPEG", quality=84, optimize=True, progressive=True)


def main() -> None:
    entries = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    font_file = font_path()
    generated = 0
    skipped = 0
    for entry in entries:
        if entry.get("is_redirect"):
            skipped += 1
            continue
        source = local_source(entry)
        output = ROOT / og_card_path(entry["page_file"])
        draw_card(entry, source, output, font_file)
        generated += 1
    print(f"Generated {generated} unique OG cards; skipped {skipped} redirect pages.")


if __name__ == "__main__":
    main()

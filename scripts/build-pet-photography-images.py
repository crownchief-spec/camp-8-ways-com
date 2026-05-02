#!/usr/bin/env python3
"""One-off batch: PNG sources → assets/images/pet-photography-party/ webp + OG jpg."""
from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path(
    "/Users/joyforest/.cursor/projects/Users-joyforest-Documents-camp-8-ways-com/assets"
)
OUT = Path("/Users/joyforest/Documents/camp-8-ways-com/assets/images/pet-photography-party")

# uuid prefix -> base filename (no extension)
MAP = {
    "EE76B633": "pet-photography-studio-cat-owner-beige-joyforest",
    "1D80276F": "pet-photography-studio-corgi-birthday-balloons-joyforest",
    "9140707F": "pet-photography-studio-border-collie-owner-dark-joyforest",
    "F747FABE": "pet-photography-studio-owner-border-collie-embrace-joyforest",
    "C389FCF7": "pet-photography-studio-shiba-inu-glamping-tent-joyforest",
    "E98E106B": "pet-photography-studio-corgi-birthday-poster-graphic-joyforest",
    "DA277FD1": "pet-photography-studio-corgi-pink-paper-peek-joyforest",
    "0C39C4A5": "pet-photography-studio-two-shiba-inu-summer-surf-joyforest",
    "E45B2A98": "pet-photography-outdoor-chihuahua-grass-dome-tent-joyforest",
    "997C02AD": "pet-photography-outdoor-husky-bernese-grass-dome-joyforest",
    "B2DFD1D7": "pet-photography-outdoor-four-dogs-grass-blanket-joyforest",
    "E075A018": "pet-photography-outdoor-owner-dogs-picnic-grass-joyforest",
    "D4AE0AB2": "pet-photography-outdoor-white-dog-running-grass-joyforest",
    "8A13AFD8": "pet-photography-studio-cat-owner-stools-beige-joyforest",
    "481BC11E": "pet-photography-studio-two-dachshunds-tent-lights-joyforest",
    "FC3D5729": "pet-photography-studio-dachshund-maine-coon-tent-joyforest",
}


def load_rgb(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    return bg


def save_webp(im: Image.Image, dest: Path, quality: int = 82) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, format="WEBP", quality=quality, method=6)


def resize_width(im: Image.Image, w: int) -> Image.Image:
    if im.width <= w:
        return im.copy()
    h = int(round(im.height * (w / im.width)))
    return im.resize((w, h), Image.Resampling.LANCZOS)


def crop_cover_square(im: Image.Image, size: int) -> Image.Image:
    """Center crop to square then resize to size."""
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = im.crop((left, top, left + side, top + side))
    return cropped.resize((size, size), Image.Resampling.LANCZOS)


def crop_cover_4x3(im: Image.Image, tw: int) -> Image.Image:
    """Center crop to 4:3 aspect, width tw."""
    target_ratio = 4 / 3
    w, h = im.size
    cur_ratio = w / h
    if cur_ratio > target_ratio:
        # too wide — crop width
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    cropped = im.crop(box)
    th = int(round(tw / target_ratio))
    return cropped.resize((tw, th), Image.Resampling.LANCZOS)


def make_og(im: Image.Image, dest: Path) -> None:
    """1200x630 cover crop center."""
    tw, th = 1200, 630
    w, h = im.size
    target_ratio = tw / th
    cur_ratio = w / h
    if cur_ratio > target_ratio:
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    cropped = im.crop(box).resize((tw, th), Image.Resampling.LANCZOS)
    cropped.save(dest, format="JPEG", quality=88, optimize=True)


def find_src(uuid_prefix: str) -> Path:
    for p in SRC.iterdir():
        if p.suffix.lower() == ".png" and p.name.startswith(uuid_prefix):
            return p
    raise FileNotFoundError(uuid_prefix)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bases: dict[str, Image.Image] = {}
    for prefix, base in MAP.items():
        src = find_src(prefix)
        bases[base] = load_rgb(src)
        print(src.name, "→", base)

    hero_keys = (
        "pet-photography-studio-cat-owner-beige-joyforest",
        "pet-photography-outdoor-four-dogs-grass-blanket-joyforest",
    )
    hero_widths = (768, 1200, 1600, 2400)

    for base, im in bases.items():
        # content widths
        for w in (900, 1200):
            out = OUT / f"{base}-w{w}.webp"
            save_webp(resize_width(im, w), out)
        # gallery thumb 600 square (1:1) + 600 4:3 for consistent grid — use 4:3 w=600
        t600 = crop_cover_4x3(im, 600)
        save_webp(t600, OUT / f"{base}-thumb-600.webp")
        # gallery full
        save_webp(resize_width(im, 1600), OUT / f"{base}-full-1600.webp")

    for hk in hero_keys:
        im = bases[hk]
        for w in hero_widths:
            save_webp(resize_width(im, w), OUT / f"{hk}-hero-w{w}.webp")

    # OG from four-dogs outdoor (landscape, shows venue)
    make_og(
        bases["pet-photography-outdoor-four-dogs-grass-blanket-joyforest"],
        OUT / "og-pet-photography-party.jpg",
    )

    print("Done. Output:", OUT)


if __name__ == "__main__":
    main()

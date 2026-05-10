#!/usr/bin/env python3
"""PNG（揪好森親子）＋遠端作品集 → assets/images/family-photography-party/"""
from __future__ import annotations

import urllib.request
from pathlib import Path

from PIL import Image

SRC_DIR = Path("/Users/joyforest/.cursor/projects/Users-joyforest-Documents-camp-8-ways-com/assets")
OUT = Path("/Users/joyforest/Documents/camp-8-ways-com/assets/images/family-photography-party")

# 本地 PNG 檔名（依使用者提供順序）→ SEO base name
CAMPSITE_MAP: list[tuple[str, str]] = [
    ("2026-05-09-16-34-13-DSC_6862-73fe13fa-af66-497c-98aa-62f39427f347.png", "family-photography-joyforest-dome-girl-bed-glamping"),
    ("2026-05-09-16-20-51-DSC_6714-931f2176-9264-4ea4-b0f8-14b66bd7e968.png", "family-photography-joyforest-indoor-karaoke-child-microphone"),
    ("2026-05-09-16-51-41-DSC_7075-50619a3a-5b9c-4bee-90ca-0fb5c859058e.png", "family-photography-joyforest-campfire-bubbles-boy-outdoor"),
    ("2026-05-09-16-50-18-DSC_7064-3e5b8360-6edb-4491-ab29-fe72f3ae9955.png", "family-photography-joyforest-kids-bubbles-grass-dome"),
    ("2026-05-09-17-00-38-DSC_7230-8b257cb8-0aa6-4438-bc87-86e601a87ae6.png", "parent-child-photography-joyforest-family-laugh-string-lights"),
    ("2026-05-09-16-11-18-DSC_6555-50d5c989-c052-411d-a208-bcbd8e4995a3.png", "family-photography-glamping-dome-bed-family-three-portrait"),
    ("2026-05-09-16-38-35-DSC_6983-8f61fb5a-6a69-46af-94b6-de75f674fec1.png", "family-photography-joyforest-transparent-dome-bathtub-girl"),
    ("2026-05-09-17-10-40-DSC_7461-4b050246-fc51-4ebb-89ce-31342944555c.png", "parent-child-photography-joyforest-family-running-grass-dome"),
    ("2026-05-09-17-03-30-DSC_7282-529e83f3-a13d-43bd-9ce2-67636f59ed24.png", "parent-child-photography-joyforest-father-son-waving-grass-dome"),
    ("536F80E2-0E0C-45DB-B076-6B88F8317FC1_4_5005_c-75d4651d-52b1-40dc-9ca4-6a07f5e468b6.png", "family-photography-joyforest-mother-daughter-pizza-picnic-outdoor"),
    ("EB5BFADD-42D6-4AEC-98B9-0628BCDE458A_4_5005_c-0d28fab6-ea29-40ad-802a-b336312e09b7.png", "parent-child-photography-joyforest-father-daughter-balloon-grass"),
    ("C9A1274C-812F-49F6-A1F1-C7551178B2AA_4_5005_c-39229b52-ab37-4fd0-8294-760bb5a8b4ee.png", "parent-child-photography-joyforest-girl-rabbit-grass-dome"),
    ("3F187018-309B-4213-96BC-673702D480C8_4_5005_c-063299f1-bbab-42f4-9a94-89ea507e2748.png", "family-photography-joyforest-third-birthday-balloon-grass"),
    ("7A1AF262-3D48-446F-9230-A0D998409618_4_5005_c-475cff2f-cefd-4037-93d1-82111f42aba4.png", "family-photography-joyforest-outdoor-forest-studio-child-portrait"),
    ("B847A1F5-6405-4CE0-9D4D-5B582F887332_4_5005_c-7756b5dd-e26a-4359-8a2c-892834dee57d.png", "parent-child-photography-joyforest-night-campfire-sparklers-family"),
    ("6051DBCB-C743-46D2-A0EE-38E562B96F81_4_5005_c-c7a090a0-5f4e-442e-948f-f1bb73c19d48.png", "parent-child-photography-joyforest-mother-baby-evening-lights"),
]

# 小巴老師作品集（family.8-ways.com）— 代表海島、雪景、都市與海外親子旅拍
PORTFOLIO_REMOTE: list[tuple[str, str]] = [
    ("https://family.8-ways.com/public/images/family/overseas-hokkaido/overseas-hokkaido-001-83fd715dff.jpg", "xiaoba-portfolio-hokkaido-winter-snow-family-photography"),
    ("https://family.8-ways.com/public/images/family/overseas-okinawa/overseas-okinawa-001-91e8570fd3.jpg", "xiaoba-portfolio-okinawa-beach-island-family-photography"),
    ("https://family.8-ways.com/public/images/family/taiwan-penghu/taiwan-penghu-001-653eecc575.webp", "xiaoba-portfolio-penghu-island-beach-family-photography"),
    ("https://family.8-ways.com/public/images/family/themes-beach/themes-beach-001-0f6ed53c4f.jpg", "xiaoba-portfolio-beach-playing-family-photography"),
    ("https://family.8-ways.com/public/images/family/overseas-singapore/overseas-singapore-001-53863497b2.jpg", "xiaoba-portfolio-singapore-family-travel-photography"),
    ("https://family.8-ways.com/public/images/family/overseas-korea/overseas-korea-001-bee0362863.jpg", "xiaoba-portfolio-korea-family-travel-photography"),
    ("https://family.8-ways.com/public/images/family/overseas-tokyo/overseas-tokyo-001-f5f08b9f81.jpg", "xiaoba-portfolio-tokyo-family-travel-photography"),
    ("https://family.8-ways.com/public/images/family/themes-grass/themes-grass-001-a9f2b393d7.jpg", "xiaoba-portfolio-grass-forest-family-photography"),
]


def load_rgb(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    return bg


def load_remote_rgb(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (camp-build)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    im = Image.open(BytesIO(data)).convert("RGB")
    return im


def save_webp(im: Image.Image, dest: Path, quality: int = 82) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, format="WEBP", quality=quality, method=6)


def resize_width(im: Image.Image, w: int) -> Image.Image:
    if im.width <= w:
        return im.copy()
    h = int(round(im.height * (w / im.width)))
    return im.resize((w, h), Image.Resampling.LANCZOS)


def crop_cover_4x3(im: Image.Image, tw: int) -> Image.Image:
    target_ratio = 4 / 3
    w, h = im.size
    cur_ratio = w / h
    if cur_ratio > target_ratio:
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


def process_image(im: Image.Image, base: str, hero: bool = False) -> None:
    for w in (900, 1200):
        save_webp(resize_width(im, w), OUT / f"{base}-w{w}.webp")
    save_webp(crop_cover_4x3(im, 600), OUT / f"{base}-thumb-600.webp")
    save_webp(resize_width(im, 1600), OUT / f"{base}-full-1600.webp")
    if hero:
        for w in (768, 1200, 1600, 2400):
            save_webp(resize_width(im, w), OUT / f"{base}-hero-w{w}.webp")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bases: dict[str, Image.Image] = {}

    for fname, base in CAMPSITE_MAP:
        path = SRC_DIR / fname
        if not path.exists():
            raise FileNotFoundError(path)
        bases[base] = load_rgb(path)
        print(path.name, "→", base)

    for url, base in PORTFOLIO_REMOTE:
        bases[base] = load_remote_rgb(url)
        print(url.split("/")[-1], "→", base)

    hero_left = "parent-child-photography-joyforest-family-running-grass-dome"
    hero_right = "family-photography-glamping-dome-bed-family-three-portrait"

    for base, im in bases.items():
        process_image(im, base, hero=(base in (hero_left, hero_right)))

    make_og(bases[hero_left], OUT / "og-family-photography-party.jpg")

    print("Done. Output:", OUT)


if __name__ == "__main__":
    main()

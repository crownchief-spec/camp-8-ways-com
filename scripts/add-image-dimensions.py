#!/usr/bin/env python3
"""Add intrinsic width/height to local HTML images to prevent layout shift."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from seo_lib import list_html_pages  # noqa: E402

IMG_RE = re.compile(r"<img\b[^>]*>", re.I)
SRC_RE = re.compile(r'\bsrc=["\']([^"\']+)["\']', re.I)
SKIP_PREFIXES = ("http://", "https://", "data:", "{{", "#")


def local_image_path(page: Path, raw_src: str) -> Path | None:
    cleaned = unquote(raw_src.split("#", 1)[0].split("?", 1)[0]).strip()
    if not cleaned or cleaned.startswith(SKIP_PREFIXES):
        return None
    path = ROOT / cleaned.lstrip("/") if cleaned.startswith("/") else page.parent / cleaned
    try:
        return path.resolve()
    except OSError:
        return None


def add_dimensions(tag: str, page: Path) -> tuple[str, bool]:
    if re.search(r"\bwidth\s*=", tag, re.I) and re.search(r"\bheight\s*=", tag, re.I):
        return tag, False
    src_match = SRC_RE.search(tag)
    if not src_match:
        return tag, False
    image_path = local_image_path(page, src_match.group(1))
    if image_path is None or not image_path.is_file():
        return tag, False
    try:
        with Image.open(image_path) as image:
            width, height = image.size
    except (OSError, ValueError):
        return tag, False
    if width < 1 or height < 1:
        return tag, False

    attrs = []
    if not re.search(r"\bwidth\s*=", tag, re.I):
        attrs.append(f'width="{width}"')
    if not re.search(r"\bheight\s*=", tag, re.I):
        attrs.append(f'height="{height}"')
    insertion = " " + " ".join(attrs)
    if tag.endswith("/>"):
        return tag[:-2].rstrip() + insertion + " />", True
    return tag[:-1].rstrip() + insertion + ">", True


def main() -> None:
    changed_files = 0
    changed_images = 0
    for page in list_html_pages():
        html = page.read_text(encoding="utf-8", errors="replace")
        page_changes = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal page_changes
            tag, changed = add_dimensions(match.group(0), page)
            if changed:
                page_changes += 1
            return tag

        updated = IMG_RE.sub(replace, html)
        if page_changes:
            page.write_text(updated, encoding="utf-8")
            changed_files += 1
            changed_images += page_changes
    print(f"Added intrinsic dimensions to {changed_images} images in {changed_files} files.")


if __name__ == "__main__":
    main()

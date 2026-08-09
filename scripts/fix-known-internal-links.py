#!/usr/bin/env python3
"""Repair known relative-link mistakes in nested English static pages."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEO_ROOT = ROOT / "en" / "seo"


def replace_in(path: Path, replacements: dict[str, str]) -> bool:
    html = path.read_text(encoding="utf-8")
    updated = html
    for old, new in replacements.items():
        updated = updated.replace(old, new)
    if updated != html:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    updated: list[str] = []
    article_slugs = [p.parent.name for p in SEO_ROOT.glob("*/index.html")]
    for page in SEO_ROOT.glob("*/index.html"):
        replacements = {
            'href="../"><span itemprop="name">Home</span>': 'href="../../"><span itemprop="name">Home</span>',
            'href="index/"><span itemprop="name">Camping Guide Hub</span>': 'href="../"><span itemprop="name">Camping Guide Hub</span>',
        }
        for slug in article_slugs:
            replacements[f'href="{slug}/"'] = f'href="../{slug}/"'
        if replace_in(page, replacements):
            updated.append(page.relative_to(ROOT).as_posix())

    nested_page_fixes = {
        ROOT / "en/pages/family-photography-party/index.html": {
            'href="../index.html"': 'href="../../index.html"',
            'href="forest-graduation-photo"': 'href="../forest-graduation-photo/"',
            'href="pet-photography-party"': 'href="../pet-photography-party/"',
            'src="../../../../../../assets/js/pet-photography-gallery.js"': 'src="../../../assets/js/pet-photography-gallery.js"',
        },
        ROOT / "en/pages/pet-photography-party/index.html": {
            'href="../index.html"': 'href="../../index.html"',
            'href="forest-graduation-photo"': 'href="../forest-graduation-photo/"',
            'src="../../../../../../assets/js/pet-photography-gallery.js"': 'src="../../../assets/js/pet-photography-gallery.js"',
        },
        ROOT / "en/pages/balloon-tent/index.html": {
            'poster="../../assets/': 'poster="../../../assets/',
        },
        ROOT / "en/pages/cloud-tent/index.html": {
            'poster="../../assets/': 'poster="../../../assets/',
        },
    }
    for page, replacements in nested_page_fixes.items():
        if page.exists() and replace_in(page, replacements):
            updated.append(page.relative_to(ROOT).as_posix())

    print(f"Updated {len(updated)} files with known nested-link fixes.")


if __name__ == "__main__":
    main()

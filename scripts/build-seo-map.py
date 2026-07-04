#!/usr/bin/env python3
"""Build seo-map.json from HTML pages + brand overrides."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from seo_lib import (  # noqa: E402
    PAGE_OG_OVERRIDES,
    SITE,
    extract_canonical,
    extract_hero_src,
    extract_meta,
    extract_title,
    infer_route,
    infer_schema_type,
    is_redirect,
    list_html_pages,
    load_brand,
    page_lang,
    resolve_asset_path,
    to_absolute_url,
)

OUT = ROOT / "seo-map.json"


def dedicated_og(page_file: str, hero_abs: str) -> str:
    if page_file in PAGE_OG_OVERRIDES:
        return to_absolute_url(PAGE_OG_OVERRIDES[page_file])
    if "og-family-photography-party" in page_file or "family-photography-party" in page_file:
        return to_absolute_url("assets/images/family-photography-party/og-family-photography-party.jpg")
    if "pet-photography-party" in page_file:
        return to_absolute_url("assets/images/pet-photography-party/og-pet-photography-party.jpg")
    if hero_abs and SITE in hero_abs:
        return hero_abs
    if hero_abs and hero_abs.startswith("/assets/"):
        return to_absolute_url(hero_abs)
    return ""


REDIRECT_META: dict[str, str] = {
    "pages/availability/index.html": "pages/availability.html",
    "pages/balloon-tent/index.html": "pages/balloon-tent.html",
    "pages/balloon-tent-karaoke-guide/index.html": "pages/balloon-tent-karaoke-guide.html",
    "pages/cloud-tent/index.html": "pages/cloud-tent.html",
    "pages/party-event-space/index.html": "pages/party-event-space.html",
}


def build_entry(page_path: Path, brand: dict) -> dict:
    page_file = str(page_path.relative_to(ROOT)).replace("\\", "/")
    html = page_path.read_text(encoding="utf-8", errors="replace")

    title = extract_title(html)
    description = extract_meta(html, "description")
    canonical = extract_canonical(html)

    redirect = is_redirect(html)
    redirect_target = REDIRECT_META.get(page_file)

    if redirect_target:
        src = ROOT / redirect_target
        if src.exists():
            src_html = src.read_text(encoding="utf-8", errors="replace")
            if not description:
                description = extract_meta(src_html, "description") or description
            if title in ("", "重新導向中…", "Redirecting…"):
                title = extract_title(src_html) or title
            if not canonical:
                canonical = extract_canonical(src_html) or canonical
    elif page_file in REDIRECT_META and not description:
        src = ROOT / REDIRECT_META[page_file]
        if src.exists():
            src_html = src.read_text(encoding="utf-8", errors="replace")
            description = extract_meta(src_html, "description") or description
            if title in ("", "重新導向中…", "Redirecting…"):
                title = extract_title(src_html) or title

    route = infer_route(page_file, canonical)

    noindex = redirect or page_file == "404.html"

    hero_raw = extract_hero_src(html)
    if redirect and redirect_target:
        src = ROOT / redirect_target
        if src.exists() and not hero_raw:
            hero_raw = extract_hero_src(src.read_text(encoding="utf-8", errors="replace"))
    hero_rel = resolve_asset_path(hero_raw, page_file if not redirect_target else redirect_target)
    hero_abs = to_absolute_url(hero_rel) if hero_rel else ""

    og_key = redirect_target if redirect and redirect_target else page_file
    og_image = dedicated_og(og_key, hero_abs)
    if not og_image and redirect_target:
        og_image = dedicated_og(page_file, hero_abs)
    if not og_image:
        og_image = hero_abs or brand.get("default_og_image", "")

    schema_type = infer_schema_type(page_file)
    if page_file in ("index.html", "en/index.html"):
        schema_type = "WebSite"

    return {
        "page_file": page_file,
        "route": route,
        "lang": page_lang(page_file, html),
        "title": title,
        "description": description,
        "canonical": canonical or to_absolute_url(route),
        "hero_image": hero_rel or hero_raw,
        "og_image": og_image,
        "og_image_override": og_key in PAGE_OG_OVERRIDES,
        "schema_type": schema_type,
        "noindex": noindex,
        "is_redirect": redirect,
    }


def main() -> None:
    brand = load_brand()
    entries = [build_entry(p, brand) for p in list_html_pages()]
    entries.sort(key=lambda e: e["page_file"])
    OUT.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} entries to {OUT}")


if __name__ == "__main__":
    main()

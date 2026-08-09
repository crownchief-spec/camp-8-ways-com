#!/usr/bin/env python3
"""Shared SEO utilities for camp.8-ways.com static site."""
from __future__ import annotations

import json
import re
from html import escape
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://camp.8-ways.com"

REDIRECT_MARKERS = ('http-equiv="refresh"', "http-equiv='refresh'")

# Per-page Joyforest og:image when hero is external or shared fallback would duplicate.
PAGE_OG_OVERRIDES: dict[str, str] = {
    "index.html": "assets/images/experience-refresh/joyforest-forest-aerial-view.jpg",
    "en/index.html": "assets/images/experience-refresh/joyforest-night-glamping-lights.jpg",
    "hk/index.html": "assets/images/experience-refresh/joyforest-balloon-tent-private-lawn.jpg",
    "pages/balloon-tent.html": "assets/images/balloon-tent/balloon-tent-exclusive-lawn-outdoor-kitchen-aerial-view.jpg",
    "pages/balloon-tent-karaoke-guide.html": "assets/images/karaoke-experience/balloon-tent-karaoke-adult-singing-tv-lyrics.jpg",
    "en/pages/balloon-tent-karaoke-guide/index.html": "assets/images/karaoke-experience/balloon-tent-karaoke-kids-singing-microphones.jpg",
    "en/pages/balloon-tent/index.html": "assets/images/balloon-tent/balloon-tent-exclusive-lawn-outdoor-kitchen-aerial-view.jpg",
    "pages/cloud-tent.html": "assets/images/cloud-tent/taoyuan-yangmei-cloud-tent-aerial-balloon-cloud-room-layout.jpg",
    "pages/party-event-space.html": "assets/images/party-highlights/joyforest-night-party-bbq-family-pet-friendly.jpg",
    "en/pages/party-event-space/index.html": "assets/images/cinema-experience/joyforest-outdoor-cinema-night-lawn-lights.jpg",
    "pages/forest-graduation-photo.html": "assets/images/forest-graduation/forest-graduation-kids-camping-hero.jpg",
    "en/pages/forest-graduation-photo/index.html": "assets/images/forest-graduation/forest-graduation-kids-camping-hero.jpg",
    "pages/campervan.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "en/pages/cloud-tent/index.html": "assets/images/camp-intro/taoyuan-yangmei-joyforest-glamping-balloon-cloud-tent-site-layout-map-en.jpg",
    "pages/location.html": "assets/images/location/taoyuan-yangmei-location-traffic-map.jpg",
    "reviews/index.html": "assets/images/reviews/review-forest-secret-small-group-private-glamping.jpg",
    "pages/availability.html": "assets/images/camp-intro/taoyuan-glamping-campsite-view.jpg",
    "en/pages/availability/index.html": "assets/images/camp-intro/taoyuan-glamping-campsite-view.jpg",
    "pages/booking.html": "assets/images/camp-intro/taoyuan-glamping-booking-campsite.jpg",
    "pages/faq.html": "assets/images/index/taoyuan-forest-camping-scene.jpg",
    "404.html": "assets/images/experience-refresh/joyforest-forest-aerial-view.jpg",
    "seo/index.html": "assets/images/index/taoyuan-glamping-forest-dome-hero.jpg",
    "en/seo/index.html": "assets/images/index/taoyuan-glamping-forest-dome-hero.jpg",
    "seo/beginner-camping.html": "assets/images/index/taoyuan-glamping-lazy-camping.jpg",
    "en/seo/beginner-camping/index.html": "assets/images/index/taoyuan-glamping-lazy-camping.jpg",
    "seo/campervan-stay.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "en/seo/campervan-travel/index.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "seo/camping-gear.html": "assets/images/index/dome-tent-glamping-space.jpg",
    "en/seo/camping-gear/index.html": "assets/images/index/dome-tent-glamping-space.jpg",
    "seo/dome-glamping.html": "assets/images/index/taoyuan-dome-tent-forest-glamping.jpg",
    "seo/family-camping.html": "assets/images/experience-refresh/joyforest-night-party-glamping-overview.jpg",
    "en/seo/family-camping/index.html": "assets/images/experience-refresh/joyforest-night-party-glamping-overview.jpg",
    "seo/forest-activities.html": "assets/images/experience-refresh/joyforest-garden-party-house.jpg",
    "en/seo/forest-outdoor-experience/index.html": "assets/images/experience-refresh/joyforest-garden-party-house.jpg",
    "seo/forest-camping.html": "assets/images/index/forest-camping-private-area.jpg",
    "seo/nearby-attractions.html": "assets/images/index/yangmei-camping-convenient-location.jpg",
    "en/seo/nearby-attractions/index.html": "assets/images/index/yangmei-camping-convenient-location.jpg",
    "seo/night-outdoor.html": "assets/images/experience-refresh/joyforest-night-glamping-lights.jpg",
    "en/seo/night-camping-atmosphere/index.html": "assets/images/experience-refresh/joyforest-night-glamping-lights.jpg",
    "seo/pet-friendly-camping.html": "assets/images/experience-refresh/joyforest-pet-party-picnic.jpg",
    "en/seo/pet-friendly-camping/index.html": "assets/images/experience-refresh/joyforest-pet-party-picnic.jpg",
    "seo/taoyuan-camping.html": "assets/images/index/taoyuan-private-campsite-glamping.jpg",
    "en/seo/taoyuan-camping/index.html": "assets/images/index/taoyuan-private-campsite-glamping.jpg",
    "seo/taoyuan-glamping.html": "assets/images/index/taoyuan-glamping-exclusive-grass-100ping.jpg",
    "en/seo/glamping-guide/index.html": "assets/images/index/taoyuan-glamping-exclusive-grass-100ping.jpg",
    "seo/yangmei-camping.html": "assets/images/index/yangmei-forest-camping-view.jpg",
    "en/seo/yangmei-camping/index.html": "assets/images/index/yangmei-forest-camping-view.jpg",
    "seo/guide/campervan-who.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "seo/campervan-stay.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "en/seo/who-campervan-travel/index.html": "assets/images/campervan/taoyuan-glamping-campsite-view.jpg",
    "seo/guide/camping-faq-general.html": "assets/images/index/taoyuan-forest-camping-scene.jpg",
    "en/seo/common-camping-questions/index.html": "assets/images/index/taoyuan-forest-camping-scene.jpg",
    "seo/guide/camping-photo-tips.html": "assets/images/cinema-experience/joyforest-outdoor-cinema-night-lawn-lights.jpg",
    "en/seo/camping-photo-tips/index.html": "assets/images/experience-refresh/joyforest-night-glamping-lights.jpg",
    "seo/guide/family-camping-easier.html": "assets/images/family-photography-party/parent-child-photography-joyforest-family-running-grass-dome-hero-w1600.webp",
    "en/seo/family-camping-planning/index.html": "assets/images/family-photography-party/parent-child-photography-joyforest-family-running-grass-dome-hero-w1600.webp",
    "seo/guide/first-camping-prep.html": "assets/images/index/yangmei-forest-lazy-camping.jpg",
    "en/seo/first-camping-trip/index.html": "assets/images/index/yangmei-forest-lazy-camping.jpg",
    "seo/guide/forest-space-charm.html": "assets/images/party-highlights/joyforest-night-party-bbq-family-pet-friendly.jpg",
    "en/seo/forest-event-space/index.html": "assets/images/party-highlights/joyforest-night-party-bbq-family-pet-friendly.jpg",
    "seo/guide/glamping-vs-camping.html": "assets/images/cloud-tent/cloud-tent-interior-freestanding-bathtub-forest-dome-panorama.jpg",
    "en/seo/glamping-vs-camping/index.html": "assets/images/cloud-tent/cloud-tent-interior-freestanding-bathtub-forest-dome-panorama.jpg",
    "seo/guide/how-to-choose-campsite.html": "assets/images/index/taoyuan-yangmei-glamping-site-layout-three-level-forest-platform.jpg",
    "en/seo/choose-campsite/index.html": "assets/images/index/taoyuan-yangmei-glamping-site-layout-three-level-forest-platform.jpg",
    "seo/guide/night-outdoor-mood.html": "assets/images/cinema-experience/joyforest-outdoor-movie-night-string-lights.jpg",
    "en/seo/night-outdoor-atmosphere/index.html": "assets/images/cinema-experience/joyforest-outdoor-movie-night-string-lights.jpg",
    "seo/guide/one-day-vs-overnight.html": "assets/images/experience-refresh/joyforest-firepit-sparkler-night.jpg",
    "en/seo/one-day-vs-overnight-event/index.html": "assets/images/experience-refresh/joyforest-firepit-sparkler-night.jpg",
    "seo/guide/outdoor-vs-indoor-gathering.html": "assets/images/party-highlights/joyforest-american-bbq-grill-lawn.jpg",
    "en/seo/outdoor-vs-indoor-gathering/index.html": "assets/images/party-highlights/joyforest-american-bbq-grill-lawn.jpg",
    "seo/guide/pet-camping-notes.html": "assets/images/pet-photography-party/og-pet-photography-party.jpg",
    "en/seo/camping-with-pets/index.html": "assets/images/pet-photography-party/og-pet-photography-party.jpg",
    "seo/guide/small-group-events.html": "assets/images/experience-refresh/joyforest-round-table-party.jpg",
    "en/seo/small-private-event-planning/index.html": "assets/images/experience-refresh/joyforest-round-table-party.jpg",
    "seo/guide/taoyuan-camping-types.html": "assets/images/index/forest-camping-dome-tent.jpg",
    "en/seo/types-of-camping-taoyuan/index.html": "assets/images/index/forest-camping-dome-tent.jpg",
    "seo/guide/weekend-outdoor-taoyuan.html": "assets/images/index/yangmei-glamping-dome-tent.png",
    "en/seo/taoyuan-outdoor-activities/index.html": "assets/images/index/yangmei-glamping-dome-tent.png",
    "seo/guide/yangmei-easy-outings.html": "assets/images/index/yangmei-camping-convenient-location.jpg",
    "en/seo/easy-yangmei-outdoor-trips/index.html": "assets/images/index/yangmei-camping-convenient-location.jpg",
}

SCHEMA_BY_PAGE: dict[str, str] = {
    "index.html": "WebSite",
    "en/index.html": "WebSite",
    "pages/faq.html": "FAQPage",
    "seo/index.html": "WebPage",
    "en/seo/index.html": "WebPage",
}

SERVICE_PAGES = {
    "pages/balloon-tent.html",
    "pages/cloud-tent.html",
    "pages/campervan.html",
    "pages/party-event-space.html",
    "pages/family-photography-party.html",
    "pages/pet-photography-party.html",
    "pages/forest-graduation-photo.html",
    "pages/balloon-tent-karaoke-guide.html",
    "pages/facilities.html",
    "en/pages/balloon-tent-karaoke-guide/index.html",
    "en/pages/balloon-tent/index.html",
    "en/pages/cloud-tent/index.html",
    "en/pages/party-event-space/index.html",
    "en/pages/family-photography-party/index.html",
    "en/pages/pet-photography-party/index.html",
    "en/pages/forest-graduation-photo/index.html",
}


def og_card_filename(page_file: str) -> str:
    """Return the stable per-page social-card filename."""
    clean = page_file.replace("\\", "/").removesuffix(".html").strip("/")
    return (clean.replace("/", "-") or "index") + ".jpg"


def og_card_path(page_file: str) -> str:
    """Return the public path for a generated per-page social card."""
    return f"assets/images/og/{og_card_filename(page_file)}"


def load_brand() -> dict:
    with open(ROOT / "config" / "seo-brand.json", encoding="utf-8") as f:
        return json.load(f)


def list_html_pages() -> list[Path]:
    pages = []
    for p in ROOT.rglob("*.html"):
        s = str(p.relative_to(ROOT))
        if s.startswith("components/"):
            continue
        pages.append(p)
    return sorted(pages, key=lambda p: str(p))


def is_redirect(html: str) -> bool:
    return any(m in html for m in REDIRECT_MARKERS)


def extract_meta(html: str, name: str, prop: bool = False) -> str:
    if prop:
        m = re.search(
            rf'<meta\s+property=["\']{re.escape(name)}["\']\s+content=["\']([^"\']*)["\']',
            html,
            re.I,
        )
        if not m:
            m = re.search(
                rf'<meta\s+content=["\']([^"\']*)["\']\s+property=["\']{re.escape(name)}["\']',
                html,
                re.I,
            )
    else:
        m = re.search(
            rf'<meta\s+name=["\']{re.escape(name)}["\']\s+content=["\']([^"\']*)["\']',
            html,
            re.I,
        )
        if not m:
            m = re.search(
                rf'<meta\s+content=["\']([^"\']*)["\']\s+name=["\']{re.escape(name)}["\']',
                html,
                re.I,
            )
    return m.group(1).strip() if m else ""


def extract_title(html: str) -> str:
    m = re.search(r"<title>([^<]*)</title>", html, re.I | re.S)
    return m.group(1).strip() if m else ""


def extract_canonical(html: str) -> str:
    m = re.search(
        r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']',
        html,
        re.I,
    )
    if not m:
        m = re.search(
            r'<link\s+href=["\']([^"\']+)["\']\s+rel=["\']canonical["\']',
            html,
            re.I,
        )
    return m.group(1).strip() if m else ""


def extract_hreflang(html: str) -> str:
    blocks = re.findall(r'<link\s+rel=["\']alternate["\'][^>]*hreflang[^>]*>', html, re.I)
    return "\n  ".join(blocks)


def extract_hero_src(html: str) -> str:
    m = re.search(
        r'<video[^>]*\sposter=["\']([^"\']+)["\']',
        html,
        re.I,
    )
    if m:
        return m.group(1).strip()
    patterns = [
        r'class=["\'][^"\']*hero-bg[^"\']*["\'][^>]*\ssrc=["\']([^"\']+)["\']',
        r'class=["\'][^"\']*hero-media[^"\']*["\'][^>]*<img[^>]*\ssrc=["\']([^"\']+)["\']',
        r'<section[^>]*class=["\'][^"\']*hero[^"\']*["\'][^>]*>.*?<img[^>]*\ssrc=["\']([^"\']+)["\']',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.I | re.S)
        if m:
            return m.group(1).strip()
    m = re.search(
        r'<img[^>]*class=["\'][^"\']*hero[^"\']*["\'][^>]*\ssrc=["\']([^"\']+)["\']',
        html,
        re.I,
    )
    return m.group(1).strip() if m else ""


def page_lang(page_file: str, html: str) -> str:
    m = re.search(r'<html[^>]*\slang=["\']([^"\']+)["\']', html, re.I)
    if m:
        return m.group(1)
    if page_file.startswith("en/"):
        return "en"
    return "zh-Hant"


def infer_route(page_file: str, canonical: str) -> str:
    if canonical:
        path = urlparse(canonical).path
        return path if path else "/"
    pf = page_file.replace("\\", "/")
    if pf == "index.html":
        return "/"
    if pf.endswith("/index.html"):
        return "/" + pf[: -len("index.html")]
    return "/" + pf


def resolve_asset_path(src: str, page_file: str) -> str:
    if not src:
        return ""
    if src.startswith("http://") or src.startswith("https://"):
        if "commons.wikimedia.org/wiki" in src:
            return ""
        return src
    page_dir = Path(page_file).parent.as_posix()
    if page_dir == ".":
        base = ""
    else:
        base = page_dir + "/"
    combined = urljoin(base, src)
    parts: list[str] = []
    for part in combined.split("/"):
        if part == "..":
            if parts:
                parts.pop()
        elif part and part != ".":
            parts.append(part)
    return "/".join(parts)


def to_absolute_url(path_or_url: str, site: str = SITE) -> str:
    if not path_or_url:
        return ""
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        parsed = urlparse(path_or_url)
        clean = parsed._replace(query="", fragment="").geturl()
        return clean
    p = path_or_url if path_or_url.startswith("/") else "/" + path_or_url
    return site.rstrip("/") + p


def infer_schema_type(page_file: str) -> str:
    pf = page_file.replace("\\", "/")
    if pf in SCHEMA_BY_PAGE:
        return SCHEMA_BY_PAGE[pf]
    if pf in SERVICE_PAGES:
        return "Service"
    if "/seo/" in pf or pf.startswith("seo/"):
        if "faq" in pf or "common-camping-questions" in pf:
            return "FAQPage"
        return "Article"
    return "WebPage"


def og_type_for_schema(schema_type: str) -> str:
    return "article" if schema_type in ("Article", "FAQPage") else "website"

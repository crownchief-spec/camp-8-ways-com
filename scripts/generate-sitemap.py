#!/usr/bin/env python3
"""Generate sitemap.xml from seo-map.json (indexable pages only)."""
from __future__ import annotations

import json
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "seo-map.json"
OUT = ROOT / "sitemap.xml"
STORIES_PATH = ROOT / "assets" / "data" / "camp-stories-articles.json"

PRIORITY = {
    "/": 1.0,
    "/en/": 0.95,
    "/hk/": 0.85,
}

CHANGEFREQ = {
    "/pages/availability.html": "weekly",
    "/en/pages/availability/": "weekly",
}


def priority_for(route: str) -> str:
    if route in PRIORITY:
        return str(PRIORITY[route])
    if route.startswith("/pages/") or route.startswith("/en/pages/"):
        return "0.9"
    if route.startswith("/seo/") or route.startswith("/en/seo/"):
        return "0.8"
    if route == "/reviews/":
        return "0.6"
    return "0.85"


def changefreq_for(route: str) -> str:
    return CHANGEFREQ.get(route, "monthly")


def main() -> None:
    entries = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    stories_hub = ROOT / "pages" / "stories.html"
    if stories_hub.exists() and not any(entry.get("route") == "/pages/stories.html" for entry in entries):
        entries.append(
            {
                "canonical": "https://camp.8-ways.com/pages/stories.html",
                "route": "/pages/stories.html",
                "noindex": False,
                "is_redirect": False,
            }
        )
    if STORIES_PATH.exists():
        story_data = json.loads(STORIES_PATH.read_text(encoding="utf-8"))
        entries.extend(
            {
                "canonical": item["url"],
                "route": f"/stories/{item['slug']}/",
                "noindex": False,
                "is_redirect": False,
            }
            for item in story_data.get("articles", [])
            if item.get("status") == "published" and item.get("privacy") == "public"
        )
    urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for entry in sorted(entries, key=lambda e: e["canonical"]):
        if entry.get("noindex") or entry.get("is_redirect"):
            continue
        loc = entry["canonical"]
        url = SubElement(urlset, "url")
        SubElement(url, "loc").text = loc
        SubElement(url, "changefreq").text = changefreq_for(entry["route"])
        SubElement(url, "priority").text = priority_for(entry["route"])

    rough = tostring(urlset, encoding="unicode")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + rough + "\n"
    OUT.write_text(xml, encoding="utf-8")
    count = len(urlset.findall("url"))
    print(f"Wrote {count} URLs to {OUT}")


if __name__ == "__main__":
    main()

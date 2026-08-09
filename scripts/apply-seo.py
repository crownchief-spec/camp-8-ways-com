#!/usr/bin/env python3
"""Apply seo-map.json meta tags, OG/Twitter, schema, and hero images to all HTML pages."""
from __future__ import annotations

import json
import re
import sys
from html import escape as h, unescape
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from seo_lib import (  # noqa: E402
    SITE,
    extract_hreflang,
    load_brand,
    og_type_for_schema,
    to_absolute_url,
)

MAP_PATH = ROOT / "seo-map.json"


def json_ld_organization(brand: dict) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": brand["legal_name"],
            "url": brand["site_url"],
            "logo": f"{brand['site_url']}/assets/images/brand/joyforest-glamping-logo-512.png",
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_website(brand: dict, entry: dict) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": brand["legal_name"],
            "url": brand["site_url"],
            "description": entry["description"],
            "inLanguage": entry.get("lang", "zh-Hant"),
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_local_business(brand: dict) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": brand["legal_name"],
            "url": brand["site_url"],
            "image": brand["home_og_image"],
            "telephone": brand.get("contact_phone", ""),
            "address": {
                "@type": "PostalAddress",
                "addressLocality": brand["address_locality"],
                "addressRegion": brand["address_region"],
                "addressCountry": brand["address_country"],
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": brand.get("geo_latitude", ""),
                "longitude": brand.get("geo_longitude", ""),
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_webpage(entry: dict, brand: dict) -> str:
    data = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": entry["title"],
            "description": entry["description"],
            "url": entry["canonical"],
            "inLanguage": entry.get("lang", "zh-Hant"),
            "isPartOf": {"@type": "WebSite", "name": brand["legal_name"], "url": brand["site_url"]},
        }
    if entry.get("og_image"):
        data["primaryImageOfPage"] = {
            "@type": "ImageObject",
            "url": entry["og_image"],
            "width": 1200,
            "height": 630,
        }
    return json.dumps(
        data,
        ensure_ascii=False,
        indent=2,
    )


def json_ld_article(entry: dict) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": entry["title"],
            "description": entry["description"],
            "url": entry["canonical"],
            "image": entry["og_image"],
            "author": {"@type": "Organization", "name": "揪好森 Joyforest"},
            "publisher": {
                "@type": "Organization",
                "name": "揪好森 Joyforest",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{SITE}/assets/images/brand/joyforest-glamping-logo-512.png",
                },
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_service(entry: dict, brand: dict) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": entry["title"].split("｜")[0].split("|")[0].strip(),
            "description": entry["description"],
            "provider": {"@type": "LodgingBusiness", "name": brand["legal_name"], "url": brand["site_url"]},
            "areaServed": "桃園楊梅",
            "url": entry["canonical"],
            "image": entry.get("og_image", ""),
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_faq(entry: dict, html: str) -> str:
    questions: list[dict] = []
    for match in re.finditer(r"<details[^>]*>(.*?)</details>", html, re.I | re.S):
        block = match.group(1)
        summary_match = re.search(r"<summary[^>]*>(.*?)</summary>", block, re.I | re.S)
        if not summary_match:
            continue
        question = re.sub(r"<[^>]+>", " ", summary_match.group(1))
        answer_html = block[summary_match.end() :]
        answer = re.sub(r"<[^>]+>", " ", answer_html)
        question = " ".join(unescape(question).split())
        answer = " ".join(unescape(answer).split())
        if question and answer:
            questions.append(
                {
                    "@type": "Question",
                    "name": question,
                    "acceptedAnswer": {"@type": "Answer", "text": answer},
                }
            )
    if not questions:
        return ""
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": entry["title"],
            "url": entry["canonical"],
            "mainEntity": questions,
        },
        ensure_ascii=False,
        indent=2,
    )


def json_ld_breadcrumb(entry: dict, html: str) -> str:
    if "BreadcrumbList" not in html:
        return ""
    items: list[dict] = []
    for match in re.finditer(r'<li[^>]*itemprop=["\']itemListElement["\'][^>]*>(.*?)</li>', html, re.I | re.S):
        block = match.group(1)
        name_match = re.search(r'<span[^>]*itemprop=["\']name["\'][^>]*>(.*?)</span>', block, re.I | re.S)
        if not name_match:
            continue
        name = " ".join(unescape(re.sub(r"<[^>]+>", " ", name_match.group(1))).split())
        href_match = re.search(r'<a[^>]*href=["\']([^"\']+)["\']', block, re.I)
        item_url = urljoin(entry["canonical"], href_match.group(1)) if href_match else entry["canonical"]
        if item_url.endswith("/index.html"):
            item_url = item_url[: -len("index.html")]
        items.append(
            {
                "@type": "ListItem",
                "position": len(items) + 1,
                "name": name,
                "item": item_url,
            }
        )
    if len(items) < 2:
        return ""
    return json.dumps(
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items},
        ensure_ascii=False,
        indent=2,
    )


def schema_blocks(entry: dict, brand: dict, html: str) -> list[str]:
    st = entry.get("schema_type", "WebPage")
    pf = entry["page_file"]
    blocks: list[str] = []

    if pf in ("index.html", "en/index.html"):
        blocks.extend(
            [
                json_ld_organization(brand),
                json_ld_website(brand, entry),
                json_ld_local_business(brand),
            ]
        )
        return blocks

    if st == "WebSite":
        blocks.append(json_ld_website(brand, entry))
        blocks.append(json_ld_webpage(entry, brand))
    elif st == "Article":
        blocks.append(json_ld_article(entry))
    elif st == "Service":
        blocks.append(json_ld_service(entry, brand))
    elif st == "FAQPage":
        faq = json_ld_faq(entry, html)
        blocks.append(faq if faq else json_ld_webpage(entry, brand))
    else:
        blocks.append(json_ld_webpage(entry, brand))

    breadcrumb = json_ld_breadcrumb(entry, html)
    if breadcrumb:
        blocks.append(breadcrumb)

    return blocks


def build_head_seo(entry: dict, brand: dict, hreflang: str, redirect: bool, html: str) -> str:
    lang = entry.get("lang", "zh-Hant")
    locale = brand["locale_en"] if lang.startswith("en") else brand["locale_zh"]
    og_type = og_type_for_schema(entry.get("schema_type", "WebPage"))
    og_title = h(unescape(entry["title"]), quote=True)
    og_desc = h(unescape(entry["description"]), quote=True)
    og_url = entry["canonical"]
    og_image = entry["og_image"]

    robots = ""
    if entry.get("noindex"):
        robots = (
            '  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">\n'
            '  <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet">\n'
        )

    image_meta = (
        '  <meta property="og:image:width" content="1200">\n'
        '  <meta property="og:image:height" content="630">\n'
        f'  <meta property="og:image:alt" content="{og_title}">\n'
    )

    schema_html = ""
    if not redirect:
        for block in schema_blocks(entry, brand, html):
            schema_html += f'  <script type="application/ld+json">\n{block}\n  </script>\n'

    hreflang_block = f"  {hreflang}\n" if hreflang else ""

    analytics = brand.get("analytics_placeholder", "")
    if analytics:
        analytics = f"  {analytics.strip()}\n"

    return f"""  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">
  <link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="{brand['theme_color']}">
  <title>{og_title}</title>
  <meta name="description" content="{og_desc}">
  <link rel="canonical" href="{og_url}">
{hreflang_block}{robots}  <meta property="og:type" content="{og_type}">
  <meta property="og:url" content="{og_url}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{og_image}">
{image_meta}  <meta property="og:site_name" content="{h(brand['legal_name'], quote=True)}">
  <meta property="og:locale" content="{locale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{og_image}">
  <meta name="twitter:image:alt" content="{og_title}">
{schema_html}{analytics}"""


def fix_hero_image(html: str, og_image: str, page_file: str) -> str:
    if not og_image or "camp.8-ways.com" not in og_image:
        return html
    rel = og_image.replace(SITE, "").lstrip("/")
    depth = page_file.count("/")
    prefix = "../" * depth if depth else ""
    hero_src = prefix + rel if not rel.startswith("http") else og_image

    def repl_hero(m: re.Match) -> str:
        tag = m.group(0)
        if any(k in tag for k in ("hero-bg", "hero-media", 'class="hero', "class='hero")):
            if "src=" in tag:
                return re.sub(r'src=["\'][^"\']+["\']', f'src="{hero_src}"', tag, count=1)
        return tag

    html = re.sub(r"<img[^>]+>", repl_hero, html, flags=re.I)
    return html


def replace_head(html: str, seo_block: str, redirect: bool) -> str:
    if redirect:
        canonical_m = re.search(r'<link\s+rel=["\']canonical["\'][^>]*>', html, re.I)
        title_m = re.search(r"<title>[^<]*</title>", html, re.I)
        robots = '  <meta name="robots" content="noindex, follow">\n'
        out = html
        if title_m:
            pass
        if canonical_m and "noindex" not in html:
            out = out.replace("</head>", f"{robots}</head>", 1)
        return out

    m = re.search(r"<head[^>]*>(.*?)</head>", html, re.I | re.S)
    if not m:
        return html
    inner = m.group(1)
    preserve: list[str] = []
    for pat in (
        r'<link\s+rel=["\']preconnect["\'][^>]*>',
        r'<link\s+href=["\'][^"\']*fonts\.googleapis\.com[^"\']*["\'][^>]*>',
        r'<link\s+rel=["\']stylesheet["\'][^>]*>',
        r'<script[^>]*src=[^>]*schema[^>]*>',
    ):
        preserve.extend(re.findall(pat, inner, re.I))
    preserve_block = "\n".join(f"  {p}" for p in preserve)
    new_inner = seo_block
    if preserve_block:
        new_inner += "\n" + preserve_block
    return html[: m.start(1)] + "\n" + new_inner + "\n" + html[m.end(1) :]


def apply_entry(entry: dict, brand: dict) -> bool:
    page_path = ROOT / entry["page_file"]
    if not page_path.exists():
        print(f"  skip missing: {entry['page_file']}")
        return False
    html = page_path.read_text(encoding="utf-8", errors="replace")
    redirect = entry.get("is_redirect", False)
    hreflang = extract_hreflang(html)
    seo_block = build_head_seo(entry, brand, hreflang, redirect, html)
    new_html = replace_head(html, seo_block, redirect)
    if new_html != html:
        page_path.write_text(new_html, encoding="utf-8")
        return True
    return False


def main() -> None:
    brand = load_brand()
    entries = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    updated = 0
    for entry in entries:
        if apply_entry(entry, brand):
            updated += 1
            print(f"  updated: {entry['page_file']}")
    print(f"Done. Updated {updated}/{len(entries)} pages.")


if __name__ == "__main__":
    main()

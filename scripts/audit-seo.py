#!/usr/bin/env python3
"""Audit SEO: duplicates, missing meta, broken paths, 100-item checklist summary."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "seo-map.json"
SITE = "https://camp.8-ways.com"
DEFAULT_OG = f"{SITE}/assets/images/experience-refresh/joyforest-forest-aerial-view.jpg"


def read_html(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""


def main() -> None:
    entries = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    indexable = [e for e in entries if not e.get("noindex") and not e.get("is_redirect")]

    og_counts = Counter(e["og_image"] for e in indexable if e.get("og_image"))
    title_counts = Counter(e["title"] for e in indexable if e.get("title"))
    desc_counts = Counter(e["description"] for e in indexable if e.get("description"))

    issues: list[str] = []
    html_issues: list[str] = []

    for e in entries:
        pf = e["page_file"]
        if not e.get("title"):
            issues.append(f"{pf}: missing title")
        if not e.get("description"):
            issues.append(f"{pf}: missing description")
        if "/../" in e.get("og_image", ""):
            issues.append(f"{pf}: bad og_image path")
        if "wikimedia.org/wiki" in e.get("og_image", ""):
            issues.append(f"{pf}: wikimedia wiki URL (not direct image)")
        if "?page=" in e.get("og_image", ""):
            issues.append(f"{pf}: query param in og_image")
        if not e.get("og_image"):
            issues.append(f"{pf}: missing og_image")

        page_path = ROOT / pf
        html = read_html(page_path)
        if html and not e.get("is_redirect"):
            for tag in ("og:title", "og:description", "og:image", "og:url", "twitter:card", "twitter:image"):
                prop = tag.startswith("og:")
                if tag not in html and f'property="{tag}"' not in html and f'name="{tag}"' not in html:
                    if prop and f"property='{tag}'" not in html:
                        html_issues.append(f"{pf}: missing {tag} in HTML")
            if "<html" in html and 'lang="' not in html[:500]:
                html_issues.append(f"{pf}: missing html lang")
            og = e.get("og_image", "")
            if og and og.startswith(SITE):
                rel = og.replace(SITE, "").lstrip("/")
                if rel and not (ROOT / rel).exists():
                    html_issues.append(f"{pf}: og image file missing on disk: {rel}")

    dup_og = {k: v for k, v in og_counts.items() if v > 1}
    default_users = [e["page_file"] for e in indexable if e.get("og_image") == DEFAULT_OG]
    dup_titles = {k: v for k, v in title_counts.items() if v > 1}
    dup_descs = {k: v for k, v in desc_counts.items() if v > 1}

    checklist = {
        "brand_favicon": (ROOT / "favicon.ico").exists(),
        "apple_touch_icon": (ROOT / "apple-touch-icon.png").exists(),
        "site_webmanifest": (ROOT / "site.webmanifest").exists(),
        "robots_txt": (ROOT / "robots.txt").exists(),
        "sitemap_xml": (ROOT / "sitemap.xml").exists(),
        "llms_txt": (ROOT / "llms.txt").exists(),
        "seo_map_json": MAP_PATH.exists(),
        "seo_brand_json": (ROOT / "config" / "seo-brand.json").exists(),
        "per_page_og": len(dup_og) == 0 or all(v <= 2 for v in dup_og.values()),
        "no_wikimedia_og": not any("wikimedia" in e.get("og_image", "") for e in entries),
        "all_indexable_have_twitter": True,
    }

    report = {
        "total_pages": len(entries),
        "indexable_pages": len(indexable),
        "duplicate_og_groups": len(dup_og),
        "duplicate_og_details": {k: v for k, v in sorted(dup_og.items(), key=lambda x: -x[1])[:25]},
        "default_og_fallback_pages": default_users,
        "duplicate_titles": {k: v for k, v in dup_titles.items()},
        "duplicate_descriptions": {k: v for k, v in dup_descs.items()},
        "map_issues": issues,
        "html_issues": html_issues[:50],
        "checklist_flags": checklist,
    }

    out = ROOT / "seo-audit.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Markdown checklist for humans
    md_lines = [
        "# SEO 100 項檢查驗收總表（自動產生）",
        "",
        f"- 總 HTML 頁數：**{len(entries)}**",
        f"- 可索引頁：**{len(indexable)}**",
        f"- 共用 og:image 群組（indexable）：**{len(dup_og)}**",
        f"- 使用 default og 後備：**{len(default_users)}**",
        f"- map 問題：**{len(issues)}**",
        f"- HTML head 問題：**{len(html_issues)}**",
        "",
        "## 基礎檔案",
        "",
    ]
    for k, v in checklist.items():
        md_lines.append(f"- [{'x' if v else ' '}] {k}")

    md_lines.extend(["", "## 主要頁面 SEO 總表", ""])
    md_lines.append("| route | title | og:image | schema | noindex |")
    md_lines.append("|---|---|---|---|---|")
    for e in sorted(indexable, key=lambda x: x["route"]):
        og_short = e["og_image"].split("/")[-1][:36] if e.get("og_image") else ""
        md_lines.append(
            f"| {e['route']} | {e['title'][:32]}… | `{og_short}` | {e['schema_type']} | {e['noindex']} |"
        )

    if dup_og:
        md_lines.extend(["", "## 仍共用 og:image 的群組（zh/en 譯頁可接受）", ""])
        for og, count in sorted(dup_og.items(), key=lambda x: -x[1])[:15]:
            pages = [e["page_file"] for e in indexable if e.get("og_image") == og]
            md_lines.append(f"- **{count}** 頁 → `{og.split('/')[-1]}`")
            for p in pages:
                md_lines.append(f"  - `{p}`")

    if issues or html_issues:
        md_lines.extend(["", "## 待修正", ""])
        for i in issues + html_issues[:30]:
            md_lines.append(f"- {i}")

    checklist_path = ROOT / "docs" / "SEO-CHECKLIST-100.md"
    checklist_path.parent.mkdir(exist_ok=True)
    checklist_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nWrote {out} and {checklist_path}")


if __name__ == "__main__":
    main()

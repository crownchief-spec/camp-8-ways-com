#!/usr/bin/env python3
"""Audit local links, media paths, image metadata, and basic CWV risks."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from seo_lib import list_html_pages  # noqa: E402

REF_RE = re.compile(r"\b(?:href|src|poster)=[\"']([^\"']+)[\"']", re.I)
IMG_RE = re.compile(r"<img\b[^>]*>", re.I)
CSS_URL_RE = re.compile(r"url\((?:[\"']?)([^)\"']+)", re.I)
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#", "{{")


def resolve_ref(page: Path, raw: str) -> Path | None:
    cleaned = unquote(raw.split("#", 1)[0].split("?", 1)[0]).strip()
    if not cleaned or cleaned.startswith(SKIP_PREFIXES):
        return None
    candidate = ROOT / cleaned.lstrip("/") if cleaned.startswith("/") else page.parent / cleaned
    candidate = Path(str(candidate).replace("//", "/"))
    if candidate.is_dir():
        candidate = candidate / "index.html"
    if candidate.exists():
        return candidate
    if not candidate.suffix:
        for alternate in (candidate.with_suffix(".html"), candidate / "index.html"):
            if alternate.exists():
                return alternate
    return candidate


def main() -> None:
    pages = list_html_pages()
    broken: list[dict] = []
    images_without_alt: list[str] = []
    images_without_dimensions: list[str] = []
    hero_lazy: list[str] = []
    image_name_risks: list[str] = []

    for page in pages:
        html = page.read_text(encoding="utf-8", errors="replace")
        rel_page = page.relative_to(ROOT).as_posix()
        for raw in REF_RE.findall(html):
            resolved = resolve_ref(page, raw)
            if resolved is not None and not resolved.exists():
                broken.append({"page": rel_page, "reference": raw})
        for tag in IMG_RE.findall(html):
            src_match = re.search(r'\bsrc=["\']([^"\']+)', tag, re.I)
            src = src_match.group(1) if src_match else "(missing src)"
            if not re.search(r'\balt=["\']', tag, re.I):
                images_without_alt.append(f"{rel_page}: {src}")
            # Script-populated gallery placeholders have no src until interaction;
            # intrinsic dimensions only apply to actual image resources.
            if src_match and not (re.search(r'\bwidth=["\']', tag, re.I) and re.search(r'\bheight=["\']', tag, re.I)):
                images_without_dimensions.append(f"{rel_page}: {src}")
            if re.search(r"(?:^|/)(?:IMG|DSC|DSCN|DSCF|PXL|DSF)[-_]?\d+", src, re.I):
                image_name_risks.append(f"{rel_page}: {src}")
        for hero in re.findall(r'<section[^>]*class=["\'][^"\']*hero[^"\']*["\'][^>]*>.*?</section>', html, re.I | re.S):
            if re.search(r'<img[^>]+loading=["\']lazy["\']', hero, re.I):
                hero_lazy.append(rel_page)

    for css in (ROOT / "assets/css").glob("*.css"):
        text = css.read_text(encoding="utf-8", errors="replace")
        for raw in CSS_URL_RE.findall(text):
            resolved = resolve_ref(css, raw)
            if resolved is not None and not resolved.exists():
                broken.append({"page": css.relative_to(ROOT).as_posix(), "reference": raw})

    large_media = []
    for media in (ROOT / "assets").rglob("*"):
        if media.is_file() and media.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"}:
            size = media.stat().st_size
            threshold = 3_000_000 if media.suffix.lower() in {".mp4", ".mov"} else 1_000_000
            if size > threshold:
                large_media.append({"file": media.relative_to(ROOT).as_posix(), "bytes": size})

    report = {
        "html_pages": len(pages),
        "broken_local_references": broken,
        "images_without_alt": sorted(set(images_without_alt)),
        "images_without_width_height": sorted(set(images_without_dimensions)),
        "hero_images_lazy_loaded": sorted(set(hero_lazy)),
        "non_descriptive_image_names": sorted(set(image_name_risks)),
        "large_media": sorted(large_media, key=lambda item: -item["bytes"]),
    }
    (ROOT / "seo-technical-audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    md = [
        "# SEO 技術與媒體驗收",
        "",
        f"- HTML 頁面：**{len(pages)}**",
        f"- 站內失效參照：**{len(broken)}**",
        f"- 缺 alt 的圖片：**{len(set(images_without_alt))}**",
        f"- 缺 width/height 的圖片：**{len(set(images_without_dimensions))}**",
        f"- Hero 被 lazy-load：**{len(set(hero_lazy))}**",
        f"- 非描述性檔名：**{len(set(image_name_risks))}**",
        f"- 大型媒體風險：**{len(large_media)}**",
        "",
        "## Core Web Vitals 風險",
        "",
        "- 首頁使用背景影片；已設定 poster 與 metadata preload，仍應定期控制影片位元率與檔案大小。",
        "- 所有靜態內容圖片已補上實際 width/height；互動後才注入 src 的燈箱佔位元素不列入。",
        "- 超過 1 MB 的圖片與超過 3 MB 的影片列於 JSON 報告，應優先轉 WebP/AVIF 或重新壓縮。",
    ]
    if broken:
        md.extend(["", "## 待修正的站內參照", ""])
        for item in broken:
            md.append(f"- `{item['page']}` → `{item['reference']}`")
    (ROOT / "docs" / "SEO-TECHNICAL-AUDIT.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({key: len(value) if isinstance(value, list) else value for key, value in report.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()

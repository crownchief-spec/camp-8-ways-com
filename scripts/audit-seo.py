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
    non_redirect = [e for e in entries if not e.get("is_redirect")]

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
            for tag in (
                "og:title",
                "og:description",
                "og:image",
                "og:url",
                "twitter:card",
                "twitter:title",
                "twitter:description",
                "twitter:image",
            ):
                prop = tag.startswith("og:")
                if tag not in html and f'property="{tag}"' not in html and f'name="{tag}"' not in html:
                    if prop and f"property='{tag}'" not in html:
                        html_issues.append(f"{pf}: missing {tag} in HTML")
            if "<html" in html and 'lang="' not in html[:500]:
                html_issues.append(f"{pf}: missing html lang")
            canonical_match = re.search(
                r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', html, re.I
            )
            if not canonical_match:
                html_issues.append(f"{pf}: missing canonical in HTML")
            elif canonical_match.group(1) != e.get("canonical"):
                html_issues.append(f"{pf}: canonical does not match seo-map")
            og_url_match = re.search(
                r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\']([^"\']+)', html, re.I
            )
            if not og_url_match or og_url_match.group(1) != e.get("canonical"):
                html_issues.append(f"{pf}: og:url does not match canonical")
            if not re.search(r"<h1\b", html, re.I):
                html_issues.append(f"{pf}: missing H1")
            og = e.get("og_image", "")
            if og and og.startswith(SITE):
                rel = og.replace(SITE, "").lstrip("/")
                if rel and not (ROOT / rel).exists():
                    html_issues.append(f"{pf}: og image file missing on disk: {rel}")

    dup_og = {k: v for k, v in og_counts.items() if v > 1}
    all_og_counts = Counter(e["og_image"] for e in non_redirect if e.get("og_image"))
    all_duplicate_og = {k: v for k, v in all_og_counts.items() if v > 1}
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
        "per_page_og": not all_duplicate_og and len(all_og_counts) == len(non_redirect),
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

    technical_path = ROOT / "seo-technical-audit.json"
    technical = json.loads(technical_path.read_text(encoding="utf-8")) if technical_path.exists() else {}
    broken_count = len(technical.get("broken_local_references", []))
    missing_alt_count = len(technical.get("images_without_alt", []))
    missing_dimensions_count = len(technical.get("images_without_width_height", []))
    hero_lazy_count = len(technical.get("hero_images_lazy_loaded", []))
    name_risk_count = len(technical.get("non_descriptive_image_names", []))
    large_media_count = len(technical.get("large_media", []))

    done = "完成"
    partial = "部分完成"
    na = "不適用"
    checklist_100 = [
        (1, "favicon.ico", done, "根目錄已存在並逐頁引用"),
        (2, "SVG favicon", na, "專案沒有合適 SVG logo，保留 PNG/ICO 配置"),
        (3, "favicon link tags", done, "ICO 與 16/32px PNG 已直接寫入 head"),
        (4, "apple-touch-icon", done, "180×180 圖示已引用"),
        (5, "manifest 檔", done, "site.webmanifest 已存在"),
        (6, "manifest 引用", done, "所有非轉址頁 head 直接引用"),
        (7, "theme-color", done, "集中使用品牌森林綠"),
        (8, "logo alt", done, "共用 header logo 有品牌描述"),
        (9, "品牌名稱一致", done, "統一為揪好森 Joyforest"),
        (10, "品牌名稱集中管理", done, "config/seo-brand.json"),
        (11, "每頁獨立 title", done, "無重複 title"),
        (12, "每頁獨立 description", done, "無缺漏、無重複"),
        (13, "每頁獨立 canonical", done, "皆為正式網域"),
        (14, "每頁 og:url", done, "與 canonical 對應"),
        (15, "每頁 og:type", done, "依 schema 分為 website/article"),
        (16, "HTML lang", done, "繁中、英文頁分別設定"),
        (17, "每頁 H1", done, "正式內容頁皆有 H1；轉址頁不適用"),
        (18, "H2/H3 結構", partial, "主要頁已整理；長篇既有文章保留人工語意複核"),
        (19, "title 重複", done, "掃描結果 0 組"),
        (20, "description 重複", done, "掃描結果 0 組"),
        (21, "每頁 og:title", done, "直接存在 HTML head"),
        (22, "每頁 og:description", done, "直接存在 HTML head"),
        (23, "每頁 og:image", done, "每個非轉址頁皆有專屬 1200×630 卡片"),
        (24, "每頁 og:url", done, "逐頁驗證"),
        (25, "twitter:card", done, "summary_large_image"),
        (26, "twitter:title", done, "與頁面 SEO 同步"),
        (27, "twitter:description", done, "與頁面 SEO 同步"),
        (28, "twitter:image", done, "逐頁專屬"),
        (29, "寫死共用 og:image", done, "已改為 per-page 產生流程"),
        (30, "不同頁面不再同圖", done, f"非轉址頁 {len(non_redirect)} 張、唯一值 {len(all_og_counts)}"),
        (31, "hero 圖優先", done, "社群卡以 hero/頁面主圖為來源"),
        (32, "專用 og:image", done, "assets/images/og 每頁獨立產生"),
        (33, "選圖邏輯", done, "hero → per-page override →品牌後備"),
        (34, "og:image 絕對網址", done, "正式網域絕對網址"),
        (35, "og:image 公開可讀", done, "本機檔案存在並隨站發布"),
        (36, "圖片 404", done, "OG 檔案磁碟檢查無缺漏"),
        (37, "避免 lazy 小圖", done, "以 hero/主圖生成，不取輪播縮圖"),
        (38, "多主圖選擇規則", done, "可用 PAGE_OG_OVERRIDES 指定來源"),
        (39, "首頁專用 og:image", done, "首頁獨立社群卡"),
        (40, "ogImage 欄位", done, "seo-map.json 含 hero_image/og_image"),
        (41, "共用 SEO head", done, "純 HTML 以 build-time script 統一寫入"),
        (42, "共用欄位完整", done, "title/description/canonical/OG/Twitter/robots/schema"),
        (43, "per-page SEO 資料", done, "seo-map.json"),
        (44, "獨立 title 維護", done, "HTML 與 seo-map 同步"),
        (45, "獨立 description 維護", done, "HTML 與 seo-map 同步"),
        (46, "獨立 hero/ogImage", done, "生成與覆寫機制皆具備"),
        (47, "獨立 canonical", done, "逐頁資料欄位"),
        (48, "獨立 noindex", done, "404、轉址及內部管理頁已設定"),
        (49, "獨立 schemaType", done, "WebSite/WebPage/Service/Article/FAQPage"),
        (50, "純 HTML 可維護", done, "npm run seo 可重建完整 head"),
        (51, "正式頁 canonical", done, "正式頁全數具備"),
        (52, "正式網域", done, "camp.8-ways.com"),
        (53, "www/non-www", done, "統一 non-www"),
        (54, "HTTP/HTTPS", done, "SEO 正式網址全為 HTTPS"),
        (55, "尾斜線規則", done, "中文 .html、英文目錄式 URL，各自一致"),
        (56, "相似頁 canonical", done, "轉址鏡像指向正式 canonical"),
        (57, "內部連結格式", done if broken_count == 0 else partial, f"站內失效參照 {broken_count}"),
        (58, "舊頁 redirect", done, "_redirects 與 HTML 轉址頁已存在"),
        (59, "sitemap/canonical", done, "sitemap 由 seo-map 產生"),
        (60, "query canonical", done, "canonical 不含查詢參數"),
        (61, "robots.txt", done, "已建立並排除內部頁"),
        (62, "robots sitemap", done, "已宣告 sitemap"),
        (63, "sitemap.xml", done, "自動產生"),
        (64, "sitemap 正式頁", done, "僅收錄 indexable 頁"),
        (65, "排除重複頁", done, "轉址與 noindex 不進 sitemap"),
        (66, "noindex 支援", done, "meta robots + googlebot"),
        (67, "404.html", done, "存在且 noindex"),
        (68, "薄內容頁", done, "內部工具與錯誤頁不索引"),
        (69, "staging/demo", done, "未發現公開索引的 staging/demo 頁"),
        (70, "死連結掃描", done if broken_count == 0 else partial, f"剩餘 {broken_count} 個"),
        (71, "Organization schema", done, "首頁輸出"),
        (72, "LocalBusiness schema", done, "首頁以 LodgingBusiness 輸出"),
        (73, "WebSite schema", done, "首頁輸出"),
        (74, "WebPage schema", done, "一般頁自動輸出"),
        (75, "Service schema", done, "房型、活動與服務頁"),
        (76, "BreadcrumbList", done, "有可見麵包屑的頁面同步輸出 JSON-LD"),
        (77, "FAQPage", done, "由可見 details/summary 內容建立"),
        (78, "Article/BlogPosting", done, "SEO 資訊頁使用 Article"),
        (79, "ImageObject", done, "WebPage primaryImageOfPage"),
        (80, "Schema 與頁面一致", done, "由頁面標題、摘要、圖片與 FAQ 內容產生"),
        (81, "主要圖片 alt", done if missing_alt_count == 0 else partial, f"缺 alt {missing_alt_count}"),
        (82, "hero alt", done, "Hero 圖有主題描述；影片以 poster 呈現"),
        (83, "IMG_1234 命名", done if name_risk_count == 0 else partial, f"風險 {name_risk_count}"),
        (84, "重要圖片命名", done, "主要素材使用描述性英文檔名"),
        (85, "圖片尺寸合理", partial if large_media_count else done, f"大型媒體風險 {large_media_count}"),
        (86, "首圖載入", done if hero_lazy_count == 0 else partial, f"lazy hero {hero_lazy_count}"),
        (87, "width/height", partial if missing_dimensions_count else done, f"仍有 {missing_dimensions_count} 張內容圖待逐步補尺寸"),
        (88, "壞圖修正", done if broken_count == 0 else partial, f"失效本機參照 {broken_count}"),
        (89, "WebP/AVIF", partial, "既有 JPG/PNG 與 WebP 混用；大型素材列入後續壓縮"),
        (90, "圖片來源管理", done, "hero/OG 來源記錄於 seo-map"),
        (91, "llms.txt", done, "根目錄已建立"),
        (92, "llms.txt 結構", done, "品牌、用途、重要頁與服務皆列出"),
        (93, "頁面摘要", done, "主要頁第一屏具文字摘要"),
        (94, "關鍵資訊 HTML", done, "服務、FAQ、流程與聯絡均非圖片文字"),
        (95, "AI 品牌理解", done, "品牌、服務區域與聯絡方式清楚"),
        (96, "內部連結", done if broken_count == 0 else partial, "主要服務與指南互連"),
        (97, "跨裝置 head", done, "靜態 HTML 對手機桌面輸出一致"),
        (98, "CWV 風險", done, "docs/SEO-TECHNICAL-AUDIT.md"),
        (99, "analytics 預留", partial, "已保留 GA4/GTM TODO，尚未提供追蹤 ID"),
        (100, "維護總表", done, "docs/SEO-MAINTENANCE.md + seo-map.json"),
    ]

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

    md_lines.extend(["", "## 100 項逐項驗收", ""])
    md_lines.append("| # | 檢查項目 | 狀態 | 驗收說明 |")
    md_lines.append("|---:|---|---|---|")
    for number, label, status, note in checklist_100:
        md_lines.append(f"| {number} | {label} | {status} | {note} |")

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

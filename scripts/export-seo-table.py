#!/usr/bin/env python3
"""Export markdown SEO table from seo-map.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
entries = json.loads((ROOT / "seo-map.json").read_text(encoding="utf-8"))

lines = [
    "# SEO 維護總表（自動產生）",
    "",
    "更新方式：修改 `seo-map.json` 或 `scripts/seo_lib.py` 的 `PAGE_OG_OVERRIDES` 後執行 `npm run seo`。",
    "",
    "| page file | route | title | description | canonical | hero | og:image | schema | noindex |",
    "|---|---|---|---|---|---|---|---|---|",
]
for e in entries:
    lines.append(
        f"| `{e['page_file']}` | {e['route']} | {e['title'][:40]}… | {e['description'][:60]}… | {e['canonical']} | "
        f"`{e.get('hero_image','')[:50]}` | …{e['og_image'].split('/')[-1][:40]} | {e['schema_type']} | {e['noindex']} |"
    )
out = ROOT / "docs" / "SEO-MAINTENANCE.md"
out.parent.mkdir(exist_ok=True)
header = """# 靜態網站 SEO / OG / AI 維護說明

## 快速流程（新增或修改頁面）

1. 完成 HTML 內容與 hero 主圖（`<video poster="…">` 或 `.hero-bg` / `.hero-media img`）。
2. 每頁分享圖會由 hero／主圖產生為 `assets/images/og/*.jpg`；若來源需與 hero 不同，在 `scripts/seo_lib.py` 的 `PAGE_OG_OVERRIDES` 加入 `page_file → assets/...`。
3. 執行：

```bash
npm run seo
```

這會依序更新 SEO map、產生每頁 1200×630 OG 卡、寫入 HTML head、修正已知內部連結、重建 sitemap，最後輸出 SEO 與技術驗收報告。

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `config/seo-brand.json` | 品牌名稱、網域、theme-color、預設 OG 圖 |
| `seo-map.json` | 每頁 title / description / canonical / hero / og:image / schema |
| `scripts/seo_lib.py` | 共用邏輯與 per-page OG 覆寫表 |
| `scripts/build-seo-map.py` | 從 HTML 掃描並產生 seo-map |
| `scripts/apply-seo.py` | 將 meta / OG / Twitter / JSON-LD 寫入 HTML head |
| `scripts/generate-og-images.py` | 以每頁 hero／主圖產生獨立 1200×630 社群分享卡 |
| `scripts/audit-site-assets.py` | 掃描站內連結、圖片 alt、尺寸與大型媒體風險 |
| `robots.txt` / `sitemap.xml` / `llms.txt` | 爬蟲與 AI 指引 |

## 注意事項

- 正式頁面的 meta 必須在 HTML head 內，不依賴 JavaScript。
- `og:image` 使用 `https://camp.8-ways.com/assets/...` 絕對網址。
- 重新導向頁（`pages/*/index.html`）設為 `noindex`。
- 電話、GA4 等請更新 `config/seo-brand.json` 中的 TODO 欄位。

---

"""
out.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {out}")

# SEO 技術與媒體驗收

- HTML 頁面：**95**
- 站內失效參照：**0**
- 缺 alt 的圖片：**0**
- 缺 width/height 的圖片：**0**
- Hero 被 lazy-load：**0**
- 非描述性檔名：**0**
- 大型媒體風險：**7**

## Core Web Vitals 風險

- 首頁使用背景影片；已設定 poster 與 metadata preload，仍應定期控制影片位元率與檔案大小。
- 所有靜態內容圖片已補上實際 width/height；互動後才注入 src 的燈箱佔位元素不列入。
- 超過 1 MB 的圖片與超過 3 MB 的影片列於 JSON 報告，應優先轉 WebP/AVIF 或重新壓縮。

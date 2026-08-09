# SEO 100 項檢查驗收總表（自動產生）

- 總 HTML 頁數：**96**
- 可索引頁：**86**
- 共用 og:image 群組（indexable）：**0**
- 使用 default og 後備：**0**
- map 問題：**0**
- HTML head 問題：**0**

## 基礎檔案

- [x] brand_favicon
- [x] apple_touch_icon
- [x] site_webmanifest
- [x] robots_txt
- [x] sitemap_xml
- [x] llms_txt
- [x] seo_map_json
- [x] seo_brand_json
- [x] per_page_og
- [x] no_wikimedia_og
- [x] all_indexable_have_twitter

## 100 項逐項驗收

| # | 檢查項目 | 狀態 | 驗收說明 |
|---:|---|---|---|
| 1 | favicon.ico | 完成 | 根目錄已存在並逐頁引用 |
| 2 | SVG favicon | 不適用 | 專案沒有合適 SVG logo，保留 PNG/ICO 配置 |
| 3 | favicon link tags | 完成 | ICO 與 16/32px PNG 已直接寫入 head |
| 4 | apple-touch-icon | 完成 | 180×180 圖示已引用 |
| 5 | manifest 檔 | 完成 | site.webmanifest 已存在 |
| 6 | manifest 引用 | 完成 | 所有非轉址頁 head 直接引用 |
| 7 | theme-color | 完成 | 集中使用品牌森林綠 |
| 8 | logo alt | 完成 | 共用 header logo 有品牌描述 |
| 9 | 品牌名稱一致 | 完成 | 統一為揪好森 Joyforest |
| 10 | 品牌名稱集中管理 | 完成 | config/seo-brand.json |
| 11 | 每頁獨立 title | 完成 | 無重複 title |
| 12 | 每頁獨立 description | 完成 | 無缺漏、無重複 |
| 13 | 每頁獨立 canonical | 完成 | 皆為正式網域 |
| 14 | 每頁 og:url | 完成 | 與 canonical 對應 |
| 15 | 每頁 og:type | 完成 | 依 schema 分為 website/article |
| 16 | HTML lang | 完成 | 繁中、英文頁分別設定 |
| 17 | 每頁 H1 | 完成 | 正式內容頁皆有 H1；轉址頁不適用 |
| 18 | H2/H3 結構 | 部分完成 | 主要頁已整理；長篇既有文章保留人工語意複核 |
| 19 | title 重複 | 完成 | 掃描結果 0 組 |
| 20 | description 重複 | 完成 | 掃描結果 0 組 |
| 21 | 每頁 og:title | 完成 | 直接存在 HTML head |
| 22 | 每頁 og:description | 完成 | 直接存在 HTML head |
| 23 | 每頁 og:image | 完成 | 每個非轉址頁皆有專屬 1200×630 卡片 |
| 24 | 每頁 og:url | 完成 | 逐頁驗證 |
| 25 | twitter:card | 完成 | summary_large_image |
| 26 | twitter:title | 完成 | 與頁面 SEO 同步 |
| 27 | twitter:description | 完成 | 與頁面 SEO 同步 |
| 28 | twitter:image | 完成 | 逐頁專屬 |
| 29 | 寫死共用 og:image | 完成 | 已改為 per-page 產生流程 |
| 30 | 不同頁面不再同圖 | 完成 | 非轉址頁 91 張、唯一值 91 |
| 31 | hero 圖優先 | 完成 | 社群卡以 hero/頁面主圖為來源 |
| 32 | 專用 og:image | 完成 | assets/images/og 每頁獨立產生 |
| 33 | 選圖邏輯 | 完成 | hero → per-page override →品牌後備 |
| 34 | og:image 絕對網址 | 完成 | 正式網域絕對網址 |
| 35 | og:image 公開可讀 | 完成 | 本機檔案存在並隨站發布 |
| 36 | 圖片 404 | 完成 | OG 檔案磁碟檢查無缺漏 |
| 37 | 避免 lazy 小圖 | 完成 | 以 hero/主圖生成，不取輪播縮圖 |
| 38 | 多主圖選擇規則 | 完成 | 可用 PAGE_OG_OVERRIDES 指定來源 |
| 39 | 首頁專用 og:image | 完成 | 首頁獨立社群卡 |
| 40 | ogImage 欄位 | 完成 | seo-map.json 含 hero_image/og_image |
| 41 | 共用 SEO head | 完成 | 純 HTML 以 build-time script 統一寫入 |
| 42 | 共用欄位完整 | 完成 | title/description/canonical/OG/Twitter/robots/schema |
| 43 | per-page SEO 資料 | 完成 | seo-map.json |
| 44 | 獨立 title 維護 | 完成 | HTML 與 seo-map 同步 |
| 45 | 獨立 description 維護 | 完成 | HTML 與 seo-map 同步 |
| 46 | 獨立 hero/ogImage | 完成 | 生成與覆寫機制皆具備 |
| 47 | 獨立 canonical | 完成 | 逐頁資料欄位 |
| 48 | 獨立 noindex | 完成 | 404、轉址及內部管理頁已設定 |
| 49 | 獨立 schemaType | 完成 | WebSite/WebPage/Service/Article/FAQPage |
| 50 | 純 HTML 可維護 | 完成 | npm run seo 可重建完整 head |
| 51 | 正式頁 canonical | 完成 | 正式頁全數具備 |
| 52 | 正式網域 | 完成 | camp.8-ways.com |
| 53 | www/non-www | 完成 | 統一 non-www |
| 54 | HTTP/HTTPS | 完成 | SEO 正式網址全為 HTTPS |
| 55 | 尾斜線規則 | 完成 | 中文 .html、英文目錄式 URL，各自一致 |
| 56 | 相似頁 canonical | 完成 | 轉址鏡像指向正式 canonical |
| 57 | 內部連結格式 | 完成 | 站內失效參照 0 |
| 58 | 舊頁 redirect | 完成 | _redirects 與 HTML 轉址頁已存在 |
| 59 | sitemap/canonical | 完成 | sitemap 由 seo-map 產生 |
| 60 | query canonical | 完成 | canonical 不含查詢參數 |
| 61 | robots.txt | 完成 | 已建立並排除內部頁 |
| 62 | robots sitemap | 完成 | 已宣告 sitemap |
| 63 | sitemap.xml | 完成 | 自動產生 |
| 64 | sitemap 正式頁 | 完成 | 僅收錄 indexable 頁 |
| 65 | 排除重複頁 | 完成 | 轉址與 noindex 不進 sitemap |
| 66 | noindex 支援 | 完成 | meta robots + googlebot |
| 67 | 404.html | 完成 | 存在且 noindex |
| 68 | 薄內容頁 | 完成 | 內部工具與錯誤頁不索引 |
| 69 | staging/demo | 完成 | 未發現公開索引的 staging/demo 頁 |
| 70 | 死連結掃描 | 完成 | 剩餘 0 個 |
| 71 | Organization schema | 完成 | 首頁輸出 |
| 72 | LocalBusiness schema | 完成 | 首頁以 LodgingBusiness 輸出 |
| 73 | WebSite schema | 完成 | 首頁輸出 |
| 74 | WebPage schema | 完成 | 一般頁自動輸出 |
| 75 | Service schema | 完成 | 房型、活動與服務頁 |
| 76 | BreadcrumbList | 完成 | 有可見麵包屑的頁面同步輸出 JSON-LD |
| 77 | FAQPage | 完成 | 由可見 details/summary 內容建立 |
| 78 | Article/BlogPosting | 完成 | SEO 資訊頁使用 Article |
| 79 | ImageObject | 完成 | WebPage primaryImageOfPage |
| 80 | Schema 與頁面一致 | 完成 | 由頁面標題、摘要、圖片與 FAQ 內容產生 |
| 81 | 主要圖片 alt | 完成 | 缺 alt 0 |
| 82 | hero alt | 完成 | Hero 圖有主題描述；影片以 poster 呈現 |
| 83 | IMG_1234 命名 | 完成 | 風險 0 |
| 84 | 重要圖片命名 | 完成 | 主要素材使用描述性英文檔名 |
| 85 | 圖片尺寸合理 | 部分完成 | 大型媒體風險 7 |
| 86 | 首圖載入 | 完成 | lazy hero 0 |
| 87 | width/height | 完成 | 仍有 0 張內容圖待逐步補尺寸 |
| 88 | 壞圖修正 | 完成 | 失效本機參照 0 |
| 89 | WebP/AVIF | 部分完成 | 既有 JPG/PNG 與 WebP 混用；大型素材列入後續壓縮 |
| 90 | 圖片來源管理 | 完成 | hero/OG 來源記錄於 seo-map |
| 91 | llms.txt | 完成 | 根目錄已建立 |
| 92 | llms.txt 結構 | 完成 | 品牌、用途、重要頁與服務皆列出 |
| 93 | 頁面摘要 | 完成 | 主要頁第一屏具文字摘要 |
| 94 | 關鍵資訊 HTML | 完成 | 服務、FAQ、流程與聯絡均非圖片文字 |
| 95 | AI 品牌理解 | 完成 | 品牌、服務區域與聯絡方式清楚 |
| 96 | 內部連結 | 完成 | 主要服務與指南互連 |
| 97 | 跨裝置 head | 完成 | 靜態 HTML 對手機桌面輸出一致 |
| 98 | CWV 風險 | 完成 | docs/SEO-TECHNICAL-AUDIT.md |
| 99 | analytics 預留 | 部分完成 | 已保留 GA4/GTM TODO，尚未提供追蹤 ID |
| 100 | 維護總表 | 完成 | docs/SEO-MAINTENANCE.md + seo-map.json |

## 主要頁面 SEO 總表

| route | title | og:image | schema | noindex |
|---|---|---|---|---|
| / | 桃園楊梅森林裡的少帳包場豪華露營｜揪好森 Joyforest… | `index.jpg` | WebSite | False |
| /en/ | Joyforest Taiwan Forest Glamping… | `en-index.jpg` | WebSite | False |
| /en/pages/availability/ | Check Availability｜Joyforest Tao… | `en-pages-availability-index.jpg` | WebPage | False |
| /en/pages/balloon-tent-karaoke-guide/ | Balloon Tent Karaoke Guide | App… | `en-pages-balloon-tent-karaoke-guide-` | Service | False |
| /en/pages/balloon-tent/ | Balloon Tent｜Private Forest Glam… | `en-pages-balloon-tent-index.jpg` | Service | False |
| /en/pages/cloud-tent/ | Cloud Tent｜Forest View Bathtub G… | `en-pages-cloud-tent-index.jpg` | Service | False |
| /en/pages/family-photography-party/ | Family Photography × Private For… | `en-pages-family-photography-party-in` | Service | False |
| /en/pages/forest-graduation-photo/ | Forest Graduation Photography｜Jo… | `en-pages-forest-graduation-photo-ind` | Service | False |
| /en/pages/party-event-space/ | Private Forest Party Venue in Ta… | `en-pages-party-event-space-index.jpg` | Service | False |
| /en/pages/pet-photography-party/ | Pet Photography × Private Forest… | `en-pages-pet-photography-party-index` | Service | False |
| /en/seo/ | Taiwan Camping and Glamping Trav… | `en-seo-index.jpg` | WebPage | False |
| /en/seo/beginner-camping/ | Beginner Camping Guide | First O… | `en-seo-beginner-camping-index.jpg` | Article | False |
| /en/seo/campervan-travel/ | Campervan Travel Guide | Who Cam… | `en-seo-campervan-travel-index.jpg` | Article | False |
| /en/seo/camping-gear/ | Camping Gear Guide | Essentials … | `en-seo-camping-gear-index.jpg` | Article | False |
| /en/seo/camping-photo-tips/ | Camping Photo Tips | Better Outd… | `en-seo-camping-photo-tips-index.jpg` | Article | False |
| /en/seo/camping-with-pets/ | Camping with Pets | Safety, Etiq… | `en-seo-camping-with-pets-index.jpg` | Article | False |
| /en/seo/choose-campsite/ | How to Choose a Campsite | Pract… | `en-seo-choose-campsite-index.jpg` | Article | False |
| /en/seo/common-camping-questions/ | Common Camping Questions | Pract… | `en-seo-common-camping-questions-inde` | Article | False |
| /en/seo/easy-yangmei-outdoor-trips/ | Easy Yangmei Outdoor Trips | Low… | `en-seo-easy-yangmei-outdoor-trips-in` | Article | False |
| /en/seo/family-camping-planning/ | Family Camping Planning | Easier… | `en-seo-family-camping-planning-index` | Article | False |
| /en/seo/family-camping/ | Family Camping Guide | Child-Fri… | `en-seo-family-camping-index.jpg` | Article | False |
| /en/seo/first-camping-trip/ | First Camping Trip Checklist | B… | `en-seo-first-camping-trip-index.jpg` | Article | False |
| /en/seo/forest-event-space/ | Forest Event Space Guide | Why O… | `en-seo-forest-event-space-index.jpg` | Article | False |
| /en/seo/forest-outdoor-experience/ | Forest Outdoor Experience Guide … | `en-seo-forest-outdoor-experience-ind` | Article | False |
| /en/seo/glamping-guide/ | Taiwan Glamping Guide | Compare … | `en-seo-glamping-guide-index.jpg` | Article | False |
| /en/seo/glamping-vs-camping/ | Glamping vs Camping | Which Styl… | `en-seo-glamping-vs-camping-index.jpg` | Article | False |
| /en/seo/nearby-attractions/ | Nearby Attractions Guide | Outdo… | `en-seo-nearby-attractions-index.jpg` | Article | False |
| /en/seo/night-camping-atmosphere/ | Night Camping Atmosphere Guide |… | `en-seo-night-camping-atmosphere-inde` | Article | False |
| /en/seo/night-outdoor-atmosphere/ | Night Outdoor Atmosphere | Light… | `en-seo-night-outdoor-atmosphere-inde` | Article | False |
| /en/seo/one-day-vs-overnight-event/ | One-Day vs Overnight Event | How… | `en-seo-one-day-vs-overnight-event-in` | Article | False |
| /en/seo/outdoor-vs-indoor-gathering/ | Outdoor vs Indoor Gathering | Ve… | `en-seo-outdoor-vs-indoor-gathering-i` | Article | False |
| /en/seo/pet-friendly-camping/ | Pet-Friendly Camping Guide | Out… | `en-seo-pet-friendly-camping-index.jp` | Article | False |
| /en/seo/small-private-event-planning/ | Small Private Event Planning | O… | `en-seo-small-private-event-planning-` | Article | False |
| /en/seo/taoyuan-camping/ | Taoyuan Camping Guide | Quiet Fo… | `en-seo-taoyuan-camping-index.jpg` | Article | False |
| /en/seo/taoyuan-outdoor-activities/ | Taoyuan Outdoor Activities | Wee… | `en-seo-taoyuan-outdoor-activities-in` | Article | False |
| /en/seo/types-of-camping-taoyuan/ | Types of Camping in Taoyuan | Fo… | `en-seo-types-of-camping-taoyuan-inde` | Article | False |
| /en/seo/who-campervan-travel/ | Who Campervan Travel Fits | Free… | `en-seo-who-campervan-travel-index.jp` | Article | False |
| /en/seo/yangmei-camping/ | Yangmei Camping Guide | Easy-Acc… | `en-seo-yangmei-camping-index.jpg` | Article | False |
| /hk/ | 香港旅客台灣豪華露營推薦｜桃園森林包場 Glamping｜揪好森… | `hk-index.jpg` | WebPage | False |
| /pages/availability.html | 查詢空房｜房型預約參考｜camp.8-ways.com… | `pages-availability.jpg` | WebPage | False |
| /pages/balloon-tent-karaoke-guide.html | 熱氣球房卡拉OK使用說明｜Apple TV 唱歌・JBL 喇叭麥… | `pages-balloon-tent-karaoke-guide.jpg` | Service | False |
| /pages/balloon-tent-tv-guide.html | 熱氣球房電視使用說明｜Apple TV・Switch 2｜揪好森… | `pages-balloon-tent-tv-guide.jpg` | WebPage | False |
| /pages/balloon-tent.html | 熱氣球房｜桃園 4–6 人包場豪華露營｜森林住宿・兩天一夜｜揪好… | `pages-balloon-tent.jpg` | Service | False |
| /pages/booking.html | 預約方式｜查詢日期、房型與付款流程｜揪好森… | `pages-booking.jpg` | WebPage | False |
| /pages/campervan.html | 露營車住宿與自駕旅行體驗｜camp.8-ways.com… | `pages-campervan.jpg` | Service | False |
| /pages/cloud-tent-projector-guide.html | 雲朵房投影機使用說明｜手機投屏・藍牙喇叭｜揪好森… | `pages-cloud-tent-projector-guide.jpg` | WebPage | False |
| /pages/cloud-tent.html | 雲朵房｜桃園豪華露營・包場露營森林住宿・景觀浴缸｜揪好森… | `pages-cloud-tent.jpg` | Service | False |
| /pages/facilities.html | 設施與使用｜戶外廚房・景觀浴缸・投影・Switch｜揪好森… | `pages-facilities.jpg` | Service | False |
| /pages/family-photography-party | 桃園親子攝影包場｜200坪森林草地・家庭寫真・聚餐烤肉可住宿｜揪… | `pages-family-photography-party.jpg` | Service | False |
| /pages/faq.html | 常見問題 FAQ｜預約、付款、交通與香港旅客資訊｜揪好森… | `pages-faq.jpg` | FAQPage | False |
| /pages/forest-graduation-photo | 森林系畢業寫真｜揪好森露營區 × 小巴老師｜桃園畢業照・家庭照・… | `pages-forest-graduation-photo.jpg` | Service | False |
| /pages/location.html | 交通方式、停車資訊與附近生活機能｜桃園楊梅露營區｜揪好森 Joy… | `pages-location.jpg` | WebPage | False |
| /pages/party-event-space.html | 桃園派對活動場地｜戶外電影・美式烤肉・KTV・森林草地包場｜揪好… | `pages-party-event-space.jpg` | Service | False |
| /pages/pet-photography-party | 桃園寵物攝影包場｜200坪森林草地攝影棚・寵物聚會・可住宿｜揪好… | `pages-pet-photography-party.jpg` | Service | False |
| /pages/summer-mosquito-prevention.html | 夏季防蚊措施｜防蚊液・蚊香・電風扇｜揪好森 Joyforest… | `pages-summer-mosquito-prevention.jpg` | WebPage | False |
| /reviews/ | 揪好森旅人真實評價｜森林系包場體驗、家庭聚會與好友旅行回饋… | `reviews-index.jpg` | WebPage | False |
| /seo/ | 旅遊露營指南（權威版）｜桃園楊梅・豪華露營・新手裝備與戶外知識｜… | `seo-index.jpg` | WebPage | False |
| /seo/beginner-camping.html | 露營新手入門｜第一次出發的心理與實務準備｜camp.8-ways… | `seo-beginner-camping.jpg` | Article | False |
| /seo/campervan-stay.html | 桃園露營車住宿推薦｜露營之外，另一種更自由的旅居方式｜camp.… | `seo-campervan-stay.jpg` | Article | False |
| /seo/camping-gear.html | 露營裝備整理｜必帶、選配與季節｜豪華露營可精簡｜camp.8-w… | `seo-camping-gear.jpg` | Article | False |
| /seo/dome-glamping.html | 圓頂帳篷露營介紹｜比一般帳篷更舒適的森林住宿方式｜camp.8-… | `seo-dome-glamping.jpg` | Article | False |
| /seo/family-camping.html | 親子露營指南｜行程節奏、安全與睡眠｜桃園楊梅露營｜camp.8-… | `seo-family-camping.jpg` | Article | False |
| /seo/forest-activities.html | 森林系活動與戶外體驗｜慢下來的感官｜桃園露營｜camp.8-wa… | `seo-forest-activities.jpg` | Article | False |
| /seo/forest-camping.html | 桃園森林露營體驗｜在樹林與草地之間，住進慢下來的生活｜camp.… | `seo-forest-camping.jpg` | Article | False |
| /seo/guide/campervan-who.html | 露營車旅行適合什麼樣的人？自由度與過夜型態｜camp.8-way… | `seo-guide-campervan-who.jpg` | Article | False |
| /seo/guide/camping-faq-general.html | 露營常見問題整理（觀念篇）｜與營區 FAQ 互補｜camp.8-… | `seo-guide-camping-faq-general.jpg` | Article | False |
| /seo/guide/camping-photo-tips.html | 露營拍照怎麼拍更好看？光線、構圖與生活感｜camp.8-ways… | `seo-guide-camping-photo-tips.jpg` | Article | False |
| /seo/guide/family-camping-easier.html | 親子露營怎麼安排更輕鬆？作息與餐點｜camp.8-ways.co… | `seo-guide-family-camping-easier.jpg` | Article | False |
| /seo/guide/first-camping-prep.html | 第一次露營要準備什麼？清單與心態｜桃園露營指南｜camp.8-w… | `seo-guide-first-camping-prep.jpg` | Article | False |
| /seo/guide/forest-space-charm.html | 森林系活動空間有什麼魅力？聲音、光線與距離｜camp.8-way… | `seo-guide-forest-space-charm.jpg` | Article | False |
| /seo/guide/glamping-vs-camping.html | 豪華露營與一般露營差在哪？力氣、成本與體驗｜camp.8-way… | `seo-guide-glamping-vs-camping.jpg` | Article | False |
| /seo/guide/how-to-choose-campsite.html | 怎麼挑選適合自己的露營區？人數、隱私與動線｜camp.8-way… | `seo-guide-how-to-choose-campsite.jpg` | Article | False |
| /seo/guide/night-outdoor-mood.html | 夜間戶外氛圍怎麼營造？燈光、座位與音量｜camp.8-ways.… | `seo-guide-night-outdoor-mood.jpg` | Article | False |
| /seo/guide/one-day-vs-overnight.html | 一日戶外活動與兩天一夜差在哪？體力與儀式感｜camp.8-way… | `seo-guide-one-day-vs-overnight.jpg` | Article | False |
| /seo/guide/outdoor-vs-indoor-gathering.html | 戶外聚會與室內聚會差異｜天候、動線與服務｜camp.8-ways… | `seo-guide-outdoor-vs-indoor-gatherin` | Article | False |
| /seo/guide/pet-camping-notes.html | 帶寵物露營前要知道的事｜禮儀與安全｜camp.8-ways.co… | `seo-guide-pet-camping-notes.jpg` | Article | False |
| /seo/guide/small-group-events.html | 小型包場活動適合怎麼規劃？人數、動線與留白｜camp.8-way… | `seo-guide-small-group-events.jpg` | Article | False |
| /seo/guide/taoyuan-camping-types.html | 桃園露營有哪些類型？山線、海岸與豪華露營｜camp.8-ways… | `seo-guide-taoyuan-camping-types.jpg` | Article | False |
| /seo/guide/weekend-outdoor-taoyuan.html | 桃園出發的週末戶外靈感｜一日與兩天一夜｜camp.8-ways.… | `seo-guide-weekend-outdoor-taoyuan.jp` | Article | False |
| /seo/guide/yangmei-easy-outings.html | 楊梅附近輕鬆出遊的露營玩法｜慢節奏靈感｜camp.8-ways.… | `seo-guide-yangmei-easy-outings.jpg` | Article | False |
| /seo/nearby-attractions.html | 周邊景點與行程靈感｜桃園楊梅出發｜露營旅遊｜camp.8-way… | `seo-nearby-attractions.jpg` | Article | False |
| /seo/night-outdoor.html | 夜間露營與戶外氛圍｜燈光、餐酒與聊天節奏｜camp.8-ways… | `seo-night-outdoor.jpg` | Article | False |
| /seo/pet-friendly-camping.html | 寵物友善露營整理｜出發前該想好的事｜桃園露營｜camp.8-wa… | `seo-pet-friendly-camping.jpg` | Article | False |
| /seo/taoyuan-camping.html | 桃園露營區推薦｜想找安靜又有空間感的森林露營體驗｜camp.8-… | `seo-taoyuan-camping.jpg` | Article | False |
| /seo/taoyuan-glamping.html | 桃園豪華露營推薦｜比住飯店更接近自然，比傳統露營更舒服｜camp… | `seo-taoyuan-glamping.jpg` | Article | False |
| /seo/yangmei-camping.html | 楊梅露營區推薦｜交通方便，卻像包下一整片森林｜camp.8-wa… | `seo-yangmei-camping.jpg` | Article | False |

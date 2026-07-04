# 靜態網站 SEO / OG / AI 維護說明

## 快速流程（新增或修改頁面）

1. 完成 HTML 內容與 hero 主圖（`<video poster="…">` 或 `.hero-bg` / `.hero-media img`）。
2. 若分享圖需與 hero 不同，在 `scripts/seo_lib.py` 的 `PAGE_OG_OVERRIDES` 加入 `page_file → assets/...`。
3. 執行：

```bash
npm run seo
```

這會依序：`build-seo-map` → `apply-seo` → `generate-sitemap` → `audit-seo`。

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `config/seo-brand.json` | 品牌名稱、網域、theme-color、預設 OG 圖 |
| `seo-map.json` | 每頁 title / description / canonical / hero / og:image / schema |
| `scripts/seo_lib.py` | 共用邏輯與 per-page OG 覆寫表 |
| `scripts/build-seo-map.py` | 從 HTML 掃描並產生 seo-map |
| `scripts/apply-seo.py` | 將 meta / OG / Twitter / JSON-LD 寫入 HTML head |
| `robots.txt` / `sitemap.xml` / `llms.txt` | 爬蟲與 AI 指引 |

## 注意事項

- 正式頁面的 meta 必須在 HTML head 內，不依賴 JavaScript。
- `og:image` 使用 `https://camp.8-ways.com/assets/...` 絕對網址。
- 重新導向頁（`pages/*/index.html`）設為 `noindex`。
- 電話、GA4 等請更新 `config/seo-brand.json` 中的 TODO 欄位。

---

# SEO 維護總表（自動產生）

更新方式：修改 `seo-map.json` 或 `scripts/seo_lib.py` 的 `PAGE_OG_OVERRIDES` 後執行 `npm run seo`。

| page file | route | title | canonical | hero | og:image | schema | noindex |
|---|---|---|---|---|---|---|---|
| `404.html` | /404.html | 找不到頁面｜揪好森 Joyforest… | https://camp.8-ways.com/404.html | `` | …joyforest-forest-aerial-view.jpg | WebPage | True |
| `en/index.html` | /en/ | Joyforest Taiwan Forest Glamping｜Private… | https://camp.8-ways.com/en/ | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-night-glamping-lights.jpg | WebSite | False |
| `en/pages/availability/index.html` | /en/pages/availability/ | Check Availability｜Joyforest Taoyuan Gla… | https://camp.8-ways.com/en/pages/availability/ | `en/assets/images/index/taoyuan-glamping-exclusive-` | …taoyuan-glamping-campsite-view.jpg | WebPage | False |
| `en/pages/balloon-tent-karaoke-guide/index.html` | /en/pages/balloon-tent-karaoke-guide/ | Balloon Tent Karaoke Guide | Apple Music… | https://camp.8-ways.com/en/pages/balloon-tent-karaoke-guide/ | `assets/images/karaoke-experience/apple-tv-siri-rem` | …balloon-tent-karaoke-kids-singing-microp | Service | False |
| `en/pages/balloon-tent/index.html` | /en/pages/balloon-tent/ | Balloon Tent｜Private Forest Glamping Dom… | https://camp.8-ways.com/en/pages/balloon-tent/ | `en/assets/images/balloon-tent/balloon-tent-exclusi` | …balloon-tent-exclusive-lawn-outdoor-kitc | Service | False |
| `en/pages/cloud-tent/index.html` | /en/pages/cloud-tent/ | Cloud Tent｜Forest View Bathtub Glamping … | https://camp.8-ways.com/en/pages/cloud-tent/ | `en/assets/images/camp-intro/taoyuan-yangmei-joyfor` | …taoyuan-yangmei-joyforest-glamping-ballo | Service | False |
| `en/pages/family-photography-party/index.html` | /en/pages/family-photography-party/ | Family Photography × Private Forest Venu… | https://camp.8-ways.com/en/pages/family-photography-party/ | `assets/images/family-photography-party/parent-chil` | …og-family-photography-party.jpg | Service | False |
| `en/pages/forest-graduation-photo/index.html` | /en/pages/forest-graduation-photo/ | Forest Graduation Photography｜Joyforest … | https://camp.8-ways.com/en/pages/forest-graduation-photo/ | `assets/images/forest-graduation/forest-graduation-` | …forest-graduation-kids-camping-hero.jpg | Service | False |
| `en/pages/party-event-space/index.html` | /en/pages/party-event-space/ | Private Forest Party Venue in Taoyuan｜Ou… | https://camp.8-ways.com/en/pages/party-event-space/ | `assets/images/cinema-experience/joyforest-outdoor-` | …joyforest-outdoor-cinema-night-lawn-ligh | Service | False |
| `en/pages/pet-photography-party/index.html` | /en/pages/pet-photography-party/ | Pet Photography × Private Forest Venue｜J… | https://camp.8-ways.com/en/pages/pet-photography-party/ | `assets/images/pet-photography-party/pet-photograph` | …og-pet-photography-party.jpg | Service | False |
| `en/seo/beginner-camping/index.html` | /en/seo/beginner-camping/ | Beginner Camping Guide | First Outdoor S… | https://camp.8-ways.com/en/seo/beginner-camping/ | `assets/images/index/taoyuan-glamping-lazy-camping.` | …taoyuan-glamping-lazy-camping.jpg | Article | False |
| `en/seo/campervan-travel/index.html` | /en/seo/campervan-travel/ | Campervan Travel Guide | Who Campervan T… | https://camp.8-ways.com/en/seo/campervan-travel/ | `assets/images/campervan/taoyuan-glamping-campsite-` | …taoyuan-glamping-campsite-view.jpg | Article | False |
| `en/seo/camping-gear/index.html` | /en/seo/camping-gear/ | Camping Gear Guide | Essentials and Smar… | https://camp.8-ways.com/en/seo/camping-gear/ | `assets/images/index/dome-tent-glamping-space.jpg` | …dome-tent-glamping-space.jpg | Article | False |
| `en/seo/camping-photo-tips/index.html` | /en/seo/camping-photo-tips/ | Camping Photo Tips | Better Outdoor Phot… | https://camp.8-ways.com/en/seo/camping-photo-tips/ | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-night-glamping-lights.jpg | Article | False |
| `en/seo/camping-with-pets/index.html` | /en/seo/camping-with-pets/ | Camping with Pets | Safety, Etiquette, a… | https://camp.8-ways.com/en/seo/camping-with-pets/ | `assets/images/pet-photography-party/og-pet-photogr` | …og-pet-photography-party.jpg | Article | False |
| `en/seo/choose-campsite/index.html` | /en/seo/choose-campsite/ | How to Choose a Campsite | Practical Dec… | https://camp.8-ways.com/en/seo/choose-campsite/ | `assets/images/index/taoyuan-yangmei-glamping-site-` | …taoyuan-yangmei-glamping-site-layout-thr | Article | False |
| `en/seo/common-camping-questions/index.html` | /en/seo/common-camping-questions/ | Common Camping Questions | Practical Sta… | https://camp.8-ways.com/en/seo/common-camping-questions/ | `assets/images/index/taoyuan-forest-camping-scene.j` | …taoyuan-forest-camping-scene.jpg | FAQPage | False |
| `en/seo/easy-yangmei-outdoor-trips/index.html` | /en/seo/easy-yangmei-outdoor-trips/ | Easy Yangmei Outdoor Trips | Low-Stress … | https://camp.8-ways.com/en/seo/easy-yangmei-outdoor-trips/ | `assets/images/index/yangmei-camping-convenient-loc` | …yangmei-camping-convenient-location.jpg | Article | False |
| `en/seo/family-camping-planning/index.html` | /en/seo/family-camping-planning/ | Family Camping Planning | Easier Outdoor… | https://camp.8-ways.com/en/seo/family-camping-planning/ | `assets/images/family-photography-party/parent-chil` | …parent-child-photography-joyforest-famil | Article | False |
| `en/seo/family-camping/index.html` | /en/seo/family-camping/ | Family Camping Guide | Child-Friendly Ou… | https://camp.8-ways.com/en/seo/family-camping/ | `assets/images/experience-refresh/joyforest-night-p` | …joyforest-night-party-glamping-overview. | Article | False |
| `en/seo/first-camping-trip/index.html` | /en/seo/first-camping-trip/ | First Camping Trip Checklist | Beginner … | https://camp.8-ways.com/en/seo/first-camping-trip/ | `assets/images/index/yangmei-forest-lazy-camping.jp` | …yangmei-forest-lazy-camping.jpg | Article | False |
| `en/seo/forest-event-space/index.html` | /en/seo/forest-event-space/ | Forest Event Space Guide | Why Outdoor V… | https://camp.8-ways.com/en/seo/forest-event-space/ | `assets/images/party-highlights/joyforest-night-par` | …joyforest-night-party-bbq-family-pet-fri | Article | False |
| `en/seo/forest-outdoor-experience/index.html` | /en/seo/forest-outdoor-experience/ | Forest Outdoor Experience Guide | Activi… | https://camp.8-ways.com/en/seo/forest-outdoor-experience/ | `assets/images/experience-refresh/joyforest-garden-` | …joyforest-garden-party-house.jpg | Article | False |
| `en/seo/glamping-guide/index.html` | /en/seo/glamping-guide/ | Taiwan Glamping Guide | Compare Glamping… | https://camp.8-ways.com/en/seo/glamping-guide/ | `assets/images/index/taoyuan-glamping-exclusive-gra` | …taoyuan-glamping-exclusive-grass-100ping | Article | False |
| `en/seo/glamping-vs-camping/index.html` | /en/seo/glamping-vs-camping/ | Glamping vs Camping | Which Style Fits Y… | https://camp.8-ways.com/en/seo/glamping-vs-camping/ | `assets/images/cloud-tent/cloud-tent-interior-frees` | …cloud-tent-interior-freestanding-bathtub | Article | False |
| `en/seo/index.html` | /en/seo/ | Taiwan Camping and Glamping Travel Guide… | https://camp.8-ways.com/en/seo/ | `assets/images/index/taoyuan-glamping-forest-dome-h` | …taoyuan-glamping-forest-dome-hero.jpg | WebPage | False |
| `en/seo/nearby-attractions/index.html` | /en/seo/nearby-attractions/ | Nearby Attractions Guide | Outdoor Route… | https://camp.8-ways.com/en/seo/nearby-attractions/ | `assets/images/index/yangmei-camping-convenient-loc` | …yangmei-camping-convenient-location.jpg | Article | False |
| `en/seo/night-camping-atmosphere/index.html` | /en/seo/night-camping-atmosphere/ | Night Camping Atmosphere Guide | Lightin… | https://camp.8-ways.com/en/seo/night-camping-atmosphere/ | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-night-glamping-lights.jpg | Article | False |
| `en/seo/night-outdoor-atmosphere/index.html` | /en/seo/night-outdoor-atmosphere/ | Night Outdoor Atmosphere | Lighting and … | https://camp.8-ways.com/en/seo/night-outdoor-atmosphere/ | `assets/images/cinema-experience/joyforest-outdoor-` | …joyforest-outdoor-movie-night-string-lig | Article | False |
| `en/seo/one-day-vs-overnight-event/index.html` | /en/seo/one-day-vs-overnight-event/ | One-Day vs Overnight Event | How to Deci… | https://camp.8-ways.com/en/seo/one-day-vs-overnight-event/ | `assets/images/experience-refresh/joyforest-firepit` | …joyforest-firepit-sparkler-night.jpg | Article | False |
| `en/seo/outdoor-vs-indoor-gathering/index.html` | /en/seo/outdoor-vs-indoor-gathering/ | Outdoor vs Indoor Gathering | Venue Trad… | https://camp.8-ways.com/en/seo/outdoor-vs-indoor-gathering/ | `assets/images/party-highlights/joyforest-american-` | …joyforest-american-bbq-grill-lawn.jpg | Article | False |
| `en/seo/pet-friendly-camping/index.html` | /en/seo/pet-friendly-camping/ | Pet-Friendly Camping Guide | Outdoor Tri… | https://camp.8-ways.com/en/seo/pet-friendly-camping/ | `assets/images/experience-refresh/joyforest-pet-par` | …joyforest-pet-party-picnic.jpg | Article | False |
| `en/seo/small-private-event-planning/index.html` | /en/seo/small-private-event-planning/ | Small Private Event Planning | Outdoor F… | https://camp.8-ways.com/en/seo/small-private-event-planning/ | `assets/images/experience-refresh/joyforest-round-t` | …joyforest-round-table-party.jpg | Article | False |
| `en/seo/taoyuan-camping/index.html` | /en/seo/taoyuan-camping/ | Taoyuan Camping Guide | Quiet Forest Cam… | https://camp.8-ways.com/en/seo/taoyuan-camping/ | `assets/images/index/taoyuan-private-campsite-glamp` | …taoyuan-private-campsite-glamping.jpg | Article | False |
| `en/seo/taoyuan-outdoor-activities/index.html` | /en/seo/taoyuan-outdoor-activities/ | Taoyuan Outdoor Activities | Weekend Nat… | https://camp.8-ways.com/en/seo/taoyuan-outdoor-activities/ | `assets/images/index/yangmei-glamping-dome-tent.png` | …yangmei-glamping-dome-tent.png | Article | False |
| `en/seo/types-of-camping-taoyuan/index.html` | /en/seo/types-of-camping-taoyuan/ | Types of Camping in Taoyuan | Format Com… | https://camp.8-ways.com/en/seo/types-of-camping-taoyuan/ | `assets/images/index/forest-camping-dome-tent.jpg` | …forest-camping-dome-tent.jpg | Article | False |
| `en/seo/who-campervan-travel/index.html` | /en/seo/who-campervan-travel/ | Who Campervan Travel Fits | Freedom, Cos… | https://camp.8-ways.com/en/seo/who-campervan-travel/ | `assets/images/campervan/taoyuan-glamping-campsite-` | …taoyuan-glamping-campsite-view.jpg | Article | False |
| `en/seo/yangmei-camping/index.html` | /en/seo/yangmei-camping/ | Yangmei Camping Guide | Easy-Access Fore… | https://camp.8-ways.com/en/seo/yangmei-camping/ | `assets/images/index/yangmei-forest-camping-view.jp` | …yangmei-forest-camping-view.jpg | Article | False |
| `hk/index.html` | /hk/ | 香港旅客台灣豪華露營推薦｜桃園森林包場 Glamping｜揪好森 Joyfore… | https://camp.8-ways.com/hk/ | `assets/images/index/taoyuan-glamping-exclusive-gra` | …joyforest-balloon-tent-private-lawn.jpg | WebPage | False |
| `index.html` | / | 桃園楊梅森林裡的少帳包場豪華露營｜揪好森 Joyforest… | https://camp.8-ways.com/ | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-forest-aerial-view.jpg | WebSite | False |
| `pages/availability.html` | /pages/availability.html | 查詢空房｜房型預約參考｜camp.8-ways.com… | https://camp.8-ways.com/pages/availability.html | `assets/images/index/taoyuan-glamping-exclusive-gra` | …taoyuan-glamping-campsite-view.jpg | WebPage | False |
| `pages/availability/index.html` | /pages/availability.html | 查詢空房｜房型預約參考｜camp.8-ways.com… | https://camp.8-ways.com/pages/availability.html | `assets/images/index/taoyuan-glamping-exclusive-gra` | …taoyuan-glamping-campsite-view.jpg | WebPage | True |
| `pages/balloon-tent-karaoke-guide.html` | /pages/balloon-tent-karaoke-guide.html | 熱氣球房卡拉OK使用說明｜Apple Music 唱歌・無線麥克風｜揪好森… | https://camp.8-ways.com/pages/balloon-tent-karaoke-guide.html | `assets/images/karaoke-experience/apple-tv-siri-rem` | …balloon-tent-karaoke-adult-singing-tv-ly | Service | False |
| `pages/balloon-tent-karaoke-guide/index.html` | /pages/balloon-tent-karaoke-guide.html | 熱氣球房卡拉OK使用說明｜Apple Music 唱歌・無線麥克風｜揪好森… | https://camp.8-ways.com/pages/balloon-tent-karaoke-guide.html | `assets/images/karaoke-experience/apple-tv-siri-rem` | …balloon-tent-karaoke-adult-singing-tv-ly | WebPage | True |
| `pages/balloon-tent.html` | /pages/balloon-tent.html | 熱氣球房｜桃園 4–6 人包場豪華露營｜森林住宿・兩天一夜｜揪好森… | https://camp.8-ways.com/pages/balloon-tent.html | `assets/images/balloon-tent/balloon-tent-exclusive-` | …balloon-tent-exclusive-lawn-outdoor-kitc | Service | False |
| `pages/balloon-tent/index.html` | /pages/balloon-tent.html | 熱氣球房｜桃園 4–6 人包場豪華露營｜森林住宿・兩天一夜｜揪好森… | https://camp.8-ways.com/pages/balloon-tent.html | `assets/images/balloon-tent/balloon-tent-exclusive-` | …balloon-tent-exclusive-lawn-outdoor-kitc | WebPage | True |
| `pages/booking.html` | /pages/booking.html | 預約方式｜查詢日期、房型與付款流程｜揪好森… | https://camp.8-ways.com/pages/booking.html | `assets/images/index/taoyuan-glamping-exclusive-gra` | …taoyuan-glamping-booking-campsite.jpg | WebPage | False |
| `pages/campervan.html` | /pages/campervan.html | 露營車住宿與自駕旅行體驗｜camp.8-ways.com… | https://camp.8-ways.com/pages/campervan.html | `assets/images/campervan/taoyuan-glamping-campsite-` | …taoyuan-glamping-campsite-view.jpg | Service | False |
| `pages/cloud-tent.html` | /pages/cloud-tent.html | 雲朵房｜桃園豪華露營・包場露營森林住宿・景觀浴缸｜揪好森… | https://camp.8-ways.com/pages/cloud-tent.html | `assets/images/cloud-tent/taoyuan-yangmei-cloud-ten` | …taoyuan-yangmei-cloud-tent-aerial-balloo | Service | False |
| `pages/cloud-tent/index.html` | /pages/cloud-tent.html | 雲朵房｜桃園豪華露營・包場露營森林住宿・景觀浴缸｜揪好森… | https://camp.8-ways.com/pages/cloud-tent.html | `assets/images/cloud-tent/taoyuan-yangmei-cloud-ten` | …taoyuan-yangmei-cloud-tent-aerial-balloo | WebPage | True |
| `pages/family-photography-party.html` | /pages/family-photography-party | 桃園親子攝影包場｜200坪森林草地・家庭寫真・聚餐烤肉可住宿｜揪好森 × 小巴老… | https://camp.8-ways.com/pages/family-photography-party | `assets/images/family-photography-party/parent-chil` | …og-family-photography-party.jpg | Service | False |
| `pages/faq.html` | /pages/faq.html | 常見問題 FAQ｜預約、付款、交通與香港旅客資訊｜揪好森… | https://camp.8-ways.com/pages/faq.html | `` | …taoyuan-forest-camping-scene.jpg | FAQPage | False |
| `pages/forest-graduation-photo.html` | /pages/forest-graduation-photo | 森林系畢業寫真｜揪好森露營區 × 小巴老師｜桃園畢業照・家庭照・露營風拍攝… | https://camp.8-ways.com/pages/forest-graduation-photo | `assets/images/forest-graduation/forest-graduation-` | …forest-graduation-kids-camping-hero.jpg | Service | False |
| `pages/location.html` | /pages/location.html | 交通方式、停車資訊與附近生活機能｜桃園楊梅露營區｜揪好森 Joyforest… | https://camp.8-ways.com/pages/location.html | `assets/images/location/taoyuan-yangmei-location-tr` | …taoyuan-yangmei-location-traffic-map.jpg | WebPage | False |
| `pages/party-event-space.html` | /pages/party-event-space.html | 桃園派對活動場地｜戶外電影・美式烤肉・KTV・森林草地包場｜揪好森 Joyfor… | https://camp.8-ways.com/pages/party-event-space.html | `assets/images/cinema-experience/joyforest-outdoor-` | …joyforest-night-party-bbq-family-pet-fri | Service | False |
| `pages/party-event-space/index.html` | /pages/party-event-space.html | 桃園派對活動場地｜戶外電影・美式烤肉・KTV・森林草地包場｜揪好森 Joyfor… | https://camp.8-ways.com/pages/party-event-space.html | `assets/images/cinema-experience/joyforest-outdoor-` | …joyforest-night-party-bbq-family-pet-fri | WebPage | True |
| `pages/pet-photography-party.html` | /pages/pet-photography-party | 桃園寵物攝影包場｜200坪森林草地攝影棚・寵物聚會・可住宿｜揪好森 × 小巴老師… | https://camp.8-ways.com/pages/pet-photography-party | `assets/images/pet-photography-party/pet-photograph` | …og-pet-photography-party.jpg | Service | False |
| `reviews/index.html` | /reviews/ | 揪好森旅人真實評價｜森林系包場體驗、家庭聚會與好友旅行回饋… | https://camp.8-ways.com/reviews/ | `` | …review-forest-secret-small-group-private | WebPage | False |
| `seo/beginner-camping.html` | /seo/beginner-camping.html | 露營新手入門｜第一次出發的心理與實務準備｜camp.8-ways.com… | https://camp.8-ways.com/seo/beginner-camping.html | `assets/images/index/taoyuan-glamping-lazy-camping.` | …taoyuan-glamping-lazy-camping.jpg | Article | False |
| `seo/campervan-stay.html` | /seo/campervan-stay.html | 桃園露營車住宿推薦｜露營之外，另一種更自由的旅居方式｜camp.8-ways.c… | https://camp.8-ways.com/seo/campervan-stay.html | `assets/images/campervan/taoyuan-glamping-campsite-` | …taoyuan-glamping-campsite-view.jpg | Article | False |
| `seo/camping-gear.html` | /seo/camping-gear.html | 露營裝備整理｜必帶、選配與季節｜豪華露營可精簡｜camp.8-ways.com… | https://camp.8-ways.com/seo/camping-gear.html | `assets/images/index/dome-tent-glamping-space.jpg` | …dome-tent-glamping-space.jpg | Article | False |
| `seo/dome-glamping.html` | /seo/dome-glamping.html | 圓頂帳篷露營介紹｜比一般帳篷更舒適的森林住宿方式｜camp.8-ways.com… | https://camp.8-ways.com/seo/dome-glamping.html | `assets/images/index/taoyuan-dome-tent-forest-glamp` | …taoyuan-dome-tent-forest-glamping.jpg | Article | False |
| `seo/family-camping.html` | /seo/family-camping.html | 親子露營指南｜行程節奏、安全與睡眠｜桃園楊梅露營｜camp.8-ways.com… | https://camp.8-ways.com/seo/family-camping.html | `assets/images/experience-refresh/joyforest-night-p` | …joyforest-night-party-glamping-overview. | Article | False |
| `seo/forest-activities.html` | /seo/forest-activities.html | 森林系活動與戶外體驗｜慢下來的感官｜桃園露營｜camp.8-ways.com… | https://camp.8-ways.com/seo/forest-activities.html | `assets/images/experience-refresh/joyforest-garden-` | …joyforest-garden-party-house.jpg | Article | False |
| `seo/forest-camping.html` | /seo/forest-camping.html | 桃園森林露營體驗｜在樹林與草地之間，住進慢下來的生活｜camp.8-ways.c… | https://camp.8-ways.com/seo/forest-camping.html | `assets/images/index/forest-camping-private-area.jp` | …forest-camping-private-area.jpg | Article | False |
| `seo/guide/campervan-who.html` | /seo/guide/campervan-who.html | 露營車旅行適合什麼樣的人？自由度與過夜型態｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/campervan-who.html | `assets/images/campervan/taoyuan-glamping-campsite-` | …taoyuan-glamping-campsite-view.jpg | Article | False |
| `seo/guide/camping-faq-general.html` | /seo/guide/camping-faq-general.html | 露營常見問題整理（觀念篇）｜與營區 FAQ 互補｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/camping-faq-general.html | `assets/images/index/taoyuan-forest-camping-scene.j` | …taoyuan-forest-camping-scene.jpg | FAQPage | False |
| `seo/guide/camping-photo-tips.html` | /seo/guide/camping-photo-tips.html | 露營拍照怎麼拍更好看？光線、構圖與生活感｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/camping-photo-tips.html | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-outdoor-cinema-night-lawn-ligh | Article | False |
| `seo/guide/family-camping-easier.html` | /seo/guide/family-camping-easier.html | 親子露營怎麼安排更輕鬆？作息與餐點｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/family-camping-easier.html | `assets/images/family-photography-party/parent-chil` | …parent-child-photography-joyforest-famil | Article | False |
| `seo/guide/first-camping-prep.html` | /seo/guide/first-camping-prep.html | 第一次露營要準備什麼？清單與心態｜桃園露營指南｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/first-camping-prep.html | `assets/images/index/yangmei-forest-lazy-camping.jp` | …yangmei-forest-lazy-camping.jpg | Article | False |
| `seo/guide/forest-space-charm.html` | /seo/guide/forest-space-charm.html | 森林系活動空間有什麼魅力？聲音、光線與距離｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/forest-space-charm.html | `assets/images/party-highlights/joyforest-night-par` | …joyforest-night-party-bbq-family-pet-fri | Article | False |
| `seo/guide/glamping-vs-camping.html` | /seo/guide/glamping-vs-camping.html | 豪華露營與一般露營差在哪？力氣、成本與體驗｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/glamping-vs-camping.html | `assets/images/cloud-tent/cloud-tent-interior-frees` | …cloud-tent-interior-freestanding-bathtub | Article | False |
| `seo/guide/how-to-choose-campsite.html` | /seo/guide/how-to-choose-campsite.html | 怎麼挑選適合自己的露營區？人數、隱私與動線｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/how-to-choose-campsite.html | `assets/images/index/taoyuan-yangmei-glamping-site-` | …taoyuan-yangmei-glamping-site-layout-thr | Article | False |
| `seo/guide/night-outdoor-mood.html` | /seo/guide/night-outdoor-mood.html | 夜間戶外氛圍怎麼營造？燈光、座位與音量｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/night-outdoor-mood.html | `assets/images/cinema-experience/joyforest-outdoor-` | …joyforest-outdoor-movie-night-string-lig | Article | False |
| `seo/guide/one-day-vs-overnight.html` | /seo/guide/one-day-vs-overnight.html | 一日戶外活動與兩天一夜差在哪？體力與儀式感｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/one-day-vs-overnight.html | `assets/images/experience-refresh/joyforest-firepit` | …joyforest-firepit-sparkler-night.jpg | Article | False |
| `seo/guide/outdoor-vs-indoor-gathering.html` | /seo/guide/outdoor-vs-indoor-gathering.html | 戶外聚會與室內聚會差異｜天候、動線與服務｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/outdoor-vs-indoor-gathering.html | `assets/images/party-highlights/joyforest-american-` | …joyforest-american-bbq-grill-lawn.jpg | Article | False |
| `seo/guide/pet-camping-notes.html` | /seo/guide/pet-camping-notes.html | 帶寵物露營前要知道的事｜禮儀與安全｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/pet-camping-notes.html | `assets/images/pet-photography-party/og-pet-photogr` | …og-pet-photography-party.jpg | Article | False |
| `seo/guide/small-group-events.html` | /seo/guide/small-group-events.html | 小型包場活動適合怎麼規劃？人數、動線與留白｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/small-group-events.html | `assets/images/experience-refresh/joyforest-round-t` | …joyforest-round-table-party.jpg | Article | False |
| `seo/guide/taoyuan-camping-types.html` | /seo/guide/taoyuan-camping-types.html | 桃園露營有哪些類型？山線、海岸與豪華露營｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/taoyuan-camping-types.html | `assets/images/index/forest-camping-dome-tent.jpg` | …forest-camping-dome-tent.jpg | Article | False |
| `seo/guide/weekend-outdoor-taoyuan.html` | /seo/guide/weekend-outdoor-taoyuan.html | 桃園出發的週末戶外靈感｜一日與兩天一夜｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/weekend-outdoor-taoyuan.html | `assets/images/index/yangmei-glamping-dome-tent.png` | …yangmei-glamping-dome-tent.png | Article | False |
| `seo/guide/yangmei-easy-outings.html` | /seo/guide/yangmei-easy-outings.html | 楊梅附近輕鬆出遊的露營玩法｜慢節奏靈感｜camp.8-ways.com… | https://camp.8-ways.com/seo/guide/yangmei-easy-outings.html | `assets/images/index/yangmei-camping-convenient-loc` | …yangmei-camping-convenient-location.jpg | Article | False |
| `seo/index.html` | /seo/ | 旅遊露營指南（權威版）｜桃園楊梅・豪華露營・新手裝備與戶外知識｜camp.8-w… | https://camp.8-ways.com/seo/ | `assets/images/index/taoyuan-glamping-forest-dome-h` | …taoyuan-glamping-forest-dome-hero.jpg | WebPage | False |
| `seo/nearby-attractions.html` | /seo/nearby-attractions.html | 周邊景點與行程靈感｜桃園楊梅出發｜露營旅遊｜camp.8-ways.com… | https://camp.8-ways.com/seo/nearby-attractions.html | `assets/images/index/yangmei-camping-convenient-loc` | …yangmei-camping-convenient-location.jpg | Article | False |
| `seo/night-outdoor.html` | /seo/night-outdoor.html | 夜間露營與戶外氛圍｜燈光、餐酒與聊天節奏｜camp.8-ways.com… | https://camp.8-ways.com/seo/night-outdoor.html | `assets/images/experience-refresh/joyforest-night-g` | …joyforest-night-glamping-lights.jpg | Article | False |
| `seo/pet-friendly-camping.html` | /seo/pet-friendly-camping.html | 寵物友善露營整理｜出發前該想好的事｜桃園露營｜camp.8-ways.com… | https://camp.8-ways.com/seo/pet-friendly-camping.html | `assets/images/experience-refresh/joyforest-pet-par` | …joyforest-pet-party-picnic.jpg | Article | False |
| `seo/taoyuan-camping.html` | /seo/taoyuan-camping.html | 桃園露營區推薦｜想找安靜又有空間感的森林露營體驗｜camp.8-ways.com… | https://camp.8-ways.com/seo/taoyuan-camping.html | `assets/images/index/taoyuan-private-campsite-glamp` | …taoyuan-private-campsite-glamping.jpg | Article | False |
| `seo/taoyuan-glamping.html` | /seo/taoyuan-glamping.html | 桃園豪華露營推薦｜比住飯店更接近自然，比傳統露營更舒服｜camp.8-ways.… | https://camp.8-ways.com/seo/taoyuan-glamping.html | `assets/images/index/taoyuan-glamping-exclusive-gra` | …taoyuan-glamping-exclusive-grass-100ping | Article | False |
| `seo/yangmei-camping.html` | /seo/yangmei-camping.html | 楊梅露營區推薦｜交通方便，卻像包下一整片森林｜camp.8-ways.com… | https://camp.8-ways.com/seo/yangmei-camping.html | `assets/images/index/yangmei-forest-camping-view.jp` | …yangmei-forest-camping-view.jpg | Article | False |

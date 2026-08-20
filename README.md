# camp-8-ways.com

靜態網站專案（首頁、房型頁、查詢空房等）。

## 維護時請以此為準

- **樣式**：請只編輯 `assets/css/main.css`。根目錄的 `styles/main.css` 為舊版備份，請勿再當作主要檔案。
- **全站腳本**：請只編輯 `assets/js/main.js`。根目錄的 `scripts/main.js` 為舊版備份。
- **查詢空房價格／連假規則**：原始碼在 `src/**/*.ts`。修改後請在專案根目錄執行 `npm run build`，再將產生的 `assets/js/camp-calendar-pricing.js` 一併部署。

## 森林故事文章系統

- 公開入口：`pages/stories.html`
- 公開文章：`stories/<英文-slug>/index.html`
- 公開索引資料：`assets/data/camp-stories-articles.json`
- 本機文章來源：`/Users/joyforest/Documents/露營區/網站文章/森林故事/`
- 固定分類：`客戶推薦分享`、`森林故事`、`新設施`、`優惠消息`

文章來源與公開網站分開保存；原始 Markdown、尚未授權的照片與草稿不會被部署。新增文章時使用日期開頭的中文資料夾，資料夾內固定放 `article.md`、`photos/` 與 `videos/`。網站網址則使用 SEO 友善的英文 slug。

```bash
npm run build:stories -- --content-dir "/Users/joyforest/Documents/露營區/網站文章/森林故事"
```

只有 `status: published`、`privacy: public` 且欄位驗證通過的文章會輸出至公開網站。

## 本機建置

```bash
npm install
npm run build
```

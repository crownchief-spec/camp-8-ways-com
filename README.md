# camp-8-ways.com

靜態網站專案（首頁、房型頁、查詢空房等）。

## 維護時請以此為準

- **樣式**：請只編輯 `assets/css/main.css`。根目錄的 `styles/main.css` 為舊版備份，請勿再當作主要檔案。
- **全站腳本**：請只編輯 `assets/js/main.js`。根目錄的 `scripts/main.js` 為舊版備份。
- **查詢空房價格／連假規則**：原始碼在 `src/**/*.ts`。修改後請在專案根目錄執行 `npm run build`，再將產生的 `assets/js/camp-calendar-pricing.js` 一併部署。

## 本機建置（價格模組）

```bash
npm install
npm run build
```

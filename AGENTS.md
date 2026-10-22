# 專案驗證規則

每次修改 LINE／AI 自動回覆、Webhook、日曆解析或讀取、Cloudflare 綁定或部署設定後，完成部署前必須執行 `npm run check:availability-live`。

正式環境的程式修正必須先提交並推送到 Git，再等待 Git 對應版本完成 Cloudflare 正式部署。禁止只用 `wrangler pages deploy` 部署尚未提交或尚未推送的程式修正，否則每 30 分鐘的檔期同步提交會重新部署 Git 舊版並覆蓋修正。

檔期 API 必須保留同一個 Pages 部署內的靜態安全快照備援；不可只依賴 Cloudflare 環境變數、Google Calendar 或另一個網站的 API。

這項檢查必須同時確認以下兩組公開頁面及 API 正常；任一失敗都不可回報完成：

- `https://van.joyforest.tw/pages/availability`
- `https://van.joyforest.tw/api/campervan-availability`
- `https://camp.8-ways.com/pages/availability`
- `https://camp.8-ways.com/api/public-calendar`

檢查日曆時不得輸出或洩漏活動標題、客戶姓名及其他私人內容。

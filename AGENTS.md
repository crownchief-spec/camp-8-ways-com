# 專案驗證規則

每次修改 LINE／AI 自動回覆、Webhook、日曆解析或讀取、Cloudflare 綁定或部署設定後，完成部署前必須執行 `npm run check:availability-live`。

這項檢查必須同時確認以下兩組公開頁面及 API 正常；任一失敗都不可回報完成：

- `https://van.joyforest.tw/pages/availability`
- `https://van.joyforest.tw/api/campervan-availability`
- `https://camp.8-ways.com/pages/availability`
- `https://camp.8-ways.com/api/public-calendar`

檢查日曆時不得輸出或洩漏活動標題、客戶姓名及其他私人內容。

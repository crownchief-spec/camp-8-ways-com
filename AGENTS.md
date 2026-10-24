# 專案驗證規則

## LINE 聯絡範圍（2026-10-24 使用者正式授權）

使用者已明確要求 camp.8-ways.com、van.joyforest.tw、joyforest.tw 的個人 LINE 聯絡入口統一改為官方帳號 `@281uducw`，加好友連結為 `https://line.me/R/ti/p/@281uducw`。LINE 為主要聯絡入口；WhatsApp、電話及 Email 保留為次要方式。此授權取代 2026-10-23 的暫不切換入口指示。

這只是網站聯絡導流切換，不是啟用 AI 自動回覆或 Webhook。目前採使用者開啟官方帳號網頁，請 Codex 閱讀訊息、先提出建議，再經使用者指示後送出的模式。不得因網站導流就自行開啟自動客服、收款或自動訂房。

每次修改 LINE／AI 自動回覆、Webhook、日曆解析或讀取、Cloudflare 綁定或部署設定後，完成部署前必須執行 `npm run check:availability-live`。

正式環境的程式修正必須先提交並推送到 Git，再等待 Git 對應版本完成 Cloudflare 正式部署。禁止只用 `wrangler pages deploy` 部署尚未提交或尚未推送的程式修正，否則每 30 分鐘的檔期同步提交會重新部署 Git 舊版並覆蓋修正。

檔期 API 必須保留同一個 Pages 部署內的靜態安全快照備援；不可只依賴 Cloudflare 環境變數、Google Calendar 或另一個網站的 API。

這項檢查必須同時確認以下五個使用面正常；任一失敗都不可回報完成：

- 已登入的 `https://camp.8-ways.com/pages/admin-revenue` 能讀到完整案件與營收資料，但不得在檢查輸出顯示私人內容。
- 已登入的 `https://camp.8-ways.com/pages/staff-availability` 能讀到完整訂房資料，但不得在檢查輸出顯示私人內容。
- 獨立 LINE Worker 能從安全公開快照回答露營車與露營區檔期，不得把私人行事曆內容交給 LINE。
- 露營車公開檔期頁與 API 正常。
- 露營區公開檔期頁與 API 正常。

公開檔期與 LINE Worker 使用去識別的安全快照；營收後台只能在登入驗證後讀取完整 Google Calendar。不得為了共用而讓營收後台改讀公開快照，也不得讓公開頁面或 LINE 讀取完整私人行事曆。

公開檔期的具體檢查網址如下：

- `https://van.joyforest.tw/pages/availability`
- `https://van.joyforest.tw/api/campervan-availability`
- `https://camp.8-ways.com/pages/availability`
- `https://camp.8-ways.com/api/public-calendar`

檢查日曆時不得輸出或洩漏活動標題、客戶姓名及其他私人內容。

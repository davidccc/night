# 部署指南

此文件協助你在 Render (Server) + Vercel (Web) + PlanetScale (MySQL) 上部署小夜 LINE OMO 系統。

## 1. 必要環境變數

| 變數 | 範圍 | 說明 |
| ---- | ---- | ---- |
| `PORT` | Server | 後端服務埠，預設 4000 |
| `DATABASE_URL` | Server | PlanetScale / MySQL 連線字串，例如 `mysql://user:pass@host:3306/night-king` |
| `JWT_SECRET` | Server | 自訂 JWT 簽章金鑰，高熵亂數 |
| `LINE_CHANNEL_ACCESS_TOKEN` | Server | LINE Messaging API Channel access token |
| `LINE_CHANNEL_SECRET` | Server | LINE Messaging API Channel secret |
| `LINE_LOGIN_CHANNEL_ID` | Server / Web | LINE Login Channel ID，用於 LIFF 與 Verify |
| `LINE_LOGIN_CHANNEL_SECRET` | Server | LINE Login Channel secret (以防線下驗證) |
| `BASE_URL` | Server | 部署後端對外網址，供 Flex 圖片與 webhook 回傳 |
| `CORS_ORIGIN` | Server | 允許的前端來源，開發可設 `http://localhost:3000` |
| `LIFF_BASE_URL` | Server | LIFF App Endpoint URL，登入完成後的跳轉位置與 Flex `更多資訊` 連結 |
| `NEXT_PUBLIC_API_BASE_URL` | Web | 指向後端 API，例如 `https://api.night-king.app` |
| `E2E_BASE_URL` | Web (可選) | Playwright 測試基底網址 |

所有變數範本可參考 `.env.example`。

> **LINE Login 設定提醒**：在 LINE Developers Console 中，將「LINE Login → Callback URL」設為 `${BASE_URL}/line/callback`，將「LIFF → Endpoint URL」設為 `LIFF_BASE_URL`。兩者需分別指向後端與前端，網址需完全一致（含協定與子路徑）。

## 2. 後端部署 (Render 示意)

1. 在 Render 建立 Web Service，來源指向 Git repo。
2. Build 命令：`npm install && npm run build:server`
3. Start 命令：`npm --workspace=@night-king/server run start`
4. 於 Render 設定全部 Server 端環境變數。
5. 部署完成後取得 HTTPS 網址 (例：`https://night-king-server.onrender.com`)。
6. 前往 LINE Developers → Messaging API → Webhook URL，填入 `https://night-king-server.onrender.com/webhook`，並按 Verify。

> PlanetScale 使用者請先建立資料庫，取得 `DATABASE_URL`。若使用其他 MySQL，需要預先執行 `npm run prisma:migrate` 或 `npm run prisma:push`。

## 3. 前端部署 (Vercel 示意)

1. 導入 Git repo 至 Vercel。
2. Build 命令：`npm run build:web`
3. Output：`.vercel/output` (Vercel 自動處理)
4. 於 Project Settings → Environment Variables 設定 `NEXT_PUBLIC_API_BASE_URL`（指向後端 API 網址）。
5. 首次部署完成後，更新 LINE LIFF App 的 Endpoint URL 為 Vercel 網址。

## 4. 資料庫初始化

```bash
# 於本機或 CI 執行一次即可
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

PlanetScale 若採線上 migration 流程，可改用：

```bash
npm run prisma:migrate
```

## 5. 自動化建議

- 建立 GitHub Actions Workflow：
  - `on: pull_request`：安裝依賴 → `npm run test` → `npm run lint`。
  - `on: push` (main)：同上，通過後觸發 Render / Vercel 部署。
- 在 staging 環境執行 `npm run test:web -- test:e2e` 確保 UI 流程正常。

## 6. 維運建議

- 啟用 PlanetScale Daily Backup，並設定只允許後端 Server IP 連線。
- Render 可設定 Auto Deploy（Merge 後自動部署）以及 Health Check Path `/healthz`。
- 若加入 CDN (Cloudflare)，請更新 Webhook URL 以確保 HTTPS 証書與 Header 未被移除。
- 監控：
  - LINE Webhook 錯誤會顯示於 Render Logs。
  - Prisma 提供 `$metrics` 可串接 APM（可加入未來 Roadmap）。

## 7. 常見問題

| 問題 | 排查方式 |
| ---- | -------- |
| Webhook 無回應 | 確認 `LINE_CHANNEL_*` 是否正確、Render Logs 是否顯示 200、Webhook URL 是否 HTTPS |
| LIFF 無法登入 | 檢查 LINE Developers Console 中的 Callback URL 是否為 `${BASE_URL}/line/callback`，以及 LIFF Endpoint 是否與 `LIFF_BASE_URL` 相符，並確認 `NEXT_PUBLIC_API_BASE_URL` 指向同一網域 |
| Prisma 連線錯誤 | 檢查 `DATABASE_URL` 格式；PlanetScale 需使用 `?sslaccept=strict` |
| JWT 驗證失敗 | 確保前後端 `JWT_SECRET` 一致，且 Bearer header 格式 `Authorization: Bearer <token>` |

順利部署後，即可透過 Rich Menu 導向 LIFF，並使用預約 / Reward 功能。若需擴展 LINE Pay 或 CRM，建議另外建立微服務或在 Server 模組新增對應路由與 Prisma Model。

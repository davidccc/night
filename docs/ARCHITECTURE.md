# 小夜 LINE OMO 系統架構說明

本文件說明 Night-king LINE OMO System 的系統模組、資料結構、資料流與設計考量，對應需求規格 (LINE Bot + LIFF + MySQL + JWT)。

## 1. 系統全覽

```
LINE Official Account (Webhook) ──► apps/server (Express) ──► PlanetScale / MySQL
                       │                            ▲
                       │                            │ REST
                       ▼                            │
               LIFF Web (Next.js) ────────────────► apps/server API
```

- **Bot Server**：接收 LINE Messaging API 事件，依照關鍵字觸發 Flex Message / 文字回覆或導流至 LIFF。
- **REST API / Gateway**：統一提供登入、甜心列表、預約、積分 CRUD，並驗證 JWT。
- **Web (LIFF)**：手機優先的 Next.js UI，完成 LINE Login、預約流程與 Reward 介面。
- **資料庫層**：MySQL + Prisma ORM，確保資料一致性並支援 PlanetScale 線上部署。

## 2. 模組分層

| 模組 | 負責範圍 | 技術 stack |
| ---- | -------- | ---------- |
| apps/server | LINE Webhook、REST API、JWT、Prisma | Node.js, Express, Prisma, Zod |
| apps/web | LIFF Web 前端、Tailwind UI、API Integration | Next.js 14, @line/liff, Tailwind CSS |
| packages/prisma | Schema、Client、Seed | Prisma ORM |
| docs | 架構文件、部署指引 | Markdown |

## 3. 資料庫 Schema

`packages/prisma/prisma/schema.prisma`

- `User`：LINE 使用者、Reward 累積、與預約/積分紀錄 (索引：`lineUserId`).
- `Sweet`：甜心卡片資料，含標籤與封面圖。
- `Booking`：預約紀錄，紀錄使用者、甜心、日期、時段、狀態與備註 (索引：`userId`, `sweetId`, `status`).
- `RewardLog`：積分異動歷程，協助稽核與客服查詢 (索引：`userId`, `createdAt`).

Prisma 以 MySQL 8.0 為目標，亦可運行於 PlanetScale / Cloud SQL。`DATABASE_URL` 由 `.env` 控管。

## 4. API 設計

| Method | Path | 說明 |
| ------ | ---- | ---- |
| `POST` | `/api/login` | 接收 LIFF `idToken`，驗證 LINE Login 並回傳 JWT + 用戶資料 |
| `GET` | `/api/login/me` | 已登入使用者資訊 (需 Bearer Token) |
| `GET` | `/api/sweets` | 甜心列表 (需 Bearer Token) |
| `POST` | `/api/booking` | 建立預約，成功會 +50 積分並寫入 `RewardLog` |
| `GET` | `/api/booking/:userId` | 取得指定使用者預約紀錄 (限本人) |
| `GET` | `/api/reward/:userId` | Reward 卡片資訊與積分紀錄 |
| `PUT` | `/api/reward/:userId` | 調整使用者總積分並保留原因 |
| `POST` | `/webhook` | LINE Messaging API Webhook (Flex / 文本回覆) |
| `GET` | `/healthz` | 健康檢查，供 Render / Vercel probe |

- 驗證：所有 `/api/*` 路徑均採 JWT Bearer。`POST /api/login` 會呼叫 LINE Verify endpoint 以確保 `idToken` 有效。
- 例外處理：統一透過 `middleware/error.ts` 回傳 JSON 錯誤。
- 資料驗證：使用 `zod` 檢查 Request Body。

## 5. LINE Bot 行為

- 關鍵字對應：
  - `甜心列表` → Flex Carousel，動態載入資料庫 `sweets`。
  - `預約規則` → 文字訊息，說明使用條款。
  - `客服` → 文字訊息，指引用戶等待真人客服。
  - 其他訊息 → 誘導輸入關鍵字的預設回覆。
- `line/messages.ts`：統一管理 Flex/文字模板，採桃紅主題並預留 LIFF 連結。
- `line/handlers.ts`：解析 Webhook 事件並委派至 Flex/文字回覆。

## 6. LIFF Web 流程

1. `AuthProvider` 啟動後呼叫 `liff.init`；若未登入則導向 LINE Login。
2. 取得 `idToken` 後呼叫 `/api/login` 換取 Night-king JWT + 用戶資訊。
3. 於 Context 中共享登入狀態，並帶入 API Bearer Token。
4. 預約、積分頁面皆使用 `fetch*` API 封裝呼叫。

UI 特點：
- Tailwind CSS + 桃紅主色、圓角卡片風格。
- RWD：Mobile-first，Nav 於手機以水平 Pill 呈現。
- App Router 架構，頁面拆分 `/sweet`, `/booking`, `/records`, `/reward`, `/profile`。

## 7. 雲端部署架構

| 模組 | 平台建議 | 重點 |
| ---- | -------- | ---- |
| Bot Server | Render / Fly.io | 提供外網 HTTPS、設定 Webhook URL、支援 CI/CD |
| Web (LIFF) | Vercel | 自動部署、支援 Edge Network、環境變數管理 |
| 資料庫 | PlanetScale / Cloud SQL | MySQL 8.0 相容、支援備援與快照 |
| DNS & SSL | Cloudflare / Vercel | 統一管理網域與 HTTPS |
| LINE OA | 官方後台 | 綁定 Webhook、Rich Menu、客服模式 |

建議以 GitHub Actions 建立 CI，部署前自動執行測試 (`npm run test`)。Server 部署完成後需重新 Verify LINE Webhook。

## 8. 安全與維運

- JWT Secret 必須使用高熵亂數；建議搭配 Secrets Manager。
- MySQL 僅開放後端 Server IP，並開啟每日自動備份。
- 為 `bookings`, `reward_logs` 建立索引，加速查詢。
- LINE Webhook 啟用簽章驗證，防止偽造請求。
- 拆分 dev / staging / prod 環境；可於 staging 模擬 LINE Sandbox。
- 設計 Graceful Shutdown (`SIGTERM`, `SIGINT`) 以釋放 Prisma 連線。

## 9. 測試策略

- **單元 / 整合測試** (apps/server/tests)：以 Vitest + Supertest 驗證登入、授權、資料回傳。
- **前端元件測試** (apps/web/tests)：使用 Testing Library 驗證核心 UI。
- **端對端測試** (apps/web/tests/e2e)：Playwright 腳手架，預設檢查首頁載入，可擴充預約流程。
- 建議於 CI 先跑單元測試，再部署到 staging 執行 Playwright。

## 10. 後續擴充建議

- LINE Pay：於預約流程加入訂金支付，更新 `reward_logs`。
- CRM 整合：記錄客服轉接狀態與標籤。
- 推播模組：排程提醒預約、積分到期。
- Analytics：定期同步資料至 BigQuery 進行報表分析。
- 多語系：以 Next.js i18n + Prisma 增加語系欄位。

---

如需部署步驟與環境變數設定細節，請參考 `docs/DEPLOYMENT.md`。

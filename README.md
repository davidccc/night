# 小夜 LINE OMO 系統 (Night-king LINE OMO System)

整合 LINE 官方帳號、LIFF Web 與 MySQL 的 OMO 平台範例專案，採前後端分離的 Monorepo。系統提供 LINE Bot 自動回覆、LIFF 登入、預約管理、Reward 積分與 API Gateway，滿足品牌官方帳號一站式互動需求。

## 📂 專案結構

```
.
├── apps
│   ├── server          # Node.js + Express + Sequelize 後端 (Webhook / REST API)
│   └── web             # Next.js + Tailwind CSS + LIFF Web 前端
├── scripts             # 部署腳本與輔助工具
├── docs                # 架構與部署補充說明
├── .env.example        # 環境變數範本
├── package.json        # NPM workspaces 與共用指令
└── tsconfig.base.json  # TypeScript 共用設定
```

## 🚀 核心模組

- **LINE Bot Server**：處理 LINE Webhook 事件、自動回覆 Flex/文字，並橋接 REST API。
- **REST API 層**：提供 `/api/login`, `/api/sweets`, `/api/booking`, `/api/reward` 等端點，採用 Sequelize ORM 搭配 MySQL。
- **LIFF Web 前端**：Next.js 14 App Router，整合 LIFF SDK 完成自動登入、預約與積分管理介面。
- **Sequelize + MySQL**：以 PlanetScale/Cloud SQL 為目標的 Schema，支援預約、甜心、使用者與積分紀錄。
- **測試骨架**：後端使用 Vitest + Supertest，前端提供 Vitest 元件測試與 Playwright E2E 腳手架。

詳盡的技術拆解、資料流程與部署建議請參考 `docs/ARCHITECTURE.md`。

## 🔧 環境需求

- Node.js 18+ (建議 20 LTS)
- npm v9+（或支援 workspaces 的套件管理工具）
- MySQL 8.0 / PlanetScale / Cloud SQL
- LINE Login + Messaging API Channel (取得 Channel ID、Secret、Access Token)

## ⚙️ 安裝與初始化

```bash
# 安裝依賴 (會一併安裝 server / web 的套件)
npm install

# 建立環境變數
cp .env.example .env
# 依實際需求填入 LIFF / LINE / Database 等設定

# 建立資料表並匯入範例資料
npm run db:sync --workspace=@night-king/server
npm run db:seed --workspace=@night-king/server   # 選填：匯入示範甜心 / 使用者
```

> 本範例預設後端埠號為 `4000`，LIFF Web Dev Server 埠號為 `3000`，避免埠衝突。

## 🧑‍💻 開發啟動流程

| 指令 | 說明 |
| ---- | ---- |
| `npm run dev:server` | 啟動後端 Express Webhook + REST API (http://localhost:4000) |
| `npm run dev:web`    | 啟動 LIFF Web 前端 (http://localhost:3000) |
| `npm run dev`        | 僅啟動後端 (可依需要擴充並行指令) |

- 後端啟動後，可透過 `GET /healthz` 檢查健康狀態。
- LIFF 前端會自動導向後端 `/line/authorize` 進行 LINE Login 授權。請確保 `.env` 中的 `NEXT_PUBLIC_API_BASE_URL` 指向可公開存取的後端網址，並在 LINE Developers Console 設定 Callback URL 為 `${BASE_URL}/line/callback`、LIFF Endpoint 為 `LIFF_BASE_URL`。
- 若需對外測試（LIFF/LINE Webhook），可啟動 ngrok：`npm run dev:app` 後執行 `ngrok http 3000`，即可取得同網域的公開 HTTPS 入口（預設檢視面板為 http://127.0.0.1:4040）。

## ✅ 測試與品質

| 指令 | 作用 |
| ---- | ---- |
| `npm run test:server` | 執行後端 Vitest + Supertest 單元／整合測試 |
| `npm run test:web`    | 執行前端 Vitest 元件測試 |
| `npm run test`        | 同時執行前後端測試組合 |
| `npm run test:web -- test:e2e` | 透過 Playwright 執行端對端測試骨架 (需先啟動前端) |
| `npm run lint`        | 執行 Next.js / Biome 程式碼檢查 |
| `npm run format`      | 以 Biome 套件格式化整個 monorepo |

## 🌐 部署提示

- **後端**：建議部署於 Render / Fly.io / Railway，設定環境變數並綁定 LINE Webhook URL (例：`https://your-server/webhook`).
- **前端**：部署至 Vercel，於 Project Settings -> Environment Variables 填入 `NEXT_PUBLIC_API_BASE_URL`（指向後端 API 網址）。
- **資料庫**：PlanetScale / Cloud SQL，需開啟資料庫使用者權限與連線白名單。若 schema 有變更，請執行 `npm run db:sync --workspace=@night-king/server` 重新同步。
- **Webhook 安全**：務必保護 Channel Secret，並啟用 LINE Webhook 驗證簽章。

部署相關的 CI/CD 流程與環境建議，可參考 `docs/DEPLOYMENT.md`。

## 🧠 開發 Roadmap (建議)

1. Schema 與 Sequelize Model 建立
2. 完成 LINE Bot Webhook 與 Flex 回覆
3. 整合 LIFF Login 與 JWT，完成前端登入流程
4. 實作預約 / Reward API 與對應 UI
5. 上線 Rich Menu、客服模式切換
6. Render + Vercel 自動部署
7. 擴充 LINE Pay、CRM、推播等商業模組

## 🤝 貢獻與維護

歡迎依實際業務需求擴充模組（LINE Pay、CRM、Analytics、多語系等）。提交 Pull Request 時請附上：

- 所變更模組與目的
- 若有 Schema 變更，附上 Migration 說明
- 對應測試指令 (含結果截圖或敘述)

---

如需更完整的設計背景、資料流、UI 指南與部署範例，請閱讀 `docs/ARCHITECTURE.md`。祝開發順利！

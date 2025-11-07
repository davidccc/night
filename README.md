# 小夜 LINE OMO 系統 (Night-king LINE OMO System)

整合 LINE 官方帳號、LIFF Web 與 MySQL 的 OMO 平台範例專案，採前後端分離的 Monorepo。系統提供 LINE Bot 自動回覆、LIFF 登入、預約管理、Reward 積分與 API Gateway，滿足品牌官方帳號一站式互動需求。

## 📂 專案結構

```
.
├── apps
│   ├── server          # Django REST API + LINE Webhook 後端
│   └── web             # Next.js + Tailwind CSS + LIFF Web 前端
├── scripts             # 啟動與部署腳本
├── docs                # 架構與部署補充說明
├── .env.example        # 本地開發環境變數範本
├── package.json        # 前端工作區設定
└── tsconfig.base.json  # TypeScript 共用設定
```

## 🚀 核心模組

- **Django 後端**：處理 LINE Webhook 事件、自動回覆 Flex/文字，並提供 `/api/login`, `/api/sweets`, `/api/booking`, `/api/reward` 等 REST API。
- **LIFF Web 前端**：Next.js 14 App Router，整合 LIFF SDK 完成自動登入、預約與積分管理介面。
- **MySQL 資料庫**：支援預約、甜心、使用者與積分紀錄。
- **測試骨架**：後端使用 Django TestCase，前端提供 Vitest 元件測試與 Playwright E2E 腳手架。

## 🔧 環境需求

- Python 3.12+
- Node.js 18+ (建議 20 LTS)
- npm v9+
- MySQL 8.0 / PlanetScale / Cloud SQL / Railway MySQL
- LINE Login + Messaging API Channel (取得 Channel ID、Secret、Access Token)

## ⚙️ 安裝與初始化

```bash
# 安裝前端依賴
npm install

# 建立本地環境變數
cp .env.example .env
# 填寫 MySQL、LINE Channel 等設定值
```

後端的 Django 設定會從環境變數讀取，如使用 Railway 請在專案設定內建立相同的變數；本地則可透過 `.env` 配合 `scripts/start-backend.sh` 自動載入。

## 🧑‍💻 開發啟動流程

| 指令 | 說明 |
| ---- | ---- |
| `bash scripts/start-backend.sh` | 啟動 Django REST API + LINE Webhook (http://localhost:8000) |
| `npm run dev:web`               | 啟動 LIFF Web 前端 (http://localhost:3000) |

- 匯入甜心資料：將文字與圖片資源放在 `res/<地區>/` 目錄後，執行 `python manage.py import_sweets`
  （位置於 `apps/server`，可搭配 `--dry-run` 先檢查解析結果）。該指令會自動建立/更新 `sweet_tab`
  資料並將圖片複製到 `apps/web/public/sweets/<slug>/`，部署後即可公開存取。

- 後端啟動後，可透過 `GET /healthz` 檢查健康狀態。
- LIFF 前端會自動導向 `/line/authorize` 進行 LINE Login 授權。請確保前端 `.env` 中的 `NEXT_PUBLIC_API_BASE_URL` 指向後端網址，並在 LINE Developers Console 設定 Callback URL 為 `${BASE_URL}/line/callback`。
- 若需對外測試（LIFF/LINE Webhook），可再執行 `ngrok http 3000`，即可取得公開 HTTPS 入口（預設檢視面板為 http://127.0.0.1:4040）。

## ✅ 測試與品質

| 指令 | 作用 |
| ---- | ---- |
| `python manage.py test` (apps/server) | 執行後端 Django 測試 |
| `npm run test:web`                    | 執行前端 Vitest 元件測試 |
| `npm run test:web -- test:e2e`        | 透過 Playwright 執行端對端測試 (需先啟動前端) |
| `npm run lint`                        | 執行 Next.js / Biome 程式碼檢查 |
| `npm run format`                      | 以 Biome 套件格式化整個 monorepo |

## 🌐 部署方案：Railway + Vercel

### 後端（Django + LINE Webhook）
1. 建立 Railway 專案並部署 `apps/server`，Dockerfile 使用 `Dockerfile.server`。
2. 在 Railway 專案設定環境變數（對應 `.env.example`）
   - `DJANGO_SECRET_KEY`
   - `DATABASE_URL`（可直接使用 Railway MySQL Plugin 產生的連線字串）
   - `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
   - `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`
   - `BASE_URL`（後端公開網址，例如 https://your-railway-app.up.railway.app）
   - `CORS_ORIGIN`, `LIFF_BASE_URL`（前端網址，如 https://your-vercel-app.vercel.app）
   - （可選）`NEXT_PUBLIC_LINE_CUSTOMER_URL`（前端使用，指向 LINE 客服入口）
   - （可選）`NEXT_PUBLIC_LINE_CUSTOMER_OA_ID`（若填入 OA ID，例如 `@night`, 「客服預約」按鈕會直接開啟訊息視窗並附上預設文字）
3. 部署完成後在 LINE Developers console 綁定 Webhook：`https://your-railway-app.up.railway.app/webhook`

### 前端（Next.js / LIFF）
1. 將 `apps/web` 部署到 Vercel。
2. 在 Vercel 專案設定環境變數
   - `NEXT_PUBLIC_API_BASE_URL` = Railway 後端公開網址
   - 其他前端所需變數（例如 Google Analytics 等）。
3. 發佈後即可從 LIFF redirect 至 Vercel 網站，並透過 `NEXT_PUBLIC_API_BASE_URL` 呼叫 Railway 後端。

### 資料庫
- 於 Railway 專案中新增 **MySQL Plugin** 或接軌外部託管（例如 PlanetScale）。
- 將連線字串填入 `DATABASE_URL`，後端即可連線。

## 🧠 開發 Roadmap (建議)

1. Django models 與 migrations 建立
2. 完成 LINE Webhook 與 Flex 回覆
3. 整合 LIFF Login 與 JWT，完成前端登入流程
4. 實作預約 / Reward API 與對應 UI
5. 上線 Rich Menu、客服模式切換
6. 建立 Railway + Vercel 自動部署流程
7. 擴充 LINE Pay、CRM、推播等商業模組

## 🤝 貢獻與維護

歡迎依實際業務需求擴充模組（LINE Pay、CRM、Analytics、多語系等）。提交 Pull Request 時請附上：

- 所變更模組與目的
- 若有 Schema 變更，附上 Migration 說明
- 對應測試指令 (含結果截圖或敘述)

---

如需更完整的設計背景、資料流、UI 指南與部署範例，請閱讀 `docs/ARCHITECTURE.md`。祝開發順利！

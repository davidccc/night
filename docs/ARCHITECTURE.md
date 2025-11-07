# 小夜 LINE OMO 系統架構說明

本文件說明 Night 專案目前的 Django + Next.js 架構、資料流以及維運重點，協助維護者快速掌握系統組成。

## 1. 系統全覽

```
LINE Official Account (Webhook) ──► apps/server (Django / DRF) ──► MySQL (night schema)
                       │                               ▲
                       │                               │ REST
                       ▼                               │
               LIFF Web (Next.js 14) ────────────────► apps/server API
```

- **Bot & API Server**：`apps/server` 以 Django 5 + Django REST Framework（DRF）提供 REST API、LINE Login、LINE Webhook，以及資料存取。
- **Web (LIFF)**：`apps/web` 採 Next.js App Router，為行動優先的預約 / 客服體驗，透過 `app/lib/api.ts` 串接後端。
- **資料庫層**：MySQL（Railway）採 `_tab` 單數資料表命名，主要模型為 `line_user_tab`, `sweet_tab`, `booking_tab`, `reward_log_tab`, `location_tab`。

## 2. 模組分層

| 模組 | 負責範圍 | 技術 stack / 位置 |
| ---- | -------- | ----------------- |
| `apps/server/api` | REST API、資料序列化、預約/積分業務邏輯、Sweet 匯入 | Django 5, DRF, MySQL, 管理指令 `import_sweets` |
| `apps/server/linebot` | LINE Login、Webhook 處理、Flex Message | Django views + LINE Messaging API |
| `apps/web` | LIFF 前端、甜心列表、預約流程、客服 CTA | Next.js 14, React 18, Tailwind CSS |
| `scripts` | 本地啟動、Railway 環境變數同步 | Bash + Python (`dotenv`, Railway CLI) |

## 3. 資料模型

| 資料表 | 內容 | 備註 |
| ------ | ---- | ---- |
| `line_user_tab` | LINE 使用者、顧客資料、累計積分 | `LineUser` 透過 `line_user_id` 索引 |
| `sweet_tab` | 甜心檔案（描述、國籍、年齡、身高體重、費用、`code`、`update_time` 等） | `Location` 外鍵改由應用程式層控管（`0005_remove_fk_constraints`） |
| `location_tab` | 城市 / 區域設定 (`slug`, 顯示名稱) | `/api/sweets` 可用 `?location=<slug>` 篩選 |
| `booking_tab` | 預約紀錄，紀錄使用者、甜心、日期、時段、備註、狀態 | `services.create_booking` 處理驗證與積分副作用 |
| `reward_log_tab` | 積分調整歷程與原因 | `services.set_reward_points` 追加紀錄 |

圖片匯入流程：`python manage.py import_sweets --source-dir res` 解析每個地區資料夾內的文字檔與照片，透過 `safe_slug` 產出甜心名稱的 **拼音檔名**，並拷貝到 `apps/web/public/sweets/<location_slug>/`。

## 4. API 設計

| Method | Path | 目的 | 權限 |
| ------ | ---- | ---- | ---- |
| `POST` | `/api/login` | 以 LINE `idToken` 換取 Night JWT + 使用者資料 | Public |
| `GET` | `/api/me` | 取得登入者資訊 | Bearer (LineJWTAuthentication) |
| `GET` | `/api/sweets?location=<slug>` | 列出甜心卡片、支援地區篩選 | Bearer |
| `POST` | `/api/booking` | 建立預約，並寫入 `booking_tab` | Bearer |
| `GET` | `/api/booking/<user_id>` | 查看使用者自己的預約紀錄 | Bearer（需本人） |
| `GET/PUT` | `/api/reward/<user_id>` | 取得 / 調整積分與日誌 | Bearer（需本人） |
| `POST` | `/line/webhook` | 處理 LINE OA Webhook（Flex、文字回覆） | LINE 平台 |

- **驗證**：DRF Serializer（`LoginSerializer`, `BookingCreateSerializer`, `RewardUpdateSerializer` 等）處理欄位驗證；JWT 驗證由 `LineJWTAuthentication` 執行。
- **服務層**：`apps/server/api/services.py` 集中 domain 邏輯（甜心查詢、預約、積分），確保 API 與排程任務可共用。

## 5. LINE Bot 行為

- `apps/server/linebot/views.py`：處理 LINE Login、Webhook、憑證交換與 Flex Message 回覆。
- `apps/server/linebot/messages.py`：定義 Flex 模板與純文字訊息。
- `apps/server/linebot/handlers.py`：解析事件、路由到不同回覆策略。
- `line_auth.login_with_id_token`：與 LINE Verify API 溝通，成功後簽發 Night JWT。

## 6. LIFF Web 流程

1. `AuthProvider` 在客戶端呼叫 `/api/login` 換取 JWT 後緩存於 Context。
2. `app/lib/api.ts` 將後端 snake_case 欄位轉為 camelCase，並附帶 `Authorization` header。
3. `/sweet` 頁面顯示甜心列表、地區過濾、代號、最新更新時間與雙預約按鈕（線上 / LINE 客服）。
4. `/sweet/[id]` 顯示詳細資料、客製化統計、猜你也會喜歡。
5. `/booking` 透過 `bookingForm.tsx` Suspense Component 讀取 URL `sweetId` 預選甜心，避免 `useSearchParams` 造成的 SSR 錯誤。
6. `/tea`、`/reward`、`/records` 等頁面共用 `AppShell` 排版，維持一致的 RWD 體驗。

Tailwind 設定在 `apps/web/tailwind.config.ts`，色票以 brand pink/light 為主；圖片放在 `apps/web/public/sweets`.

## 7. 部署拓樸

| 模組 | 平台 | 重點 |
| ---- | ---- | ---- |
| Backend (`apps/server`) | Railway 服務 `night`（project considerate-gentleness） | `Makefile backend` 會先同步 `.env` 變數再 `railway up`；`make backend-migrate` 會啟動 `.venv` 後執行 `python manage.py migrate`。 |
| Frontend (`apps/web`) | Vercel | `make frontend` 透過 `npx vercel deploy --prod`，需確保 `NEXT_PUBLIC_*` 環境變數同步。 |
| DB | Railway MySQL (`night` schema) | 若 schema 未建立需先 `CREATE DATABASE night;`，否則 migrations 會噴 `OperationalError 1049`。 |
| 靜態資產 | Vercel / CDN | 需確保 `/sweets/<slug>/<filename>` 可公開存取，或同步調整前端取用路徑。 |

## 8. 維運 / 安全

- JWT secret 由環境變數 `JWT_SECRET` 提供；更換後需讓 Web 重新登入。
- `sweet_tab` 與 `location_tab` 不使用 DB 層級外鍵，應用程式更新時需一併維持資料完整性。
- `import_sweets` 預設啟用 OCR（pytesseract），若未安裝會自動略過；部署時可關閉以節省資源。
- `scripts/sync_env_to_railway.py` 透過批次 `railway variables --skip-deploys` 避免 rate limit，可視需求調整 `chunk_pairs`。
- 建議針對 `/api/*` 加上 Cloudflare 應用層防護，減少惡意呼叫。

## 9. 測試策略

- Backend：`apps/server/api/tests/test_api.py` 針對登入、甜心列表、預約與積分流程撰寫 DRF 測試，可由 `python manage.py test` 執行。
- Frontend：`apps/web/tests` 以 Vitest + Testing Library 撰寫 UI 單元測試；`tests/e2e` 使用 Playwright（需設定測試用 API）。
- 建議於 CI 先跑 Python 測試、再跑 `npm run test` 與 `npm run test:e2e`，最後才部署。

## 10. 後續擴充建議

- LINE Pay / 金流：於預約流程加入訂金與退款機制。
- Sweet CMS：建立後台介面管理 `sweet_tab` 與 `location_tab`，減少手動編輯 `res/` 檔案。
- 分析：將預約 / 積分資料匯入 BigQuery 或其他 BI 工具。
- 多語系：利用 Next.js i18n + Django 翻譯，服務國際客戶。

---

更多部署細節請參考 `docs/DEPLOYMENT.md` 與 `AGENTS.md`，並善用 `scripts/start-backend.sh`, `npm run dev:web` 進行本地開發。

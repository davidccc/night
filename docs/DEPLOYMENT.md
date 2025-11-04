# 部署指南（Railway + Vercel）

本文說明如何將 Django 後端部署到 **Railway**，並將 Next.js 前端部署到 **Vercel**。預設資料庫為 Railway 的 MySQL Plugin，若改用其他 MySQL 供應商則調整 `DATABASE_URL` 即可。

---

## 1. 必要環境變數

| 變數 | 範圍 | 說明 |
| ---- | ---- | ---- |
| `DJANGO_SECRET_KEY` | 後端 | Django SECRET_KEY，建議使用高熵亂數 |
| `DJANGO_DEBUG` | 後端 (可選) | 調試模式，生產請設為 `false` |
| `ALLOWED_HOSTS` | 後端 | 可接受的 Host 名稱，以逗號分隔；Railway 可設 `*` 或指定域名 |
| `DATABASE_URL` | 後端 | MySQL 連線字串，Railway Plugin 可直接複製 `MYSQL_PUBLIC_URL` |
| `JWT_SECRET` | 後端 | JWT 簽章金鑰，需與前端一致 |
| `LINE_CHANNEL_ACCESS_TOKEN` | 後端 | LINE Messaging API channel access token |
| `LINE_CHANNEL_SECRET` | 後端 | LINE Messaging API channel secret |
| `LINE_LOGIN_CHANNEL_ID` | 後端 / 前端 | LINE Login channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | 後端 | LINE Login channel secret |
| `BASE_URL` | 後端 | 後端公開網址，例如 `https://your-app.up.railway.app` |
| `CORS_ORIGIN` | 後端 | 允許的前端來源，多個以逗號分隔 (例：`https://your-web.vercel.app`) |
| `LIFF_BASE_URL` | 後端 | LIFF 頁面網址（通常是 Vercel 網址） |
| `TIME_ZONE` | 後端 | 時區，預設 `Asia/Taipei` |
| `NEXT_PUBLIC_API_BASE_URL` | 前端 | 指向後端 API（與 `BASE_URL` 相同） |

> 本地開發可複製 `.env.example` 後依實際需求調整；在 Railway / Vercel 上請改於控制台建立相同變數。

---

## 2. 後端部署（Railway）

### 2.1 安裝與登入 CLI
```bash
curl -fsSL https://railway.com/install.sh | sh
railway login
railway link -p <YOUR_PROJECT_ID>
```

### 2.2 建立 MySQL Plugin
1. 前往 Railway 專案頁面 → `New Plugin` → 選擇 **MySQL**。
2. 建立完成後複製 `MYSQL_PUBLIC_URL`，貼到 `DATABASE_URL` 變數。

### 2.3 新增後端服務
1. 在 Railway 介面點 `+ New Service` → 選擇 **Dockerfile**。
2. 服務名稱建議使用 `night`。
3. Build 設定：
   - Dockerfile path：`Dockerfile.server`
   - Context：`./`
4. 儲存後，在 **Variables** 中新增前述所有後端變數。

### 2.4 建置與部署
```bash
make backend
```
此指令會先將 `.env` 內的環境變數同步到 Railway 的 `night` 服務，再觸發部署。部署完成後即可於服務首頁看到公開網址，例如 `https://night-production-xxxxx.up.railway.app`。請將此網址填回 `BASE_URL` 與前端 `NEXT_PUBLIC_API_BASE_URL`。

### 2.5 執行資料庫遷移
```bash
railway run --service night "python manage.py migrate"
```
此指令會在雲端環境內執行 Django migrations，使資料表結構與 models 同步。

### 2.6 設定 LINE Webhook / LIFF
1. Webhook URL：`https://your-app.up.railway.app/webhook`
2. LINE Login Callback URL：`https://your-app.up.railway.app/line/callback`
3. LIFF Endpoint：`https://your-web.vercel.app`

---

## 3. 前端部署（Vercel）

### 3.1 建立 Vercel 專案
1. 前往 [Vercel](https://vercel.com/) → `New Project` → 匯入此 Git repo。
2. Root Directory 請選擇 `apps/web`。
3. 建置設定：
   - Build Command：`npm run build:web`
   - Install Command（預設即可）：`npm install`
4. 在 `Environment Variables` 新增：
   - `NEXT_PUBLIC_API_BASE_URL` = Railway 後端公開網址
   - （如需）`LINE_LOGIN_CHANNEL_ID` 等前端使用的變數。

### 3.2 部署與驗證
1. 第一次部署完成後會取得類似 `https://your-web.vercel.app` 的網址。
2. 將此網址更新至 Railway 的 `CORS_ORIGIN`、`LIFF_BASE_URL`，並於 LINE Console 的 LIFF Endpoint 使用此網址。
3. 若有設定自訂網域，可在 Vercel → `Domains` 綁定。

---

## 4. 常見檢查項目

| 情境 | 檢查項目 |
| ---- | -------- |
| Webhook 無回應 | 確認 Railway 服務已公開、環境變數填寫正確、LINE Webhook URL 使用 HTTPS |
| LIFF 登入卡住 | Callback URL 是否為 `${BASE_URL}/line/callback`；前端 `NEXT_PUBLIC_API_BASE_URL` 是否指向同一網域；`LINE_LOGIN_*` 變數是否一致 |
| CORS 失敗 | Railway `CORS_ORIGIN` 是否包含 Vercel 網域；Django 重新部署後是否生效 |
| 資料庫連線錯誤 | `DATABASE_URL` 是否為 Railway 提供的 public proxy；若改用其它 MySQL，需確保 IP 白名單與 TLS 設定 |
| 需要定時 migrate | 可在 Railway 建立自動化工作或於部署流程加入 `railway run --service night "python manage.py migrate"` |

---

## 5. 進階建議
- 將 `scripts/start-backend.sh` 與 `.env` 當作開發環境專用，正式部署只透過 Railway/Vercel 控制台管理變數。
- 若要執行 E2E 測試，可在本地啟動 Playwright（它會以 `http://localhost:3000` 為預設 base URL，無需再設 `E2E_BASE_URL`）。
- 需要生產等級效能時，可在 `Dockerfile.server` 改用 Gunicorn / Uvicorn，並在 Railway Start Command 設為 WSGI/ASGI 伺服器。

部署成功後，即可從 LINE LIFF 導向 Vercel 前端，並透過 Railway 後端處理 Webhook 與 API。祝順利！

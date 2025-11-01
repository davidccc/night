# 小夜 LINE Chatbot MVP

以 Express + LINE Messaging API 打造的聊天助理，提供「甜心列表」、「預約規則」、「真人客服」三大功能，符合專案功能規格書的 MVP 要求。

## 功能總覽

- Webhook 事件處理：依照使用者輸入關鍵字回覆 Flex 或文字訊息。
- Flex Carousel：動態載入 `flex/sweet.json`，生成甜心輪播卡片。
- 靜態資源：`public/images` 內的圖片會自動對外提供，Flex 也可指向這些檔案。
- Health Check：`GET /healthz` 回傳 `ok`，方便 Render/Railway 監控。
- 環境變數管理：使用 `.env` 管理 LINE credentials 與部署設定。

## 快速開始

```bash
npm install
cp .env.example .env   # 填入 CHANNEL_ACCESS_TOKEN / CHANNEL_SECRET / BASE_URL
npm run dev            # nodemon 開發模式
# 或 npm start         # production 模式
```

伺服器啟動後預設監聽 `PORT`（預設 3000）。健康檢查可透過 `GET http://localhost:3000/healthz` 驗證。

## 必填環境變數

| 變數 | 說明 |
| ---- | ---- |
| `CHANNEL_ACCESS_TOKEN` | LINE Messaging API Channel access token |
| `CHANNEL_SECRET` | LINE Messaging API Channel secret |
| `PORT` | 服務埠號，預設 3000 |
| `BASE_URL` | 部署 URL，顯示在根目錄資訊回傳 |

> 開發環境請從 LINE Developers Console 複製 token/secret，並在部署平台（Render / Railway / Vercel / Heroku）設定相同環境變數。

## Webhook 設定流程

1. 部署伺服器（例如 Render）。
2. 在 LINE Developers Console → Messaging API → Webhook URL 填入 `https://your-domain/webhook`。
3. 點選 Verify 確認成功。
4. 將 LINE 官方帳號與此 Webhook 綁定，並設定 Rich Menu 按鈕對應字串：
   - 官網看更多 → `https://www.google.com`
   - 甜心列表 → 傳送文字「甜心列表」
   - 預約規則 → 傳送文字「預約規則」
   - 真人客服 → 傳送文字「客服」

## Flex Message 資料維護

- 甜心列表儲存在 `flex/sweet.json`。
- 更新 JSON 後程式會自動重新載入（檔案監聽會清除快取）。
- 每個甜心包含 `id`, `name`, `desc`, `image`, `link`。
- 若 `image` 欄位填相對路徑（例如 `an-cheng.jpg` 或 `images/an-cheng.jpg`），系統會自動解析成 `BASE_URL` 下的靜態網址，例如 `https://<base>/images/an-cheng.jpg`。
- 需要自備圖片時，把檔案放在 `public/images`（或再分子資料夾），並保持 `.env` 的 `BASE_URL` 指向對外可存取的網域。

範例結構：

```json
[
  {
    "id": "mimi",
    "name": "Mimi 💗",
    "desc": "活潑健談，擅長旅遊話題",
    "image": "https://picsum.photos/600?random=1",
    "link": "https://www.google.com/search?q=Mimi"
  }
]
```

## 主要 API

| Method | Path | 說明 |
| ------ | ---- | ---- |
| `POST` | `/webhook` | 接收 LINE 事件，回覆甜心列表 / 規則 / 客服文字 |
| `GET` | `/healthz` | 健康檢查 |
| `GET` | `/` | 伺服器資訊（狀態、Base URL） |

## 部署建議

- Node.js 18+。
- Render/Railway/Vercel/Heroku 任一平台。
- 確保使用 HTTPS（平台預設）。
- 部署後需重新 Verify Webhook 才會生效。

## 開發注意事項

- 若缺少 `CHANNEL_ACCESS_TOKEN` 或 `CHANNEL_SECRET`，伺服器將拒絕啟動以避免 webhook 驗證失敗。
- 伺服器會在 console 中列印收到的事件種類與錯誤，方便除錯。
- 可依需求擴充資料來源（例如改連接資料庫）或新增推播機制。

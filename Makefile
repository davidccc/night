.PHONY: setup backend backend-migrate backend-logs frontend frontend-clean import-sweets import-sweets-dry-run

ROOT_DIR := $(abspath .)

# 初始化專案（安裝前端依賴）
setup:
	npm install

# 部署後端至 Railway，假設已 link 並設定 service=night
backend:
	python3 scripts/sync_env_to_railway.py --service night
	railway up --service night

# 在 Railway 後端執行 Django migrations
backend-migrate:
	railway run --service night bash -lc 'source .venv/bin/activate && cd apps/server && python manage.py migrate --noinput'

# 查看 Railway 後端日誌（流式）
backend-logs:
	railway logs --service night --lines 100

# 從 res 資料夾匯入甜心資料與圖片
import-sweets:
	bash -lc "source .venv/bin/activate && cd apps/server && python manage.py import_sweets --source-dir '$(ROOT_DIR)/res'"

import-sweets-dry-run:
	bash -lc "source .venv/bin/activate && cd apps/server && python manage.py import_sweets --dry-run --source-dir '$(ROOT_DIR)/res'"

# 部署前端至 Vercel
frontend:
	npx vercel deploy --prod

# 清除本地 node_modules 與暫存檔
frontend-clean:
	rm -rf node_modules apps/web/.next

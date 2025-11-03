.PHONY: setup backend backend-migrate backend-logs frontend frontend-clean

# 初始化專案（安裝前端依賴）
setup:
	npm install

# 部署後端至 Railway，假設已 link 並設定 service=night
backend:
	railway up --service night

# 在 Railway 後端執行 Django migrations
backend-migrate:
	railway run --service night "python manage.py migrate"

# 查看 Railway 後端日誌（流式）
backend-logs:
	railway logs --service night --lines 100

# 部署前端至 Vercel
frontend:
	vercel deploy --prod --cwd apps/web

# 清除本地 node_modules 與暫存檔
frontend-clean:
	rm -rf node_modules apps/web/.next

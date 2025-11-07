# Night Project – Agent Handover

This document captures the current project state so that the next agent can pick up smoothly.

## Repository Snapshot (2025-11-05)
- Backend: Django 5 with custom apps under `apps/server`.
  - Database tables now use singular names with `_tab` suffix (`user_tab`, `sweet_tab`, `booking_tab`, `reward_log_tab`).
  - New `Location` model (`location_tab`) is linked to sweets; `/api/sweets` accepts an optional `location` query parameter.
  - Seed migration `0002_seed_kaohsiung_sweets` loads five Kaohsiung sweets; `0003_location_and_table_updates` introduces locations and renames tables.
  - `0004_sweet_additional_fields` adds structured profile columns (國籍、年齡、身高/體重、時間、費用等) and an `update_time` timestamp.
  - `0005_remove_fk_constraints` 關閉所有外鍵資料庫約束（改由應用程式層控制資料完整性）。
  - Management command `python manage.py import_sweets` ingests `/res/<地區>` text & image assets, copies photos到 `apps/web/public/sweets/<slug>/`，並更新對應 `sweet_tab`.
- 每位甜心可透過 `Sweet.code` 取得代號（地區縮寫 + 4 位 base36），已透過 API (`code`) 提供前端使用。
- Frontend: Next.js app under `apps/web`.
  - Sweet list page supports location filtering, displays location info, and includes an “立即預約” button that routes to `/booking?sweetId=<id>`.
  - Sweet cards現在會顯示詳細欄位（國籍、年齡、鐘數價格、更新時間）及甜心代號，圖片使用 `object-contain` 顯示完整畫面，並提供「線上預約 / 客服預約」雙按鈕（客服按鈕會複製訊息並透過 `NEXT_PUBLIC_LINE_CUSTOMER_OA_ID`/`NEXT_PUBLIC_LINE_CUSTOMER_URL` 開啟 LINE 官方帳號）。
  - Booking page pre-selects the sweet based on the query parameter carried via Suspense-friendly `bookingForm.tsx`.
  - API layer (`app/lib/api.ts`) normalises snake_case responses、曝露新增欄位。
- Tooling:
  - `Makefile` targets call `railway` CLI; `backend-migrate` activates `.venv` before running `python manage.py migrate`.
  - `.env` database points to `.../night` (new schema name).

## Environment Notes
- Python virtual environment located at `.venv` (created by `scripts/start-backend.sh`).
- Railway project: `considerate-gentleness`, service `night`. Rate limiting can trigger if setting many variables quickly; consider batching with `railway variables --skip-deploys`.
- Database: `.env` expects schema name `night`. Create the schema on MySQL (`CREATE DATABASE night;`) before applying migrations, otherwise migrations will fail with `OperationalError (1049, "Unknown database 'night'")`. If you prefer to keep using the existing `railway` database, revert the name in `.env` and update remote env vars accordingly.

## Pending Actions / Risks
1. **Database Migration** – Ensure the remote DB contains the new `night` schema. Run:
   ```bash
   make backend-migrate
   ```
   If the schema is missing, create it first or point `DATABASE_URL` back to the existing schema before deploying.
2. **Static Files Exposure** – Confirm the deployment serves `/sweets/<slug>/<filename>`（圖片被部署在 `apps/web/public/sweets`）。若使用 CDN 或不同靜態路徑，需要同步調整。
3. **Railway Variable Sync** – `scripts/sync_env_to_railway.py` now batches `--set` updates with `--skip-deploys` to avoid rate limits; adjust `chunk_pairs` size if more throttling occurs.
4. **Frontend Verification** – After deploying新 API，測試篩選、代號顯示與雙預約按鈕（線上表單、LINE 客服）是否正常；若要直接進客服訊息，務必設定 `NEXT_PUBLIC_LINE_CUSTOMER_OA_ID` 或 `NEXT_PUBLIC_LINE_CUSTOMER_URL`。

## Quick Start Commands
```bash
# Backend (local)
bash scripts/start-backend.sh  # installs deps, runs migrations, starts server

# Frontend (local)
npm run dev:web  # runs Next.js app on http://localhost:3000

# Migrations on Railway
make backend-migrate

# Deployments
make backend   # sync .env vars then railway up
make frontend  # npx vercel deploy --prod
```

## Helpful References
- Backend settings: `apps/server/nightserver/settings.py`
- API serializers/services: `apps/server/api/serializers.py`, `apps/server/api/services.py`
- Frontend sweet list: `apps/web/app/(pages)/sweet/page.tsx`
- Booking page: `apps/web/app/(pages)/booking/page.tsx`
- Deployment guide: `docs/DEPLOYMENT.md`

Feel free to append to this document as the project evolves.
- Booking page now renders the form inside a Suspense boundary (`bookingForm.tsx`), fixing the `useSearchParams` build error during Vercel deploys.

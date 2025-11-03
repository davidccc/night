#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# 基本設定（可直接在此調整，亦可於執行前 export 環境變數覆寫）
# -----------------------------------------------------------------------------
: "${GCP_PROJECT_ID:=night-king-477010}"                  # 必填：GCP 專案 ID
: "${GCP_REGION:=asia-northeast1}"            # 必填：部署地區，例如 asia-northeast1

: "${ARTIFACT_REPO:=night-king-registry}"      # Artifact Registry 名稱
: "${SERVER_IMAGE_NAME:=night-king-server}"    # 後端映像名稱
: "${WEB_IMAGE_NAME:=night-king-web}"          # 前端映像名稱
: "${DEPLOY_TAG:=$(date +%Y%m%d%H%M%S)}" # 自動 tag，可自行修改
: "${DOCKER_PLATFORM:=linux/amd64}"

: "${CLOUD_RUN_SERVER_SERVICE:=night-king-server}" # Cloud Run 後端服務名稱
: "${CLOUD_RUN_WEB_SERVICE:=night-king-web}"       # Cloud Run 前端服務名稱

: "${SERVER_CPU:=1}"
: "${SERVER_MEMORY:=1Gi}"
: "${ENV_FILE:=.env}"

build_env_vars() {
  local file="$1"
  shift
  local keys=("$@")
  local pairs=()

  if [[ ! -f "${file}" ]]; then
    echo ""
    return
  fi

  for key in "${keys[@]}"; do
    local value
    value="$(grep -E "^${key}=" "${file}" | tail -n1 | cut -d'=' -f2-)"
    if [[ -n "${value}" ]]; then
      pairs+=("${key}=${value}")
    fi
  done

  if [[ ${#pairs[@]} -gt 0 ]]; then
    (IFS=','; echo "${pairs[*]}")
  else
    echo ""
  fi
}

server_keys=(
  DATABASE_URL
  JWT_SECRET
  LINE_CHANNEL_ACCESS_TOKEN
  LINE_CHANNEL_SECRET
  LINE_LOGIN_CHANNEL_ID
  LINE_LOGIN_CHANNEL_SECRET
  BASE_URL
  CORS_ORIGIN
  LIFF_BASE_URL
)

web_keys=(
  NEXT_PUBLIC_API_BASE_URL
)

if [[ -z "${SERVER_ENV_VARS:-}" ]]; then
  env_values="$(build_env_vars "${ENV_FILE}" "${server_keys[@]}")"
  if [[ -n "${env_values}" ]]; then
    SERVER_ENV_VARS="NODE_ENV=production,${env_values}"
  else
    SERVER_ENV_VARS="NODE_ENV=production"
  fi
fi

: "${SERVER_SECRET_BINDINGS:=}"          # 例如 KEY=secret-name:latest,JWT_SECRET=jwt-secret:1
: "${SERVER_ALLOW_UNAUTH:=false}"
: "${CLOUD_SQL_INSTANCE:=}"              # 例如 project:region:instance
: "${SERVER_VPC_CONNECTOR:=}"            # 例如 projects/project/locations/region/connectors/connector
: "${SERVER_SERVICE_ACCOUNT:=}"          # 服務帳號 email

: "${WEB_CPU:=1}"
: "${WEB_MEMORY:=512Mi}"
: "${WEB_ENV_VARS:=}"
: "${WEB_SECRET_BINDINGS:=}"
: "${WEB_ALLOW_UNAUTH:=true}"
: "${WEB_SERVICE_ACCOUNT:=${SERVER_SERVICE_ACCOUNT}}"

if [[ -z "${WEB_ENV_VARS}" ]]; then
  env_values="$(build_env_vars "${ENV_FILE}" "${web_keys[@]}")"
  if [[ -n "${env_values}" ]]; then
    WEB_ENV_VARS="${env_values}"
  fi
fi

# -----------------------------------------------------------------------------
# 共用函式
# -----------------------------------------------------------------------------
require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Environment variable ${name} is required." >&2
    exit 1
  fi
}

require_var "GCP_PROJECT_ID"
require_var "GCP_REGION"

REGISTRY_HOST="${REGISTRY_HOST:-${GCP_REGION}-docker.pkg.dev}"

SERVER_IMAGE_URI="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${SERVER_IMAGE_NAME}:${DEPLOY_TAG}"
WEB_IMAGE_URI="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${WEB_IMAGE_NAME}:${DEPLOY_TAG}"
SERVER_IMAGE_CACHE="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${SERVER_IMAGE_NAME}:cache"
WEB_IMAGE_CACHE="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${WEB_IMAGE_NAME}:cache"

SERVER_SERVICE="${CLOUD_RUN_SERVER_SERVICE}"
WEB_SERVICE="${CLOUD_RUN_WEB_SERVICE}"

echo "Using project ${GCP_PROJECT_ID} in ${GCP_REGION}"
gcloud config set project "${GCP_PROJECT_ID}" >/dev/null

if ! gcloud artifacts repositories describe "${ARTIFACT_REPO}" --location "${GCP_REGION}" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository ${ARTIFACT_REPO} in ${GCP_REGION}"
  gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker \
    --location "${GCP_REGION}" \
    --description="Container images for the Night-king LINE OMO project" >/dev/null
fi

echo "Authenticating Docker with ${REGISTRY_HOST}"
gcloud auth configure-docker "${REGISTRY_HOST}" >/dev/null

export DOCKER_BUILDKIT=1

pull_if_exists() {
  local image="$1"
  if docker pull "${image}" >/dev/null 2>&1; then
    echo "Pulled cache image ${image}"
  fi
}

echo "Building server image ${SERVER_IMAGE_URI} for ${DOCKER_PLATFORM}"
pull_if_exists "${SERVER_IMAGE_CACHE}"
docker build \
  --platform="${DOCKER_PLATFORM}" \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from="${SERVER_IMAGE_CACHE}" \
  -f Dockerfile.server \
  -t "${SERVER_IMAGE_URI}" \
  -t "${SERVER_IMAGE_CACHE}" .

echo "Pushing server image"
docker push "${SERVER_IMAGE_URI}"
docker push "${SERVER_IMAGE_CACHE}" >/dev/null

echo "Building web image ${WEB_IMAGE_URI} for ${DOCKER_PLATFORM}"
pull_if_exists "${WEB_IMAGE_CACHE}"
docker build \
  --platform="${DOCKER_PLATFORM}" \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from="${WEB_IMAGE_CACHE}" \
  -f Dockerfile.web \
  -t "${WEB_IMAGE_URI}" \
  -t "${WEB_IMAGE_CACHE}" .

echo "Pushing web image"
docker push "${WEB_IMAGE_URI}"
docker push "${WEB_IMAGE_CACHE}" >/dev/null

deploy_server() {
  local args=(
    "${SERVER_SERVICE}"
    --image "${SERVER_IMAGE_URI}"
    --region "${GCP_REGION}"
    --platform managed
    --cpu "${SERVER_CPU}"
    --memory "${SERVER_MEMORY}"
    --ingress internal-and-cloud-load-balancing
  )

  if [[ -n "${SERVER_ENV_VARS}" ]]; then
    args+=(--set-env-vars "${SERVER_ENV_VARS}")
  fi

  if [[ -n "${SERVER_SECRET_BINDINGS}" ]]; then
    args+=(--set-secrets "${SERVER_SECRET_BINDINGS}")
  fi

  if [[ -n "${CLOUD_SQL_INSTANCE}" ]]; then
    args+=(--add-cloudsql-instances "${CLOUD_SQL_INSTANCE}")
  fi

  if [[ -n "${SERVER_VPC_CONNECTOR}" ]]; then
    args+=(--vpc-connector "${SERVER_VPC_CONNECTOR}")
  fi

  if [[ -n "${SERVER_SERVICE_ACCOUNT}" ]]; then
    args+=(--service-account "${SERVER_SERVICE_ACCOUNT}")
  fi

  if [[ "${SERVER_ALLOW_UNAUTH}" == "true" ]]; then
    args+=(--allow-unauthenticated)
  fi

  echo "Deploying Cloud Run service ${SERVER_SERVICE}"
  gcloud run deploy "${args[@]}"
}

deploy_web() {
  local args=(
    "${WEB_SERVICE}"
    --image "${WEB_IMAGE_URI}"
    --region "${GCP_REGION}"
    --platform managed
    --cpu "${WEB_CPU}"
    --memory "${WEB_MEMORY}"
  )

  if [[ -n "${WEB_ENV_VARS}" ]]; then
    args+=(--set-env-vars "${WEB_ENV_VARS}")
  fi

  if [[ -n "${WEB_SECRET_BINDINGS}" ]]; then
    args+=(--set-secrets "${WEB_SECRET_BINDINGS}")
  fi

  if [[ -n "${WEB_SERVICE_ACCOUNT}" ]]; then
    args+=(--service-account "${WEB_SERVICE_ACCOUNT}")
  fi

  if [[ "${WEB_ALLOW_UNAUTH}" == "true" ]]; then
    args+=(--allow-unauthenticated)
  fi

  echo "Deploying Cloud Run service ${WEB_SERVICE}"
  gcloud run deploy "${args[@]}"
}

deploy_server
deploy_web

cat <<EOF

✅ Deployment complete

Server image: ${SERVER_IMAGE_URI}
Web image:    ${WEB_IMAGE_URI}

Cloud Run services:
  - ${SERVER_SERVICE}
  - ${WEB_SERVICE}

Remember to:
  • Ensure required environment variables or Secret Manager bindings are set.
  • Grant the services access to Cloud SQL (if used) and enable the SQL Admin API.
  • Run database migrations (e.g. npm run prisma:migrate) before routing traffic.

EOF

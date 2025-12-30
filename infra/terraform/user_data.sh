#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${project_name}"
REPO_URL="${repo_url}"
APP_DIR="${app_dir}"
APP_PORT="${app_port}"
NODE_VERSION="${node_version}"
BRANCH="${branch}"

ENV_DIR="/etc/${project_name}"
ENV_FILE="${ENV_DIR}/duka-replica.env"

APP_ROOT="/opt/${project_name}"
REPO_PATH="${APP_ROOT}/repo"

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl git

curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

mkdir -p "${APP_ROOT}"
if [ ! -d "${REPO_PATH}/.git" ]; then
  git clone "${REPO_URL}" "${REPO_PATH}"
fi

cd "${REPO_PATH}"
git fetch --all
git checkout "${BRANCH}"
git pull

cd "${REPO_PATH}/${APP_DIR}"
npm ci || npm install

mkdir -p "${ENV_DIR}"
if [ ! -f "${ENV_FILE}" ]; then
  cat > "${ENV_FILE}" <<'EOF'
# Required
# SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
# RESEND_API_KEY=
# JWT_SECRET=

# Optional
# FROM_EMAIL=orders@kejayacapo.shop
# ADMIN_EMAIL=admin@kejayacapo.shop
# MPESA_ENVIRONMENT=production
# MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
EOF
  chmod 600 "${ENV_FILE}"
fi

cat > /etc/systemd/system/${project_name}.service <<EOF
[Unit]
Description=${project_name} Node Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${REPO_PATH}/${APP_DIR}
Environment=PORT=${APP_PORT}
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chown -R ubuntu:ubuntu "${APP_ROOT}" "${ENV_DIR}"

systemctl daemon-reload
systemctl enable ${project_name}
systemctl restart ${project_name}

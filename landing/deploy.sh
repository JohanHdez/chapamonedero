#!/usr/bin/env bash
#
# Deploy / actualización de Chapa Monedero en el VPS (Hostinger).
#
# Uso (desde la carpeta del proyecto en el VPS):
#   cd /var/www/chapamonedero/landing
#   ./deploy.sh
#
# Qué hace: trae el código (si es repo git), instala dependencias, compila el
# build de producción (a .next-build) y (re)carga la app con PM2 sin downtime.
#
# Requisitos previos (una sola vez en el VPS):
#   - Node 18+, npm, pm2 instalados.
#   - landing/.env.local creado con las credenciales de PRODUCCIÓN
#     (MP_ACCESS_TOKEN_CO/MX, MP_WEBHOOK_SECRET_CO/MX, NEXT_PUBLIC_SITE_URL).
#     ⚠️ .env.local NO se versiona; vive solo en el VPS.
#   - Nginx como reverse proxy a localhost:3000 + HTTPS (certbot).
#
set -euo pipefail

APP_NAME="chapamonedero"
# Directorio del proyecto: la carpeta donde está este script.
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "==> Proyecto: $APP_DIR"

# 1) Traer código (solo si es un repositorio git; si subes por SFTP, se omite).
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> git pull (fast-forward)"
  git pull --ff-only
else
  echo "==> No es repo git: se asume que el código ya está actualizado (SFTP)."
fi

# 2) Dependencias reproducibles (usa package-lock.json).
echo "==> npm ci"
npm ci

# 3) Build de producción (sale a .next-build, no pisa el .next de dev).
echo "==> npm run build"
npm run build

# 4) (Re)cargar con PM2.
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "==> pm2 reload (recarga sin downtime)"
  pm2 reload ecosystem.config.js --update-env
else
  echo "==> pm2 start (primer arranque)"
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "==> Estado:"
pm2 status "$APP_NAME"
echo "==> Deploy completado."

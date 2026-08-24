#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE ACTUALIZACIÓN - TIENDA SINGLE BINARY (Go + Embedded SPA)
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Reparar permisos de archivos si fueron creados por root
if [ -n "$SUDO_USER" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR" 2>/dev/null || true
else
    chown -R $(id -u):$(id -g) "$PROJECT_DIR" 2>/dev/null || true
fi

echo -e "${YELLOW}🔄 Sincronizando con la última versión de GitHub...${NC}"

cd "$PROJECT_DIR"

# Backup automático de base de datos viva antes de sincronizar con git
if [ -f "$PROJECT_DIR/backend/ecommerce.db" ]; then
    mkdir -p "$PROJECT_DIR/backend/backups"
    cp "$PROJECT_DIR/backend/ecommerce.db" "$PROJECT_DIR/backend/backups/ecommerce_$(date +%Y%m%d_%H%M%S).bak" 2>/dev/null || true
    cp "$PROJECT_DIR/backend/ecommerce.db" "$PROJECT_DIR/backend/.ecommerce.db.live" 2>/dev/null || true
fi

git fetch origin main
git checkout -f origin/main 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
git pull origin main

# Restaurar base de datos viva para garantizar 0 pérdida de configuración y productos
if [ -f "$PROJECT_DIR/backend/.ecommerce.db.live" ]; then
    cp "$PROJECT_DIR/backend/.ecommerce.db.live" "$PROJECT_DIR/backend/ecommerce.db" 2>/dev/null || true
    rm -f "$PROJECT_DIR/backend/.ecommerce.db.live" 2>/dev/null || true
fi

# 2. Asegurar permisos en directorio de subidas
mkdir -p "$PROJECT_DIR/backend/uploads"
chmod -R 777 "$PROJECT_DIR/backend/uploads" 2>/dev/null || true

echo -e "\n${YELLOW}📦 [1/2] Compilando Frontend optimizado...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --no-audit --no-fund
npm run build

echo -e "\n${YELLOW}🐹 [2/2] Compilando Binario Go Single Binary...${NC}"
cd "$PROJECT_DIR/backend"
go mod tidy
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$PROJECT_DIR/backend/server" .
chmod +x "$PROJECT_DIR/backend/server"

# 3. Restaurar permisos de usuario
if [ -n "$SUDO_USER" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR" 2>/dev/null || true
fi

echo -e "\n${YELLOW}🚀 Reiniciando servicio 'tienda.service'...${NC}"
sudo systemctl daemon-reload 2>/dev/null || systemctl daemon-reload 2>/dev/null || true
sudo systemctl restart tienda.service || systemctl restart tienda.service

echo -e "\n${GREEN}✅ ¡Tienda actualizada y en línea exitosamente!${NC}"

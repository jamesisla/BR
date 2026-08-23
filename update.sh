#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE ACTUALIZACIÓN - TIENDA SINGLE BINARY (Go + Embedded SPA)
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -n "$SUDO_USER" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR" 2>/dev/null || true
fi

echo -e "${YELLOW}🔄 Actualizando Tienda E-Commerce desde GitHub...${NC}"

cd "$PROJECT_DIR"
git pull origin main

echo -e "\n${YELLOW}📦 [1/2] Compilando Frontend optimizado...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --no-audit --no-fund
npm run build

echo -e "\n${YELLOW}🐹 [2/2] Compilando Binario Go Single Binary...${NC}"
cd "$PROJECT_DIR/backend"
go mod tidy
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$PROJECT_DIR/backend/server" .
chmod +x "$PROJECT_DIR/backend/server"

echo -e "\n${YELLOW}🚀 Reiniciando servicio 'tienda.service'...${NC}"
systemctl restart tienda.service

echo -e "\n${GREEN}✅ ¡Tienda actualizada y en línea exitosamente!${NC}"

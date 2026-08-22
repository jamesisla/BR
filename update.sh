#!/usr/bin/env bash
# ==============================================================================
# 🔄 TIENDA ARTISAN - ACTUALIZADOR AUTOMÁTICO NATIVO DESDE GITHUB
# ==============================================================================

set -e

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=================================================================="
echo "    🔄  ACTUALIZADOR NATIVO DE TIENDA E-COMMERCE (PULL & DEPLOY) "
echo "=================================================================="
echo -e "${NC}"

# Verificar permisos de root / sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Por favor ejecuta este script con sudo o como root:${NC}"
  echo "   sudo bash update.sh"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📥 [1/4] Descargando últimos cambios desde GitHub...${NC}"
git fetch --all
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "main")
echo "Rama actual: $CURRENT_BRANCH"
git pull origin "$CURRENT_BRANCH"

echo -e "\n${YELLOW}🐹 [2/4] Verificando y recompilando Backend Go nativo...${NC}"
cd "$PROJECT_DIR/backend"
go mod tidy
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$PROJECT_DIR/backend/server" ./cmd/server
chmod +x "$PROJECT_DIR/backend/server"

echo "Reiniciando servicio backend Go nativo..."
systemctl restart tienda-backend
echo -e "${GREEN}✅ Backend Go actualizado y reiniciado en < 1 segundo.${NC}"

echo -e "\n${YELLOW}🟢 [3/4] Verificando y recompilando Frontend Next.js nativo...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --no-audit --no-fund
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
npm run build

# Copiar assets estáticos a la carpeta standalone
mkdir -p "$PROJECT_DIR/frontend/.next/standalone/public"
mkdir -p "$PROJECT_DIR/frontend/.next/standalone/.next/static"
cp -r "$PROJECT_DIR/frontend/public/." "$PROJECT_DIR/frontend/.next/standalone/public/" 2>/dev/null || true
cp -r "$PROJECT_DIR/frontend/.next/static/." "$PROJECT_DIR/frontend/.next/standalone/.next/static/" 2>/dev/null || true

echo "Reiniciando servicio frontend Next.js nativo..."
systemctl restart tienda-frontend
echo -e "${GREEN}✅ Frontend Next.js actualizado y reiniciado.${NC}"

echo -e "\n${YELLOW}🌐 [4/4] Verificando estado de los servicios nativos...${NC}"
systemctl is-active --quiet tienda-backend && echo -e "  - Backend Go (Nativo):   ${GREEN}ACTIVO (RUNNING)${NC}" || echo -e "  - Backend Go:    ${RED}ERROR${NC}"
systemctl is-active --quiet tienda-frontend && echo -e "  - Frontend Node (Nativo): ${GREEN}ACTIVO (RUNNING)${NC}" || echo -e "  - Frontend Node: ${RED}ERROR${NC}"
systemctl is-active --quiet caddy && echo -e "  - Caddy Proxy (Nativo):  ${GREEN}ACTIVO (RUNNING)${NC}" || echo -e "  - Caddy Proxy:   ${RED}ERROR${NC}"

PUBLIC_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "localhost")

echo -e "\n${GREEN}=================================================================="
echo "    ✨ ¡ACTUALIZACIÓN NATIVA COMPLETADA CON ÉXITO!               "
echo "=================================================================="
echo -e "${NC}"
echo -e "Tienda disponible en: ${CYAN}http://$PUBLIC_IP/${NC}"
echo "=================================================================="

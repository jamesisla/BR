#!/usr/bin/env bash
# ==============================================================================
# 🕊️ TIENDA ARTISAN - INSTALADOR NATIVO PARA ORACLE CLOUD (OCI)
# Optimizado para: Ubuntu Minimal (1 vCPU, 1 GB RAM - E2.1.Micro)
# Modo: 100% NATIVO (Sin Docker, Servicios Systemd, Máximo Rendimiento)
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
echo "    🕊️  INSTALADOR NATIVO DE TIENDA E-COMMERCE (GO + NEXT.JS)   "
echo "    Optimizado para OCI Always Free E2.1.Micro (1GB RAM)          "
echo "    100% NATIVO (Servicios Systemd + Caddy + SQLite WAL)         "
echo "=================================================================="
echo -e "${NC}"

# 1. Verificar permisos de root / sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Por favor ejecuta este script con sudo o como root:${NC}"
  echo "   sudo bash install.sh"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}📁 Directorio del proyecto:${NC} $PROJECT_DIR"

# 2. Configurar Memoria SWAP (Crucial para evitar OOM Killer en 1GB RAM durante build)
echo -e "\n${YELLOW}⚙️  [1/7] Configurando memoria SWAP (2GB) para estabilidad del sistema...${NC}"
SWAP_EXISTS=$(swapon --show | wc -l)
if [ "$SWAP_EXISTS" -le 1 ]; then
    echo "Creando archivo swap de 2GB..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    sysctl vm.swappiness=10
    echo "vm.swappiness=10" >> /etc/sysctl.d/99-swap.conf
    echo -e "${GREEN}✅ Swap de 2GB configurado correctamente.${NC}"
else
    echo -e "${GREEN}✅ Memoria swap ya presente en el sistema.${NC}"
fi

# 3. Actualizar sistema e instalar paquetes esenciales
echo -e "\n${YELLOW}📦 [2/7] Instalando paquetes base y dependencias del sistema...${NC}"
export DEBIAN_FRONTEND=noninteractive

# Corregir / desactivar posibles llaves PPA rotas de terceros (ej: Microsoft VS Code)
if [ -f /etc/apt/sources.list.d/vscode.list ] || grep -rq "packages.microsoft.com" /etc/apt/sources.list.d/ 2>/dev/null; then
    echo "Corrigiendo llaves GPG de repositorios externos..."
    mkdir -p /etc/apt/trusted.gpg.d /usr/share/keyrings /etc/apt/keyrings
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft.gpg 2>/dev/null || true
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/packages.microsoft.gpg 2>/dev/null || true
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/packages.microsoft.gpg 2>/dev/null || true
    # Obtener llave específica EB3E94ADBE1229CF si sqv la solicita
    gpg --keyserver hkps://keyserver.ubuntu.com --recv-keys EB3E94ADBE1229CF 2>/dev/null && gpg --export EB3E94ADBE1229CF > /etc/apt/trusted.gpg.d/vscode-eb3.gpg 2>/dev/null || true
fi

apt-get update -qq || true
# Nota: NO instalar iptables-persistent junto a ufw porque entran en conflicto de dependencias
apt-get install -y --fix-missing curl wget git build-essential ufw ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# 4. Instalar Go 1.22+ (Si no está instalado o es versión antigua)
echo -e "\n${YELLOW}🐹 [3/7] Verificando / Instalando Go (Golang)...${NC}"
GO_VERSION="1.22.6"
if ! command -v go &> /dev/null || [[ "$(go version)" != *"go1.22"* && "$(go version)" != *"go1.23"* && "$(go version)" != *"go1.24"* ]]; then
    echo "Instalando Go $GO_VERSION oficial para Linux x86_64..."
    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm -f /tmp/go.tar.gz
    ln -sf /usr/local/go/bin/go /usr/bin/go
    ln -sf /usr/local/go/bin/gofmt /usr/bin/gofmt
    echo -e "${GREEN}✅ Go $(go version) instalado.${NC}"
else
    echo -e "${GREEN}✅ Go ya está instalado: $(go version)${NC}"
fi

# 5. Instalar Node.js 20 LTS y npm
echo -e "\n${YELLOW}🟢 [4/7] Verificando / Instalando Node.js 20 LTS y npm...${NC}"
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    apt-get install -y --fix-missing nodejs || true
fi
if ! command -v npm &> /dev/null; then
    echo "Instalando npm..."
    apt-get install -y --fix-missing npm || true
fi
echo -e "${GREEN}✅ Node.js $(node -v 2>/dev/null || echo '') y npm $(npm -v 2>/dev/null || echo '') listos.${NC}"

# 6. Instalar y configurar Caddy (Servidor web nativo ultra-ligero y rápido con SSL automático)
echo -e "\n${YELLOW}🌐 [5/7] Verificando / Instalando Caddy Web Server nativo...${NC}"
if ! command -v caddy &> /dev/null; then
    echo "Instalando Caddy desde repositorio oficial..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes 2>/dev/null || true
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq || true
    apt-get install -y --fix-missing caddy
    echo -e "${GREEN}✅ Caddy instalado con éxito.${NC}"
else
    echo -e "${GREEN}✅ Caddy ya está instalado.${NC}"
fi

# 7. Configurar Firewall OCI (iptables y ufw)
echo -e "\n${YELLOW}🛡️  [6/7] Abriendo puertos en Firewall OCI (22, 80, 443, 3000, 8000)...${NC}"
# Desbloquear puertos en iptables de Oracle Cloud
iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 8000 -j ACCEPT 2>/dev/null || true

# Configurar UFW
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw allow 3000/tcp 2>/dev/null || true
    ufw allow 8000/tcp 2>/dev/null || true
fi
echo -e "${GREEN}✅ Reglas de firewall configuradas.${NC}"

# 8. Compilar y Configurar Backend en Go
echo -e "\n${YELLOW}⚙️  [7/7] Compilando Backend Go nativo y Frontend Next.js nativo...${NC}"

# Crear directorios y variables de entorno backend
mkdir -p "$PROJECT_DIR/backend/uploads"
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    if [ -f "$PROJECT_DIR/backend/.env.example" ]; then
        cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
    else
        cat <<EOF > "$PROJECT_DIR/backend/.env"
PORT=8000
GIN_MODE=release
DATABASE_URL=$PROJECT_DIR/backend/ecommerce.db
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
ADMIN_PASSWORD=admin123
MP_ACCESS_TOKEN=TEST-6447849483321584-051015-8d598585474747474747474747474747-000000000
UPLOAD_DIR=$PROJECT_DIR/backend/uploads
EOF
    fi
fi

cd "$PROJECT_DIR/backend"
echo "Descargando dependencias de Go..."
go mod tidy
echo "Compilando binario de Go nativo de alto rendimiento..."
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$PROJECT_DIR/backend/server" ./cmd/server
chmod +x "$PROJECT_DIR/backend/server"
echo -e "${GREEN}✅ Backend Go compilado exitosamente (binario estático nativo).${NC}"

# Compilar Frontend Next.js
cd "$PROJECT_DIR/frontend"
echo "Instalando dependencias de frontend (npm install)..."
npm install --no-audit --no-fund

echo "Generando build optimizado de producción (Standalone Mode)..."
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
npm run build

# Copiar assets estáticos para ejecución nativa ultraligera en Next.js Standalone
mkdir -p "$PROJECT_DIR/frontend/.next/standalone/public"
mkdir -p "$PROJECT_DIR/frontend/.next/standalone/.next/static"
cp -r "$PROJECT_DIR/frontend/public/." "$PROJECT_DIR/frontend/.next/standalone/public/" 2>/dev/null || true
cp -r "$PROJECT_DIR/frontend/.next/static/." "$PROJECT_DIR/frontend/.next/standalone/.next/static/" 2>/dev/null || true
echo -e "${GREEN}✅ Frontend Next.js compilado exitosamente (Standalone listo).${NC}"

# 9. Crear servicios systemd para auto-arranque y monitoreo nativo
echo -e "\n${YELLOW}🔧 Configurando servicios systemd nativos...${NC}"

# Servicio Backend Go
cat <<EOF > /etc/systemd/system/tienda-backend.service
[Unit]
Description=Tienda E-Commerce Backend (Go High Performance Native)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=$PROJECT_DIR/backend/server
Restart=always
RestartSec=3
Environment=PORT=8000
Environment=GIN_MODE=release
Environment=DATABASE_URL=$PROJECT_DIR/backend/ecommerce.db
Environment=BACKEND_URL=http://localhost:8000
Environment=FRONTEND_URL=http://localhost:3000
Environment=UPLOAD_DIR=$PROJECT_DIR/backend/uploads
Environment=ADMIN_PASSWORD=admin123
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Servicio Frontend Next.js Nativo
cat <<EOF > /etc/systemd/system/tienda-frontend.service
[Unit]
Description=Tienda E-Commerce Frontend (Next.js Standalone Native)
After=network.target tienda-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=/usr/bin/node $PROJECT_DIR/frontend/.next/standalone/server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
Environment=NEXT_PUBLIC_API_URL=http://localhost:8000/api
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Configuración Caddyfile
cat <<EOF > /etc/caddy/Caddyfile
:80 {
    # Proxy para API y uploads del backend Go
    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /static/* {
        reverse_proxy localhost:8000
    }
    handle /uploads/* {
        reverse_proxy localhost:8000
    }

    # Proxy para frontend Next.js nativo
    handle {
        reverse_proxy localhost:3000
    }

    encode zstd gzip
}
EOF

# Recargar y habilitar servicios nativos
systemctl daemon-reload
systemctl enable tienda-backend tienda-frontend caddy
systemctl restart tienda-backend
systemctl restart tienda-frontend
systemctl restart caddy

# Obtener IP Pública de la instancia OCI
PUBLIC_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "IP_PUBLICA")

echo -e "\n${GREEN}=================================================================="
echo "    🎉 ¡INSTALACIÓN NATIVA COMPLETADA CON ÉXITO!                 "
echo "=================================================================="
echo -e "${NC}"
echo -e "🛍️  ${CYAN}Tienda Pública:${NC}       http://$PUBLIC_IP/"
echo -e "🔐 ${CYAN}Panel de Administración:${NC} http://$PUBLIC_IP/admin"
echo -e "🔑 ${CYAN}Contraseña Admin:${NC}        admin123"
echo -e "⚡ ${CYAN}API Backend (Go):${NC}        http://$PUBLIC_IP/api/health"
echo -e "\n${YELLOW}💡 Comandos de administración nativa en Ubuntu:${NC}"
echo "   - Ver estado:            sudo systemctl status tienda-backend tienda-frontend caddy"
echo "   - Ver logs backend:      sudo journalctl -u tienda-backend -f"
echo "   - Ver logs frontend:     sudo journalctl -u tienda-frontend -f"
echo "   - Actualizar desde Git:  sudo bash update.sh"
echo "=================================================================="
